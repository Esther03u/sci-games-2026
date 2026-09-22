'use client';
import { ChevronDown, Sparkles } from '@/components/animate-ui/icons';
import { CATEGORIES, STATUS_TABS, isSport } from './filters';

const selectStyle = {
  width: '100%',
  appearance: 'none',
  WebkitAppearance: 'none',
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '0.58rem 1.6rem 0.58rem 0.85rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text)',
  cursor: 'pointer',
  outline: 'none',
  transition: 'all 0.2s',
  textOverflow: 'ellipsis',
};

const adornment = (side, color) => ({
  position: 'absolute',
  [side]: side === 'left' ? '10px' : '9px',
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  color,
});

/**
 * Status segmented bar + sport/category dropdowns + summary strip.
 * `filters` = { sport, status, category }; `onChange(partial)` merges.
 */
export default function ResultsFilters({ filters, onChange, sports, matches, counts, resultCount }) {
  const { sport, status, category } = filters;
  const dirty = status !== 'all' || sport !== 'all' || category !== 'all';
  const reset = () => onChange({ sport: 'all', status: 'all', category: 'all' });

  return (
    <div className="filter-island-card" style={{ width: '100%', boxSizing: 'border-box' }}>
      {/* Tier 1: status segmented bar (equal columns) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${STATUS_TABS.length}, 1fr)`,
          background: 'var(--surface-2)',
          padding: '3px',
          borderRadius: '12px',
          gap: '3px',
          marginBottom: '0.85rem',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {STATUS_TABS.map((tab) => {
          const active = status === tab.key;
          const count = counts[tab.key];
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange({ status: tab.key })}
              style={{
                width: '100%',
                minWidth: 0,
                padding: '0.48rem 0.15rem',
                borderRadius: '9px',
                border: 'none',
                background: active ? 'var(--surface)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text-3)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.74rem',
                cursor: 'pointer',
                boxShadow: active ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                transition: 'all 0.15s ease',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                whiteSpace: 'nowrap',
                boxSizing: 'border-box',
              }}
            >
              {tab.isLive && count > 0 && (
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    animation: 'pulse 1.5s infinite',
                    flexShrink: 0,
                  }}
                />
              )}
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '0.62rem',
                  padding: '1px 5px',
                  borderRadius: '999px',
                  background: active ? 'var(--accent-surface)' : 'var(--border)',
                  color: active ? 'var(--accent-text)' : 'var(--text-3)',
                  fontWeight: 700,
                  lineHeight: 1.2,
                  flexShrink: 0,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tier 2: sport + category dropdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
        <div style={{ position: 'relative' }}>
          <select value={sport} onChange={(e) => onChange({ sport: e.target.value })} style={selectStyle}>
            <option value="all">ทุกชนิดกีฬา ({matches.length})</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({matches.filter((m) => isSport(m, s.id)).length})
              </option>
            ))}
          </select>
          <div style={adornment('right', 'var(--text-3)')}>
            <ChevronDown size={14} />
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <select
            value={category}
            onChange={(e) => onChange({ category: e.target.value })}
            style={selectStyle}
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <div style={adornment('right', 'var(--text-3)')}>
            <ChevronDown size={14} />
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.75rem',
          paddingTop: '0.65rem',
          borderTop: '1px solid var(--surface-2)',
          fontSize: '0.75rem',
          color: 'var(--text-3)',
        }}
      >
        <span>
          พบ <strong>{resultCount}</strong> แมตช์การแข่งขัน
        </span>
        {dirty && (
          <button
            type="button"
            onClick={reset}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-text)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0,
            }}
          >
            <Sparkles size={12} />
            ล้างตัวกรอง
          </button>
        )}
      </div>
    </div>
  );
}
