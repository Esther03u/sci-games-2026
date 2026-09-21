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
      {status === 'live' && <span style={{ fontSize: '0.6rem', marginRight: '3px' }}>●</span>}
      {config.label}
    </span>
  );
}
