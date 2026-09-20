export const TEAM_COLORS = {
  red: { name: 'สีแดง', hex: '#ef4444', light: '#fee2e2' },
  blue: { name: 'สีน้ำเงิน', hex: '#3b82f6', light: '#dbeafe' },
  green: { name: 'สีเขียว', hex: '#22c55e', light: '#dcfce7' },
  yellow: { name: 'สีเหลือง', hex: '#eab308', light: '#fef9c3' },
};

export const SPORT_TYPES = {
  individual: 'เดี่ยว',
  team: 'ทีม',
};

export const MATCH_STATUS = {
  upcoming: { label: 'ยังไม่แข่ง', color: '#a1a1aa', bgClass: 'badge-upcoming' },
  live: { label: 'กำลังแข่ง', color: '#22c55e', bgClass: 'badge-live' },
  finished: { label: 'จบแล้ว', color: '#3b82f6', bgClass: 'badge-finished' },
  postponed: { label: 'เลื่อน', color: '#f59e0b', bgClass: 'badge-postponed' },
};

export const REGISTRATION_STATUS = {
  registered: { label: 'สมัครแล้ว', color: '#22c55e' },
  cancelled: { label: 'ยกเลิก', color: '#ef4444' },
};

export const SPORTS_LIST = [
  { key: 'petanque', name: 'เปตอง', type: 'team' },
  { key: 'sepaktakraw', name: 'เซปักตะกร้อ', type: 'team' },
  { key: 'volleyball', name: 'วอลเลย์บอล', type: 'team' },
  { key: 'basketball_male', name: 'บาสเกตบอลชาย', type: 'team' },
  { key: 'basketball_female', name: 'บาสเกตบอลหญิง', type: 'team' },
  { key: 'futsal', name: 'ฟุตซอล', type: 'team' },
];

export const EVENT_INFO = {
  name: 'Sci Games',
  nameTh: 'กีฬาสานสัมพันธ์ภายใน',
  organizer: 'สโมสรนักศึกษาคณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต',
  dates: '9-11 ตุลาคม 2569',
  startDate: '2026-10-09',
  endDate: '2026-10-11',
  participants: 160,
  teamCount: 4,
};
