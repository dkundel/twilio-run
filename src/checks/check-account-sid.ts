import { stripIndent } from 'common-tags';
import { errorMessage } from '../printers/utils';
import chalk = require('chalk');

type Options = {
  shouldPrintMessage: boolean;
  shouldThrowError: boolean;
  functionName?: string;
};

export function checkForValidAccountSid(
  accountSid: string | undefined,
  options: Options = { shouldPrintMessage: false, shouldThrowError: false }
): boolean {
  if (accountSid && accountSid.length === 34 && accountSid.startsWith('AC')) {
    return true;
  }

  let message = '';
  let title = '';
  if (!accountSid) {
    title = 'Missing Account SID';
    message = stripIndent`
      You are missing a Twilio Account SID. You can add one into your .env file:
      
      ${chalk.bold('ACCOUNT_SID=')}ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    `;
  } else {
    title = 'Invalid Account SID';
    message = stripIndent`
      The value for your ACCOUNT_SID in your .env file is not a valid Twilio Account SID. 
      
      It should look like this: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    `;
  }

  if (options.shouldPrintMessage && message) {
    console.error(errorMessage(title, message));
  }

  if (options.shouldThrowError && message) {
    const err = new Error(title);
    err.name = 'INVALID_CONFIG';
    err.message = `${title}\n${message}`;
    let meta = '';
    if (options.functionName) {
      meta = `\n--- at ${options.functionName}`;
    }
    err.stack = `${err.message}${meta}`;
    throw err;
  }

  return false;
}
