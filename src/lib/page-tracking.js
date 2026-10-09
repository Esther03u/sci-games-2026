// Client side of page-view counting (PageTracker). Pure helpers are
// unit-tested in tests/page-tracking.test.js.

/** A page counts once per tab per this window — a refresh is not a new view. */
export const TRACK_WINDOW_MS = 30 * 60 * 1000;

/**
 * @param {Record<string, number>} seen  path → last tracked time (this tab)
 * @returns {{ track: boolean, seen: Record<string, number> }}
 */
export function shouldTrack(seen, path, now, windowMs = TRACK_WINDOW_MS) {
  const last = seen?.[path];
  if (typeof last === 'number' && now - last < windowMs && now >= last) {
    return { track: false, seen };
  }
  // Drop expired entries so the stored map stays small.
  const next = {};
  for (const [p, t] of Object.entries(seen || {})) {
    if (typeof t === 'number' && now - t < windowMs) next[p] = t;
  }
  next[path] = now;
  return { track: true, seen: next };
}

function randomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Long-lived anonymous id for this browser, or null when storage is blocked. */
export function getVisitorId(storage) {
  try {
    let id = storage.getItem('sg_vid');
    if (!id) {
      id = randomId();
      storage.setItem('sg_vid', id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Reads, updates and writes this tab's seen-map; storage errors → always track. */
export function claimPageView(storage, path, now = Date.now()) {
  let seen = {};
  try {
    seen = JSON.parse(storage.getItem('sg_seen') || '{}') || {};
  } catch {
    seen = {};
  }
  const result = shouldTrack(seen, path, now);
  if (result.track) {
    try {
      storage.setItem('sg_seen', JSON.stringify(result.seen));
    } catch {
      // storage full / blocked — still count this view
    }
  }
  return result.track;
}
