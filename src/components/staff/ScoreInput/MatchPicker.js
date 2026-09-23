'use client';
import { useMemo, useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import TeamBadge from '@/components/ui/TeamBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import Banner from '@/components/ui/Banner';
import { MapPin, Clock, Search, X, Shield, Sparkles, AlertTriangle } from '@/components/animate-ui/icons';
import { fmtRemaining, fmtTime, fmtPlace, fmtEventDay, EVENT_DAYS } from '@/lib/format';
import { roundLabel } from '@/lib/labels';
import { editDeadline, groupMatches } from './scoring';

/** Step 1 — pick the match to score, isolated per sport so staff and referees focus only on their sport. */
export default function MatchPicker({
  matches = [],
  groups: defaultGroups,
  sports = [],
  teams = [],
  actor = null,
  isAdmin = false,
  now,
  editWindowMinutes = 10,
  realtimeStatus,
  noAssignment = false,
  offlineBanner = null,
  error = '',
  onSelect,
}) {
  // Sports present in the visible matches
  const availableSports = useMemo(() => {
    const ids = new Set(matches.map((m) => m.sport_id));
    return sports.filter((s) => ids.has(s.id));
  }, [matches, sports]);

  // If only 1 sport available (PIN referee or single-sport staff), lock to it.
  // Otherwise check localStorage if a sport was previously picked.
  const [selectedSport, setSelectedSport] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('staff_selected_sport') || null;
    }
    return null;
  });

  const [selectedDate, setSelectedDate] = useState('all');
  const [search, setSearch] = useState('');

  // Effective sport ID:
  // - If availableSports has exactly 1 sport -> always lock strictly to that sport!
  // - If multiple sports exist and selectedSport matches one of them -> use that sport
  // - If selectedSport === 'all' (explicit admin choice) -> 'all'
  // - Otherwise -> null (prompts to choose sport first)
  const effectiveSportId = useMemo(() => {
    if (availableSports.length === 1) return availableSports[0].id;
    if (selectedSport === 'all') return 'all';
    if (selectedSport && availableSports.some((s) => s.id === selectedSport)) {
      return selectedSport;
    }
    return null;
  }, [availableSports, selectedSport]);

  const currentSport = useMemo(() => {
    if (!effectiveSportId || effectiveSportId === 'all') return null;
    return sports.find((s) => s.id === effectiveSportId) || null;
  }, [effectiveSportId, sports]);

  // Handle sport selection
  const handleSelectSport = (sportId) => {
    setSelectedSport(sportId);
    if (typeof window !== 'undefined') {
      if (sportId) {
        localStorage.setItem('staff_selected_sport', sportId);
      } else {
        localStorage.removeItem('staff_selected_sport');
      }
    }
    setSelectedDate('all');
    setSearch('');
  };

  // Dates present in matches of current sport scope
  const availableDates = useMemo(() => {
    const scope =
      effectiveSportId && effectiveSportId !== 'all'
        ? matches.filter((m) => m.sport_id === effectiveSportId)
        : matches;
    const dateSet = new Set(scope.map((m) => m.match_date));
    return EVENT_DAYS.filter((d) => dateSet.has(d.date));
  }, [matches, effectiveSportId]);

  // Apply filters to matches of the chosen sport scope
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (effectiveSportId && effectiveSportId !== 'all' && m.sport_id !== effectiveSportId) {
        return false;
      }
      if (selectedDate !== 'all' && m.match_date !== selectedDate) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const s = sports.find((x) => x.id === m.sport_id);
        const a = teams.find((t) => t.id === m.team_a_id);
        const b = teams.find((t) => t.id === m.team_b_id);
        const sportMatch = (s?.name || '').toLowerCase().includes(q);
        const teamAMatch = (a?.name || '').toLowerCase().includes(q);
        const teamBMatch = (b?.name || '').toLowerCase().includes(q);
        const venueMatch =
          (m.venue || '').toLowerCase().includes(q) || (m.court || '').toLowerCase().includes(q);
        const roundText = roundLabel(m.round) || '';
        const roundMatch =
          roundText.toLowerCase().includes(q) || (m.category || '').toLowerCase().includes(q);
        if (!sportMatch && !teamAMatch && !teamBMatch && !venueMatch && !roundMatch) return false;
      }
      return true;
    });
  }, [matches, effectiveSportId, selectedDate, search, sports, teams]);

  const hasFilter = selectedDate !== 'all' || Boolean(search.trim());

  const resetFilters = () => {
    setSelectedDate('all');
    setSearch('');
  };

  // Group active filtered matches into live / upcoming / recent
  const groups = useMemo(() => {
    return groupMatches(filteredMatches, { editWindowMinutes, now, isAdmin });
  }, [filteredMatches, editWindowMinutes, now, isAdmin]);

  // ------------------------------------------------------------
  // SCREEN A: Choose Sport (shown to Admins / Multi-sport staff when no sport is selected)
  // ------------------------------------------------------------
  if (effectiveSportId === null && availableSports.length > 1) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Title Header */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.25rem' }}>
            เลือกชนิดกีฬาที่จะลงคะแนน
          </h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.82rem',
              color: 'var(--text-3)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: realtimeStatus === 'SUBSCRIBED' ? '#22c55e' : 'var(--gold-500)',
              }}
            />
            <span>
              {realtimeStatus === 'SUBSCRIBED' ? 'ข้อมูลอัปเดตแบบเรียลไทม์' : 'กำลังเชื่อมต่อ Realtime...'}
            </span>
          </div>
        </div>

        {/* Notice */}
        {isAdmin && (
          <div
            style={{
              background: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
            }}
          >
            <Shield size={18} style={{ color: 'var(--gold-600)', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div
                style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.2rem' }}
              >
                โหมดผู้ดูแลระบบ (Admin)
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.45 }}>
                เลือกชนิดกีฬาที่ต้องการลงคะแนนเพื่อดูเฉพาะแมตช์ของกีฬานั้นอย่างชัดเจนและใช้งานง่าย
              </div>
            </div>
          </div>
        )}

        {offlineBanner}
        <Banner kind="error">{error}</Banner>

        {/* Sport Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '0.85rem',
            marginBottom: '1.5rem',
          }}
        >
          {availableSports.map((s) => {
            const sportMatches = matches.filter((m) => m.sport_id === s.id);
            const liveCount = sportMatches.filter((m) => m.status === 'live').length;
            const upcomingCount = sportMatches.filter((m) => m.status === 'scheduled').length;
            const finishedCount = sportMatches.filter((m) => m.status === 'finished').length;

            return (
              <div
                key={s.id}
                onClick={() => handleSelectSport(s.id)}
                className="sport-select-card"
                role="button"
                tabIndex={0}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                      {s.name}
                    </h3>
                    {liveCount > 0 && (
                      <span className="live-pill">
                        <span className="live-dot" /> {liveCount} คู่กำลังแข่ง
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-3)',
                      marginTop: '0.4rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>{sportMatches.length} แมตช์</span>
                    <span>·</span>
                    <span>รอแข่ง {upcomingCount}</span>
                    {finishedCount > 0 && (
                      <>
                        <span>·</span>
                        <span>จบแล้ว {finishedCount}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="sport-select-footer">
                  <span>เลือกลงคะแนนกีฬา{s.name}</span>
                  <span style={{ fontSize: '1.1rem' }}>→</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overview button for Admin only */}
        {isAdmin && (
          <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleSelectSport('all')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
            >
              📋 แสดงทุกกีฬาพร้อมกัน (โหมดภาพรวม)
            </button>
          </div>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------
  // SCREEN B: Matches View (Single Sport or Overview)
  // ------------------------------------------------------------
  const renderCard = (m) => {
    const s = sports.find((x) => x.id === m.sport_id);
    const a = teams.find((t) => t.id === m.team_a_id);
    const b = teams.find((t) => t.id === m.team_b_id);
    const teamsKnown = Boolean(a && b);
    const dl = m.status === 'finished' ? editDeadline(m, editWindowMinutes) : null;
    const isLive = m.status === 'live';

    return (
      <div
        key={m.id}
        onClick={() => teamsKnown && onSelect(m)}
        className={`match-picker-card ${isLive ? 'is-live' : ''}`}
        style={{
          cursor: teamsKnown ? 'pointer' : 'not-allowed',
          opacity: teamsKnown ? 1 : 0.6,
        }}
      >
        {/* Header Tag & Status */}
        <div className="flex-between" style={{ marginBottom: '0.65rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'var(--surface-2)',
              padding: '0.22rem 0.6rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>
              {s?.name || 'กีฬา'}
            </span>
            {(m.round || m.category) && (
              <span style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>
                · {roundLabel(m.round)}
                {m.category && !roundLabel(m.round)?.includes(m.category) ? ` (${m.category})` : ''}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {m.is_walkover && (
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--gold-700)',
                  background: 'rgba(251, 191, 36, 0.15)',
                  border: '1px solid var(--gold-500)',
                  borderRadius: '6px',
                  padding: '1px 6px',
                }}
              >
                ★ ชนะบาย
              </span>
            )}
            <StatusBadge status={m.status} />
          </div>
        </div>

        {/* Teams & Score Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.6rem 0',
          }}
        >
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <TeamBadge name={a?.name || 'รอผล'} colorHex={a?.color_hex} emoji={a?.logo_emoji} size="md" />
          </div>

          <div style={{ padding: '0 0.85rem', textAlign: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.45rem',
                fontWeight: 800,
                letterSpacing: '1px',
                color: isLive ? '#22c55e' : 'var(--text)',
              }}
            >
              {s?.scoring_type === 'sets'
                ? `${m.sets_a ?? 0} - ${m.sets_b ?? 0}`
                : `${m.score_a ?? 0} - ${m.score_b ?? 0}`}
            </span>
            {s?.scoring_type === 'sets' && isLive && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: '2px' }}>
                เซตปัจจุบัน: {m.score_a ?? 0} - {m.score_b ?? 0}
              </div>
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <TeamBadge name={b?.name || 'รอผล'} colorHex={b?.color_hex} emoji={b?.logo_emoji} size="md" />
          </div>
        </div>

        {/* Footer Info & Action Callout */}
        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-3)',
            marginTop: '0.65rem',
            paddingTop: '0.6rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={13} style={{ color: 'var(--text-3)' }} />
              {fmtEventDay(m.match_date)} {fmtTime(m.match_time)} น.
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <MapPin size={13} style={{ color: 'var(--text-3)' }} />
              {fmtPlace(m)}
            </span>
            {dl && (
              <span style={{ color: 'var(--gold-700)', fontWeight: 600 }}>
                แก้ได้อีก {fmtRemaining(dl.getTime() - now)}
              </span>
            )}
          </div>

          <div>
            {teamsKnown ? (
              <div className="match-picker-cta">
                <span>{isLive ? '⚡ กำลังแข่ง · แตะลงคะแนน' : 'แตะเพื่อลงคะแนน →'}</span>
              </div>
            ) : (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>รอผลคู่ก่อนหน้า</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGroup = (title, list, emptyText, icon = null) => (
    <section style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
        {icon}
        <h3
          style={{
            fontSize: '0.88rem',
            fontWeight: 700,
            color: 'var(--text)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            margin: 0,
          }}
        >
          {title}
        </h3>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '1px 7px',
            borderRadius: '999px',
            background: list.length > 0 ? 'var(--surface-3)' : 'var(--border)',
            color: list.length > 0 ? 'var(--text)' : 'var(--text-muted)',
          }}
        >
          {list.length}
        </span>
      </div>

      {list.length === 0 ? (
        <div
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            padding: '0.85rem 1rem',
            background: 'var(--surface-2)',
            borderRadius: '10px',
            border: '1px dashed var(--border)',
            textAlign: 'center',
          }}
        >
          {emptyText}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{list.map(renderCard)}</div>
      )}
    </section>
  );

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Sport Scope Header Banner */}
      {currentSport ? (
        <div className="sport-scope-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
                {currentSport.name}
              </span>
              <span className="sport-scope-badge">
                {actor?.type === 'pin'
                  ? `กรรมการ PIN (${actor.label || 'สนาม'})`
                  : isAdmin
                    ? 'Admin'
                    : 'เจ้าหน้าที่'}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '2px' }}>
              ลงคะแนนเฉพาะกีฬา{currentSport.name} · ทั้งหมด {filteredMatches.length} แมตช์
            </div>
          </div>

          {(isAdmin || availableSports.length > 1) && (
            <button
              type="button"
              onClick={() => handleSelectSport(null)}
              className="btn btn-secondary btn-sm"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>🔄 สลับกีฬา</span>
            </button>
          )}
        </div>
      ) : (
        /* Overview header when viewing all sports */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
              ภาพรวมทุกชนิดกีฬา
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
              แสดงแมตช์ทั้งหมด {matches.length} แมตช์
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSelectSport(null)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.7rem' }}
          >
            ← เลือกกีฬาเดี่ยว
          </button>
        </div>
      )}

      {/* Filter Section: Date Pills + Search */}
      <div className="match-picker-filter-box">
        {/* If in overview mode, show sport pills */}
        {effectiveSportId === 'all' && availableSports.length > 1 && (
          <div className="match-picker-pill-scroll" aria-label="กรองชนิดกีฬา">
            <button
              type="button"
              onClick={() => setSelectedSport('all')}
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
                  onClick={() => handleSelectSport(s.id)}
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
                onClick={() => setSelectedDate('all')}
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
                    onClick={() => setSelectedDate(d.date)}
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
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
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
              พบ <strong>{filteredMatches.length}</strong> แมตช์
            </span>
            <button
              type="button"
              onClick={resetFilters}
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

      {offlineBanner}
      <Banner kind="error">{error}</Banner>

      {noAssignment ? (
        <GlassCard style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-3)' }}>
          <AlertTriangle size={32} style={{ color: 'var(--gold-600)', marginBottom: '0.75rem' }} />
          <div>บัญชีนี้ยังไม่ได้รับมอบหมายชนิดกีฬา กรุณาติดต่อผู้ดูแลระบบ</div>
        </GlassCard>
      ) : filteredMatches.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: '2.5rem', marginTop: '1rem' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.35rem' }}>
            ไม่พบแมตช์ที่ตรงกับตัวกรอง
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1rem' }}>
            ลองเปลี่ยนวันแข่งขัน หรือคำค้นหา
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={resetFilters}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Sparkles size={13} />
            แสดงแมตช์ทั้งหมดของกีฬานี้
          </button>
        </GlassCard>
      ) : (
        <>
          {groups.live.length > 0 &&
            renderGroup(
              'กำลังแข่ง',
              groups.live,
              'ยังไม่มีแมตช์ที่กำลังแข่ง',
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  animation: 'pulse 1.5s infinite',
                }}
              />
            )}
          {renderGroup('ถัดไป', groups.upcoming, 'ไม่มีแมตช์ที่รอแข่ง')}
          {groups.recent.length > 0 && renderGroup('เพิ่งจบ — ยังแก้ได้', groups.recent, 'ไม่มี')}
        </>
      )}
    </div>
  );
}
