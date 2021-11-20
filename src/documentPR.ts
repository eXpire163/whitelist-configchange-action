import { options } from "./options";
import { OctoType } from "./types/OctoType"
import { hasNested } from "./validation";


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

export async function documentPrPath(dynamicPath: string, octokit: OctoType, owner: string, repo: string, issue_number: number, filename: string, diff: any) {


  if (options.pathDocsDynamic.has(dynamicPath)) {
    console.log("DEBUG: found dynamic doc file");
    const pathDocs = options.pathDocsDynamic.get(dynamicPath)
    if (pathDocs !== undefined) {
      for (const check of pathDocs) {
        console.log("DEBUG: check in dyn doc", check);
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


  octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number,
    labels: [options.docLabel]
  })

}
