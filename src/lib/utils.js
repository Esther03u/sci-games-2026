import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Date helpers moved to '@/lib/format' — re-exported for existing callers.
export { formatDate, formatDateTime, fmtTime as formatTime } from '@/lib/format';

export function validateStudentId(id) {
  if (!id) return false;
  // Accepts standard format: xx-xxxx-xxxxx or 11-13 digits
  const clean = id.trim();
  return /^\d{2}-\d{4}-\d{5}$/.test(clean) || /^\d{11,13}$/.test(clean);
}

export function validatePhone(phone) {
  if (!phone) return false;
  const clean = phone.replace(/[-\s]/g, '');
  return /^0[0-9]{8,9}$/.test(clean);
}
