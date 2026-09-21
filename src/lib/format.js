// Date / time / duration formatting used across public, staff and admin UI.
// Everything Thai-locale and event-specific lives here so day labels and
// wording change in one place.

/** Event days: ISO date → labels used in filters, cards and headings. */
export const EVENT_DAYS = [
  { date: '2026-10-09', short: 'ศ. 9 ต.ค.', long: 'วันศุกร์ที่ 9 ตุลาคม 2569 (วันเปิดสนาม)', sub: 'เปิดสนาม' },
  { date: '2026-10-10', short: 'ส. 10 ต.ค.', long: 'วันเสาร์ที่ 10 ตุลาคม 2569 (รอบตัดเชือก & ชิงชนะเลิศ)', sub: 'ตัดเชือก' },
  { date: '2026-10-11', short: 'อา. 11 ต.ค.', long: 'วันอาทิตย์ที่ 11 ตุลาคม 2569 (วันชิงชนะเลิศส่งท้าย)', sub: 'ชิงชนะเลิศ' },
];
export const EVENT_START_DATE = EVENT_DAYS[0].date;
export const EVENT_END_DATE = EVENT_DAYS[EVENT_DAYS.length - 1].date;

const dayByDate = Object.fromEntries(EVENT_DAYS.map((d) => [d.date, d]));

/** '2026-10-09' → 'ศ. 9 ต.ค.'; unknown dates fall back to 'MM-DD'. */
export function fmtEventDay(date) {
  return dayByDate[date]?.short || (date ? date.slice(5) : '');
}

/** '2026-10-09' → 'วันศุกร์ที่ 9 ตุลาคม 2569 (วันเปิดสนาม)'; unknown → the date itself. */
export function fmtEventDayLong(date) {
  return dayByDate[date]?.long || date || '';
}

/** '17:30:00' → '17:30' */
export function fmtTime(time) {
  return time ? time.slice(0, 5) : '';
}

/** '17:30:00' → '17:30 น.' */
export function fmtTimeTh(time) {
  return time ? `${time.slice(0, 5)} น.` : '';
}

/** ISO date/timestamp → '9 ตุลาคม 2569' */
export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** ISO timestamp → '9 ต.ค. 2569 17:30' */
export function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** ISO timestamp → '21 ก.ย. 17:24' (compact, for admin tables) */
export function fmtShortDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** ISO timestamp → '21 ก.ย. 17:24:07' (with seconds, for audit rows) */
export function fmtShortDateTimeSec(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Date → '17:24:07' */
export function fmtClock(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('th-TH');
}

/** Milliseconds → 'm:ss' (never negative). */
export function fmtRemaining(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * ISO timestamp → 'เมื่อสักครู่' / '12 วินาทีที่แล้ว' / '3 นาทีที่แล้ว' / '2 ชั่วโมงที่แล้ว'.
 * Returns null when `now` is 0 (SSR / before the client clock starts) so
 * server and client markup match.
 */
export function relativeTime(iso, now = Date.now()) {
  if (!iso || !now) return null;
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 5) return 'เมื่อสักครู่';
  if (s < 60) return `${s} วินาทีที่แล้ว`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  return `${h} ชั่วโมงที่แล้ว`;
}
