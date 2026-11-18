// Address of the web service, from mobile/.env (EXPO_PUBLIC_API_URL).
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/+$/, '');

// Requirement N2: every request is cancelled after 10 seconds.
export const TIMEOUT_MS = 10000;
