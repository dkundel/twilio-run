const createTwilioFunction = require('./create-twilio-function');
const {
  installDependencies
} = require('./create-twilio-function/install-dependencies');
const inquirer = require('inquirer');
const fs = require('fs');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

jest.mock('inquirer');
jest.mock('./create-twilio-function/install-dependencies.js', () => {
  return { installDependencies: jest.fn() };
});

beforeAll(async () => {
  await rimraf('./scratch');
});

beforeEach(async () => {
  await mkdir('./scratch');
});

afterEach(async () => {
  await rimraf('./scratch');
});

describe('createTwilioFunction', () => {
  beforeEach(() => jest.clearAllMocks());

  test('it scaffolds a Twilio Function', async () => {
    inquirer.prompt = jest.fn(() =>
      Promise.resolve({
        accountSid: 'test-sid',
        authToken: 'test-auth-token'
      })
    );
    const name = 'test-function';
    await createTwilioFunction({ name, path: './scratch' });

    const dir = await stat(`./scratch/${name}`);
    expect(dir.isDirectory());
    const env = await stat(`./scratch/${name}/.env`);
    expect(env.isFile());

    const packageJSON = await stat(`./scratch/${name}/package.json`);
    expect(packageJSON.isFile());

    const gitignore = await stat(`./scratch/${name}/.gitignore`);
    expect(gitignore.isFile());

    const functions = await stat(`./scratch/${name}/functions`);
    expect(functions.isDirectory());

    const assets = await stat(`./scratch/${name}/assets`);
    expect(assets.isDirectory());

    const example = await stat(`./scratch/${name}/functions/example.js`);
    expect(example.isFile());

    expect(installDependencies).toHaveBeenCalledWith(`./scratch/${name}`);
  });

  it("doesn't scaffold if the target folder name already exists", async () => {
    const name = 'test-function';
    await mkdir('./scratch/test-function');
    console.log = jest.fn();

    await createTwilioFunction({ name, path: './scratch' });

    expect.assertions(2);

    expect(console.log).toHaveBeenCalledTimes(1);

    try {
      await stat(`./scratch/${name}/package.json`);
    } catch (e) {
      expect(e.toString()).toMatch('no such file or directory');
    }
  });
});
