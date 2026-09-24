// Human-readable Thai labels for enum-like values coming from the database.
// Keep every "code → text" mapping here so wording is consistent across
// public, staff and admin screens.

/** matches.status */
export const MATCH_STATUS = {
  upcoming: { label: 'ยังไม่แข่ง', color: '#a1a1aa', bgClass: 'badge-upcoming' },
  live: { label: 'กำลังแข่ง', color: '#22c55e', bgClass: 'badge-live' },
  finished: { label: 'จบแล้ว', color: '#3b82f6', bgClass: 'badge-finished' },
  postponed: { label: 'เลื่อน', color: '#f59e0b', bgClass: 'badge-postponed' },
};

/** matches.round (bracket slots created by generate_bracket) */
export const ROUND_LABEL = {
  semi_1: 'รอบรองฯ 1',
  semi_2: 'รอบรองฯ 2',
  third: 'ชิงที่ 3',
  final: 'ชิงชนะเลิศ',
};
export const roundLabel = (round) => ROUND_LABEL[round] || round || '';

/** score_events.event_type */
export const EVENT_LABEL = {
  score: 'คะแนน',
  start: 'เริ่มแมตช์',
  finish_set: 'จบเซต',
  finish_match: 'จบแมตช์',
  reopen: 'เปิดใหม่',
  override: 'แก้คะแนน',
  undo: 'ยกเลิก',
};

/** score_events.actor_type */
export const ACTOR_TYPE_LABEL = {
  admin: 'ผู้ดูแลระบบ',
  staff: 'เจ้าหน้าที่',
  pin: 'กรรมการ (PIN)',
};

/** audit_logs.action (trigger writes `<op>_<table>`; API routes write explicit names) */
export const ACTION_LABEL = {
  insert: 'สร้าง',
  update: 'แก้ไข',
  delete: 'ลบ',
  create_user: 'สร้างผู้ใช้',
  delete_user: 'ลบผู้ใช้',
  create_pin: 'สร้าง PIN',
  update_pin: 'แก้ไข PIN',
  delete_pin: 'ลบ PIN',
  reveal_pin: 'ดู PIN',
  reset_match: 'รีเซ็ตผลการแข่ง',
  override_score: 'แก้ไขคะแนน',
  walkover_match: 'ชนะบาย',
  reopen_match: 'เปิดแข่งต่อ',
  update_setting: 'ตั้งค่า',
};

/** registrations.status */
export const REGISTRATION_STATUS = {
  registered: { label: 'สมัครแล้ว', color: '#22c55e' },
  cancelled: { label: 'ยกเลิก', color: '#ef4444' },
};

/** sports.sport_type */
export const SPORT_TYPE_LABEL = {
  individual: 'เดี่ยว',
  team: 'ทีม',
};

export const EVENT_INFO = {
  name: 'Sci Games',
  nameTh: 'กีฬาสานสัมพันธ์ภายใน',
  organizer: 'สโมสรนักศึกษาคณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต',
  dates: '9-11 ตุลาคม 2569',
  participants: 160,
  teamCount: 4,
};
