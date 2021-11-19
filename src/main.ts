import * as github from "@actions/github";
import * as core from '@actions/core';
import { create } from 'jsondiffpatch';
import { getDiffOptions, validate } from "./validation";
import { documentPR } from "./documentPR";
import { getContent } from "./getContent";
import { SummeryDetail } from "./types/SummeryDetail";
import { options } from "./options";
import {OctoType} from "./types/OctoType"


const summery = new Map<string, SummeryDetail>();
const diffPatcher = create(getDiffOptions());

// ## summery
function setResult(filename: string, result: boolean, reason:string) {
  summery.set(filename, { result: result, reason: reason })
}
function printSummery() {
  console.log("########### result ##########");
  summery.forEach((value: SummeryDetail, key: string) => {
    console.log(`File ${key} was ${value.reason} ${value.result ? "✔" : "✖"}`)
  });
}


async function run(): Promise<void> {
  try {

    //console.log("hi there ⚠");

    //getting base information
    const myToken = core.getInput('myToken');
    const octokit = github.getOctokit(myToken) as OctoType
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

    // console.log("ℹ this is a pr", repository.owner.login,
    //   repository.name,
    //   payload.number)
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



      //check for noCheckFiles (whitelist)

      //ignore the first x folders in the path - like project name that could change
      //techdebt - make it smarter
      let dynamicPath = filename
      for (let i = 0; i < options.dynamicFilesCount; i++) {
        dynamicPath = dynamicPath.substring(dynamicPath.indexOf('/') + 1)
      }


      //document PR
      documentPR(dynamicPath, octokit, org, repo, pull_number, filename);

      // whitelisted files
      //console.log("DEBUG: whitelist check root", filename, options.noCheckFilesRoot);
      if (options.noCheckFilesRoot.includes(filename)) {
        //console.log("DEBUG: file in whitelist", filename)
        setResult(filename, true, "part of noCheckFilesRoot")
        continue
      }

      //console.log("DEBUG: whitelist check dynamic", dynamicPath, options.noCheckFilesDynamic);
      if (options.noCheckFilesDynamic.includes(dynamicPath)) {
        setResult(filename, true, "part of noCheckFilesDynamic")
        continue
      }

      // create or delete can not be merged automatically
      if (file.status != "modified") {
        setResult(filename, false, "file is new or deleted")
        continue
      }

      //only allowing yaml/yml files
      if (filename.endsWith(".yaml") || filename.endsWith(".yml")) {
        //console.log("ℹ file is a yml/yaml")
      }
      else {
        setResult(filename, false, "file is not a yaml")
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
      const delta = diffPatcher.diff(jsonOld, jsonNew) as never;
      console.log("ℹ delta", delta)

      //console.log(jsonDiffPatch.formatters.console.format(delta))


      const result = await validate(delta, dynamicPath, org, repo, octokit)
      setResult(filename, result.result, result.reason)

    }

    printSummery()
    if (summery.size != filesChanged) {
      throw `Some files could not be classified, should be ${filesChanged} / was ${summery.size}`
    }

    console.log("All files could be classified ✔")
    //check if map contains "false" elements
    const falseMap = new Map([...summery].filter(([, v]) => v.result == false))
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
