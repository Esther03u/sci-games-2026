'use client';
import React from 'react';
import { Trophy, Medal, Award, CheckCircle2, Clock } from 'lucide-react';
import { formatGrandFinale, formatMcCallouts } from '@/lib/ceremony';

export default function CeremonyPrintSheet({
  events = [],
  standings = [],
  teams = [],
  options = {},
}) {
  const {
    ceremonyTitle = 'พิธีมอบรางวัลและปิดการแข่งขัน Sci Games 2026',
    ceremonyDate = '11 ตุลาคม 2569',
    awardPresenter = '',
    mcNotes = '',
    includeFourthPlace = false,
    fontSize = 'medium',
  } = options;

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const finaleRows = formatGrandFinale(standings);

  return (
    <div id="ceremony-print-area" className={`ceremony-sheet font-size-${fontSize}`}>
      {/* 1. Header */}
      <header className="ceremony-header">
        <h1>{ceremonyTitle}</h1>
        <h2>คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต</h2>
        <div className="ceremony-meta-row">
          <span>วันที่: {ceremonyDate}</span>
          {awardPresenter ? <span>ประธานในพิธี: {awardPresenter}</span> : null}
          <span>เอกสารทางการสำหรับพิธีกร (MC Cue Sheet)</span>
        </div>
      </header>

      {/* 2. Quick Standings Summary Grid */}
      <div className="ceremony-quick-grid">
        {standings.map((team) => (
          <div key={team.id} className="ceremony-quick-team">
            <div className="ceremony-quick-team-name">
              <span className="ceremony-color-dot" style={{ backgroundColor: team.color_hex }} />
              <span>{team.name}</span>
            </div>
            <div style={{ color: '#475569' }}>
              ทอง {team.golds} | เงิน {team.silvers} | ทองแดง {team.bronzes}
            </div>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>
              คะแนนรวม: {team.total_points} แต้ม (อันดับ {team.rank})
            </div>
          </div>
        ))}
      </div>

      {/* 3. Sequential Event Cards (Build-up: 3rd -> 2nd -> 1st) */}
      <div className="ceremony-events-list">
        {events.map((event, index) => {
          const callouts = formatMcCallouts(event, teamMap, { includeFourthPlace });

          return (
            <div key={event.key || index} className="event-card-cue">
              <div className="event-card-header">
                <div className="event-card-title">
                  <span style={{ color: '#64748b' }}>ลำดับที่ {index + 1}:</span>
                  <span>{event.sport_name}</span>
                  <span style={{ color: '#2563eb' }}>{event.category}</span>
                </div>
                <div className={`event-card-badge ${event.done ? 'done' : 'pending'}`}>
                  {event.done ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  <span>{event.done ? 'แข่งเสร็จสิ้น' : 'รอผลการแข่งขัน'}</span>
                </div>
              </div>

              <div className="event-card-callouts">
                {callouts.map((cue) => {
                  let medalIcon = <Award size={14} className="text-slate-500" />;
                  let rowClass = '';
                  if (cue.place === 1) {
                    medalIcon = <Medal size={16} style={{ color: '#eab308' }} />;
                    rowClass = 'gold';
                  } else if (cue.place === 2) {
                    medalIcon = <Medal size={16} style={{ color: '#94a3b8' }} />;
                    rowClass = 'silver';
                  } else if (cue.place === 3) {
                    medalIcon = <Medal size={16} style={{ color: '#b45309' }} />;
                    rowClass = 'bronze';
                  }

                  return (
                    <div key={cue.place} className={`cue-callout-row ${rowClass}`}>
                      <div className="cue-callout-left">
                        {medalIcon}
                        <span>{cue.title}</span>
                      </div>
                      <div className="cue-callout-right">
                        <span className="ceremony-color-dot" style={{ backgroundColor: cue.teamColor }} />
                        <span>{cue.teamName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Grand Finale: Overall Tournament Trophy */}
      <div className="grand-finale-card">
        <div className="grand-finale-header">
          <Trophy size={22} style={{ color: '#ca8a04' }} />
          <span>การประกาศรางวัล ถ้วยคะแนนรวมเจ้าสนาม (Grand Finale)</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {finaleRows.map((team) => (
            <div key={team.teamId} className={`grand-finale-row ${team.isChampion ? 'champion' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="ceremony-color-dot" style={{ backgroundColor: team.teamColor }} />
                <span>{team.title}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>{team.teamName}</span>
                <span style={{ fontSize: '0.85em', opacity: 0.9 }}>({team.totalPoints} คะแนน)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. MC Notes & Footer */}
      {mcNotes ? (
        <div style={{ marginTop: '16px', padding: '10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.82rem', color: '#334155' }}>
          <strong>โน้ตสำหรับพิธีกร:</strong> {mcNotes}
        </div>
      ) : null}
    </div>
  );
}
