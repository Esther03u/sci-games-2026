'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import MatchCard from '@/components/ui/MatchCard';
import GlassCard from '@/components/ui/GlassCard';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { createClient } from '@/lib/supabase/client';
import { useRealtime } from '@/hooks/useRealtime';
import { Flag, Clock, Trophy, Activity, Calendar, Users, ChevronDown, Sparkles, CheckCircle2 } from '@/components/animate-ui/icons';
import { SportIcon } from '@/components/ui/SportIcon';
import { OFFICIAL_MATCHES, OFFICIAL_SPORTS, OFFICIAL_TEAMS } from '@/lib/tournamentData';

export default function ResultsPage() {
  const [matches, setMatches] = useState(OFFICIAL_MATCHES);
  const [sports, setSports] = useState(OFFICIAL_SPORTS);
  const [teams, setTeams] = useState(OFFICIAL_TEAMS);
  const [selectedSport, setSelectedSport] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [updatedMatchId, setUpdatedMatchId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient();
      if (!supabase) return;

      const [teamsRes, sportsRes, matchesRes] = await Promise.all([
        supabase.from('teams').select('*').order('sort_order'),
        supabase.from('sports').select('*').order('sort_order'),
        supabase.from('matches').select('*').order('match_date').order('match_time'),
      ]);

      if (teamsRes.data?.length) setTeams(teamsRes.data);
      if (sportsRes.data?.length) setSports(sportsRes.data);
      if (matchesRes.data?.length) setMatches(matchesRes.data);
    } catch (err) {
      console.error('Error fetching results data, using official handbook dataset:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription to matches updates
  useRealtime('matches', null, (payload) => {
    if (payload.eventType === 'UPDATE') {
      setUpdatedMatchId(payload.new.id);
      setTimeout(() => setUpdatedMatchId(null), 3000);
      setMatches((prev) =>
        prev.map((m) => (m.id === payload.new.id ? payload.new : m))
      );
    } else if (payload.eventType === 'INSERT') {
      setMatches((prev) => [payload.new, ...prev]);
    } else if (payload.eventType === 'DELETE') {
      setMatches((prev) => prev.filter((m) => m.id !== payload.old.id));
    }
  });

  const categories = [
    { key: 'all', label: 'ทุกประเภท' },
    { key: 'ชาย', label: 'ทีมชาย' },
    { key: 'หญิง', label: 'ทีมหญิง' },
    { key: 'ผสม', label: 'คู่ผสม' },
  ];

  const filteredMatches = useMemo(() => {
    const list = matches.filter((m) => {
      const matchSport =
        selectedSport === 'all' ||
        m.sport_id === selectedSport ||
        (m.sport_id && m.sport_id.toLowerCase().includes(selectedSport.toLowerCase()));

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'live'
          ? m.status === 'live'
          : statusFilter === 'finished'
          ? m.status === 'finished'
          : m.status === 'upcoming' || m.status === 'postponed';

      const matchCat =
        selectedCategory === 'all' ||
        (m.category && m.category.includes(selectedCategory));

      return matchSport && matchStatus && matchCat;
    });

    // Strictly sort all filtered matches chronologically by match_date then match_time
    return list.sort((a, b) => {
      const d = (a.match_date || '').localeCompare(b.match_date || '');
      if (d !== 0) return d;
      const t = (a.match_time || '').localeCompare(b.match_time || '');
      if (t !== 0) return t;
      return (a.match_number || 0) - (b.match_number || 0);
    });
  }, [matches, selectedSport, statusFilter, selectedCategory]);

  const liveMatches = useMemo(() => {
    return filteredMatches
      .filter((m) => m.status === 'live')
      .sort((a, b) => (a.match_time || '').localeCompare(b.match_time || ''));
  }, [filteredMatches]);

  const finishedMatches = useMemo(() => {
    return filteredMatches
      .filter((m) => m.status === 'finished')
      .sort((a, b) => {
        const d = (a.match_date || '').localeCompare(b.match_date || '');
        if (d !== 0) return d;
        const t = (a.match_time || '').localeCompare(b.match_time || '');
        if (t !== 0) return t;
        return (a.match_number || 0) - (b.match_number || 0);
      });
  }, [filteredMatches]);

  const upcomingMatches = useMemo(() => {
    return filteredMatches
      .filter((m) => m.status === 'upcoming' || m.status === 'postponed')
      .sort((a, b) => {
        const d = (a.match_date || '').localeCompare(b.match_date || '');
        if (d !== 0) return d;
        const t = (a.match_time || '').localeCompare(b.match_time || '');
        if (t !== 0) return t;
        return (a.match_number || 0) - (b.match_number || 0);
      });
  }, [filteredMatches]);

  // Next upcoming matches: strictly only the single NEXT match per sport, ordered chronologically by time
  const nextUpcomingMatches = useMemo(() => {
    if (selectedSport !== 'all') {
      const sportUpcoming = upcomingMatches.filter(
        (m) =>
          m.sport_id === selectedSport ||
          (m.sport_id && m.sport_id.toLowerCase().includes(selectedSport.toLowerCase()))
      );
      return sportUpcoming.slice(0, 1);
    }

    // When "all" sports are selected: pick ONLY the earliest 1 upcoming match of EACH sport
    const seenSports = new Set();
    const result = [];

    for (const m of upcomingMatches) {
      if (!seenSports.has(m.sport_id)) {
        seenSports.add(m.sport_id);
        result.push(m);
      }
    }

    // Explicitly sort the next upcoming matches chronologically by match_date then match_time
    return result.sort((a, b) => {
      const d = (a.match_date || '').localeCompare(b.match_date || '');
      if (d !== 0) return d;
      const t = (a.match_time || '').localeCompare(b.match_time || '');
      if (t !== 0) return t;
      const sportA = sports.find(s => s.id === a.sport_id);
      const sportB = sports.find(s => s.id === b.sport_id);
      const orderA = sportA?.sort_order || 0;
      const orderB = sportB?.sort_order || 0;
      if (orderA !== orderB) return orderA - orderB;
      return (a.match_number || 0) - (b.match_number || 0);
    });
  }, [upcomingMatches, selectedSport, sports]);

  return (
    <div>
      {/* Top Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', fontSize: '1.85rem' }}>
          <Trophy size={30} style={{ color: '#fbbf24' }} /> ผลการแข่งขัน
        </h1>
        <p className="page-subtitle" style={{ fontSize: '0.98rem' }}>
          สรุปคะแนน สถิติ และผลการแข่งขันครบทุกชนิดกีฬาในงาน Sci Games 2026
        </p>
      </div>

      {/* Option 2: Clean Dropdown Island (Apple Minimal Style) */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(228, 228, 231, 0.9)',
          borderRadius: '20px',
          padding: '1rem 1.15rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 30px -4px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        }}
      >
        {/* Tier 1: iOS-Style Status Segmented Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: liveMatches.length > 0 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
            background: '#f4f4f5',
            padding: '4px',
            borderRadius: '14px',
            gap: '4px',
            marginBottom: '0.85rem',
          }}
        >
          {[
            { key: 'all', label: 'ทั้งหมด', count: matches.length, icon: <Activity size={13} /> },
            { key: 'finished', label: 'จบแล้ว', count: finishedMatches.length, icon: <CheckCircle2 size={13} /> },
            ...(liveMatches.length > 0 ? [{ key: 'live', label: 'กำลังแข่ง', count: liveMatches.length, isLive: true }] : []),
            { key: 'upcoming', label: 'รอแข่ง', count: upcomingMatches.length, icon: <Clock size={13} /> },
          ].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: '0.5rem 0.2rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: active ? '#ffffff' : 'transparent',
                  color: active ? '#09090b' : '#71717a',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: active ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                  transition: 'all 0.2s ease',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.isLive ? (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      animation: 'pulse 1.5s infinite',
                    }}
                  />
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', color: active ? '#ca8a04' : '#a1a1aa' }}>
                    {tab.icon}
                  </span>
                )}
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '0 4px',
                    borderRadius: '999px',
                    background: active ? '#fef3c7' : '#e4e4e7',
                    color: active ? '#b45309' : '#71717a',
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
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
              <option value="all">ทุกชนิดกีฬา ({matches.length})</option>
              {sports.map((s) => {
                const count = matches.filter(
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
          {(statusFilter !== 'all' || selectedSport !== 'all' || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setStatusFilter('all');
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

      {loading ? (
        <LoadingSkeleton count={4} height="110px" />
      ) : filteredMatches.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1.5rem',
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e4e4e7',
          }}
        >
          <p style={{ fontSize: '1.05rem', color: '#09090b', fontWeight: 600, marginBottom: '0.5rem' }}>
            ไม่พบรายการแข่งขันที่ตรงกับตัวกรอง
          </p>
          <button
            onClick={() => {
              setSelectedSport('all');
              setStatusFilter('all');
              setSelectedCategory('all');
            }}
            className="btn btn-secondary btn-sm"
          >
            ล้างตัวกรอง
          </button>
        </div>
      ) : statusFilter !== 'all' ? (
        /* Flat list when specific status filter is active */
        <div>
          {statusFilter === 'upcoming' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                color: '#92400e',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <span>📌 แสดงเฉพาะคู่ถัดไปของแต่ละกีฬา ({nextUpcomingMatches.length} คู่)</span>
              <Link
                href="/schedule"
                style={{ fontWeight: 700, color: '#b45309', textDecoration: 'underline' }}
              >
                ดูตารางแข่งขันทั้งหมดทุกคู่ ({upcomingMatches.length} แมตช์) →
              </Link>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
              gap: '1rem',
            }}
          >
            {(statusFilter === 'upcoming' ? nextUpcomingMatches : filteredMatches).map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                teams={teams}
                isScheduleView={statusFilter === 'upcoming'}
                sport={sports.find(
                  (s) =>
                    s.id === m.sport_id ||
                    (m.sport_id && m.sport_id.toLowerCase().includes(s.id.toLowerCase()))
                )}
                animated={updatedMatchId === m.id}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Categorized sections when all statuses are shown - Finished matches first */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Live Section */}
          {liveMatches.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#b91c1c', margin: 0 }}>
                  กำลังแข่งขันสด (LIVE MATCHES)
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#71717a' }}>({liveMatches.length} แมตช์)</span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
                  gap: '1rem',
                }}
              >
                {liveMatches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    teams={teams}
                    sport={sports.find(
                      (s) =>
                        s.id === m.sport_id ||
                        (m.sport_id && m.sport_id.toLowerCase().includes(s.id.toLowerCase()))
                    )}
                    animated={updatedMatchId === m.id}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Finished Section */}
          {finishedMatches.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#09090b', margin: 0 }}>
                  ผลการแข่งขันที่จบแล้ว (COMPLETED)
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#71717a' }}>({finishedMatches.length} แมตช์)</span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
                  gap: '1rem',
                }}
              >
                {finishedMatches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    teams={teams}
                    sport={sports.find(
                      (s) =>
                        s.id === m.sport_id ||
                        (m.sport_id && m.sport_id.toLowerCase().includes(s.id.toLowerCase()))
                    )}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Section: ONLY next match per sport */}
          {nextUpcomingMatches.length > 0 && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ca8a04' }} />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#09090b', margin: 0 }}>
                    โปรแกรมแมตช์ต่อไป (UPCOMING)
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: '#71717a' }}>
                    ({selectedSport === 'all' ? `คู่ถัดไปของแต่ละกีฬา • เรียงตามเวลาแข่งขัน • ${nextUpcomingMatches.length} คู่` : 'คู่ถัดไป'})
                  </span>
                </div>
                <Link
                  href="/schedule"
                  style={{
                    fontSize: '0.82rem',
                    color: '#b45309',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#fef3c7',
                    padding: '0.3rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid #fde68a',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>ดูตารางแข่งทั้งหมด ({upcomingMatches.length} แมตช์)</span>
                  <span>→</span>
                </Link>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
                  gap: '1rem',
                }}
              >
                {nextUpcomingMatches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    teams={teams}
                    isScheduleView={true}
                    sport={sports.find(
                      (s) =>
                        s.id === m.sport_id ||
                        (m.sport_id && m.sport_id.toLowerCase().includes(s.id.toLowerCase()))
                    )}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
