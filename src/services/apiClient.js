import { auth } from '../firebase/firebase';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Authenticated JSON call to the Chandara backend (/api/v1). Throws ApiError with a user-safe message. */
export async function apiRequest(path, { method = 'GET', body, idempotencyKey } = {}) {
  const user = auth.currentUser;
  if (!user) throw new ApiError('Please sign in to continue.', 401);
  const token = await user.getIdToken();

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* non-JSON error body */
  }
  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.error || payload?.message || `Request failed (${response.status})`, response.status);
  }
  // Most endpoints wrap results as { success, data }; admin endpoints return the body directly.
  if (payload && typeof payload === 'object' && 'data' in payload) return payload.data;
  return payload ?? undefined;
}
