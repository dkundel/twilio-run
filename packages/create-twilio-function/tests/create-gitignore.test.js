const nock = require('nock');
const createGitignore = require('../src/create-twilio-function/create-gitignore');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));
const fs = require('fs');
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

beforeAll(async () => {
  await rimraf('./scratch');
  nock.disableNetConnect();
});

afterAll(() => {
  nock.enableNetConnect();
});

beforeEach(async () => {
  await mkdir('./scratch');
  nock('https://raw.githubusercontent.com')
    .get('/github/gitignore/master/Node.gitignore')
    .reply(200, '*.log\n.env');
});

afterEach(async () => {
  await rimraf('./scratch');
  nock.cleanAll();
});

describe('createGitignore', () => {
  test('it creates a new .gitignore file', async () => {
    await createGitignore('./scratch');
    const file = await stat('./scratch/.gitignore');
    expect(file.isFile());
    const contents = await readFile('./scratch/.gitignore', {
      encoding: 'utf-8'
    });
    expect(contents).toMatch('*.log');
    expect(contents).toMatch('.env');
  });

  test('it rejects if there is already a .gitignore file', async () => {
    fs.closeSync(fs.openSync('./scratch/.gitignore', 'w'));
    expect.assertions(1);
    try {
      await createGitignore('./scratch');
    } catch (e) {
      expect(e.toString()).toMatch('file already exists');
    }
  });
});
