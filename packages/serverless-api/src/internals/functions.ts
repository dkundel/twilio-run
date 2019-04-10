import debug from 'debug';
import path, { extname } from 'path';
import {
  FunctionApiResource,
  FunctionList,
  VersionResource,
} from '../serverless-api-types';
import {
  FileInfo,
  FunctionResource,
  GotClient,
  RawFunctionWithPath,
} from '../types';
import { uploadToAws } from '../utils/aws-upload';
import { readFile } from '../utils/fs';

const log = debug('twilio-serverless-api/functions');

async function createFunctionResource(
  name: string,
  serviceSid: string,
  client: GotClient
) {
  try {
    const resp = await client.post(`/Services/${serviceSid}/Functions`, {
      form: true,
      body: {
        FriendlyName: name,
      },
    });
    return (resp.body as unknown) as FunctionApiResource;
  } catch (err) {
    throw new Error(`Failed to create "${name}" function`);
  }
}

async function getFunctionResources(serviceSid: string, client: GotClient) {
  const resp = await client.get(`/Services/${serviceSid}/Functions`);
  const content = (resp.body as unknown) as FunctionList;
  return content.functions;
}

export async function getOrCreateFunctionResources(
  functions: FileInfo[],
  serviceSid: string,
  client: GotClient
): Promise<FunctionResource[]> {
  const output: FunctionResource[] = [];
  const existingFunctions = await getFunctionResources(serviceSid, client);
  const functionsToCreate: RawFunctionWithPath[] = [];

  functions.forEach(fn => {
    const functionPath = `/${path
      .basename(fn.name, '.js')
      .replace(/\s/g, '-')}`;
    const existingFn = existingFunctions.find(f => fn.name === f.friendly_name);
    if (!existingFn) {
      functionsToCreate.push({ ...fn, functionPath });
    } else {
      output.push({
        ...fn,
        functionPath,
        sid: existingFn.sid,
      });
    }
  });

  const createdFunctions = await Promise.all(
    functionsToCreate.map(async fn => {
      const newFunction = await createFunctionResource(
        fn.name,
        serviceSid,
        client
      );
      return {
        ...fn,
        sid: newFunction.sid,
      };
    })
  );

  return [...output, ...createdFunctions];
}

async function createFunctionVersion(
  fn: FunctionResource,
  serviceSid: string,
  client: GotClient
) {
  try {
    const resp = await client.post(
      `/Services/${serviceSid}/Functions/${fn.sid}/Versions`,
      {
        form: true,
        body: {
          Path: fn.functionPath,
          Visibility: 'public',
        },
      }
    );

    return (resp.body as unknown) as VersionResource;
  } catch (err) {
    log(err);
    throw new Error('Failed to upload Function');
  }
}

export async function uploadFunction(
  fn: FunctionResource,
  serviceSid: string,
  client: GotClient
) {
  let content: Buffer | string | undefined;
  if (typeof fn.content !== 'undefined') {
    content = fn.content;
  } else if (typeof fn.path !== 'undefined') {
    const encoding = extname(fn.path) === '.js' ? 'utf8' : undefined;
    content = await readFile(fn.path, encoding);
  } else {
    throw new Error('Missing either content or path for file');
  }

  const version = await createFunctionVersion(fn, serviceSid, client);
  const { pre_signed_upload_url: awsData } = version;
  const awsResult = await uploadToAws(awsData.url, awsData.kmsARN, content);
  return version.sid;
}
