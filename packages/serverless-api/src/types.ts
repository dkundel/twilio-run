import { PackageJson } from 'type-fest';
import got = require('got');

export type EnvironmentVariables = {
  [key: string]: string | number | undefined;
};

export type ClientConfig = {
  accountSid: string;
  authToken: string;
};

type DeployProjectConfigBase = {
  env: EnvironmentVariables;
  serviceSid?: string;
  pkgJson: PackageJson;
  projectName: string;
  functionsEnv: string;
};

export type FileInfo = {
  name: string;
  path?: string;
  content?: string | Buffer;
};

export type DeployProjectConfig = ClientConfig &
  DeployProjectConfigBase & {
    functions: FileInfo[];
    assets: FileInfo[];
  };

export type DeployLocalProjectConfig = ClientConfig &
  DeployProjectConfigBase & {
    cwd: string;
    envPath: string;
  };

export type GotClient = typeof got;

export type RawFunctionWithPath = FileInfo & {
  functionPath: string;
};

export type FunctionResource = RawFunctionWithPath & {
  sid: string;
};

export type Dependency = {
  name: string;
  version: string;
};

export type Variable = {
  key: string;
  value: string;
};
