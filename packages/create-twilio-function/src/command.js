const handler = require('./create-twilio-function');

const command = '$0 <name>';
const describe = 'Creates a new Twilio Function project';

const cliInfo = {
  options: {
    'account-sid': {
      alias: 'a',
      describe: 'The Account SID for your Twilio account',
      type: 'string'
    },
    'auth-token': {
      alias: 't',
      describe: 'Your Twilio account Auth Token',
      type: 'string'
    },
    'skip-credentials': {
      describe:
        "Don't ask for Twilio account credentials or import them from the environment",
      type: 'boolean',
      default: false
    },
    'import-credentials': {
      describe:
        'Import credentials from the environment variables TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN',
      type: 'boolean',
      default: false
    },
    template: {
      describe:
        'Initialize your new project with a template from github.com/twilio-labs/function-templates',
      type: 'string'
    }
  }
};

const builder = command => {
  command.positional('name', {
    describe: 'Name of your project.',
    type: 'string'
  });
  command.options(cliInfo.options);
};

module.exports = {
  command,
  describe,
  handler,
  cliInfo,
  builder
};
