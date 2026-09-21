'use client';
import { TeamIcon } from '@/components/ui/SportIcon';
import { matchWinner } from '@/hooks/useLiveScores';

/**
 * Two teams + the score line, used by the sport card and the detail page.
 * `bump` ({ team, at }) highlights the team that just scored.
 */
export default function LiveMatchScore({ match, sport, teams, sets = [], bump = null, size = 'md' }) {
  const isSets = sport?.scoring_type === 'sets';
  const teamA = teams.find((t) => t.id === match.team_a_id);
  const teamB = teams.find((t) => t.id === match.team_b_id);
  const winner = matchWinner(match, sport);
  const finished = match.status === 'finished';
  const live = match.status === 'live';

  const big = size === 'lg' ? '3.6rem' : '2.6rem';
  const bumpKey = bump ? `${bump.team}-${bump.at}` : 'none';

  const mainA = isSets ? match.sets_a ?? 0 : match.score_a ?? 0;
  const mainB = isSets ? match.sets_b ?? 0 : match.score_b ?? 0;

  const scoreStyle = (side) => ({
    fontFamily: 'var(--font-heading)',
    fontSize: big,
    fontWeight: 900,
    lineHeight: 1,
    color: finished && winner && winner !== side ? 'var(--text-muted)' : 'var(--text)',
    minWidth: '2ch',
    textAlign: 'center',
  });

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.5rem' }}>
        <TeamCol team={teamA} align="flex-start" isWinner={winner === 'a'} placeholder="รอผล" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span key={bump?.team === 'a' ? bumpKey : 'a'} className={`live-score ${bump?.team === 'a' ? 'is-bump' : ''}`} style={scoreStyle('a')}>
            {mainA}
          </span>
          <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: size === 'lg' ? '1.6rem' : '1.2rem' }}>–</span>
          <span key={bump?.team === 'b' ? bumpKey : 'b'} className={`live-score ${bump?.team === 'b' ? 'is-bump' : ''}`} style={scoreStyle('b')}>
            {mainB}
          </span>
        </div>
        <TeamCol team={teamB} align="flex-end" isWinner={winner === 'b'} placeholder="รอผล" />
      </div>

      {isSets && (
        <div style={{ marginTop: '0.55rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-3)' }}>
          {live && (
            <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>
              เซตที่ {match.current_set ?? 1}: {match.score_a ?? 0}–{match.score_b ?? 0}
            </span>
          )}
          {sets.filter((s) => s.status === 'finished').length > 0 && (
            <span style={{ marginLeft: live ? '0.6rem' : 0 }}>
              {sets
                .filter((s) => s.status === 'finished')
                .map((s) => `${s.score_a}–${s.score_b}`)
                .join(' | ')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function TeamCol({ team, align, isWinner, placeholder }) {
  const color = team?.color_hex || 'var(--text-muted)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: align, gap: '0.3rem', minWidth: 0 }}>
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: team ? color : 'var(--surface-2)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isWinner ? `0 0 0 3px ${color}55` : 'none',
        }}
      >
        {team && <TeamIcon teamId={team.id} teamName={team.name} color="#fff" size={18} />}
      </span>
      <span
        style={{
          fontSize: '0.85rem',
          fontWeight: isWinner ? 800 : 600,
          color: team ? 'var(--text-2)' : 'var(--text-muted)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}
      >
        {team?.name || placeholder}
      </span>
    </div>
  );
}
