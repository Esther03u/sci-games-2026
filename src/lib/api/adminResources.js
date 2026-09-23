// Whitelist for the generic admin CRUD route (/api/admin/[resource]).
// Only these tables and columns can be written from the dashboard; anything
// else is rejected. Score changes on matches never go through here — they
// use /api/match/[id]/override so a score_event is recorded.
// `revalidate` lists the ISR public pages to refresh after a write.

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v) => typeof v === 'string' && uuidRe.test(v);
const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isTime = (v) => typeof v === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(v);
const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
const optionalText = (v) => v == null || typeof v === 'string';
const optionalInt = (v) => v == null || Number.isInteger(v);
const bool = (v) => typeof v === 'boolean';

const optionalUuid = (v) => v == null || isUuid(v);

export const RESOURCES = {
  matches: {
    table: 'matches',
    select: '*',
    revalidate: ['/schedule'],
    insert: {
      required: ['sport_id', 'match_date', 'match_time', 'venue'],
      columns: {
        sport_id: isUuid,
        team_a_id: optionalUuid,
        team_b_id: optionalUuid,
        match_date: isDate,
        match_time: isTime,
        venue: nonEmpty,
        round: optionalText,
        category: optionalText,
        match_number: optionalInt,
      },
      defaults: { status: 'upcoming' },
      validate: (b) =>
        b.team_a_id && b.team_b_id && b.team_a_id === b.team_b_id
          ? 'ทีมที่แข่งขันต้องไม่เป็นทีมเดียวกัน'
          : null,
    },
    update: {
      columns: {
        sport_id: isUuid,
        team_a_id: optionalUuid,
        team_b_id: optionalUuid,
        match_date: isDate,
        match_time: isTime,
        venue: nonEmpty,
        round: optionalText,
        category: optionalText,
        match_number: optionalInt,
        // status only for schedule changes (upcoming ⇄ postponed); live/finished go through start/finish
        status: (v) => v === 'upcoming' || v === 'postponed',
      },
    },
    delete: true,
  },
  announcements: {
    table: 'announcements',
    select: '*',
    revalidate: ['/news'],
    insert: {
      required: ['title', 'content'],
      columns: { title: nonEmpty, content: nonEmpty, is_pinned: bool },
      withActor: { created_by: 'adminUserId' },
    },
    update: { columns: { title: nonEmpty, content: nonEmpty, is_pinned: bool } },
    delete: true,
  },
  departments: {
    table: 'departments',
    select: '*, teams(name, color_hex, logo_emoji)',
    insert: { required: ['name', 'team_id'], columns: { name: nonEmpty, team_id: isUuid } },
    update: { columns: { name: nonEmpty, team_id: isUuid } },
    delete: true,
  },
  sport_schedules: {
    table: 'sport_schedules',
    select: '*, sports(name)',
    insert: {
      required: ['sport_id', 'schedule_date', 'start_time', 'end_time'],
      columns: { sport_id: isUuid, schedule_date: isDate, start_time: isTime, end_time: isTime },
      validate: (b) => (b.start_time >= b.end_time ? 'เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด' : null),
    },
    update: { columns: { sport_id: isUuid, schedule_date: isDate, start_time: isTime, end_time: isTime } },
    delete: true,
  },
  athletes: {
    table: 'athletes',
    select: '*',
    delete: true, // registrations cascade
  },
  registrations: {
    table: 'registrations',
    select: '*',
    update: {
      // only cancellation is allowed from the dashboard
      columns: { status: (v) => v === 'cancelled' || v === 'registered' },
      onUpdate: (patch, actor) =>
        patch.status === 'cancelled'
          ? { ...patch, cancelled_at: new Date().toISOString(), cancelled_by: actor.adminUserId }
          : { ...patch, cancelled_at: null, cancelled_by: null },
    },
  },
};

/** Keep only whitelisted, valid columns. Returns { values, error }. */
export function pickColumns(spec, body, { requireAll = false } = {}) {
  const values = {};
  for (const [col, check] of Object.entries(spec.columns || {})) {
    if (!(col in body)) continue;
    const v = body[col];
    if (!check(v)) return { error: `ค่าของ ${col} ไม่ถูกต้อง` };
    values[col] = typeof v === 'string' ? v.trim() : v;
  }
  if (requireAll) {
    for (const col of spec.required || []) {
      if (values[col] == null || values[col] === '') return { error: `กรุณากรอก ${col}` };
    }
  }
  if (Object.keys(values).length === 0) return { error: 'ไม่มีข้อมูลให้บันทึก' };
  const custom = spec.validate?.(values);
  if (custom) return { error: custom };
  return { values };
}
