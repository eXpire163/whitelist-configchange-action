import { parse } from 'yaml';
import { Buffer } from 'buffer';



export async function getContent(contentRequest: any, octokit: any) {
  const resultOld = await octokit.rest.repos.getContent(contentRequest);
  //console.log("oldFileResult: " + resultOld)
  if (!resultOld) {
    //console.log("old result was empty")
    return null;
  }
  const contentOld = Buffer.from(resultOld.data.content, 'base64').toString();
  //console.log(contentRequest, contentOld)
  return parse(contentOld);
}
