'use client';

/** One side of the scoreboard: team chip, big score, +1 (and +2/+3 for basketball), −1. */
export default function TeamColumn({ side: key, team, value, fallback, column, canScore, isBasket, score }) {
  const hex = team?.color_hex || fallback;
  return (
    <div
      style={{
        gridColumn: column,
        gridRow: 1,
        padding: '1.25rem 0.85rem 1rem',
        textAlign: 'center',
        background: `linear-gradient(180deg, ${hex}1f 0%, ${hex}0a 60%, transparent 100%)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 14px',
          borderRadius: 999,
          background: 'var(--surface)',
          border: `1px solid ${hex}55`,
          boxShadow: `0 2px 8px ${hex}22`,
          alignSelf: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: hex,
            boxShadow: `0 0 8px ${hex}aa`,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>
          {team?.name || '—'}
        </span>
      </div>

      <div
        key={`${key}-${value}`}
        className="live-score is-bump"
        style={{
          fontSize: 'clamp(4.8rem, 16vw, 7rem)',
          fontFamily: 'var(--font-heading)',
          fontWeight: 900,
          color: 'var(--text)',
          lineHeight: 1,
          margin: 'auto 0',
          padding: '0.4rem 0',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>

      <button
        onClick={() => score(key, 1)}
        disabled={!canScore}
        className="score-btn"
        style={{
          background: `linear-gradient(145deg, ${hex} 0%, ${hex}cc 100%)`,
          boxShadow: `0 10px 24px ${hex}55`,
          flex: '1 1 auto',
          minHeight: 'clamp(100px, 16vh, 160px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label={`+1 ${team?.name || ''}`}
      >
        +1
      </button>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isBasket ? '1fr 1fr 1fr' : '1fr',
          gap: '0.4rem',
          marginTop: '0.55rem',
          flexShrink: 0,
        }}
      >
        {isBasket && (
          <>
            <button
              onClick={() => score(key, 2)}
              disabled={!canScore}
              className="score-btn score-btn-ghost"
              style={{ color: hex, borderColor: `${hex}66` }}
            >
              +2
            </button>
            <button
              onClick={() => score(key, 3)}
              disabled={!canScore}
              className="score-btn score-btn-ghost"
              style={{ color: hex, borderColor: `${hex}66` }}
            >
              +3
            </button>
          </>
        )}
        <button
          onClick={() => score(key, -1)}
          disabled={!canScore || value === 0}
          className="score-btn score-btn-ghost"
          aria-label={`-1 ${team?.name || ''}`}
        >
          −1
        </button>
      </div>
    </div>
  );
}
