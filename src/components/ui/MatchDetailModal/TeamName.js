'use client';

/** A team name in the big scoreboard: a "รอผล…" chip while pending, else the name sized by result. */
export default function TeamName({ team, wins, lost, isMedalRound, isFinal, isThird }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minWidth: 0,
        width: '100%',
      }}
    >
      {team.isPending ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMedalRound ? '0.32rem 0.55rem' : '0.2rem 0.45rem',
            borderRadius: '10px',
            background: isFinal
              ? 'var(--mc-gold-chip)'
              : isThird
                ? 'var(--mc-bronze-chip)'
                : 'var(--surface-2)',
            border: isFinal
              ? '1.5px solid rgba(245, 158, 11, 0.85)'
              : isThird
                ? '1.5px solid rgba(234, 88, 12, 0.8)'
                : '1px solid var(--border)',
            color: isFinal ? 'var(--mc-gold-ink)' : isThird ? 'var(--mc-bronze-ink)' : 'var(--text-3)',
            fontWeight: 800,
            fontSize: 'clamp(0.74rem, 2.5vw, 0.88rem)',
            boxShadow: isFinal
              ? '0 2px 8px rgba(245, 158, 11, 0.28)'
              : isThird
                ? '0 2px 8px rgba(234, 88, 12, 0.22)'
                : 'none',
            whiteSpace: 'nowrap',
            letterSpacing: '0.01em',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {team.name}
        </span>
      ) : (
        <div
          style={{
            fontSize: wins ? '1.35rem' : lost ? '1.12rem' : '1.22rem',
            fontWeight: wins ? 900 : lost ? 600 : 800,
            fontFamily: 'var(--font-heading)',
            color: lost ? 'var(--text-3)' : 'var(--text)',
            opacity: lost ? 0.5 : 1,
            lineHeight: 1.2,
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 0,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{team.name}</span>
        </div>
      )}
    </div>
  );
}
