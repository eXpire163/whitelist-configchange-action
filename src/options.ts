import { Options } from "./types/Options";


export const options: Options = {
  noCheckFilesRoot: ["src/main.ts", "dist/index.js", "dist/index.js.map", "dist/licenses.txt", "dist/sourcemap-register.js", "package-lock.json", "package.json"],
  dynamicFilesCount: 2,
  noCheckFilesDynamic: ["subbed/namespace.yml"],
  schemaCheck: new Map([["subbed/config.yaml", "schemas/test.schema.json"]]),
  fileDocsRoot: new Map([["src/main.ts", "Hope you know that you are changing the pipeline!!!"]]),
  fileDocsDynamic: new Map([["subbed/namespace.yml", "Have you checked your available resources to handle your namespace change?"]]),
  docLabel: "bot/documented",
  pathDocsDynamic: new Map([["subbed/config.yaml", [
    { path: "nodegroups/*/instance-type", text: "# Instance type changed\nChanging the instance type will recycle all nodes one by one. \n- [] Make sure you don't have **single points of failures** in your app\n- [] This will effect the **cost** of your cluster"},
    {path: "lvl1", text: "lvl1 changed or subelement"}
  ]]])
};
