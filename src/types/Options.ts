export type Options = {
  noCheckFilesRoot: string[];
  dynamicFilesCount: number;
  noCheckFilesDynamic: string[];
  schemaCheck: Map<string, string>;
  fileDocsDynamic: Map<string, string>;
  fileDocsRoot: Map<string, string>;
  docLabel: string;
  pathDocsDynamic: Map<string, PathDoc[]>;
};

export type PathDoc = {
  path : string
  text: string
}
