import { options } from "./options";
import { OctoType } from "./types/OctoType"


export async function isDocumentPR(octokit: OctoType, owner: string, repo: string, issue_number: number) {
    const labels = await octokit.rest.issues.listLabelsOnIssue({
        owner,
        repo,
        issue_number,
    });
    //check if label already in place
    return labels.data.filter(label => label.name == options.docLabel).length > 0
}

export async function documentPR(dynamicPath: string, octokit: OctoType, owner: string, repo: string, issue_number: number, filename: string) {


  if (options.fileDocsDynamic.has(dynamicPath)) {
    octokit.rest.issues.createComment({
      owner,
      repo: repo,
      issue_number,
      body: options.fileDocsDynamic.get(dynamicPath) + "",
    });
  }

  if (options.fileDocsRoot.has(filename)) {
    octokit.rest.issues.createComment({
      owner,
      repo: repo,
      issue_number,
        body: options.fileDocsRoot.get(filename) + "",
    });
  }


    octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number,
        labels: [options.docLabel]
    })

}
