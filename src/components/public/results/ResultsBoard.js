'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import MatchCard from '@/components/ui/MatchCard';
import { Trophy } from '@/components/animate-ui/icons';
import { useLiveScores } from '@/hooks/useLiveScores';
import ResultsFilters from './ResultsFilters';
import { filterMatches, groupByStatus, nextUpcoming, sportOf, statusCounts } from './filters';

const GRID = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(330px, 100%), 1fr))',
  gap: '1rem',
};

/**
 * /results — every match with sport / status / category filters.
 * Data comes from the same realtime pipeline as /live (`useLiveScores`), so
 * scores, sets and the ↑ bump indicator stay in sync without a second fetch.
 */
export default function ResultsBoard({ initial }) {
  // Spectator page: no Realtime channel (free-tier cap is 200 concurrent),
  // it refreshes every 30 s — enough for status changes, which is all
  // spectators see; live scores stay on /live for referees and admins.
  const live = useLiveScores(initial, { realtime: false, publicView: true });
  const [filters, setFilters] = useState({ sport: 'all', status: 'all', category: 'all' });
  const onChange = (partial) => setFilters((f) => ({ ...f, ...partial }));

  const { matches, sports, teams } = live;

  const filtered = useMemo(() => filterMatches(matches, filters), [matches, filters]);
  const groups = useMemo(() => groupByStatus(filtered), [filtered]);
  const next = useMemo(
    () => nextUpcoming(groups.upcoming, { sport: filters.sport, sports }),
    [groups.upcoming, filters.sport, sports]
  );
  const counts = useMemo(() => statusCounts(matches, filters), [matches, filters]);

  const card = (m, extra = {}) => (
    <MatchCard
      key={m.id}
      match={m}
      teams={teams}
      sport={sportOf(sports, m)}
      animated={!!live.bumps[m.id]}
      {...extra}
    />
  );

  return (
    <div>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1
          className="page-title"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            fontSize: '1.85rem',
          }}
        >
          <Trophy size={30} style={{ color: 'var(--accent)' }} /> ผลการแข่งขัน
        </h1>
        <p className="page-subtitle" style={{ fontSize: '0.98rem' }}>
          สรุปคะแนน สถิติ และผลการแข่งขันครบทุกชนิดกีฬาในงาน Sci Games 2026
        </p>
      </div>

      <ResultsFilters
        filters={filters}
        onChange={onChange}
        sports={sports}
        matches={matches}
        counts={counts}
        resultCount={filtered.length}
      />

      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1.5rem',
            background: 'var(--surface)',
            borderRadius: '20px',
            border: '1px solid var(--border)',
          }}
        >
          <p style={{ fontSize: '1.05rem', color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem' }}>
            ไม่พบรายการแข่งขันที่ตรงกับตัวกรอง
          </p>
          <button
            type="button"
            onClick={() => onChange({ sport: 'all', status: 'all', category: 'all' })}
            className="btn btn-secondary btn-sm"
          >
            ล้างตัวกรอง
          </button>
        </div>
      ) : filters.status !== 'all' ? (
        /* Flat list for a single status tab */
        <div>
          {filters.status === 'live' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                color: 'var(--danger-text)',
                fontWeight: 600,
              }}
            >
              <span>
                🔴 แสดงกีฬาที่กำลังแข่งขันอยู่ ({filtered.length} แมตช์) · ผลคะแนนจะอัปเดตหลังจบการแข่งขัน
              </span>
            </div>
          )}
          {filters.status === 'upcoming' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--accent-surface)',
                border: '1px solid var(--accent-border)',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                color: '#92400e',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <span>📌 แสดงเฉพาะคู่ถัดไปของแต่ละกีฬา ({next.length} คู่)</span>
              <Link
                href="/schedule"
                style={{ fontWeight: 700, color: 'var(--accent-text)', textDecoration: 'underline' }}
              >
                ดูตารางแข่งขันทั้งหมดทุกคู่ ({groups.upcoming.length} แมตช์) →
              </Link>
            </div>
          )}
          <div style={GRID}>
            {filters.status === 'upcoming'
              ? next.map((m) => card(m, { isScheduleView: true }))
              : filtered.map((m) => card(m))}
          </div>
        </div>
      ) : (
        /* All statuses: live → finished → next-up sections */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {groups.live.length > 0 && (
            <section>
              <SectionHeader
                dot={
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#ef4444',
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                }
                title="กำลังแข่งขัน (IN PROGRESS)"
                titleColor="var(--danger-text)"
                note={`(${groups.live.length} แมตช์ · แสดงสถานะการแข่ง รอสรุปผลเมื่อจบแมตช์)`}
              />
              <div style={GRID}>{groups.live.map((m) => card(m))}</div>
            </section>
          )}

          {groups.finished.length > 0 && (
            <section>
              <SectionHeader
                dot={
                  <div
                    style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success-text)' }}
                  />
                }
                title="ผลการแข่งขันที่จบแล้ว (COMPLETED)"
                note={`(${groups.finished.length} แมตช์)`}
              />
              <div style={GRID}>{groups.finished.map((m) => card(m))}</div>
            </section>
          )}

          {next.length > 0 && (
            <section>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.6rem',
                }}
              >
                <SectionHeader
                  dot={
                    <div
                      style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-text)' }}
                    />
                  }
                  title="โปรแกรมแมตช์ต่อไป (UPCOMING)"
                  note={`(${filters.sport === 'all' ? `คู่ถัดไปของแต่ละกีฬา • เรียงตามเวลาแข่งขัน • ${next.length} คู่` : 'คู่ถัดไป'})`}
                  inline
                />
                <Link
                  href="/schedule"
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--accent-text)',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'var(--accent-surface)',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--accent-border)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>ดูตารางแข่งทั้งหมด ({groups.upcoming.length} แมตช์)</span>
                  <span>→</span>
                </Link>
              </div>
              <div style={GRID}>{next.map((m) => card(m, { isScheduleView: true }))}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ dot, title, titleColor = 'var(--text)', note, inline = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: inline ? 0 : '1rem' }}>
      {dot}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: titleColor, margin: 0 }}>{title}</h2>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{note}</span>
    </div>
  );
}
