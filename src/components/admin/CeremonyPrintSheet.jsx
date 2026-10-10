'use client';
import React from 'react';
import { Trophy, Medal, Award, CheckCircle2, Clock } from 'lucide-react';
import { formatGrandFinale, formatMcCallouts, paginateCeremonyEvents } from '@/lib/ceremony';

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
  const pages = paginateCeremonyEvents(events);

  return (
    <div id="ceremony-print-area" className={`ceremony-print-sheets font-size-${fontSize}`}>
      {pages.map((page) => (
        <div key={page.pageNumber} className="ceremony-page-container">
          {/* Screen-only page indicator badge */}
          <div className="ceremony-page-badge no-print">
            <span>แผ่นที่ {page.pageNumber} จาก {page.totalPages} (ขนาดมาตรฐาน A4: 210 × 297 มม.)</span>
          </div>

          {/* Realistic A4 Page */}
          <div className="ceremony-page">
            <div className="ceremony-page-body">
              {/* Header: Full header on Page 1, compact running header on subsequent pages */}
              {page.isFirstPage ? (
                <header className="ceremony-header">
                  <h1>{ceremonyTitle}</h1>
                  <h2>คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต</h2>
                  <div className="ceremony-meta-row">
                    <span>วันที่: {ceremonyDate}</span>
                    {awardPresenter ? <span>ประธานในพิธี: {awardPresenter}</span> : null}
                    <span>เอกสารทางการสำหรับพิธีกร (MC Cue Sheet)</span>
                  </div>
                </header>
              ) : (
                <header className="ceremony-running-header">
                  <div className="running-header-left">
                    <span className="running-header-title">{ceremonyTitle}</span>
                    <span className="running-header-sub">
                      คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต · วันที่ {ceremonyDate}
                    </span>
                  </div>
                  <div className="running-header-badge">
                    <span>
                      {page.isLastPage
                        ? `ช่วงสุดท้าย (ถ้วยรวมเจ้าสนาม)`
                        : `โพยสคริปต์พิธีกร (ช่วงที่ ${page.pageNumber})`}
                    </span>
                  </div>
                </header>
              )}

              {/* Quick Standings Summary Grid (Page 1) */}
              {page.isFirstPage && standings.length > 0 && (
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
              )}

              {/* Section Interval Label */}
              {page.events.length > 0 && (
                <div className="ceremony-section-label">
                  {page.isFirstPage
                    ? `ช่วงที่ 1: รายการแข่งขันลำดับที่ ${page.startIndex + 1} - ${page.startIndex + page.events.length}`
                    : page.isLastPage
                    ? `ช่วงสุดท้าย: รายการแข่งขันลำดับที่ ${page.startIndex + 1} - ${page.startIndex + page.events.length}`
                    : `ช่วงที่ ${page.pageNumber}: รายการแข่งขันลำดับที่ ${page.startIndex + 1} - ${page.startIndex + page.events.length}`}
                </div>
              )}

              {/* Sequential Event Cue Cards */}
              <div className="ceremony-events-list">
                {page.events.map((event, localIdx) => {
                  const globalIdx = page.startIndex + localIdx + 1;
                  const callouts = formatMcCallouts(event, teamMap, { includeFourthPlace });

                  return (
                    <div key={event.key || globalIdx} className="event-card-cue">
                      <div className="event-card-header">
                        <div className="event-card-title">
                          <span style={{ color: '#64748b' }}>ลำดับที่ {globalIdx}:</span>
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
                          let medalIcon = <Award size={14} style={{ color: '#64748b' }} />;
                          let rowClass = '';
                          if (cue.place === 1) {
                            medalIcon = <Medal size={15} style={{ color: '#eab308' }} />;
                            rowClass = 'gold';
                          } else if (cue.place === 2) {
                            medalIcon = <Medal size={15} style={{ color: '#94a3b8' }} />;
                            rowClass = 'silver';
                          } else if (cue.place === 3) {
                            medalIcon = <Medal size={15} style={{ color: '#b45309' }} />;
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

              {/* Grand Finale Card & MC Notes (Last Page) */}
              {page.isLastPage && (
                <>
                  <div className="grand-finale-card">
                    <div className="grand-finale-header">
                      <Trophy size={20} style={{ color: '#ca8a04' }} />
                      <span>การประกาศรางวัล ถ้วยคะแนนรวมเจ้าสนาม (Grand Finale)</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {finaleRows.map((team) => (
                        <div key={team.teamId} className={`grand-finale-row ${team.isChampion ? 'champion' : ''}`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="ceremony-color-dot" style={{ backgroundColor: team.teamColor }} />
                            <span>{team.title}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{team.teamName}</span>
                            <span style={{ fontSize: '0.85em', opacity: 0.9 }}>({team.totalPoints} คะแนน)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {mcNotes ? (
                    <div className="mc-notes-card">
                      <strong>โน้ตสำหรับพิธีกร:</strong> {mcNotes}
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* Running Footer on EVERY page */}
            <footer className="ceremony-page-footer">
              <div className="footer-left">
                Sci Games 2026 · คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต
              </div>
              <div className="footer-right">
                หน้าที่ {page.pageNumber} จาก {page.totalPages}
              </div>
            </footer>
          </div>
        </div>
      ))}
    </div>
  );
}
