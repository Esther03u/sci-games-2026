'use client';

import { useState, useMemo } from 'react';
import MatchCard from '@/components/ui/MatchCard';
import { Calendar, Trophy, Activity, Filter, Clock, MapPin, Sparkles } from '@/components/animate-ui/icons';
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
    { key: 'all', label: 'ทุกวัน', sub: '9 - 11 ต.ค.' },
    { key: '2026-10-09', label: '9 ต.ค. 69', sub: 'วันเปิดสนาม' },
    { key: '2026-10-10', label: '10 ต.ค. 69', sub: 'รอบตัดเชือก' },
    { key: '2026-10-11', label: '11 ต.ค. 69', sub: 'วันชิงชนะเลิศ' },
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
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e4e4e7',
          borderRadius: '20px',
          padding: '1.25rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* 1. Date Filter Carousel */}
        <div style={{ marginBottom: '1.15rem' }}>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#71717a',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Calendar size={13} style={{ color: '#ca8a04' }} /> เลือกวันที่แข่งขัน
          </div>

          <div className="mobile-carousel" style={{ gap: '0.5rem' }}>
            {days.map((day) => {
              const active = selectedDay === day.key;
              const count =
                day.key === 'all'
                  ? allMatches.length
                  : allMatches.filter((m) => m.match_date === day.key).length;

              return (
                <button
                  key={day.key}
                  onClick={() => setSelectedDay(day.key)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '12px',
                    border: active ? '1px solid #ca8a04' : '1px solid #e4e4e7',
                    background: active
                      ? 'linear-gradient(135deg, #facc15 0%, #ca8a04 100%)'
                      : '#f4f4f5',
                    color: active ? '#ffffff' : '#18181b',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    minWidth: '125px',
                    transition: 'all 0.2s',
                    boxShadow: active ? '0 4px 14px rgba(202, 138, 4, 0.25)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '0.88rem' }}>{day.label}</strong>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: active ? 'rgba(0,0,0,0.2)' : '#e4e4e7',
                        fontWeight: 700,
                      }}
                    >
                      {count}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', opacity: active ? 0.9 : 0.65 }}>
                    {day.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Sport Filter Carousel */}
        <div style={{ marginBottom: '1.15rem' }}>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#71717a',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Trophy size={13} style={{ color: '#ca8a04' }} /> เลือกชนิดกีฬา (สูจิบัตร 2569)
          </div>

          <div className="mobile-carousel" style={{ gap: '0.45rem' }}>
            <button
              onClick={() => setSelectedSport('all')}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '999px',
                border: selectedSport === 'all' ? '1px solid #09090b' : '1px solid #e4e4e7',
                background: selectedSport === 'all' ? '#09090b' : '#ffffff',
                color: selectedSport === 'all' ? '#ffffff' : '#3f3f46',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              <span>🏆 ทุกกีฬา</span>
              <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>({allMatches.length})</span>
            </button>

            {allSports.map((s) => {
              const active = selectedSport === s.id;
              const count = allMatches.filter(
                (m) =>
                  m.sport_id === s.id ||
                  (m.sport_id && m.sport_id.toLowerCase().includes(s.id.toLowerCase()))
              ).length;

              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSport(s.id)}
                  style={{
                    padding: '0.45rem 0.9rem',
                    borderRadius: '999px',
                    border: active ? '1px solid #09090b' : '1px solid #e4e4e7',
                    background: active ? '#09090b' : '#ffffff',
                    color: active ? '#ffffff' : '#3f3f46',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{s.icon || '🏅'}</span>
                  <span>{s.name}</span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Category Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#71717a', fontWeight: 600, marginRight: '4px' }}>
              ประเภท:
            </span>
            {categories.map((c) => {
              const active = selectedCategory === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setSelectedCategory(c.key)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: active ? '#fef3c7' : '#f4f4f5',
                    color: active ? '#b45309' : '#52525b',
                    fontSize: '0.78rem',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '0.82rem', color: '#71717a' }}>
            พบ <strong>{filteredMatches.length}</strong> แมตช์การแข่งขัน
          </div>
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
