const versions = require('./versions');
const fs = require('fs');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);
const open = promisify(fs.open);
const write = promisify(fs.write);

function createDirectory(path, dirName) {
  return mkdir(path + '/' + dirName);
}

function createFile(fullPath, content) {
  return open(fullPath, 'wx').then(fd => {
    return write(fd, content);
  });
}

function createPackageJSON(path, name) {
  const fullPath = `${path}/package.json`;
  const packageJSON = JSON.stringify(
    {
      name: name,
      version: '0.0.0',
      private: true,
      scripts: {
        test: 'echo "Error: no test specified" && exit 1',
        start: 'twilio-run --env'
      },
      devDependencies: {
        'twilio-run': versions.twilioRun
      },
      engines: { node: versions.node }
    },
    null,
    2
  );
  return createFile(fullPath, packageJSON);
}

function createExampleFunction(path) {
  const content = `exports.handler = function(context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();
  twiml.say("Hello World!");
  callback(null, twiml);
};`;
  const fullPath = `${path}/example.js`;
  return createFile(fullPath, content);
}

function createEnvFile(path, { accountSid, authToken }) {
  const fullPath = `${path}/.env`;
  const content = `ACCOUNT_SID=${accountSid}
AUTH_TOKEN=${authToken}`;
  return createFile(fullPath, content);
}

function createNvmrcFile(path) {
  const fullPath = `${path}/.nvmrc`;
  const content = versions.node;
  return createFile(fullPath, content);
}

module.exports = {
  createDirectory,
  createPackageJSON,
  createExampleFunction,
  createEnvFile,
  createNvmrcFile
};
