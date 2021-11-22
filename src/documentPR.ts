import { options } from "./options";
import { OctoType } from "./types/OctoType"
import { hasNested } from "./validation";
import * as core from '@actions/core';

//check if PR already has the "docLabel in place" label in place
export async function isDocumentPR(octokit: OctoType, owner: string, repo: string, issue_number: number) {
    const labels = await octokit.rest.issues.listLabelsOnIssue({
        owner,
        repo,
        issue_number,
    });
    //check if label already in place
    return labels.data.filter(label => label.name == options.docLabel).length > 0
}

//documentation for general changed files
export async function documentPR(dynamicPath: string, octokit: OctoType, owner: string, repo: string, issue_number: number, filename: string) {

  // document dynamic file changes
  if (options.fileDocsDynamic.has(dynamicPath)) {
    octokit.rest.issues.createComment({
      owner,
      repo: repo,
      issue_number,
      body: options.fileDocsDynamic.get(dynamicPath) + "",
    });
  }

  // document absolute file changes
  if (options.fileDocsRoot.has(filename)) {
    octokit.rest.issues.createComment({
      owner,
      repo: repo,
      issue_number,
      body: options.fileDocsRoot.get(filename) + "",
    });
  }

  // add label to define PR as documented
  labelPrAsDocumented(octokit, owner, repo, issue_number);

}


//documentation call for changes within a specific path in a yaml file
export async function documentPrPath(dynamicPath: string, octokit: OctoType, owner: string, repo: string, issue_number: number, filename: string, diff: never) {

  // document dynamic path changes
  if (options.pathDocsDynamic.has(dynamicPath)) {
    core.debug("found dynamic doc file");
    const pathDocs = options.pathDocsDynamic.get(dynamicPath)
    if (pathDocs !== undefined) {
      for (const check of pathDocs) {
        core.debug("check in dyn doc " + check);
        const isNested = hasNested(diff, check.path)
        if (isNested) {
          octokit.rest.issues.createComment({
            owner,
            repo: repo,
            issue_number,
            body: check.text,
          });
        }
      }
    }


  }

  // add label to define PR as documented
  labelPrAsDocumented(octokit, owner, repo, issue_number);

}


function labelPrAsDocumented(octokit: OctoType, owner: string, repo: string, issue_number: number) {
  octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number,
    labels: [options.docLabel]
  });
}
