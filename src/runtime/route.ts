import {
  Context,
  ServerlessCallback,
  ServerlessFunctionSignature,
} from '@twilio-labs/serverless-runtime-types/types';
import {
  NextFunction,
  Request as ExpressRequest,
  RequestHandler as ExpressRequestHandler,
  Response as ExpressResponse,
} from 'express';
import twilio, { twiml } from 'twilio';
import { checkForValidAccountSid } from '../checks/check-account-sid';
import { StartCliConfig } from '../config/start';
import { wrapErrorInHtml } from '../utils/error-html';
import { getDebugFunction } from '../utils/logger';
import { Response } from './internal/response';
import * as Runtime from './internal/runtime';

const { VoiceResponse, MessagingResponse, FaxResponse } = twiml;

const debug = getDebugFunction('twilio-run:route');

export function constructEvent<T extends {} = {}>(req: ExpressRequest): T {
  return { ...req.query, ...req.body };
}

export function constructContext<T extends {} = {}>({
  url,
  env,
}: StartCliConfig): Context<{
  ACCOUNT_SID?: string;
  AUTH_TOKEN?: string;
  [key: string]: string | undefined | Function;
}> {
  function getTwilioClient(): twilio.Twilio {
    checkForValidAccountSid(env.ACCOUNT_SID, {
      shouldPrintMessage: true,
      shouldThrowError: true,
      functionName: 'context.getTwilioClient()',
    });

    return twilio(env.ACCOUNT_SID, env.AUTH_TOKEN);
  }
  const DOMAIN_NAME = url.replace(/^https?:\/\//, '');
  return { ...env, DOMAIN_NAME, getTwilioClient };
}

export function constructGlobalScope(config: StartCliConfig): void {
  const GlobalRuntime = Runtime.create(config);
  (global as any)['Twilio'] = { ...twilio, Response };
  (global as any)['Runtime'] = GlobalRuntime;
  (global as any)['Functions'] = GlobalRuntime.getFunctions();
  (global as any)['Response'] = Response;

  if (
    checkForValidAccountSid(config.env.ACCOUNT_SID) &&
    config.env.AUTH_TOKEN
  ) {
    (global as any)['twilioClient'] = twilio(
      config.env.ACCOUNT_SID,
      config.env.AUTH_TOKEN
    );
  }
}

export function handleError(
  err: Error | string | object,
  req: ExpressRequest,
  res: ExpressResponse,
  functionFilePath?: string
) {
  res.status(500);
  if (!(err instanceof Error)) {
    res.send(err);
  } else {
    if (req.useragent && (req.useragent.isDesktop || req.useragent.isMobile)) {
      res.type('text/html');
      res.send(wrapErrorInHtml(err, functionFilePath));
    } else {
      res.send(err.toString());
    }
  }
}

export function isTwiml(obj: object): boolean {
  const isVoiceTwiml = obj instanceof VoiceResponse;
  const isMessagingTwiml = obj instanceof MessagingResponse;
  const isFaxTwiml = obj instanceof FaxResponse;
  return isVoiceTwiml || isMessagingTwiml || isFaxTwiml;
}

export function handleSuccess(
  responseObject: string | object | undefined,
  res: ExpressResponse
) {
  res.status(200);
  if (typeof responseObject === 'string') {
    debug('Sending basic string response');
    res.type('text/plain').send(responseObject);
    return;
  }

  if (responseObject && isTwiml(responseObject)) {
    debug('Sending TwiML response as XML string');
    res.type('text/xml').send(responseObject.toString());
    return;
  }

  if (responseObject && responseObject instanceof Response) {
    debug('Sending custom response');
    responseObject.applyToExpressResponse(res);
    return;
  }

  debug('Sending JSON response');
  res.send(responseObject);
}

export function functionToRoute(
  fn: ServerlessFunctionSignature,
  config: StartCliConfig,
  functionFilePath?: string
): ExpressRequestHandler {
  constructGlobalScope(config);

  return function twilioFunctionHandler(
    req: ExpressRequest,
    res: ExpressResponse,
    next: NextFunction
  ) {
    const event = constructEvent(req);
    debug('Event for %s: %o', req.path, event);
    const context = constructContext(config);
    debug('Context for %s: %p', req.path, context);

    const callback: ServerlessCallback = function callback(
      err,
      responseObject?
    ) {
      debug('Function execution %s finished', req.path);
      if (err) {
        handleError(err, req, res, functionFilePath);
        return;
      }
      handleSuccess(responseObject, res);
    };

    debug('Calling function for %s', req.path);
    try {
      fn(context, event, callback);
    } catch (err) {
      callback(err);
    }
  };
}
