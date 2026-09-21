'use client';
import Link from 'next/link';
import { SportIcon } from '@/components/ui/SportIcon';
import { useLiveScores, useClock, matchesForSport } from '@/hooks/useLiveScores';
import { relativeTime, fmtEventDay, fmtTime } from '@/lib/format';
import { ROUND_LABEL } from '@/lib/labels';
import LiveMatchScore from './LiveMatchScore';
import Bracket from './Bracket';
import { ConnectionNote } from './LiveBoard';

export default function SportLiveDetail({ sportId, initial }) {
  const { sports, teams, matches, setsByMatch, bumps, status, polling } = useLiveScores(initial);
  const now = useClock(); // 0 until mounted, then ticks every second

  const sport = sports.find((s) => s.id === sportId);
  if (!sport) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-3)' }}>
        ไม่พบชนิดกีฬานี้ · <Link href="/live" style={{ color: 'var(--gold-700)' }}>กลับหน้าผลสด</Link>
      </div>
    );
  }

  const { live, upcoming, finished } = matchesForSport(matches, sport.id);
  const bracket = matches.filter((m) => m.sport_id === sport.id && m.round);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <Link href="/live" className="btn btn-secondary btn-sm" style={{ padding: '0.4rem 0.7rem' }}>
          ‹ ผลสด
        </Link>
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'var(--sci-yellow-surface)',
            border: '1px solid var(--sci-yellow-border)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold-700)',
          }}
        >
          <SportIcon sportId={sport.id} sportName={sport.name} size={22} />
        </span>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>{sport.name}</h1>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
            {sport.scoring_type === 'sets'
              ? `นับเป็นเซต · ชนะ ${sport.sets_to_win} เซต${sport.points_per_set ? ` · เซตละ ${sport.points_per_set}` : ''}`
              : 'นับคะแนนรวม'}
          </div>
          <ConnectionNote status={status} polling={polling} />
        </div>
      </div>

      {/* กำลังแข่ง */}
      <Section title="กำลังแข่ง" count={live.length} accent>
        {live.length === 0 ? (
          <Empty>ยังไม่มีคู่ที่กำลังแข่ง</Empty>
        ) : (
          live.map((m) => {
            const bump = bumps[m.id];
            const show = Boolean(bump && now && now - bump.at < 3000);
            return (
              <div key={m.id} className="glass-card" style={{ position: 'relative', padding: '1.25rem 1.1rem', border: '1.5px solid rgba(239, 68, 68, 0.45)' }}>
                {show && <span key={bump.at} className="live-indicator">↑ +แต้ม</span>}
                <MetaLine m={m} />
                <LiveMatchScore match={m} sport={sport} teams={teams} sets={setsByMatch[m.id] || []} bump={show ? bump : null} size="lg" />
                <SetTable sets={setsByMatch[m.id] || []} sport={sport} teams={teams} match={m} />
                <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: 'var(--text-3)', textAlign: 'center' }}>
                  {m.last_score_at ? (now ? `อัปเดตล่าสุด ${relativeTime(m.last_score_at, now)}` : '') : 'รอคะแนนแรก'}
                </div>
              </div>
            );
          })
        )}
      </Section>

      {/* คู่ต่อไป */}
      <Section title="คู่ต่อไป" count={upcoming.length}>
        {upcoming.length === 0 ? (
          <Empty>ไม่มีคู่ที่รอแข่ง</Empty>
        ) : (
          upcoming.map((m, i) => (
            <div key={m.id} className="glass-card" style={{ padding: '0.9rem 1.1rem', opacity: i === 0 ? 1 : 0.85 }}>
              <MetaLine m={m} badge={i === 0 ? 'ถัดไป' : null} />
              <LiveMatchScore match={{ ...m, score_a: null, score_b: null, sets_a: null, sets_b: null }} sport={sport} teams={teams} />
            </div>
          ))
        )}
      </Section>

      {/* จบแล้ว */}
      <Section title="จบแล้ว" count={finished.length}>
        {finished.length === 0 ? (
          <Empty>ยังไม่มีผลการแข่งขัน</Empty>
        ) : (
          finished.map((m) => (
            <div key={m.id} className="glass-card" style={{ padding: '0.9rem 1.1rem' }}>
              <MetaLine m={m} />
              <LiveMatchScore match={m} sport={sport} teams={teams} sets={setsByMatch[m.id] || []} />
              <SetTable sets={setsByMatch[m.id] || []} sport={sport} teams={teams} match={m} />
            </div>
          ))
        )}
      </Section>

      {bracket.length > 0 && <Bracket matches={bracket} teams={teams} sport={sport} />}
    </div>
  );
}

function Section({ title, count, accent, children }) {
  return (
    <section style={{ marginBottom: '1.75rem' }}>
      <h2 style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: accent ? 'var(--danger-text)' : 'var(--text-3)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {accent && <span className="live-dot" />}
        {title} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>({count})</span>
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{children}</div>
    </section>
  );
}

function Empty({ children }) {
  return <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', padding: '0.5rem 0.25rem' }}>{children}</div>;
}

function MetaLine({ m, badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
      {badge && <span style={{ padding: '2px 8px', borderRadius: 999, background: 'var(--sci-yellow-surface)', color: 'var(--gold-700)', fontWeight: 700 }}>{badge}</span>}
      {m.round && <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>{ROUND_LABEL[m.round] || m.round}</span>}
      <span>{fmtEventDay(m.match_date)} {fmtTime(m.match_time)} น.</span>
      {m.venue && <span>· {m.venue}</span>}
    </div>
  );
}

function SetTable({ sets, sport, teams, match }) {
  if (sport.scoring_type !== 'sets' || sets.length === 0) return null;
  const teamA = teams.find((t) => t.id === match.team_a_id);
  const teamB = teams.find((t) => t.id === match.team_b_id);
  return (
    <table style={{ width: '100%', marginTop: '0.75rem', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
      <thead>
        <tr style={{ color: 'var(--text-3)' }}>
          <th style={{ textAlign: 'left', fontWeight: 600, padding: '2px 0' }}></th>
          {sets.map((s) => (
            <th key={s.id} style={{ fontWeight: 600, padding: '2px 4px' }}>
              เซต {s.set_number}{s.status === 'live' ? ' •' : ''}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[['a', teamA], ['b', teamB]].map(([side, team]) => (
          <tr key={side} style={{ borderTop: '1px solid var(--glass-border)' }}>
            <td style={{ padding: '4px 0', fontWeight: 700, color: 'var(--text-2)' }}>{team?.name || '—'}</td>
            {sets.map((s) => {
              const mine = side === 'a' ? s.score_a : s.score_b;
              const other = side === 'a' ? s.score_b : s.score_a;
              const won = s.status === 'finished' && mine > other;
              return (
                <td key={s.id} style={{ textAlign: 'center', padding: '4px', fontWeight: won ? 800 : 500, color: won ? 'var(--text)' : 'var(--text-3)' }}>
                  {mine}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
