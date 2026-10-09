// 24-hour "HH:MM" text entry for admin forms (components/ui/TimeInput).
// Pure, unit-tested in tests/time-input.test.js.

/** While typing: keep digits, put the colon in after the hour → "19" "19:0" "19:00". */
export function formatTyping(raw = '') {
  const s = String(raw);
  // "9:30" typed with a colon after one hour digit → keep it as 9:30 for now
  const m = s.match(/^(\d{1,2})\s*[:.]\s*(\d{0,2})/);
  if (m) return `${m[1]}:${m[2]}`;
  const d = s.replace(/\D/g, '').slice(0, 4);
  // 3–9 can only be a one-digit hour: "930" → "09:30"
  if (d[0] > '2' && d.length > 1) return `0${d[0]}:${d.slice(1, 3)}`;
  return d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
}

/**
 * Complete value → "HH:MM", or null when it is not a valid 24-hour time.
 * Accepts "19:00", "1900", "9:30", "930", "9", "19", "19.00".
 */
export function parseTime(text = '') {
  const s = String(text).trim();
  if (!s) return null;
  let h;
  let mi;
  const withSep = s.match(/^(\d{1,2})\s*[:.]\s*(\d{1,2})$/);
  if (withSep) {
    h = +withSep[1];
    mi = +withSep[2];
    if (withSep[2].length === 1) mi *= 10; // "19:3" → 19:30
  } else if (/^\d{1,4}$/.test(s)) {
    if (s.length <= 2) [h, mi] = [+s, 0];
    else if (s.length === 3) [h, mi] = [+s[0], +s.slice(1)];
    else [h, mi] = [+s.slice(0, 2), +s.slice(2)];
  } else {
    return null;
  }
  if (h > 23 || mi > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
}

/** "HH:MM:SS" / "HH:MM" from the database → what the field shows. */
export const toFieldValue = (v) => (v ? String(v).slice(0, 5) : '');
