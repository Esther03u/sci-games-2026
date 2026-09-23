'use client';
import { useMemo, useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import TeamBadge from '@/components/ui/TeamBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import Banner from '@/components/ui/Banner';
import SportIcon from '@/components/ui/SportIcon';
import { MapPin, Clock, Search, X, Shield, Sparkles, AlertTriangle } from '@/components/animate-ui/icons';
import { fmtRemaining, fmtTime, fmtPlace, fmtEventDay, EVENT_DAYS } from '@/lib/format';
import { roundLabel } from '@/lib/labels';
import { editDeadline, groupMatches } from './scoring';

/** Step 1 — pick the match to score, with sport/date filters and quick search. */
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
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [search, setSearch] = useState('');

  // Sports present in the visible matches
  const availableSports = useMemo(() => {
    const ids = new Set(matches.map((m) => m.sport_id));
    return sports.filter((s) => ids.has(s.id));
  }, [matches, sports]);

  // Dates present in matches of current sport scope
  const availableDates = useMemo(() => {
    const scope = selectedSport === 'all' ? matches : matches.filter((m) => m.sport_id === selectedSport);
    const dateSet = new Set(scope.map((m) => m.match_date));
    return EVENT_DAYS.filter((d) => dateSet.has(d.date));
  }, [matches, selectedSport]);

  // Apply filters
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (selectedSport !== 'all' && m.sport_id !== selectedSport) return false;
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
  }, [matches, selectedSport, selectedDate, search, sports, teams]);

  const hasFilter = selectedSport !== 'all' || selectedDate !== 'all' || Boolean(search.trim());

  const resetFilters = () => {
    setSelectedSport('all');
    setSelectedDate('all');
    setSearch('');
  };

  // Group active filtered matches into live / upcoming / recent
  const groups = useMemo(() => {
    if (!hasFilter && defaultGroups) return defaultGroups;
    return groupMatches(filteredMatches, { editWindowMinutes, now, isAdmin });
  }, [hasFilter, defaultGroups, filteredMatches, editWindowMinutes, now, isAdmin]);

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
              gap: '0.4rem',
              background: 'var(--surface-2)',
              padding: '0.22rem 0.6rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            <SportIcon sportName={s?.name} size={15} style={{ color: 'var(--gold-600)' }} />
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
      {/* Title Header */}
      <div style={{ marginBottom: '1.15rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.2rem' }}>
          เลือกคู่การแข่งขันที่จะลงคะแนน
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

      {/* Admin Notice Banner */}
      {isAdmin && (
        <div
          style={{
            background: 'rgba(251, 191, 36, 0.08)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            marginBottom: '1.15rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
          }}
        >
          <Shield size={18} style={{ color: 'var(--gold-600)', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '0.86rem',
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>โหมดผู้ดูแลระบบ (Admin)</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  background: 'rgba(251, 191, 36, 0.2)',
                  color: 'var(--gold-700)',
                  padding: '1px 6px',
                  borderRadius: '999px',
                }}
              >
                มีสิทธิ์ทุกชนิดกีฬา
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.45 }}>
              คุณสามารถเลือกลงคะแนนได้ทุกกีฬา หรือแตะปุ่มชนิดกีฬาด้านล่างเพื่อกรองดูเฉพาะกีฬาที่ต้องการ
              (หากต้องการทดสอบในมุมมองของกรรมการสนามจริง ให้กดปุ่ม <strong>&quot;ออก&quot;</strong> มุมขวาบน
              แล้วล็อกอินด้วย PIN 6 หลัก)
            </div>
          </div>
        </div>
      )}

      {/* Single PIN sport indication */}
      {actor?.type === 'pin' && availableSports.length === 1 && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '999px',
            padding: '0.35rem 0.85rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: '1rem',
          }}
        >
          <SportIcon sportName={availableSports[0]?.name} size={15} style={{ color: 'var(--gold-600)' }} />
          <span>กรรมการประจำกีฬา: {availableSports[0]?.name} (PIN)</span>
        </div>
      )}

      {/* Filter Section */}
      <div className="match-picker-filter-box">
        {/* Tier 1: Sport Pills (shown when more than 1 sport is available) */}
        {availableSports.length > 1 && (
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
              const active = selectedSport === s.id;
              const count = matches.filter((m) => m.sport_id === s.id).length;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSport(s.id)}
                  className={`match-picker-pill ${active ? 'active' : ''}`}
                >
                  <SportIcon
                    sportName={s.name}
                    size={14}
                    style={{ color: active ? 'inherit' : 'var(--gold-600)' }}
                  />
                  <span>{s.name}</span>
                  <span className="match-picker-pill-badge">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Tier 2: Date Pills + Search */}
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
                  (m) => m.match_date === d.date && (selectedSport === 'all' || m.sport_id === selectedSport)
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
              พบ <strong>{filteredMatches.length}</strong> แมตช์จากทั้งหมด {matches.length} แมตช์
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
            ลองเปลี่ยนชนิดกีฬา วันแข่งขัน หรือคำค้นหา
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={resetFilters}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Sparkles size={13} />
            แสดงแมตช์ทั้งหมด
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
