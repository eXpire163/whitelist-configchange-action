import { Options } from "./types/Options";


export const options: Options = {
  noCheckFilesRoot: ["src/main.ts", "dist/index.js", "dist/index.js.map", "dist/licenses.txt", "dist/sourcemap-register.js", "package-lock.json", "package.json"],
  dynamicFilesCount: 2,
  noCheckFilesDynamic: ["subbed/namespace.yml"],
  schemaCheck: new Map([["subbed/config.yaml", "schemas/test.schema.json"]]),
  fileDocsRoot: new Map([["src/main.ts", "Hope you know that you are changing the pipeline!!!"]]),
  fileDocsDynamic: new Map([["subbed/namespace.yml", "Have you checked your available resources to handle your namespace change?"]]),
  docLabel: "bot/documented"
};
