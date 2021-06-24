import { Response as ExpressResponse } from 'express';
import { Response } from '../../../src/dev-runtime/internal/response';

test('has correct defaults', () => {
  const response = new Response();
  expect(response['body']).toBeNull();
  expect(response['statusCode']).toBe(200);
  expect(response['headers']).toEqual({});
});

test('sets status code, body and headers from constructor', () => {
  const response = new Response({
    headers: {
      'Access-Control-Allow-Origin': 'example.com',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: 'Error',
    statusCode: 400,
  });
  expect(response['statusCode']).toBe(400);
  expect(response['body']).toBe('Error');
  expect(response['headers']).toEqual({
    'Access-Control-Allow-Origin': 'example.com',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
});

test('sets status code', () => {
  const response = new Response();
  expect(response['statusCode']).toBe(200);
  const response2 = response.setStatusCode(418);
  expect(response['statusCode']).toBe(418);
  expect(response2).toBe(response);
});

test('sets body correctly', () => {
  const response = new Response();
  expect(response['body']).toBeNull();
  response.setBody('Hello');
  expect(response['body']).toBe('Hello');
  const response2 = response.setBody({ url: 'https://dkundel.com' });
  expect(response['body']).toEqual({ url: 'https://dkundel.com' });
  expect(response2).toBe(response);
});

test('sets headers correctly', () => {
  const response = new Response();
  expect(response['headers']).toEqual({});
  const response2 = response.setHeaders({
    'Access-Control-Allow-Origin': 'example.com',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  const expected = {
    'Access-Control-Allow-Origin': 'example.com',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  expect(response['headers']).toEqual(expected);
  // @ts-ignore
  response.setHeaders(undefined);
  expect(response['headers']).toEqual(expected);
  expect(response2).toBe(response);
});

test('appends a new header correctly', () => {
  const response = new Response();
  expect(response['headers']).toEqual({});
  response.appendHeader('Access-Control-Allow-Origin', 'dkundel.com');
  expect(response['headers']).toEqual({
    'Access-Control-Allow-Origin': 'dkundel.com',
  });
  const response2 = response.appendHeader('Content-Type', 'application/json');
  expect(response['headers']).toEqual({
    'Access-Control-Allow-Origin': 'dkundel.com',
    'Content-Type': 'application/json',
  });
  expect(response2).toBe(response);
});

test('appends a header correctly with no existing one', () => {
  const response = new Response();
  expect(response['headers']).toEqual({});
  // @ts-ignore
  response['headers'] = undefined;
  const response2 = response.appendHeader(
    'Access-Control-Allow-Origin',
    'dkundel.com'
  );
  expect(response['headers']).toEqual({
    'Access-Control-Allow-Origin': 'dkundel.com',
  });
  expect(response2).toBe(response);
});

test('calls express response correctly', () => {
  const mockRes = {
    status: jest.fn(),
    set: jest.fn(),
    send: jest.fn(),
  } as unknown as ExpressResponse;
  const response = new Response();
  response.setBody(`I'm a teapot!`);
  response.setStatusCode(418);
  response.appendHeader('Content-Type', 'text/plain');
  response.applyToExpressResponse(mockRes);

  expect(mockRes.send).toHaveBeenCalledWith(`I'm a teapot!`);
  expect(mockRes.status).toHaveBeenCalledWith(418);
  expect(mockRes.set).toHaveBeenCalledWith({ 'Content-Type': 'text/plain' });
});

test('serializes a response', () => {
  const response = new Response();
  response.setBody("I'm a teapot!");
  response.setStatusCode(418);
  response.appendHeader('Content-Type', 'text/plain');

  const serialized = response.serialize();

  expect(serialized.body).toEqual("I'm a teapot!");
  expect(serialized.statusCode).toEqual(418);
  expect(serialized.headers).toEqual({ 'Content-Type': 'text/plain' });
});

test('serializes a response with content type set to application/json', () => {
  const response = new Response();
  response.setBody({ url: 'https://dkundel.com' });
  response.setStatusCode(200);
  response.appendHeader('Content-Type', 'application/json');

  const serialized = response.serialize();

  expect(serialized.body).toEqual(
    JSON.stringify({ url: 'https://dkundel.com' })
  );
  expect(serialized.statusCode).toEqual(200);
  expect(serialized.headers).toEqual({ 'Content-Type': 'application/json' });
});
