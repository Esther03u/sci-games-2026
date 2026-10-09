'use client';
import { Search, X, Sparkles } from '@/components/animate-ui/icons';

/** Sport pills (overview only), date pills, search box and the "ล้างตัวกรอง" summary. */
export default function PickerFilters({
  matches,
  availableSports,
  availableDates,
  effectiveSportId,
  selectedSport,
  selectedDate,
  search,
  filteredCount,
  hasFilter,
  onShowAllSports,
  onSelectSport,
  onSelectDate,
  onSearch,
  onReset,
}) {
  return (
    <div className="match-picker-filter-box">
      {/* If in overview mode, show sport pills */}
      {effectiveSportId === 'all' && availableSports.length > 1 && (
        <div className="match-picker-pill-scroll" aria-label="กรองชนิดกีฬา">
          <button
            type="button"
            onClick={onShowAllSports}
            className={`match-picker-pill ${selectedSport === 'all' ? 'active' : ''}`}
          >
            <span>ทุกกีฬา</span>
            <span className="match-picker-pill-badge">{matches.length}</span>
          </button>
          {availableSports.map((s) => {
            const count = matches.filter((m) => m.sport_id === s.id).length;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSport(s.id)}
                className="match-picker-pill"
              >
                <span>{s.name}</span>
                <span className="match-picker-pill-badge">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Date Pills + Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {availableDates.length > 1 && (
          <div className="match-picker-pill-scroll" aria-label="กรองวันที่แข่ง">
            <button
              type="button"
              onClick={() => onSelectDate('all')}
              className={`match-picker-pill ${selectedDate === 'all' ? 'active' : ''}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              <span>ทุกวัน</span>
            </button>
            {availableDates.map((d) => {
              const active = selectedDate === d.date;
              const count = matches.filter(
                (m) =>
                  m.match_date === d.date && (effectiveSportId === 'all' || m.sport_id === effectiveSportId)
              ).length;
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => onSelectDate(d.date)}
                  className={`match-picker-pill ${active ? 'active' : ''}`}
                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                >
                  <span>{d.short}</span>
                  <span className="match-picker-pill-badge">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Search Input */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-3)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            className="match-picker-search"
            placeholder="ค้นหาตามชื่อทีม สี รอบ หรือสนาม..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearch('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-3)',
                cursor: 'pointer',
                padding: '4px',
              }}
              aria-label="ล้างการค้นหา"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Summary & Reset */}
      {hasFilter && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            color: 'var(--text-3)',
            padding: '0.2rem 0.25rem',
          }}
        >
          <span>
            พบ <strong>{filteredCount}</strong> แมตช์
          </span>
          <button
            type="button"
            onClick={onReset}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gold-600)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Sparkles size={12} />
            ล้างตัวกรอง
          </button>
        </div>
      )}
    </div>
  );
}
