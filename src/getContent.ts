import { parse } from 'yaml';
import { Buffer } from 'buffer';


//retrieve the content of a file as plane text
export async function getContent(contentRequest: any, octokit: any) {
  const result = await octokit.rest.repos.getContent(contentRequest);
  //core.info("oldFileResult: " + resultOld)
  if (!result) {
    //core.info("old result was empty")
    return null;
  }
  const content = Buffer.from(result.data.content, 'base64').toString();
  //core.info(contentRequest, contentOld)
  return parse(content);
}
