'use client';

// Small fetch wrapper for the admin/staff UI. Throws an Error whose
// message is the Thai text from the API so it can be shown as-is.
export async function adminApi(path, { method = 'POST', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const err = new Error(json.message || `เกิดข้อผิดพลาด (${res.status})`);
    err.code = json.error_code;
    err.status = res.status;
    throw err;
  }
  return json.data;
}
