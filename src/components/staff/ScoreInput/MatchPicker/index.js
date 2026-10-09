'use client';
import { useMemo } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Banner from '@/components/ui/Banner';
import { Sparkles, AlertTriangle } from '@/components/animate-ui/icons';
import { useMatchPicker } from './useMatchPicker';
import SportChooser from './SportChooser';
import PickerFilters from './PickerFilters';
import PickerGroup from './PickerGroup';
import PickerCard from './PickerCard';

/** Step 1 — pick the match to score, isolated per sport so staff and referees focus only on their sport. */
export default function MatchPicker({
  matches = [],
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
  const {
    availableSports,
    selectedSport,
    setSelectedSport,
    selectedDate,
    setSelectedDate,
    search,
    setSearch,
    effectiveSportId,
    currentSport,
    handleSelectSport,
    availableDates,
    filteredMatches,
    hasFilter,
    resetFilters,
    groups,
  } = useMatchPicker({ matches, sports, teams, editWindowMinutes, now, isAdmin });

  const sportById = useMemo(() => new Map(sports.map((s) => [s.id, s])), [sports]);
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  // ------------------------------------------------------------
  // SCREEN A: Choose Sport (shown to Admins / Multi-sport staff when no sport is selected)
  // ------------------------------------------------------------
  if (effectiveSportId === null && availableSports.length > 1) {
    return (
      <SportChooser
        matches={matches}
        availableSports={availableSports}
        isAdmin={isAdmin}
        realtimeStatus={realtimeStatus}
        offlineBanner={offlineBanner}
        error={error}
        onSelectSport={handleSelectSport}
      />
    );
  }

  // ------------------------------------------------------------
  // SCREEN B: Matches View (Single Sport or Overview)
  // ------------------------------------------------------------
  const renderGroup = (title, list, emptyText, icon = null) => (
    <PickerGroup title={title} count={list.length} emptyText={emptyText} icon={icon}>
      {list.map((m) => (
        <PickerCard
          key={m.id}
          m={m}
          sport={sportById.get(m.sport_id)}
          teamA={teamById.get(m.team_a_id)}
          teamB={teamById.get(m.team_b_id)}
          now={now}
          editWindowMinutes={editWindowMinutes}
          onSelect={onSelect}
        />
      ))}
    </PickerGroup>
  );

  return (
    <div className="mp-page">
      {/* Sport Scope Header Banner */}
      {currentSport ? (
        <div className="sport-scope-header">
          <div>
            <div className="mp-scope-title-row">
              <span className="mp-scope-title">{currentSport.name}</span>
              <span className="sport-scope-badge">
                {actor?.type === 'pin'
                  ? `กรรมการ PIN (${actor.label || 'สนาม'})`
                  : isAdmin
                    ? 'Admin'
                    : 'เจ้าหน้าที่'}
              </span>
            </div>
            <div className="mp-scope-sub">
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
        <div className="mp-overview-head">
          <div>
            <h2 className="mp-overview-title">ภาพรวมทุกชนิดกีฬา</h2>
            <div className="mp-overview-sub">แสดงแมตช์ทั้งหมด {matches.length} แมตช์</div>
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

      <PickerFilters
        matches={matches}
        availableSports={availableSports}
        availableDates={availableDates}
        effectiveSportId={effectiveSportId}
        selectedSport={selectedSport}
        selectedDate={selectedDate}
        search={search}
        filteredCount={filteredMatches.length}
        hasFilter={hasFilter}
        onShowAllSports={() => setSelectedSport('all')}
        onSelectSport={handleSelectSport}
        onSelectDate={setSelectedDate}
        onSearch={setSearch}
        onReset={resetFilters}
      />

      {offlineBanner}
      <Banner kind="error">{error}</Banner>

      {noAssignment ? (
        <GlassCard style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-3)' }}>
          <AlertTriangle size={32} style={{ color: 'var(--gold-600)', marginBottom: '0.75rem' }} />
          <div>บัญชีนี้ยังไม่ได้รับมอบหมายชนิดกีฬา กรุณาติดต่อผู้ดูแลระบบ</div>
        </GlassCard>
      ) : filteredMatches.length === 0 ? (
        <GlassCard style={{ textAlign: 'center', padding: '2.5rem', marginTop: '1rem' }}>
          <div className="mp-empty-title">ไม่พบแมตช์ที่ตรงกับตัวกรอง</div>
          <p className="mp-empty-text">ลองเปลี่ยนวันแข่งขัน หรือคำค้นหา</p>
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
              <span className="mp-live-dot" />
            )}
          {renderGroup('ถัดไป', groups.upcoming, 'ไม่มีแมตช์ที่รอแข่ง')}
          {groups.recent.length > 0 && renderGroup('เพิ่งจบ — ยังแก้ได้', groups.recent, 'ไม่มี')}
        </>
      )}
    </div>
  );
}
