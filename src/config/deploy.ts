import { DeployLocalProjectConfig } from '@twilio-labs/serverless-api';
import path from 'path';
import { Arguments } from 'yargs';
import { cliInfo } from '../commands/deploy';
import {
  ExternalCliOptions,
  SharedFlagsWithCrdentials,
} from '../commands/shared';
import { deprecateFunctionsEnv } from '../commands/utils';
import { getFunctionServiceSid } from '../serverless-api/utils';
import { mergeFlagsAndConfig, readSpecializedConfig } from './global';
import {
  getCredentialsFromFlags,
  getServiceNameFromFlags,
  readLocalEnvFile,
  readPackageJsonContent,
} from './utils';

export type DeployCliFlags = Arguments<
  SharedFlagsWithCrdentials & {
    serviceSid?: string;
    functionsEnv?: string;
    environment: string;
    projectName?: string;
    serviceName?: string;
    overrideExistingProject: boolean;
    force: boolean;
    functions: boolean;
    assets: boolean;
    assetsFolder?: string;
    functionsFolder?: string;
  }
>;

export async function getConfigFromFlags(
  flags: DeployCliFlags,
  externalCliOptions?: ExternalCliOptions
): Promise<DeployLocalProjectConfig> {
  let cwd = flags.cwd ? path.resolve(flags.cwd) : process.cwd();
  flags.cwd = cwd;

  if (typeof flags.functionsEnv !== 'undefined') {
    deprecateFunctionsEnv();
    if (!flags.environment) {
      flags.environment = flags.functionsEnv;
    }
    delete flags.functionsEnv;
  }

  const configFlags = readSpecializedConfig(cwd, flags.config, 'deployConfig', {
    projectId:
      flags.accountSid ||
      (externalCliOptions && externalCliOptions.accountSid) ||
      undefined,
    environmentSuffix: flags.environment,
  });

  flags = mergeFlagsAndConfig(configFlags, flags, cliInfo);
  cwd = flags.cwd || cwd;

  const { accountSid, authToken } = await getCredentialsFromFlags(
    flags,
    externalCliOptions
  );
  const { localEnv, envPath } = await readLocalEnvFile(flags);

  const serviceSid =
    flags.serviceSid ||
    (await getFunctionServiceSid(cwd, flags.config, 'deployConfig'));

  const pkgJson = await readPackageJsonContent(flags);

  const env = {
    ...localEnv,
  };

  for (let key of Object.keys(env)) {
    const val = env[key];
    if (typeof val === 'string' && val.length === 0) {
      delete env[key];
    }
  }

  delete env.ACCOUNT_SID;
  delete env.AUTH_TOKEN;

  let serviceName: string | undefined = await getServiceNameFromFlags(flags);

  if (!serviceName) {
    throw new Error(
      'Please pass --service-name or add a "name" field to your package.json'
    );
  }

  return {
    cwd,
    envPath,
    accountSid,
    authToken,
    env,
    serviceSid,
    pkgJson,
    overrideExistingService: flags.overrideExistingProject,
    force: flags.force,
    serviceName,
    functionsEnv: flags.environment,
    functionsFolderName: flags.functionsFolder,
    assetsFolderName: flags.assetsFolder,
    noAssets: !flags.assets,
    noFunctions: !flags.functions,
  };
}
