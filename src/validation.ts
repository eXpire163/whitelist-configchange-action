import { options, getContent } from "./main";
import Ajv2019 from "../node_modules/ajv/dist/2019";
import addFormats from 'ajv-formats';


export async function validate(delta: any, filename: string, org: string, repo: string, octokit: any) {
    //is there a whitelist entry
    // todo run schema validation on diff
    if (!options.schemaCheck.has(filename)) {
        return { result: false, reason: "no noCheckPath found for this file " + filename };
    }
    const schemaPath = options.schemaCheck.get(filename);
    console.log("ℹ working with noCheckPath", schemaPath);
    console.log("ℹ current diff is", delta);

    const contentRequest = { owner: org, repo: repo, path: schemaPath };
    const schema = await getContent(contentRequest, octokit);

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
    }
}



export function validateDiff(diff: any, schema: any){

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
