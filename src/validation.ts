import { options } from "./options";
import { getContent } from "./getContent";
import Ajv2019 from "../node_modules/ajv/dist/2019";
import addFormats from 'ajv-formats';
import { OctoType } from "./types/OctoType";


export async function validate(delta: never, filename: string, org: string, repo: string, octokit: OctoType) {
    //is there a whitelist entry
    // todo run schema validation on diff
    if (!options.schemaCheck.has(filename)) {
        return { result: false, reason: "no noCheckPath found for this file " + filename };
    }
    const schemaPath = options.schemaCheck.get(filename);
    console.log("ℹ working with noCheckPath", schemaPath);
    console.log("ℹ current diff is", delta);

    const contentRequest = { owner: org, repo: repo, path: schemaPath };
    const schema = await getContent(contentRequest, octokit) as never;

    console.log("ℹ current schema is", schema);

    if (validateDiff(delta, schema)) {
        return { result: true, reason: "validation OK" };
    }
    return { result: false, reason: "nothing fit" };
}




export function getDiffOptions(){
    return {
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
        cloneDiffValues: false /* default false. if true, values in the obtained delta will be cloned
      (using jsondiffpatch.clone by default), to ensure delta keeps no references to left or right objects. this becomes useful if you're diffing and patching the same objects multiple times without serializing deltas.
      instead of true, a function can be specified here to provide a custom clone(value)
      */
    }
}



export function validateDiff(diff: never, schema: never){

    //const common_schema = require("./common_types.schema.json")
    const ajv = new Ajv2019({ allErrors: true, messages: true })
    addFormats(ajv)

    const validate = ajv.compile(schema)
    const valid = validate(diff)

    if (!valid) {
        console.log(validate.errors)
        return false
    }
    return true

}




//var test = { level1: { level2: { level3: 'level3' } } };
//console.log(hasNested(test, "level1/level2/level4"))

export function hasNested(obj:any, path:string): boolean {
    return checkNested(obj, path.split("/"))
}

function checkNested(obj: any, path: string[] | undefined) : boolean {
    if(path === undefined) return false
    const level = path[0]
    path.shift()
    const rest = path
    console.log("level: ", level)
    console.log("rest: ", rest)
    if (obj === undefined) return false
    if (level == "*") {
        for (const [, value] of Object.entries(obj)) {
            //console.log(`looping: ${key}: ${value}`);
            if (checkNested(value, rest)) return true
        }
    }
    if (rest.length == 0 && Object.prototype.hasOwnProperty.call(obj, level)) return true

    return checkNested(obj[level], rest)
}
