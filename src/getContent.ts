import { parse } from 'yaml';
import { Buffer } from 'buffer';
import { OctoType } from './types/OctoType';
import * as core from '@actions/core';


//retrieve the content of a file as plane text
export async function getContent(contentRequest: any, octokit: OctoType) {
  const fileContent = await octokit.rest.repos.getContent(contentRequest);
  //core.info("oldFileResult: " + resultOld)
  if (fileContent?.data?.toString() === undefined ) {
    core.error("file result was empty")
    return null;
  }

  const content = Buffer.from(fileContent.data.toString(), 'base64').toString();
  //core.info(contentRequest, contentOld)
  return parse(content);
}
