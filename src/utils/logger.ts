import debug from 'debug';
import { errorMessage, warningMessage } from '../printers/utils';

export const LoggingLevel = {
  debug: -1,
  info: 0,
  warn: 1,
  error: 2,
  none: 10,
};

export type LoggingLevelValue = number;
export type LoggingLevelNames = keyof typeof LoggingLevel;

export interface ILogger {
  config: LoggerOptions;
  useDebugModule?: boolean;
  debug(msg: string): void;
  info(msg: string): void;
  warn(msg: string, title?: string): void;
  error(msg: string, title?: string): void;
  log(msg: string, level: LoggingLevelValue): void;
}

export type LoggerOptions = {
  level: LoggingLevelValue;
};

export class Logger implements ILogger {
  private options: LoggerOptions;
  public useDebugModule = true;

  get config() {
    return this.options;
  }
  set config(val: LoggerOptions) {
    this.options = val;
    if (val.level === LoggingLevel.debug) {
      const namespaces = ['twilio*'];
      if (process.env.DEBUG) {
        namespaces.push(process.env.DEBUG);
      }
      process.env.DEBUG = namespaces.join(',');
      debug.enable(process.env.DEBUG);
    }
  }

  constructor(opts: LoggerOptions) {
    this.options = opts;
    this.config = opts;
  }

  debug(msg: string) {
    this.log(msg, LoggingLevel.debug);
  }

  info(msg: string) {
    this.log(msg, LoggingLevel.info);
  }

  warn(msg: string, title: string = '') {
    msg = warningMessage(title, msg);
    this.log(msg, LoggingLevel.warn);
  }

  error(msg: string, title: string = '') {
    msg = errorMessage(title, msg);
    this.log(msg, LoggingLevel.error);
  }

  log(msg: string, level: LoggingLevelValue) {
    level = level || LoggingLevel.info;

    if (level >= this.config.level) {
      const message = typeof msg === 'string' ? msg : JSON.stringify(msg);
      process.stderr.write(message + '\n');
    }
  }
}

export function getDebugFunction(namespace: string) {
  const debugLogger = debug(namespace);
  if (!logger.useDebugModule) {
    debugLogger.enabled = true;
    debug.log = logger.debug.bind(logger);
  }

  return debugLogger;
}

export function setLogLevelByName(name: LoggingLevelNames) {
  logger.config = { level: LoggingLevel[name] };
}

export let logger: ILogger = new Logger({
  level: LoggingLevel.info,
});

export function overrideLogger(newLogger: ILogger) {
  logger = newLogger;
}
