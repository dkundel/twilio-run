const chalk = require('chalk');
const { stripIndent } = require('common-tags');
const columnify = require('columnify');
const camelCase = require('lodash.camelcase');
const { shouldPrettyPrint, printObjectWithoutHeaders } = require('./utils');

function sortByAccess(resA, resB) {
  if (resA.access === resB.access) {
    if (resA.functionPath) {
      return resA.functionPath.localeCompare(resB.functionPath);
    } else if (resA.assetPath) {
      return resA.assetPath.localeCompare(resB.assetPath);
    }
  }
  return resA.access.localeCompare(resB.access);
}

function plainPrintDeployedResources(config, result) {
  const functionsOutput = columnify(
    result.functionResources.sort(sortByAccess).map(fn => ({
      ...fn,
      url: `https://${result.domain}${fn.functionPath}`,
    })),
    {
      columns: ['access', 'functionPath', 'url'],
      showHeaders: false,
    }
  );

  const assetsOutput = columnify(
    result.assetResources.sort(sortByAccess).map(asset => ({
      ...asset,
      url: `https://${result.domain}${asset.assetPath}`,
    })),
    {
      columns: ['access', 'assetPath', 'url'],
      showHeaders: false,
    }
  );

  const data = {
    domain: result.domain,
    projectName: config.projectName,
    serviceSid: result.serviceSid,
    environmentSuffix: config.functionsEnv,
    environmentSid: config.ennvironmentSid,
    buildSid: result.buildSid,
  };

  const output = `
deploymentInfo\n${printObjectWithoutHeaders(data)}

functions\n${functionsOutput}

assets\n${assetsOutput}
  `;
  console.log(stripIndent(output));
}

function prettyPrintConfigInfo(config) {
  let dependencyString = '';
  if (config.pkgJson && config.pkgJson.dependencies) {
    dependencyString = Object.keys(config.pkgJson.dependencies).join(', ');
  }

  console.log(
    // @ts-ignore
    chalk`
Deploying functions & assets to Twilio Serverless

{bold.cyan Account}\t\t${config.accountSid}
{bold.cyan Project Name}\t${config.projectName}
{bold.cyan Environment}\t${config.functionsEnv}
{bold.cyan Root Directory}\t${config.cwd}
{bold.cyan Dependencies}\t${dependencyString}
{bold.cyan Env Variables}\t${Object.keys(config.env).join(', ')}
`
  );
}

function plainPrintConfigInfo(config) {
  let dependencyString = '';
  if (config.pkgJson && config.pkgJson.dependencies) {
    dependencyString = Object.keys(config.pkgJson.dependencies).join(',');
  }
  const printObj = {
    account: config.accountSid,
    projectName: config.projectName,
    environment: config.functionsEnv,
    rootDirectory: config.cwd,
    dependencies: dependencyString,
    environmentVariables: Object.keys(config.env).join(','),
  };
  console.log(`configInfo\n${printObjectWithoutHeaders(printObj)}\n`);
}

function printConfigInfo(config) {
  if (shouldPrettyPrint) {
    prettyPrintConfigInfo(config);
  } else {
    plainPrintConfigInfo(config);
  }
}

function prettyPrintDeployedResources(config, result) {
  console.log(
    chalk`
{bold.cyan Deployment Details}
⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺⎺
{bold.cyan Domain:} ${result.domain}
{bold.cyan Service:}
   ${config.projectName} {dim (${result.serviceSid})}
{bold.cyan Environment:}
   ${config.functionsEnv} {dim (${result.environmentSid})} 
{bold.cyan Build SID:}
   ${result.buildSid}
  `.trim()
  );
  if (result.functionResources) {
    const functionMessage = result.functionResources
      .sort(sortByAccess)
      .map(fn => {
        const accessPrefix =
          fn.access !== 'public' ? chalk`{bold [${fn.access}]} ` : '';
        return chalk`   ${accessPrefix}{dim https://${result.domain}}${
          fn.functionPath
        }`;
      })
      .join('\n');
    console.log(chalk.bold.cyan('Functions:'));
    console.log(functionMessage);
  }

  if (result.assetResources) {
    const assetMessage = result.assetResources
      .sort(sortByAccess)
      .map(fn => {
        const accessPrefix =
          fn.access !== 'public' ? chalk`{bold [${fn.access}]} ` : '';
        return chalk`   ${accessPrefix}{dim https://${result.domain}}${
          fn.assetPath
        }`;
      })
      .join('\n');

    console.log(chalk.bold.cyan('Assets:'));
    console.log(assetMessage);
  }
}

function printDeployedResources(config, result) {
  if (shouldPrettyPrint) {
    prettyPrintDeployedResources(config, result);
  } else {
    plainPrintDeployedResources(config, result);
  }
}

module.exports = { printDeployedResources, printConfigInfo };