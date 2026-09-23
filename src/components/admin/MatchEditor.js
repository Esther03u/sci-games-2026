'use client';
import { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Banner from '@/components/ui/Banner';
import TeamBadge from '@/components/ui/TeamBadge';
import StatusBadge from '@/components/ui/StatusBadge';
import FormField from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import { apiRequest } from '@/lib/api/client';
import { formatDate, EVENT_START_DATE } from '@/lib/format';
import { Plus, Calendar, MapPin, Pencil, Trash2, AlertTriangle } from '@/components/animate-ui/icons';

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
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit Score/Status State
  const [editingMatch, setEditingMatch] = useState(null);
  const [editScoreA, setEditScoreA] = useState('');
  const [editScoreB, setEditScoreB] = useState('');
  const [editStatus, setEditStatus] = useState('upcoming');
  const [matchToDelete, setMatchToDelete] = useState(null);

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

  // Score and status edits go through the scoring API so every change is a
  // score_event (audited, undoable) and points/brackets stay consistent:
  //   scores      → /api/match/[id]/override
  //   → live      → /api/match/[id]/start
  //   → finished  → /api/match/[id]/finish
  //   → upcoming / postponed → schedule PATCH (no score semantics)
  const handleUpdateScore = async (e) => {
    e.preventDefault();
    if (!editingMatch) return;
    setLoading(true);

    const scoreA = editScoreA === '' ? null : parseInt(editScoreA, 10);
    const scoreB = editScoreB === '' ? null : parseInt(editScoreB, 10);

    try {
      let row = editingMatch;
      const scoreChanged = scoreA !== (row.score_a ?? null) || scoreB !== (row.score_b ?? null);

      if (editStatus === 'live' && row.status !== 'live') {
        row = await apiRequest(`/api/match/${row.id}/start`);
      }
      if (scoreChanged) {
        row = await apiRequest(`/api/match/${row.id}/override`, {
          body: { score_a: scoreA ?? 0, score_b: scoreB ?? 0 },
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

      setMatches((prev) => prev.map((m) => (m.id === editingMatch.id ? row : m)));
      setEditingMatch(null);
    } catch (err) {
      setPageError(err.message || 'เกิดข้อผิดพลาดในการอัปเดต');
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
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>ชนิดกีฬา</th>
              <th>คู่แข่งขัน</th>
              <th style={{ textAlign: 'center' }}>ผลคะแนน</th>
              <th>สถานะ</th>
              <th>วัน / เวลา / สนาม</th>
              <th style={{ width: '160px', textAlign: 'center' }}>การดำเนินการ</th>
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

                return (
                  <tr key={m.id}>
                    <td>
                      <strong style={{ color: 'var(--text)' }}>{sport?.name}</strong>
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
                    <td
                      style={{
                        textAlign: 'center',
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1.2rem',
                        fontWeight: 800,
                      }}
                    >
                      {m.status === 'upcoming' ? '-' : `${m.score_a ?? 0} - ${m.score_b ?? 0}`}
                    </td>
                    <td>
                      <StatusBadge status={m.status} />
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
                        <span>{m.venue}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => {
                            setEditingMatch(m);
                            setEditScoreA(
                              m.score_a !== null && m.score_a !== undefined ? String(m.score_a) : ''
                            );
                            setEditScoreB(
                              m.score_b !== null && m.score_b !== undefined ? String(m.score_b) : ''
                            );
                            setEditStatus(m.status);
                          }}
                          className="btn btn-primary btn-sm"
                          style={{
                            padding: '0.25rem 0.6rem',
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
                          onClick={() => setMatchToDelete(m)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: '0.25rem 0.6rem',
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
              <select
                className="form-select"
                value={teamAId}
                onChange={(e) => setTeamAId(e.target.value)}
              >
                <option value="">-- รอผลการแข่งขัน (ยังไม่ระบุ) --</option>
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
                value={teamBId}
                onChange={(e) => setTeamBId(e.target.value)}
              >
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

          <FormField label="สถานที่ / สนาม" required>
            <input
              type="text"
              className="form-input"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              required
            />
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary btn-sm">
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'สร้างแมตช์'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Score & Status Modal */}
      <Modal isOpen={!!editingMatch} onClose={() => setEditingMatch(null)} title="บันทึกผลคะแนนและสถานะแมตช์">
        <form onSubmit={handleUpdateScore} style={{ padding: '0.5rem 0' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1rem 0' }}>
            <FormField
              label={`คะแนน: ${teams.find((t) => t.id === editingMatch?.team_a_id)?.name || 'ทีม A'}`}
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
              label={`คะแนน: ${teams.find((t) => t.id === editingMatch?.team_b_id)?.name || 'ทีม B'}`}
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

          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '1.5rem' }}>
            * หากเลือกสถานะเป็น &quot;จบการแข่งขัน&quot; ระบบจะคำนวณแต้มสะสม (ชนะ 3, เสมอ 1, แพ้ 0)
            ให้โดยอัตโนมัติ
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={() => setEditingMatch(null)} className="btn btn-secondary btn-sm">
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'บันทึกผล'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!matchToDelete}
        onClose={() => setMatchToDelete(null)}
        title="ยืนยันการลบแมตช์การแข่งขัน"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ color: 'var(--text)', marginBottom: '1.25rem' }}>
            คุณต้องการลบแมตช์นี้ออกจากระบบหรือไม่?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              onClick={() => setMatchToDelete(null)}
              className="btn btn-secondary btn-sm"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-primary btn-sm"
              disabled={loading}
              style={{ background: '#ef4444' }}
            >
              {loading ? 'กำลังลบ...' : 'ยืนยันลบ'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
