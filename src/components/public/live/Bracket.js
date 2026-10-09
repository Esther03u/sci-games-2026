'use client';
import { matchWinner } from '@/hooks/useLiveScores';
import { ROUND_LABEL } from '@/lib/labels';

// 4-team bracket: two semis feeding a final, losers to a 3rd-place match.
export default function Bracket({ matches, teams, sport }) {
  const byRound = Object.fromEntries(matches.map((m) => [m.round, m]));
  const name = (id) => teams.find((t) => t.id === id)?.name;
  const cell = (m, slot) => {
    if (!m) return null;
    const id = slot === 'a' ? m.team_a_id : m.team_b_id;
    const w = matchWinner(m, sport);
    const isW = w === slot;
    const score =
      sport.scoring_type === 'sets'
        ? slot === 'a'
          ? m.sets_a
          : m.sets_b
        : slot === 'a'
          ? m.score_a
          : m.score_b;
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '4px 8px',
          fontWeight: isW ? 800 : 500,
          color: id
            ? isW || m.status !== 'finished'
              ? 'var(--text)'
              : 'var(--text-muted)'
            : 'var(--text-muted)',
        }}
      >
        <span>{name(id) || 'รอผล'}</span>
        <span>{m.status === 'upcoming' ? '' : (score ?? '')}</span>
      </div>
    );
  };
  const box = (m, label) => (
    <div className="glass-card" style={{ padding: '0.5rem 0.25rem', minWidth: 150 }}>
      <div className="br-label">
        {label}
        {m?.status === 'live' ? ' · LIVE' : ''}
      </div>
      {cell(m, 'a')}
      {cell(m, 'b')}
    </div>
  );
  return (
    <section className="br">
      <h2 className="br-title">สายการแข่งขัน</h2>
      <div className="br-grid">
        <div className="br-col">
          {box(byRound.semi_1, ROUND_LABEL.semi_1)}
          {box(byRound.semi_2, ROUND_LABEL.semi_2)}
        </div>
        <div className="br-col">
          {box(byRound.final, ROUND_LABEL.final)}
          {box(byRound.third, ROUND_LABEL.third)}
        </div>
      </div>
    </section>
  );
}
