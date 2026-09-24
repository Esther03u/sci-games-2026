'use client';
import { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Banner from '@/components/ui/Banner';
import TeamBadge from '@/components/ui/TeamBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import FormField from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import { apiRequest } from '@/lib/api/client';
import { schedulePatch } from '@/lib/schedule-patch';
import { formatDate, fmtPlace, EVENT_START_DATE } from '@/lib/format';
import {
  Plus,
  Calendar,
  MapPin,
  Pencil,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Play,
} from '@/components/animate-ui/icons';

export default function MatchEditor({ initialMatches = [], sports = [], teams = [] }) {
  const [matches, setMatches] = useState(initialMatches);
  const [pageError, setPageError] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Add Match Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [sportId, setSportId] = useState(sports[0]?.id || '');
  const [teamAId, setTeamAId] = useState(teams[0]?.id || '');
  const [teamBId, setTeamBId] = useState(teams[1]?.id || '');
  const [matchDate, setMatchDate] = useState(EVENT_START_DATE);
  const [matchTime, setMatchTime] = useState('10:00');
  const [venue, setVenue] = useState('โรงยิมเนเซียม 1');
  const [court, setCourt] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit Score/Status State
  const [editingMatch, setEditingMatch] = useState(null);
  const [editScoreA, setEditScoreA] = useState('');
  const [editScoreB, setEditScoreB] = useState('');
  const [editSets, setEditSets] = useState([]); // [{ set_number: 1, score_a: '', score_b: '' }]
  const [editStatus, setEditStatus] = useState('upcoming');
  const [editReason, setEditReason] = useState('');

  // Reset Match State
  const [matchToReset, setMatchToReset] = useState(null);
  const [resetReason, setResetReason] = useState('');

  // Delete Match State
  const [matchToDelete, setMatchToDelete] = useState(null);

  // Edit Schedule State (teams / date / time / venue / court of an existing match)
  const [scheduleMatch, setScheduleMatch] = useState(null);
  const [scheduleForm, setScheduleForm] = useState(null);
  const [scheduleError, setScheduleError] = useState('');

  const filteredMatches = matches.filter((m) => {
    const sportMatch = selectedSport === 'all' || m.sport_id === selectedSport;
    const statusMatch = selectedStatus === 'all' || m.status === selectedStatus;
    return sportMatch && statusMatch;
  });

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    setFormError('');

    if (teamAId && teamBId && teamAId === teamBId) {
      setFormError('ทีมที่แข่งขันต้องไม่เป็นทีมเดียวกัน');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest('/api/admin/matches', {
        body: {
          sport_id: sportId,
          team_a_id: teamAId || null,
          team_b_id: teamBId || null,
          match_date: matchDate,
          match_time: matchTime + ':00',
          venue: venue.trim(),
          court: court.trim() || null,
        },
      });
      setMatches((prev) => [data, ...prev]);
      setShowAddModal(false);
    } catch (err) {
      setFormError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const openEditScore = (m) => {
    setEditingMatch(m);
    setEditScoreA(m.score_a !== null && m.score_a !== undefined ? String(m.score_a) : '');
    setEditScoreB(m.score_b !== null && m.score_b !== undefined ? String(m.score_b) : '');
    setEditStatus(m.status);
    setEditReason('');

    const currentSport = sports.find((s) => s.id === m.sport_id);
    if (currentSport?.scoring_type === 'sets') {
      const rawSets = Array.isArray(m.match_sets) ? [...m.match_sets] : [];
      rawSets.sort((a, b) => a.set_number - b.set_number);
      const setsToWin = currentSport.sets_to_win || 2;
      const maxSlots = Math.max(setsToWin === 2 ? 3 : 5, rawSets.length);
      const initialSets = [];
      for (let i = 1; i <= maxSlots; i++) {
        const existing = rawSets.find((x) => x.set_number === i);
        initialSets.push({
          set_number: i,
          score_a:
            existing?.score_a !== null && existing?.score_a !== undefined ? String(existing.score_a) : '',
          score_b:
            existing?.score_b !== null && existing?.score_b !== undefined ? String(existing.score_b) : '',
        });
      }
      setEditSets(initialSets);
    } else {
      setEditSets([]);
    }
  };

  const handleUpdateScore = async (e) => {
    e.preventDefault();
    if (!editingMatch) return;
    setLoading(true);

    const currentSport = sports.find((s) => s.id === editingMatch.sport_id);
    const isSetSport = currentSport?.scoring_type === 'sets';

    try {
      // If user selected upcoming while match was live or finished, prompt reset
      if (editStatus === 'upcoming' && editingMatch.status !== 'upcoming') {
        setMatchToReset(editingMatch);
        setResetReason(editReason || 'เปลี่ยนสถานะกลับเป็นยังไม่แข่ง');
        setEditingMatch(null);
        setLoading(false);
        return;
      }

      let row = editingMatch;
      let scoreA = editScoreA === '' ? null : parseInt(editScoreA, 10);
      let scoreB = editScoreB === '' ? null : parseInt(editScoreB, 10);
      let setsA = null;
      let setsB = null;

      if (isSetSport) {
        const validSets = editSets.filter((s) => s.score_a !== '' && s.score_b !== '');
        let countA = 0;
        let countB = 0;
        validSets.forEach((s) => {
          const sa = parseInt(s.score_a, 10);
          const sb = parseInt(s.score_b, 10);
          if (sa > sb) countA++;
          else if (sb > sa) countB++;
        });
        setsA = countA;
        setsB = countB;
        scoreA = countA;
        scoreB = countB;
      }

      const scoreChanged = scoreA !== (row.score_a ?? null) || scoreB !== (row.score_b ?? null);

      if (editStatus === 'live' && row.status !== 'live') {
        row = await apiRequest(`/api/match/${row.id}/start`);
      }
      if (scoreChanged || (isSetSport && editSets.some((s) => s.score_a !== '' && s.score_b !== ''))) {
        row = await apiRequest(`/api/match/${row.id}/override`, {
          body: {
            score_a: scoreA ?? 0,
            score_b: scoreB ?? 0,
            sets_a: setsA,
            sets_b: setsB,
            sets: isSetSport ? editSets.filter((s) => s.score_a !== '' && s.score_b !== '') : undefined,
            reason: editReason || undefined,
          },
        });
      }
      if (editStatus === 'finished' && row.status !== 'finished') {
        row = await apiRequest(`/api/match/${row.id}/finish`);
      } else if ((editStatus === 'upcoming' || editStatus === 'postponed') && row.status !== editStatus) {
        row = await apiRequest('/api/admin/matches', {
          method: 'PATCH',
          body: { id: row.id, status: editStatus },
        });
      }

      setMatches((prev) => prev.map((m) => (m.id === editingMatch.id ? { ...m, ...row } : m)));
      setEditingMatch(null);
    } catch (err) {
      setPageError(err.message || 'เกิดข้อผิดพลาดในการอัปเดต');
    } finally {
      setLoading(false);
    }
  };

  const handleResetMatch = async () => {
    if (!matchToReset) return;
    setLoading(true);
    setPageError('');
    try {
      const res = await apiRequest(`/api/match/${matchToReset.id}/reset`, {
        method: 'POST',
        body: { reason: resetReason.trim() || 'แอดมินรีเซ็ตผลการแข่งขัน' },
      });
      setMatches((prev) =>
        prev.map((m) => {
          if (m.id === matchToReset.id) {
            return {
              ...m,
              ...res,
              status: 'upcoming',
              score_a: null,
              score_b: null,
              sets_a: null,
              sets_b: null,
              points_a: null,
              points_b: null,
              is_walkover: false,
              match_sets: [],
            };
          }
          if (m.id === matchToReset.next_match_id) {
            return {
              ...m,
              team_a_id: matchToReset.next_match_slot === 'a' ? null : m.team_a_id,
              team_b_id: matchToReset.next_match_slot === 'b' ? null : m.team_b_id,
            };
          }
          if (m.id === matchToReset.loser_next_match_id) {
            return {
              ...m,
              team_a_id: matchToReset.loser_next_match_slot === 'a' ? null : m.team_a_id,
              team_b_id: matchToReset.loser_next_match_slot === 'b' ? null : m.team_b_id,
            };
          }
          return m;
        })
      );
      setMatchToReset(null);
      setResetReason('');
      if (editingMatch?.id === matchToReset.id) setEditingMatch(null);
    } catch (err) {
      setPageError(err.message || 'รีเซ็ตผลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleReopenMatch = async (m) => {
    if (
      !window.confirm(
        'ยืนยันเปิดให้แข่งขันต่อสำหรับคู่นี้?\n\nสถานะจะเปลี่ยนกลับเป็น "กำลังแข่งขัน" (Live) เพื่อให้กรรมการสนามสามารถบันทึกคะแนนต่อได้'
      )
    ) {
      return;
    }
    setLoading(true);
    setPageError('');
    try {
      const res = await apiRequest(`/api/match/${m.id}/reopen`, { method: 'POST' });
      setMatches((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, ...res, status: 'live', is_walkover: false } : x))
      );
    } catch (err) {
      setPageError(err.message || 'เปิดแข่งขันต่อไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleWalkover = async (winner) => {
    if (!editingMatch) return;
    const teamName =
      winner === 'a'
        ? teams.find((t) => t.id === editingMatch.team_a_id)?.name || 'ทีม A'
        : teams.find((t) => t.id === editingMatch.team_b_id)?.name || 'ทีม B';

    if (
      !window.confirm(
        `ยืนยันตัดสินให้ "${teamName}" ชนะบาย?\n\nระบบจะปรับคะแนนชนะบาย จบการแข่งขัน และส่งผลต่อสายการแข่งขันทันที`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest(`/api/match/${editingMatch.id}/walkover`, {
        body: {
          winner,
          reason: editReason || 'คู่แข่งไม่มาทำการแข่งขันหรือสละสิทธิ์',
        },
      });
      setMatches((prev) => prev.map((m) => (m.id === editingMatch.id ? res : m)));
      setEditingMatch(null);
    } catch (err) {
      setPageError(err.message || 'เกิดข้อผิดพลาดในการตัดสินชนะบาย');
    } finally {
      setLoading(false);
    }
  };

  const openSchedule = (m) => {
    setScheduleMatch(m);
    setScheduleError('');
    setScheduleForm({
      team_a_id: m.team_a_id || '',
      team_b_id: m.team_b_id || '',
      match_date: m.match_date || '',
      match_time: m.match_time?.slice(0, 5) || '',
      venue: m.venue || '',
      court: m.court || '',
    });
  };
  const setScheduleField = (key) => (e) => setScheduleForm((f) => ({ ...f, [key]: e.target.value }));

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleMatch) return;
    const result = schedulePatch(scheduleMatch, scheduleForm);
    if (result.error) {
      setScheduleError(result.error);
      return;
    }
    const { patch } = result;
    if (Object.keys(patch).length === 0) {
      setScheduleMatch(null);
      return;
    }
    setLoading(true);
    try {
      const row = await apiRequest('/api/admin/matches', {
        method: 'PATCH',
        body: { id: scheduleMatch.id, ...patch },
      });
      setMatches((prev) => prev.map((m) => (m.id === row.id ? row : m)));
      setScheduleMatch(null);
    } catch (err) {
      setScheduleError(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!matchToDelete) return;
    setLoading(true);
    try {
      await apiRequest(`/api/admin/matches?id=${matchToDelete.id}`, { method: 'DELETE' });
      setMatches((prev) => prev.filter((m) => m.id !== matchToDelete.id));
      setMatchToDelete(null);
    } catch (err) {
      setPageError(err.message || 'ลบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const currentEditingSport = sports.find((s) => s.id === editingMatch?.sport_id);
  const isEditingSetSport = currentEditingSport?.scoring_type === 'sets';

  return (
    <div>
      <Banner kind="error" onClose={() => setPageError('')}>
        {pageError}
      </Banner>
      {/* Top action bar */}
      <GlassCard
        style={{
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Sport Filter */}
          <select
            className="form-select"
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">ทุกชนิดกีฬา</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="form-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">ทุกสถานะ</option>
            <option value="upcoming">ยังไม่แข่ง</option>
            <option value="live">กำลังแข่ง</option>
            <option value="finished">จบแล้ว</option>
            <option value="postponed">เลื่อน</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary btn-sm"
          style={{ padding: '0.6rem 1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={16} />
          <span>สร้างแมตช์แข่งขันใหม่</span>
        </button>
      </GlassCard>

      {/* Matches Table */}
      <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table className="data-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>ชนิดกีฬา</th>
              <th>คู่แข่งขัน</th>
              <th style={{ textAlign: 'center' }}>ผลคะแนน</th>
              <th>สถานะ</th>
              <th>วัน / เวลา / สนาม</th>
              <th style={{ minWidth: '220px', textAlign: 'center' }}>การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredMatches.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-3)' }}>
                  ไม่พบรายการแข่งขัน
                </td>
              </tr>
            ) : (
              filteredMatches.map((m) => {
                const sport = sports.find((s) => s.id === m.sport_id);
                const teamA = teams.find((t) => t.id === m.team_a_id);
                const teamB = teams.find((t) => t.id === m.team_b_id);
                const isSetSport = sport?.scoring_type === 'sets';
                const hasFinishedSets =
                  isSetSport &&
                  Array.isArray(m.match_sets) &&
                  m.match_sets.some((s) => s.score_a !== null && s.score_b !== null);

                const canReset =
                  m.status !== 'upcoming' ||
                  m.score_a !== null ||
                  m.score_b !== null ||
                  m.is_walkover ||
                  hasFinishedSets;

                return (
                  <tr key={m.id}>
                    <td>
                      <strong style={{ color: 'var(--text)' }}>{sport?.name}</strong>
                      {m.round && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                          รอบ {m.round} {m.match_number ? `(คู่ที่ ${m.match_number})` : ''}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TeamBadge
                          name={teamA?.name || 'รอผลการแข่งขัน'}
                          colorHex={teamA?.color_hex || '#94a3b8'}
                          emoji={teamA?.logo_emoji || '⏳'}
                          size="sm"
                        />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>VS</span>
                        <TeamBadge
                          name={teamB?.name || 'รอผลการแข่งขัน'}
                          colorHex={teamB?.color_hex || '#94a3b8'}
                          emoji={teamB?.logo_emoji || '⏳'}
                          size="sm"
                        />
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          color: 'var(--text)',
                        }}
                      >
                        {m.status === 'upcoming' && m.score_a === null
                          ? '-'
                          : `${m.score_a ?? 0} - ${m.score_b ?? 0}`}
                        {isSetSport && m.status !== 'upcoming' && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: 'var(--text-3)',
                              marginLeft: '4px',
                            }}
                          >
                            (เซต)
                          </span>
                        )}
                      </div>
                      {hasFinishedSets && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-2)', marginTop: '2px' }}>
                          {m.match_sets
                            .filter((s) => s.score_a !== null && s.score_b !== null)
                            .sort((a, b) => a.set_number - b.set_number)
                            .map((s) => `${s.score_a}-${s.score_b}`)
                            .join(' | ')}
                        </div>
                      )}
                    </td>
                    <td>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <StatusBadge status={m.status} />
                        {m.is_walkover && (
                          <span
                            style={{
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: 'var(--gold-700)',
                              border: '1px solid rgba(245, 158, 11, 0.35)',
                              borderRadius: '999px',
                              padding: '2px 7px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ★ ชนะบาย
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          marginBottom: '0.2rem',
                        }}
                      >
                        <Calendar size={13} style={{ color: '#60a5fa', flexShrink: 0 }} />
                        <span>
                          {formatDate(m.match_date)} | {m.match_time?.slice(0, 5)} น.
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MapPin size={13} style={{ color: '#f87171', flexShrink: 0 }} />
                        <span>{fmtPlace(m)}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          gap: '0.35rem',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => openEditScore(m)}
                          className="btn btn-primary btn-sm"
                          title="บันทึกผลคะแนนหรือชนะบาย"
                          style={{
                            padding: '0.25rem 0.55rem',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <Pencil size={12} />
                          <span>บันทึกผล</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openSchedule(m)}
                          className="btn btn-secondary btn-sm"
                          title="แก้ไขทีม วัน เวลา หรือสนาม"
                          style={{
                            padding: '0.25rem 0.55rem',
                            fontSize: '0.78rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <Calendar size={12} />
                          <span>แก้ตาราง</span>
                        </button>

                        {canReset && (
                          <button
                            type="button"
                            onClick={() => {
                              setMatchToReset(m);
                              setResetReason('');
                            }}
                            className="btn btn-secondary btn-sm"
                            title="ล้างคะแนนและสถานะกลับเป็นยังไม่แข่ง (ตารางคู่แข่งยังคงอยู่)"
                            style={{
                              padding: '0.25rem 0.55rem',
                              fontSize: '0.78rem',
                              color: 'var(--gold-700)',
                              borderColor: 'rgba(245, 158, 11, 0.4)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <RotateCcw size={12} />
                            <span>รีเซ็ตผล</span>
                          </button>
                        )}

                        {m.status === 'finished' && (
                          <button
                            type="button"
                            onClick={() => handleReopenMatch(m)}
                            className="btn btn-secondary btn-sm"
                            title="เปิดกลับมาแข่งขันต่อ (Live)"
                            style={{
                              padding: '0.25rem 0.55rem',
                              fontSize: '0.78rem',
                              color: 'var(--success-text)',
                              borderColor: 'rgba(34, 197, 94, 0.4)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <Play size={12} />
                            <span>แข่งต่อ</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setMatchToDelete(m)}
                          className="btn btn-secondary btn-sm"
                          title="ลบแมตช์นี้ออกจากตารางถาวร"
                          style={{
                            padding: '0.25rem 0.55rem',
                            fontSize: '0.78rem',
                            color: 'var(--danger-text)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <Trash2 size={12} />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Match Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="เพิ่มแมตช์แข่งขันใหม่">
        <form onSubmit={handleCreateMatch} style={{ padding: '0.5rem 0' }}>
          {formError && (
            <p
              style={{
                color: 'var(--danger-text)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <AlertTriangle size={15} />
              <span>{formError}</span>
            </p>
          )}

          <FormField label="ชนิดกีฬา" required>
            <select
              className="form-select"
              value={sportId}
              onChange={(e) => setSportId(e.target.value)}
              required
            >
              {sports.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="ทีม A">
              <select className="form-select" value={teamAId} onChange={(e) => setTeamAId(e.target.value)}>
                <option value="">-- รอผลการแข่งขัน (ยังไม่ระบุ) --</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="ทีม B">
              <select className="form-select" value={teamBId} onChange={(e) => setTeamBId(e.target.value)}>
                <option value="">-- รอผลการแข่งขัน (ยังไม่ระบุ) --</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="วันที่แข่ง" required>
              <input
                type="date"
                className="form-input"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                required
              />
            </FormField>
            <FormField label="เวลาแข่ง" required>
              <input
                type="time"
                className="form-input"
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
                required
              />
            </FormField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <FormField label="สถานที่ / สนาม" required>
              <input
                type="text"
                className="form-input"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                required
              />
            </FormField>
            <FormField label="สนามย่อย (ถ้ามี)">
              <input
                type="text"
                className="form-input"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                placeholder="เช่น สนาม 1"
              />
            </FormField>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary btn-sm">
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'กำลังสร้าง...' : 'สร้างแมตช์'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Score & Status Modal */}
      <Modal isOpen={!!editingMatch} onClose={() => setEditingMatch(null)} title="บันทึกผลคะแนนและสถานะแมตช์">
        {editingMatch && (
          <form onSubmit={handleUpdateScore} style={{ padding: '0.5rem 0' }}>
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)' }}>
                {sports.find((s) => s.id === editingMatch.sport_id)?.name}
                {editingMatch.round ? ` · รอบ ${editingMatch.round}` : ''}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                {teams.find((t) => t.id === editingMatch.team_a_id)?.name || 'รอผลการแข่งขัน'} vs{' '}
                {teams.find((t) => t.id === editingMatch.team_b_id)?.name || 'รอผลการแข่งขัน'}
              </div>
            </div>

            <FormField label="สถานะการแข่งขัน" required>
              <select
                className="form-select"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                required
              >
                <option value="upcoming">ยังไม่แข่ง (Upcoming)</option>
                <option value="live">กำลังแข่งขัน (Live)</option>
                <option value="finished">จบการแข่งขัน (Finished)</option>
                <option value="postponed">เลื่อนการแข่งขัน (Postponed)</option>
              </select>
            </FormField>

            {/* Score inputs: Sets or Points */}
            {isEditingSetSport ? (
              <div style={{ margin: '1rem 0' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <label className="form-label" style={{ margin: 0 }}>
                    คะแนนรายเซต ({currentEditingSport?.name})
                  </label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                    onClick={() =>
                      setEditSets((prev) => [
                        ...prev,
                        { set_number: prev.length + 1, score_a: '', score_b: '' },
                      ])
                    }
                  >
                    + เพิ่มเซต
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {editSets.map((s, idx) => (
                    <div
                      key={s.set_number}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '80px 1fr 1fr',
                        gap: '0.75rem',
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '0.4rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--glass-border)',
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-2)' }}>
                        เซตที่ {s.set_number}
                      </span>
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        placeholder={teams.find((t) => t.id === editingMatch.team_a_id)?.name || 'ทีม A'}
                        value={s.score_a}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditSets((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, score_a: val } : item))
                          );
                        }}
                      />
                      <input
                        type="number"
                        min="0"
                        className="form-input"
                        placeholder={teams.find((t) => t.id === editingMatch.team_b_id)?.name || 'ทีม B'}
                        value={s.score_b}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditSets((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, score_b: val } : item))
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1rem 0' }}>
                <FormField
                  label={`คะแนน: ${teams.find((t) => t.id === editingMatch.team_a_id)?.name || 'ทีม A'}`}
                >
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={editScoreA}
                    onChange={(e) => setEditScoreA(e.target.value)}
                    placeholder="0"
                  />
                </FormField>

                <FormField
                  label={`คะแนน: ${teams.find((t) => t.id === editingMatch.team_b_id)?.name || 'ทีม B'}`}
                >
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={editScoreB}
                    onChange={(e) => setEditScoreB(e.target.value)}
                    placeholder="0"
                  />
                </FormField>
              </div>
            )}

            <FormField label="หมายเหตุการแก้ไข (ถ้ามี — บันทึกลง Audit Log)">
              <input
                type="text"
                className="form-input"
                placeholder='เช่น "แก้ไขคะแนนเซต 1", "กรรมการบันทึกผิด"'
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
              />
            </FormField>

            {/* Walkover section */}
            <div
              style={{
                margin: '1.25rem 0',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  color: 'var(--gold-700)',
                  marginBottom: '0.35rem',
                }}
              >
                ★ ตัดสินชนะบาย (Walkover)
              </div>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-2)',
                  marginBottom: '0.75rem',
                  lineHeight: 1.4,
                }}
              >
                ใช้กรณีคู่แข่งไม่มาทำการแข่งขันตามกำหนด หรือสละสิทธิ์ ระบบจะปรับคะแนนชนะบาย จบการแข่งขัน
                และส่งทีมเข้ารอบอัตโนมัติ
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={loading || !editingMatch?.team_a_id}
                  onClick={() => handleWalkover('a')}
                  style={{
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    background: 'var(--surface)',
                  }}
                >
                  {teams.find((t) => t.id === editingMatch?.team_a_id)?.name || 'ทีม A'} ชนะบาย
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={loading || !editingMatch?.team_b_id}
                  onClick={() => handleWalkover('b')}
                  style={{
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    background: 'var(--surface)',
                  }}
                >
                  {teams.find((t) => t.id === editingMatch?.team_b_id)?.name || 'ทีม B'} ชนะบาย
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.5rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              {editingMatch.status !== 'upcoming' || editingMatch.score_a !== null ? (
                <button
                  type="button"
                  onClick={() => {
                    setMatchToReset(editingMatch);
                    setResetReason('รีเซ็ตจากหน้าต่างบันทึกผล');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{
                    color: 'var(--gold-700)',
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <RotateCcw size={12} />
                  <span>ล้างผลคู่นี้ (รีเซ็ต)</span>
                </button>
              ) : (
                <div />
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="btn btn-secondary btn-sm"
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                  {loading ? 'กำลังบันทึก...' : 'บันทึกผล'}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Edit Schedule Modal */}
      <Modal
        isOpen={!!scheduleMatch}
        onClose={() => setScheduleMatch(null)}
        title="แก้ไขตารางแข่ง (ทีม / วัน / เวลา / สนาม)"
      >
        {scheduleForm && (
          <form onSubmit={handleUpdateSchedule} style={{ padding: '0.5rem 0' }}>
            {scheduleError && (
              <p style={{ color: 'var(--danger-text)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {scheduleError}
              </p>
            )}
            {scheduleMatch?.status !== 'upcoming' && scheduleMatch?.status !== 'postponed' && (
              <p style={{ color: 'var(--accent-text)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                แมตช์นี้เริ่มหรือจบไปแล้ว — การเปลี่ยนทีมจะไม่ย้ายคะแนนหรือผลที่บันทึกไว้
              </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormField label="ทีม A">
                <select
                  className="form-select"
                  value={scheduleForm.team_a_id}
                  onChange={setScheduleField('team_a_id')}
                >
                  <option value="">-- รอผลการแข่งขัน --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="ทีม B">
                <select
                  className="form-select"
                  value={scheduleForm.team_b_id}
                  onChange={setScheduleField('team_b_id')}
                >
                  <option value="">-- รอผลการแข่งขัน --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormField label="วันที่แข่ง" required>
                <input
                  type="date"
                  className="form-input"
                  value={scheduleForm.match_date}
                  onChange={setScheduleField('match_date')}
                  required
                />
              </FormField>
              <FormField label="เวลาแข่ง" required>
                <input
                  type="time"
                  className="form-input"
                  value={scheduleForm.match_time}
                  onChange={setScheduleField('match_time')}
                  required
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <FormField label="สถานที่ / สนาม" required>
                <input
                  type="text"
                  className="form-input"
                  value={scheduleForm.venue}
                  onChange={setScheduleField('venue')}
                  required
                />
              </FormField>
              <FormField label="สนามย่อย (ถ้ามี)">
                <input
                  type="text"
                  className="form-input"
                  value={scheduleForm.court}
                  onChange={setScheduleField('court')}
                  placeholder="เช่น สนาม 1"
                />
              </FormField>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setScheduleMatch(null)}
                className="btn btn-secondary btn-sm"
              >
                ยกเลิก
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? 'กำลังบันทึก...' : 'บันทึกตาราง'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={!!matchToReset}
        onClose={() => setMatchToReset(null)}
        title="🔄 ยืนยันการรีเซ็ตผลการแข่งขัน"
      >
        {matchToReset && (
          <div style={{ padding: '0.5rem 0' }}>
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: 'var(--text)',
                  marginBottom: '0.35rem',
                }}
              >
                {sports.find((s) => s.id === matchToReset.sport_id)?.name}
                {matchToReset.round ? ` · รอบ ${matchToReset.round}` : ''}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>
                {teams.find((t) => t.id === matchToReset.team_a_id)?.name || 'รอผลการแข่งขัน'} vs{' '}
                {teams.find((t) => t.id === matchToReset.team_b_id)?.name || 'รอผลการแข่งขัน'}
              </div>
            </div>

            <ul
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-2)',
                lineHeight: 1.6,
                paddingLeft: '1.25rem',
                marginBottom: '1.25rem',
              }}
            >
              <li>
                ล้างคะแนน, รายการเซต, และสถานะกลับเป็น <strong>&quot;ยังไม่แข่ง (Upcoming)&quot;</strong>
              </li>
              <li>ล้างเวลาแข่งจริง และประวัติแต้มสดทั้งหมด</li>
              <li>
                <strong>คู่แข่งขัน วัน เวลา และสถานที่ จะยังคงอยู่ครบเหมือนเดิม 100%</strong> (แมตช์ไม่หาย)
              </li>
              {(matchToReset.next_match_id || matchToReset.loser_next_match_id) && (
                <li style={{ color: 'var(--accent-text)', fontWeight: 600 }}>
                  ดึงชื่อทีมในรอบชิงชนะเลิศ / รอบชิงอันดับ 3 กลับมาเป็น &quot;รอผลการแข่งขัน&quot;
                  ให้อัตโนมัติ
                </li>
              )}
            </ul>

            <FormField label="หมายเหตุ / เหตุผล (ไม่บังคับ)">
              <input
                type="text"
                className="form-input"
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder='เช่น "ทดสอบระบบ", "กรรมการกดผิด", "ประท้วงผล"'
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setMatchToReset(null)}
                className="btn btn-secondary btn-sm"
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleResetMatch}
                className="btn btn-primary btn-sm"
                disabled={loading}
                style={{
                  background: 'var(--gold-600)',
                  borderColor: 'var(--gold-600)',
                  color: '#000',
                  fontWeight: 700,
                }}
              >
                {loading ? 'กำลังรีเซ็ต...' : '🔄 ยืนยันรีเซ็ตผล'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!matchToDelete}
        onClose={() => setMatchToDelete(null)}
        title="⚠️ ยืนยันลบแมตช์ออกจากระบบถาวร"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '1rem',
            }}
          >
            <p
              style={{
                fontWeight: 800,
                color: 'var(--danger-text)',
                fontSize: '0.9rem',
                marginBottom: '0.4rem',
              }}
            >
              คำเตือน: นี่คือการลบคู่นี้ออกจากตารางถาวร (Hard Delete)
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
              แมตช์นี้จะ<strong>หายไปจากระบบ</strong> ทั้งหน้าตารางแข่ง ผลการแข่ง และผังสายแข่ง
            </p>
            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--gold-700)',
                fontWeight: 700,
                marginTop: '0.5rem',
                marginBottom: 0,
              }}
            >
              👉 หากท่านต้องการเพียงแค่ล้างผลคะแนน/เริ่มแข่งใหม่ กรุณากด &quot;ยกเลิก&quot; แล้วใช้ปุ่ม [🔄
              รีเซ็ตผล] แทน
            </p>
          </div>

          {matchToDelete?.match_number && (
            <p style={{ fontSize: '0.8rem', color: 'var(--accent-text)', marginBottom: '1rem' }}>
              * คู่นี้เป็นคู่แข่งขันทางการตามสูจิบัตร (คู่ที่ {matchToDelete.match_number})
              หากลบแล้วตารางสูจิบัตรจะไม่ครบ 44 คู่
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              onClick={() => setMatchToDelete(null)}
              className="btn btn-secondary btn-sm"
              disabled={loading}
            >
              ยกเลิก (ไม่ลบ)
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-primary btn-sm"
              disabled={loading}
              style={{ background: '#ef4444' }}
            >
              {loading ? 'กำลังลบถาวร...' : 'ลบแมตช์ถาวร'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
