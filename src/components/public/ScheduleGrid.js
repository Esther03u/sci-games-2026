'use client';

import { useState, useMemo } from 'react';
import MatchCard from '@/components/ui/MatchCard';
import { Calendar, Trophy, Users, Filter, Clock, MapPin, Sparkles, ChevronDown } from '@/components/animate-ui/icons';
import { SportIcon } from '@/components/ui/SportIcon';
import { OFFICIAL_SPORTS, OFFICIAL_TEAMS, OFFICIAL_MATCHES } from '@/data/handbook';
import { EVENT_DAYS, EVENT_START_DATE, fmtEventDayLong } from '@/lib/format';

export default function ScheduleGrid({
  matches = [],
  sports = [],
  teams = [],
}) {
  // Fall back to the handbook dataset as a whole (never mix DB sports with
  // handbook matches — their ids don't line up and cards lose their sport).
  const useHandbook = matches.length === 0;
  const allSports = useHandbook ? OFFICIAL_SPORTS : sports;
  const allTeams = useHandbook ? OFFICIAL_TEAMS : teams;
  const allMatches = useHandbook ? OFFICIAL_MATCHES : matches;

  const [viewMode, setViewMode] = useState('sport'); // 'sport' | 'time'
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const days = [
    { key: 'all', label: 'ทุกวัน', sub: '9-11 ต.ค.' },
    ...EVENT_DAYS.map((d) => ({ key: d.date, label: d.short, sub: d.sub })),
  ];

  const categories = [
    { key: 'all', label: 'ทุกประเภท' },
    { key: 'ชาย', label: 'ทีมชาย' },
    { key: 'หญิง', label: 'ทีมหญิง' },
    { key: 'ผสม', label: 'คู่ผสม' },
  ];

  const filteredMatches = useMemo(() => {
    return allMatches.filter((m) => {
      const matchDay = selectedDay === 'all' || m.match_date === selectedDay;
      const matchSport =
        selectedSport === 'all' ||
        m.sport_id === selectedSport ||
        (m.sport_id && m.sport_id.toLowerCase().includes(selectedSport.toLowerCase()));
      
      const matchCat =
        selectedCategory === 'all' ||
        (m.category && m.category.includes(selectedCategory));

      return matchDay && matchSport && matchCat;
    });
  }, [allMatches, selectedDay, selectedSport, selectedCategory]);

  // Group filtered matches by date, then strictly by chronological time slots
  const scheduleData = useMemo(() => {
    const dates = {};
    const sorted = [...filteredMatches].sort((a, b) => {
      const dateCompare = (a.match_date || '').localeCompare(b.match_date || '');
      if (dateCompare !== 0) return dateCompare;
      const timeCompare = (a.match_time || '').localeCompare(b.match_time || '');
      if (timeCompare !== 0) return timeCompare;
      const sportA = allSports.find(s => s.id === a.sport_id);
      const sportB = allSports.find(s => s.id === b.sport_id);
      const orderA = sportA?.sort_order || 0;
      const orderB = sportB?.sort_order || 0;
      if (orderA !== orderB) return orderA - orderB;
      return (a.match_number || 0) - (b.match_number || 0);
    });

    sorted.forEach((m) => {
      const date = m.match_date || EVENT_START_DATE;
      if (!dates[date]) {
        dates[date] = {
          dateStr: date,
          totalMatches: 0,
          timeSlots: {},
        };
      }
      dates[date].totalMatches++;

      const timeKey = m.time_display || (m.match_time ? m.match_time.slice(0, 5) + ' น.' : 'ไม่ระบุเวลา');
      if (!dates[date].timeSlots[timeKey]) {
        dates[date].timeSlots[timeKey] = [];
      }
      dates[date].timeSlots[timeKey].push(m);
    });

    return dates;
  }, [filteredMatches, allSports]);

  // Group by sport (in sort_order), then by date, for the "ตามกีฬา" view
  const sportData = useMemo(() => {
    const sorted = [...filteredMatches].sort((a, b) => {
      const d = (a.match_date || '').localeCompare(b.match_date || '');
      if (d !== 0) return d;
      const t = (a.match_time || '').localeCompare(b.match_time || '');
      if (t !== 0) return t;
      return (a.match_number || 0) - (b.match_number || 0);
    });
    const findSport = (m) =>
      allSports.find((s) => s.id === m.sport_id || (m.sport_id && m.sport_id.toLowerCase().includes(s.id.toLowerCase())));
    const groups = new Map();
    for (const s of allSports) groups.set(s.id, { sport: s, total: 0, dates: {} });
    groups.set('__other', { sport: null, total: 0, dates: {} });
    for (const m of sorted) {
      const sp = findSport(m);
      const g = groups.get(sp?.id) || groups.get('__other');
      g.total++;
      const date = m.match_date || EVENT_START_DATE;
      (g.dates[date] ||= []).push(m);
    }
    return Array.from(groups.values()).filter((g) => g.total > 0);
  }, [filteredMatches, allSports]);

  const getDateLabel = fmtEventDayLong;

  return (
    <div>
      {/* Filters Container */}
      {/* Option 2: Clean Dropdown Island (Apple Minimal Style) */}
      <div className="filter-island-card">
        {/* Tier 1: iOS-Style Date Segmented Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
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
              day.key === 'all'
                ? allMatches.length
                : allMatches.filter((m) => m.match_date === day.key).length;

            return (
              <button
                key={day.key}
                type="button"
                onClick={() => setSelectedDay(day.key)}
                style={{
                  width: '100%',
                  minWidth: 0,
                  padding: '0.45rem 0.15rem',
                  borderRadius: '9px',
                  border: 'none',
                  background: active ? '#ffffff' : 'transparent',
                  color: active ? 'var(--text)' : 'var(--text-3)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  boxShadow: active ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>{day.label}</span>
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
                </div>
                <span
                  style={{
                    fontSize: '0.64rem',
                    color: active ? 'var(--accent-text)' : 'var(--text-muted)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
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
          {/* Dropdown 1: Sport Selector with Vector Icon */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--accent-text)',
              }}
            >
              {selectedSport === 'all' ? (
                <Trophy size={15} />
              ) : (
                <SportIcon sportId={selectedSport} size={15} color="var(--accent-text)" />
              )}
            </div>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              style={{
                width: '100%',
                appearance: 'none',
                WebkitAppearance: 'none',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '0.58rem 1.6rem 0.58rem 2.05rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--text)',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s',
                textOverflow: 'ellipsis',
              }}
            >
              <option value="all">ทุกชนิดกีฬา ({allMatches.length})</option>
              {allSports.map((s) => {
                const count = allMatches.filter(
                  (m) =>
                    m.sport_id === s.id ||
                    (m.sport_id && m.sport_id.toLowerCase().includes(s.id.toLowerCase()))
                ).length;
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

          {/* Dropdown 2: Category Selector with Vector Icon */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-3)',
              }}
            >
              <Users size={15} />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                appearance: 'none',
                WebkitAppearance: 'none',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '0.58rem 1.6rem 0.58rem 2.05rem',
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
            <span>พบ <strong>{filteredMatches.length}</strong> แมตช์การแข่งขัน</span>
            <span role="group" aria-label="รูปแบบการแสดงผล" style={{ display: 'inline-flex', background: 'var(--surface-2)', borderRadius: '999px', padding: '2px' }}>
              {[
                { key: 'sport', label: 'ตามกีฬา' },
                { key: 'time', label: 'ตามเวลา' },
              ].map((v) => (
                <button
                  key={v.key}
                  onClick={() => setViewMode(v.key)}
                  style={{
                    border: 'none',
                    borderRadius: '999px',
                    padding: '3px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: viewMode === v.key ? 'var(--surface)' : 'transparent',
                    color: viewMode === v.key ? 'var(--text)' : 'var(--text-3)',
                    boxShadow: viewMode === v.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {v.label}
                </button>
              ))}
            </span>
          </span>
          {(selectedDay !== 'all' || selectedSport !== 'all' || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSelectedDay('all');
                setSelectedSport('all');
                setSelectedCategory('all');
              }}
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

      {/* Matches Display Grouped by Date */}
      {filteredMatches.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3.5rem 1.5rem',
            background: 'var(--surface)',
            borderRadius: '20px',
            border: '1px solid var(--border)',
          }}
        >
          <Calendar size={48} style={{ color: 'var(--border-strong)', marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text)', fontWeight: 700, marginBottom: '0.35rem' }}>
            ไม่พบรายการแข่งขันตามเงื่อนไขที่เลือก
          </h3>
          <p style={{ color: 'var(--text-3)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
            ลองเลือกทุกวัน หรือเลือกทุกชนิดกีฬาเพื่อดูโปรแกรมแข่งขันทั้งหมด
          </p>
          <button
            onClick={() => {
              setSelectedDay('all');
              setSelectedSport('all');
              setSelectedCategory('all');
            }}
            className="btn btn-secondary btn-sm"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : viewMode === 'sport' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {sportData.map((g) => (
            <section key={g.sport?.id || 'other'}>
              {/* Sport Section Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  paddingBottom: '0.65rem',
                  borderBottom: '2px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <span
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: 'var(--sci-yellow-surface)',
                      border: '1px solid var(--sci-yellow-border)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-text)',
                      flexShrink: 0,
                    }}
                  >
                    {g.sport ? <SportIcon sportId={g.sport.id} sportName={g.sport.name} size={20} /> : <Trophy size={20} />}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.15 }}>
                      {g.sport?.name || 'กีฬาอื่น ๆ'}
                    </h2>
                    {g.sport?.venue && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} /> {g.sport.venue}
                      </div>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-3)',
                    fontWeight: 700,
                    background: 'var(--surface-2)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {g.total} แมตช์
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {Object.entries(g.dates).map(([date, list]) => (
                  <div key={date}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.6rem' }}>
                      <Calendar size={15} style={{ color: 'var(--accent-text)' }} />
                      <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text)' }}>{getDateLabel(date)}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                        {list.length} คู่
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1rem' }}>
                      {list.map((m) => (
                        <MatchCard key={m.id} match={m} teams={allTeams} sport={g.sport} isScheduleView={true} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {Object.values(scheduleData).map((dateGroup) => (
            <div key={dateGroup.dateStr}>
              {/* Date Section Header Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                  paddingBottom: '0.65rem',
                  borderBottom: '2px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: 'var(--accent-text)',
                    }}
                  />
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    {getDateLabel(dateGroup.dateStr)}
                  </h2>
                </div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-3)',
                    fontWeight: 700,
                    background: 'var(--surface-2)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                  }}
                >
                  {dateGroup.totalMatches} แมตช์
                </span>
              </div>

              {/* Time Slots under this Date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                {Object.entries(dateGroup.timeSlots).map(([timeLabel, slotMatches]) => (
                  <div key={timeLabel}>
                    {/* Time Slot Divider */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <Clock size={16} style={{ color: 'var(--accent-text)' }} />
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text)' }}>
                        รอบเวลา {timeLabel}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-3)',
                          background: 'var(--surface-2)',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontWeight: 600,
                        }}
                      >
                        {slotMatches.length} คู่แข่งขัน
                      </span>
                    </div>

                    {/* Grid of Dark Luxury Match Cards */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
                        gap: '1rem',
                      }}
                    >
                      {slotMatches.map((m) => {
                        const sport = allSports.find(
                          (s) =>
                            s.id === m.sport_id ||
                            (m.sport_id && m.sport_id.toLowerCase().includes(s.id.toLowerCase()))
                        );
                        return (
                          <MatchCard
                            key={m.id}
                            match={m}
                            teams={allTeams}
                            sport={sport}
                            isScheduleView={true}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
