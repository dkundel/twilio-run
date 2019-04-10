import querystring from 'querystring';
import { JsonObject } from 'type-fest';
import { DeployStatus } from '../consts';
import { BuildResource, Sid } from '../serverless-api-types';
import { Dependency, GotClient } from '../types';
import { sleep } from '../utils/sleep';

import events = require('events');

async function getBuildStatus(
  buildSid: string,
  serviceSid: string,
  client: GotClient
) {
  const resp = await client.get(`/Services/${serviceSid}/Builds/${buildSid}`);
  return (resp.body as unknown) as BuildResource;
}

export type BuildConfig = {
  dependencies?: Dependency[];
  functionVersions?: Sid[];
  assetVersions?: Sid[];
};

export async function triggerBuild(
  { functionVersions, dependencies, assetVersions }: BuildConfig,
  serviceSid: string,
  client: GotClient
) {
  try {
    const body: JsonObject = {};

    if (Array.isArray(dependencies) && dependencies.length > 0) {
      const dependencyString = `"${JSON.stringify(dependencies)}"`;
      body.Dependencies = dependencyString;
    }

    if (Array.isArray(functionVersions) && functionVersions.length > 0) {
      body.FunctionVersions = functionVersions;
    }

    if (Array.isArray(assetVersions) && assetVersions.length > 0) {
      body.AssetVersions = assetVersions;
    }

    const resp = await client.post(`/Services/${serviceSid}/Builds`, {
      // @ts-ignore
      json: false,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: querystring.stringify(body),
    });
    return JSON.parse(resp.body);
  } catch (err) {
    console.error(err);
  }
}

export function waitForSuccessfulBuild(
  buildSid: string,
  serviceSid: string,
  client: GotClient,
  eventEmitter: events.EventEmitter
) {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    let isBuilt = false;

    while (!isBuilt) {
      if (Date.now() - startTime > 120000) {
        if (eventEmitter) {
          eventEmitter.emit('status-update', {
            status: DeployStatus.TIMED_OUT,
            message: 'Deployment took too long',
          });
        }
        reject(new Error('Timeout'));
      }
      const { status } = await getBuildStatus(buildSid, serviceSid, client);
      isBuilt = status === 'VERIFIED';
      if (isBuilt) {
        break;
      }
      if (eventEmitter) {
        eventEmitter.emit('status-update', {
          status: DeployStatus.BUILDING,
          message: `Waiting for deployment. Current status: ${status}`,
        });
      }
      await sleep(1000);
    }
    resolve();
  });
}

export async function activateBuild(
  buildSid: string,
  environmentSid: string,
  serviceSid: string,
  client: GotClient
): Promise<any> {
  const resp = await client.post(
    `/Services/${serviceSid}/Environments/${environmentSid}/Deployments`,
    {
      form: true,
      body: {
        BuildSid: buildSid,
      },
    }
  );
  return resp.body;
}
