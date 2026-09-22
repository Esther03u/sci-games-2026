'use client';

/**
 * Thrown when the request never reached the server (offline, DNS, aborted).
 * Callers that queue work (the scoring pad) retry on this; everything else
 * shows the message.
 */
export class NetworkError extends Error {
  constructor(message = 'ไม่มีสัญญาณอินเทอร์เน็ต') {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Thrown for any non-2xx / { success:false } response. `message` is the
 * Thai text from the API and can be shown as-is; `code` is the API's
 * error_code (e.g. EDIT_WINDOW_CLOSED) for callers that branch on it.
 */
export class ApiError extends Error {
  constructor(message, { code, status } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Single fetch wrapper for every /api/* call from the browser.
 *
 *   const match = await apiRequest('/api/score', { body: { match_id, team: 'a', delta: 1 } });
 *   const pins  = await apiRequest('/api/admin/pins', { method: 'GET' });
 *
 * Resolves with `data` from { success:true, data } and rejects with
 * NetworkError or ApiError.
 */
export async function apiRequest(path, { method = 'POST', body, signal } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new NetworkError();
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new ApiError(json.message || `เกิดข้อผิดพลาด (${res.status})`, {
      code: json.error_code,
      status: res.status,
    });
  }
  return json.data;
}
