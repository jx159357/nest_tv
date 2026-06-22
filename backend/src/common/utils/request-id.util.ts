import type { Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';
export const REQUEST_ID_RESPONSE_HEADER = 'X-Request-ID';

const normalizeHeaderValue = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

export const generateRequestId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
};

export const getRequestIdFromRequest = (request: Request): string | undefined => {
  return normalizeHeaderValue(request.headers[REQUEST_ID_HEADER]);
};

export const ensureRequestId = (request: Request, response?: Response): string => {
  const requestId = getRequestIdFromRequest(request) || generateRequestId();
  request.headers[REQUEST_ID_HEADER] = requestId;
  response?.setHeader(REQUEST_ID_RESPONSE_HEADER, requestId);
  return requestId;
};
