'use client';
import { MATCH_STATUS } from '@/lib/labels';

export default function StatusBadge({ status }) {
  const config = MATCH_STATUS[status];
  if (!config) return null;

  const classMap = {
    upcoming: 'badge-upcoming',
    live: 'badge-live',
    finished: 'badge-finished',
    postponed: 'badge-postponed',
  };

  return (
    <span className={`badge ${classMap[status] || ''}`}>
      {status === 'live' && <span className="sb-dot">●</span>}
      {config.label}
    </span>
  );
}
