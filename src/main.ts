import * as github from "@actions/github";
import * as core from '@actions/core';
import { parse } from 'yaml';
import { create } from 'jsondiffpatch';
import { Buffer } from 'buffer';
import Ajv from "ajv"


const options: Options = {
  noCheckFilesRoot: ["index.js"], //files relative to root
  dynamicFilesCount: 2, //ignored folders starting from root
  noCheckFilesDynamic: ["subber/namespace.yml"], //filename relative after ignored folders
  noCheckPath: new Map([[ "dummy.yaml", ["my/annoying/*"]]]) //xpath (todo) in dynamic folders
}
const summery = new Map<string, SummeryDetail>();

const diffPatcher = create({
  // used to match objects when diffing arrays, by default only === operator is used
  objectHash: function (obj: any) {
    // this function is used only to when objects are not equal by ref
    return obj._id || obj.id;
  },
  arrays: {
    // default true, detect items moved inside the array (otherwise they will be registered as remove+add)
    detectMove: true,
    // default false, the value of items moved is not included in deltas
    includeValueOnMove: false
  },
  textDiff: {
    // default 60, minimum string length (left and right sides) to use text diff algorythm: google-diff-match-patch
    minLength: 60
  },
  propertyFilter: function (name: string, context: any) {
    /*
     this optional function can be specified to ignore object properties (eg. volatile data)
      name: property name, present in either context.left or context.right objects
      context: the diff context (has context.left and context.right objects)
    */
    return name.slice(0, 1) !== '$';
  },
  cloneDiffValues: false /* default false. if true, values in the obtained delta will be cloned
      (using jsondiffpatch.clone by default), to ensure delta keeps no references to left or right objects. this becomes useful if you're diffing and patching the same objects multiple times without serializing deltas.
      instead of true, a function can be specified here to provide a custom clone(value)
      */
});

type SummeryDetail = {
  result: boolean;
  reason: string;
}
type Options = {
  noCheckFilesRoot: string[]
  dynamicFilesCount: number
  noCheckFilesDynamic: string[]
  noCheckPath: Map<string, string[]>
}






async function getContent(contentRequest:any, octokit: any) {
  const resultOld = await octokit.rest.repos.getContent(contentRequest);
  console.log("oldFileResult: " + resultOld)
  if (!resultOld) {
    console.log("old result was empty")
    return null
  }
  const contentOld = Buffer.from(resultOld.data.content, 'base64').toString();
  console.log(contentRequest, contentOld)
  return parse(contentOld)
}

function validateDiff(delta: any, filename: string): SummeryDetail {
  //is there a whitelist entry
  // todo run schema validation on diff
  if (!options.noCheckPath.has(filename)) {
    return { result: false, reason: "no noCheckPath found for this file " + filename }
  }


  const paths = options.noCheckPath.get(filename)
  console.log("ℹ working with noCheckPath", paths);
  console.log("ℹ current diff is", delta)

  return { result: false, reason: "nothing fit" }
}

function validateChange(delta: never, schema: never): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    const ajv = new Ajv() // options can be passed, e.g. {allErrors: true}
    const validate = ajv.compile(schema)
    const valid = validate(delta)
    if (!valid) {
      console.log(validate.errors)
      resolve(false)
    }
    resolve(true)
  })
}

function setResult(filename: string, result: boolean, reason:string) {
  summery.set(filename, { result: result, reason: reason })
}
function printSummery() {
  console.log("########### result ##########");
  summery.forEach((value: SummeryDetail, key: string) => {
    console.log(`File ${key} was ${value.reason} ${value.result ? "✔" : "✖"}`)
  });
}


// most @actions toolkit packages have async methods
async function run(): Promise<void> {
  try {

    console.log("hi there ⚠");

    //getting base information
    const myToken = core.getInput('myToken');
    const octokit = github.getOctokit(myToken)
    const context = github.context;

    if (context.eventName != "pull_request") {
      console.log("this pipeline is only for pull requests")
      return
    }
    //getting pr related information
    const payload = context.payload
    const repository = payload.repository

    if(repository == undefined){
      throw "repository was undefined in payload"
    }
    if (payload.pull_request == undefined) {
      throw "pull_request was undefined in payload"
    }

    const org = repository.owner.login
    const repo = repository.name
    const pull_number = payload.number
    const filesChanged : number = payload.pull_request.changed_files

    console.log("ℹ this is a pr", repository.owner.login,
      repository.name,
      payload.number)
    //load pr files
    const thisPR = await octokit.rest.pulls.listFiles({
      owner: org,
      repo: repo,
      pull_number: pull_number
    });
    const files = thisPR.data

    //iterating over changed files

    for (const file of files) {

      const filename = file.filename

      // create or delete can not be merged automatically
      if (file.status != "modified") {
        setResult(filename, false, "file is new or deleted")
        continue
      }

      //only allowing yaml/yml files
      if (filename.endsWith(".yaml") || filename.endsWith(".yml"))
        console.log("ℹ file is a yml/yaml")
      else {
        setResult(filename, false, "file is not a yaml")
        continue
      }

      //check for noCheckFiles (whitelist)

      //ignore the first x folders in the path - like project name that could change
      //techdebt - make it smarter
      let dynamicPath = filename
      for (let i = 0; i < options.dynamicFilesCount; i++) {
        dynamicPath = dynamicPath.substring(dynamicPath.indexOf('/') + 1)
      }

      if (filename in options.noCheckFilesRoot) {
        setResult(filename, true, "part of noCheckFilesRoot")
        continue
      }
      if (dynamicPath in options.noCheckFilesDynamic) {
        setResult(filename, true, "part of noCheckFilesDynamic")
        continue
      }


      // compare content of yaml files

      //get master
      const contentRequestOld = { owner: org, repo: repo, path: filename }
      const jsonOld = await getContent(contentRequestOld, octokit)

      //get current
      const contentRequestNew = { owner: org, repo: repo, path: filename, ref: payload.pull_request.head.ref }
      const jsonNew = await getContent(contentRequestNew, octokit)

      //check if both have valid content
      if (jsonOld == null || jsonNew == null) {
        setResult(filename, false, "could not read file content")
      }

      // run the compare
      const delta = diffPatcher.diff(jsonOld, jsonNew);
      console.log("ℹ delta", delta)
      //console.log(jsonDiffPatch.formatters.console.format(delta))


      const result = validateDiff(delta, dynamicPath)
      setResult(filename, result.result, result.reason)

    }

    printSummery()
    if (summery.size != filesChanged) {
      throw `Some files could not be classified, should be ${filesChanged} / was ${summery.size}`
    }

    console.log("All files could be classified ✔")
    //check if map contains "false" elements
    const falseMap = new Map([...summery].filter(([k, v]) => v.result == false))
    if (falseMap.size > 0) {
      throw "PR contains changes that are not whitelisted"

    }

    console.log("all files seem to be valid and can be merged")




  } catch (error: any) {
    console.log("pipeline failed", error)
    core.setFailed(error.message);
  }
}

run();
