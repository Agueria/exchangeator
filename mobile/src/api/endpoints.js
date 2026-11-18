import { request } from './client';

// Read path (F9)
export function getWallet() {
  return request('GET', '/wallet');
}

// Write path (F4). The same requestId must be used if the request is repeated (N6).
export function fundWallet(requestId, amount) {
  return request('POST', '/wallet/fund', { requestId, amount });
}
