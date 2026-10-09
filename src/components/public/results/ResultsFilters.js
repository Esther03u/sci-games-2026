'use client';
import { motion } from 'motion/react';
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
                position: 'relative',
                width: '100%',
                minWidth: 0,
                padding: '0.48rem 0.15rem',
                borderRadius: '9px',
                border: 'none',
                background: 'transparent',
                color: active ? 'var(--text)' : 'var(--text-3)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.74rem',
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                whiteSpace: 'nowrap',
                boxSizing: 'border-box',
              }}
            >
              {active && (
                <motion.div
                  layoutId="resultsStatusSegmentPill"
                  className="rf-day-pill"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <div className="rf-day-row">
                {tab.isLive && count > 0 && (
                  <motion.span
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    className="rf-live-dot"
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
                    transition: 'background 0.2s, color 0.2s',
                  }}
                >
                  {count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tier 2: sport + category dropdowns */}
      <div className="rf-selects">
        <div className="rf-select-wrap">
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

        <div className="rf-select-wrap">
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
      <div className="rf-summary">
        <span>
          พบ <strong>{resultCount}</strong> แมตช์การแข่งขัน
        </span>
        {dirty && (
          <button type="button" onClick={reset} className="rf-reset">
            <Sparkles size={12} />
            ล้างตัวกรอง
          </button>
        )}
      </div>
    </div>
  );
}
