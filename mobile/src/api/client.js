import { API_URL, TIMEOUT_MS } from '../config';

/**
 * kind tells the screen what went wrong:
 *  - 'network'    the request could not reach the service (no connection, wrong address)
 *  - 'timeout'    no answer within 10 seconds (N2)
 *  - 'validation' the service refused the input (400, 409, 422)
 *  - 'auth'       not logged in (401, used from Lab 07)
 *  - 'server'     the service failed (5xx)
 *  - 'config'     EXPO_PUBLIC_API_URL is missing
 */
export class ApiError extends Error {
  constructor(kind, message, { status = null, code = null } = {}) {
    super(message);
    this.kind = kind;
    this.status = status;
    this.code = code;
  }
}

export function kindForStatus(status) {
  if (status === 401) return 'auth';
  if (status >= 400 && status < 500) return 'validation';
  return 'server';
}

export async function request(method, path, body) {
  if (!API_URL) {
    throw new ApiError('config', 'The service address is missing. Set EXPO_PUBLIC_API_URL in mobile/.env.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response;
  try {
    response = await fetch(API_URL + path, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new ApiError('timeout', 'The server did not answer within 10 seconds.');
    }
    throw new ApiError('network', 'Cannot reach the server. Check your connection.');
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // empty or non-JSON body
  }

  if (response.ok) return data;

  const message = (data && data.error && data.error.message) || `The server answered ${response.status}.`;
  const code = data && data.error ? data.error.code : null;
  throw new ApiError(kindForStatus(response.status), message, { status: response.status, code });
}
