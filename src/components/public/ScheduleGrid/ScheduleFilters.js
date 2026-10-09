'use client';
import { motion } from 'motion/react';
import { Sparkles, ChevronDown } from '@/components/animate-ui/icons';
import { sportMatches } from '@/lib/schedule-grid';

/** Day segmented bar, sport + category dropdowns, match count, view toggle and "ล้างตัวกรอง". */
export default function ScheduleFilters({
  matches,
  sports,
  days,
  categories,
  filteredCount,
  viewMode,
  selectedDay,
  selectedSport,
  selectedCategory,
  onViewMode,
  onDay,
  onSport,
  onCategory,
  onReset,
}) {
  return (
    <div className="filter-island-card">
      {/* Tier 1: iOS-Style Date Segmented Bar */}
      <div
        className={`ios-segmented-bar cols-${days.length}`}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
          background: 'var(--surface-2)',
          padding: '3px',
          borderRadius: '12px',
          gap: '3px',
          marginBottom: '0.85rem',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {days.map((day) => {
          const active = selectedDay === day.key;
          const count =
            day.key === 'all' ? matches.length : matches.filter((m) => m.match_date === day.key).length;

          return (
            <button
              key={day.key}
              type="button"
              onClick={() => onDay(day.key)}
              style={{
                position: 'relative',
                width: '100%',
                minWidth: 0,
                padding: '0.45rem 0.08rem',
                borderRadius: '9px',
                border: 'none',
                background: 'transparent',
                color: active ? 'var(--text)' : 'var(--text-3)',
                fontWeight: active ? 700 : 500,
                fontSize: '0.74rem',
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                boxSizing: 'border-box',
              }}
            >
              {active && (
                <motion.div
                  layoutId="scheduleDateSegmentPill"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '9px',
                    background: 'var(--surface)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    zIndex: 0,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  width: '100%',
                }}
              >
                <span className="schedule-day-full" style={{ whiteSpace: 'nowrap' }}>
                  {day.label}
                </span>
                <span className="schedule-day-compact" style={{ whiteSpace: 'nowrap' }}>
                  {day.shortLabel || day.label}
                </span>
                <span
                  style={{
                    fontSize: '0.62rem',
                    padding: '1px 4px',
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
              </div>
              <span
                style={{
                  position: 'relative',
                  zIndex: 1,
                  fontSize: '0.62rem',
                  color: active ? 'var(--accent-text)' : 'var(--text-muted)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.2px',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {day.sub}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tier 2: Two Minimal Dropdown Selects Side-by-Side */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.65rem',
        }}
      >
        {/* Dropdown 1: Sport Selector */}
        <div style={{ position: 'relative' }}>
          <select
            value={selectedSport}
            onChange={(e) => onSport(e.target.value)}
            style={{
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
            }}
          >
            <option value="all">ทุกชนิดกีฬา ({matches.length})</option>
            {sports.map((s) => {
              const count = matches.filter((m) => sportMatches(m, s.id)).length;
              return (
                <option key={s.id} value={s.id}>
                  {s.name} ({count})
                </option>
              );
            })}
          </select>
          <div
            style={{
              position: 'absolute',
              right: '9px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-3)',
            }}
          >
            <ChevronDown size={14} />
          </div>
        </div>

        {/* Dropdown 2: Category Selector */}
        <div style={{ position: 'relative' }}>
          <select
            value={selectedCategory}
            onChange={(e) => onCategory(e.target.value)}
            style={{
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
            }}
          >
            {categories.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
          <div
            style={{
              position: 'absolute',
              right: '9px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--text-3)',
            }}
          >
            <ChevronDown size={14} />
          </div>
        </div>
      </div>

      {/* Footer Summary Strip */}
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
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span>
            พบ <strong>{filteredCount}</strong> แมตช์การแข่งขัน
          </span>
          <span
            role="group"
            aria-label="รูปแบบการแสดงผล"
            style={{
              display: 'inline-flex',
              background: 'var(--surface-2)',
              borderRadius: '999px',
              padding: '2px',
            }}
          >
            {[
              { key: 'sport', label: 'ตามกีฬา' },
              { key: 'time', label: 'ตามเวลา' },
            ].map((v) => (
              <button
                key={v.key}
                onClick={() => onViewMode(v.key)}
                style={{
                  position: 'relative',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '3px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: 'transparent',
                  color: viewMode === v.key ? 'var(--text)' : 'var(--text-3)',
                  lineHeight: 1.4,
                }}
              >
                {viewMode === v.key && (
                  <motion.div
                    layoutId="scheduleViewModePill"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '999px',
                      background: 'var(--surface)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      zIndex: 0,
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{v.label}</span>
              </button>
            ))}
          </span>
        </span>
        {(selectedDay !== 'all' || selectedSport !== 'all' || selectedCategory !== 'all') && (
          <button
            onClick={onReset}
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
