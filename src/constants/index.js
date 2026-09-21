// Moved to '@/lib/labels'. Kept as a re-export so old imports keep working.
export { MATCH_STATUS, REGISTRATION_STATUS, SPORT_TYPE_LABEL as SPORT_TYPES, EVENT_INFO } from '@/lib/labels';

export const TEAM_COLORS = {
  red: { name: 'สีแดง', hex: '#ef4444', light: '#fee2e2' },
  blue: { name: 'สีน้ำเงิน', hex: '#3b82f6', light: '#dbeafe' },
  green: { name: 'สีเขียว', hex: '#22c55e', light: '#dcfce7' },
  yellow: { name: 'สีเหลือง', hex: '#eab308', light: '#fef9c3' },
};

export const SPORTS_LIST = [
  { key: 'petanque', name: 'เปตอง', type: 'team' },
  { key: 'sepaktakraw', name: 'เซปักตะกร้อ', type: 'team' },
  { key: 'volleyball', name: 'วอลเลย์บอล', type: 'team' },
  { key: 'basketball_male', name: 'บาสเกตบอลชาย', type: 'team' },
  { key: 'basketball_female', name: 'บาสเกตบอลหญิง', type: 'team' },
  { key: 'futsal', name: 'ฟุตซอล', type: 'team' },
];
