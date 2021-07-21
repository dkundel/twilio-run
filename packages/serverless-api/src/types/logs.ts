/** @module @twilio-labs/serverless-api */

import { Sid } from './serverless-api';

export type LogsConfig = {
  serviceSid: Sid;
  environment: string | Sid;
  tail: boolean;
  limit?: number;
  filterByFunction?: string | Sid;
  pollingFrequency?: number;
  maxPollingFrequency?: number;
  logCacheSize?: number;
};

export type LogFilters = {
  pageSize?: number;
  functionSid?: Sid;
  startDate?: string | Date;
  endDate?: string | Date;
  pageToken?: string;
};
