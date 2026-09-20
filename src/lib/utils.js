import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
