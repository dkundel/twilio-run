/** @module @twilio-labs/serverless-api/dist/api */

import debug from 'debug';
import { LogApiResource, LogList, Sid, LogFilters } from '../types';
import { TwilioServerlessApiClient } from '../client';
import { getPaginatedResource } from './utils/pagination';
import { ClientApiError } from '../utils/error';
import { OptionsOfJSONResponseBody } from 'got';

const log = debug('twilio-serverless-api:logs');

function urlWithFilters(
  environmentSid: Sid,
  serviceSid: Sid,
  filters: LogFilters = {}
): string {
  const pageSize = filters.pageSize || 50;
  const { functionSid, startDate, endDate, pageToken } = filters;
  let url = `Services/${serviceSid}/Environments/${environmentSid}/Logs?PageSize=${pageSize}`;
  if (typeof functionSid !== 'undefined') {
    url += `&FunctionSid=${functionSid}`;
  }
  if (typeof startDate !== 'undefined') {
    url += `&StartDate=${
      startDate instanceof Date ? startDate.toISOString() : startDate
    }`;
  }
  if (typeof endDate !== 'undefined') {
    url += `&EndDate=${
      endDate instanceof Date ? endDate.toISOString() : endDate
    }`;
  }
  if (typeof pageToken !== 'undefined') {
    url += `&PageToken=${pageToken}`;
  }
  return url;
}

/**
 * Calls the API to retrieve a list of all logs
 *
 * @param {Sid} environmentSid environment in which to get logs
 * @param {Sid} serviceSid service to look for logs
 * @param {TwilioServerlessApiClient} client API client
 * @returns {Promise<LogApiResource[]>}
 */
export async function listLogResources(
  environmentSid: Sid,
  serviceSid: Sid,
  client: TwilioServerlessApiClient
) {
  try {
    return getPaginatedResource<LogList, LogApiResource>(
      client,
      urlWithFilters(environmentSid, serviceSid)
    );
  } catch (err) {
    log('%O', new ClientApiError(err));
    throw err;
  }
}

/**
 * Calls the API to retrieve one page of a list of logs
 *
 * @param {Sid} environmentSid environment in which to get logs
 * @param {Sid} serviceSid service to look for logs
 * @param {TwilioServerlessApiClient} client API client
 * @returns {Promise<LogApiResource[]>}
 */
export async function listOnePageLogResources(
  environmentSid: Sid,
  serviceSid: Sid,
  client: TwilioServerlessApiClient,
  filters: LogFilters
): Promise<LogApiResource[]> {
  const url = urlWithFilters(environmentSid, serviceSid, filters);
  try {
    const resp = await client.request('get', url);
    const content = resp.body as unknown as LogList;
    return content.logs as LogApiResource[];
  } catch (err) {
    log('%O', new ClientApiError(err));
    throw err;
  }
}

/**
 * Calls the API to retrieve a paginated list of logs
 *
 * @param {Sid} environmentSid environment in which to get logs
 * @param {Sid} serviceSid service to look for logs
 * @param {TwilioServerlessApiClient} client API client
 * @param {LogFilters} filters filters to apply to the request
 * @param {string} nextPageUrl if you have a next page url, use it
 * @returns {Promise<LogList>}
 */
export async function listPaginatedLogs(
  environmentSid: Sid,
  serviceSid: Sid,
  client: TwilioServerlessApiClient,
  filters: LogFilters = {},
  nextPageUrl?: string
): Promise<LogList> {
  try {
    const opts: OptionsOfJSONResponseBody = { responseType: 'json' };
    let url = nextPageUrl;
    if (typeof url === 'undefined') {
      url = urlWithFilters(environmentSid, serviceSid, filters);
    }
    if (url.startsWith('http')) {
      opts.prefixUrl = '';
    }
    const resp = await client.request('get', url, opts);
    return resp.body as unknown as LogList;
  } catch (err) {
    log('%O', new ClientApiError(err));
    throw err;
  }
}

/**
 * Calls the API to retrieve a single log resource
 *
 * @param {Sid} logSid SID of log to retrieve
 * @param {Sid} environmentSid environment in which to get logs
 * @param {Sid} serviceSid service to look for logs
 * @param {TwilioServerlessApiClient} client API client
 * @returns {Promise<LogApiResource>}
 */
export async function getLog(
  logSid: Sid,
  environmentSid: Sid,
  serviceSid: Sid,
  client: TwilioServerlessApiClient
) {
  try {
    const resp = await client.request(
      'get',
      `Services/${serviceSid}/Environments/${environmentSid}/Logs/${logSid}`
    );
    return resp.body as unknown as LogApiResource;
  } catch (err) {
    log('%O', new ClientApiError(err));
    throw err;
  }
}
