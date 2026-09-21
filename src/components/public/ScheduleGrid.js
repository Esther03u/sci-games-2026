'use client';

import { useState, useMemo } from 'react';
import MatchCard from '@/components/ui/MatchCard';
import { Calendar, Trophy, Users, Filter, Clock, MapPin, Sparkles, ChevronDown } from '@/components/animate-ui/icons';
import { SportIcon } from '@/components/ui/SportIcon';
import { OFFICIAL_SPORTS, OFFICIAL_TEAMS, OFFICIAL_MATCHES } from '@/lib/tournamentData';

export default function ScheduleGrid({
  matches = [],
  sports = [],
  teams = [],
}) {
  // Merge prop data with official handbook master data as reliable source/fallback
  const allSports = sports.length > 0 ? sports : OFFICIAL_SPORTS;
  const allTeams = teams.length > 0 ? teams : OFFICIAL_TEAMS;
  const allMatches = matches.length > 0 ? matches : OFFICIAL_MATCHES;

  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const days = [
    { key: 'all', label: 'ทุกวัน', sub: '9-11 ต.ค.' },
    { key: '2026-10-09', label: 'ศ. 9 ต.ค.', sub: 'เปิดสนาม' },
    { key: '2026-10-10', label: 'ส. 10 ต.ค.', sub: 'ตัดเชือก' },
    { key: '2026-10-11', label: 'อา. 11 ต.ค.', sub: 'ชิงชนะเลิศ' },
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
      const date = m.match_date || '2026-10-09';
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

  const getDateLabel = (dateStr) => {
    if (dateStr === '2026-10-09') return 'วันศุกร์ที่ 9 ตุลาคม 2569 (วันเปิดสนาม)';
    if (dateStr === '2026-10-10') return 'วันเสาร์ที่ 10 ตุลาคม 2569 (รอบตัดเชือก & ชิงชนะเลิศ)';
    if (dateStr === '2026-10-11') return 'วันอาทิตย์ที่ 11 ตุลาคม 2569 (วันชิงชนะเลิศส่งท้าย)';
    return dateStr;
  };

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
            background: '#f4f4f5',
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
                  color: active ? '#09090b' : '#71717a',
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
                      background: active ? '#fef3c7' : '#e4e4e7',
                      color: active ? '#b45309' : '#71717a',
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
                    color: active ? '#ca8a04' : '#a1a1aa',
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
                color: '#ca8a04',
              }}
            >
              {selectedSport === 'all' ? (
                <Trophy size={15} />
              ) : (
                <SportIcon sportId={selectedSport} size={15} color="#ca8a04" />
              )}
            </div>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              style={{
                width: '100%',
                appearance: 'none',
                WebkitAppearance: 'none',
                background: '#f8fafc',
                border: '1px solid #e4e4e7',
                borderRadius: '12px',
                padding: '0.58rem 1.6rem 0.58rem 2.05rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#09090b',
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
                color: '#71717a',
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
                color: '#71717a',
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
                background: '#f8fafc',
                border: '1px solid #e4e4e7',
                borderRadius: '12px',
                padding: '0.58rem 1.6rem 0.58rem 2.05rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#09090b',
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
                color: '#71717a',
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
            borderTop: '1px solid #f4f4f5',
            fontSize: '0.75rem',
            color: '#71717a',
          }}
        >
          <span>พบ <strong>{filteredMatches.length}</strong> แมตช์การแข่งขัน</span>
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
                color: '#ca8a04',
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
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e4e4e7',
          }}
        >
          <Calendar size={48} style={{ color: '#d4d4d8', marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.15rem', color: '#09090b', fontWeight: 700, marginBottom: '0.35rem' }}>
            ไม่พบรายการแข่งขันตามเงื่อนไขที่เลือก
          </h3>
          <p style={{ color: '#71717a', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
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
                  borderBottom: '2px solid #e4e4e7',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#ca8a04',
                    }}
                  />
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#09090b', margin: 0 }}>
                    {getDateLabel(dateGroup.dateStr)}
                  </h2>
                </div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: '#71717a',
                    fontWeight: 700,
                    background: '#f4f4f5',
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
                      <Clock size={16} style={{ color: '#ca8a04' }} />
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#18181b' }}>
                        รอบเวลา {timeLabel}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: '#71717a',
                          background: '#f4f4f5',
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
