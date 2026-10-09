'use client';
import { useMemo, useState } from 'react';
import { apiRequest } from '@/lib/api/client';
import { schedulePatch } from '@/lib/schedule-patch';
import { EVENT_START_DATE } from '@/lib/format';
import { toast } from '@/lib/toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import {
  applyResetToList,
  buildEditSets,
  setScoreOverride,
  mergeEditedSets,
  statusSteps,
  toInputValue,
} from '@/lib/match-editor';

/**
 * State + API calls for the admin match editor. Every write goes through the
 * API (/api/admin/matches or /api/match/[id]/<action>) so it is audited and,
 * for scores, produces a score_event. The components in this folder only render.
 */
export function useMatchEditor({ initialMatches = [], sports = [], teams = [] }) {
  const [matches, setMatches] = useState(initialMatches);
  const [confirm, confirmDialog] = useConfirm();
  const [pageError, setPageError] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  // Add Match Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(() => ({
    sport_id: sports[0]?.id || '',
    team_a_id: teams[0]?.id || '',
    team_b_id: teams[1]?.id || '',
    match_date: EVENT_START_DATE,
    match_time: '10:00',
    venue: 'โรงยิมเนเซียม 1',
    court: '',
  }));
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

  const sportById = useMemo(() => new Map(sports.map((s) => [s.id, s])), [sports]);
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const teamName = (id, fallback) => teamById.get(id)?.name || fallback;
  /** "ฟุตซอล · สีฟ้า vs สีแดง" — table rows look alike, so confirm dialogs name the match */
  const matchLabel = (m) =>
    `${sportById.get(m.sport_id)?.name || 'กีฬา'} · ${teamName(m.team_a_id, 'รอผล')} vs ${teamName(m.team_b_id, 'รอผล')}`;

  const filteredMatches = matches.filter((m) => {
    const sportMatch = selectedSport === 'all' || m.sport_id === selectedSport;
    const statusMatch = selectedStatus === 'all' || m.status === selectedStatus;
    return sportMatch && statusMatch;
  });

  /** shared failure path: banner (or a modal's own error line) + toast */
  const fail = (err, fallback, showError = setPageError) => {
    const msg = err.message || fallback;
    showError(msg);
    toast.error(msg);
  };

  const setAddField = (key) => (e) => setAddForm((f) => ({ ...f, [key]: e.target.value }));

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    setFormError('');

    if (addForm.team_a_id && addForm.team_b_id && addForm.team_a_id === addForm.team_b_id) {
      setFormError('ทีมที่แข่งขันต้องไม่เป็นทีมเดียวกัน');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest('/api/admin/matches', {
        body: {
          sport_id: addForm.sport_id,
          team_a_id: addForm.team_a_id || null,
          team_b_id: addForm.team_b_id || null,
          match_date: addForm.match_date,
          match_time: addForm.match_time + ':00',
          venue: addForm.venue.trim(),
          court: addForm.court.trim() || null,
        },
      });
      setMatches((prev) => [data, ...prev]);
      setShowAddModal(false);
      toast.success('สร้างแมตช์แข่งขันใหม่เรียบร้อย');
    } catch (err) {
      fail(err, 'เกิดข้อผิดพลาดในการเชื่อมต่อ', setFormError);
    } finally {
      setLoading(false);
    }
  };

  const openEditScore = (m) => {
    setEditingMatch(m);
    setEditScoreA(toInputValue(m.score_a));
    setEditScoreB(toInputValue(m.score_b));
    setEditStatus(m.status);
    setEditReason('');
    setEditSets(buildEditSets(m, sportById.get(m.sport_id)));
  };

  const setEditSetScore = (idx, side, value) =>
    setEditSets((prev) => prev.map((item, i) => (i === idx ? { ...item, [side]: value } : item)));
  const addEditSet = () =>
    setEditSets((prev) => [...prev, { set_number: prev.length + 1, score_a: '', score_b: '' }]);

  const openReset = (m, reason = '') => {
    setPageError('');
    setMatchToReset(m);
    setResetReason(reason);
  };

  const handleUpdateScore = async (e) => {
    e.preventDefault();
    if (!editingMatch) return;
    setLoading(true);

    const isSetSport = sportById.get(editingMatch.sport_id)?.scoring_type === 'sets';

    try {
      // If user selected upcoming while match was live or finished, prompt reset
      if (editStatus === 'upcoming' && editingMatch.status !== 'upcoming') {
        openReset(editingMatch, editReason || 'เปลี่ยนสถานะกลับเป็นยังไม่แข่ง');
        setEditingMatch(null);
        setLoading(false);
        return;
      }

      let row = editingMatch;
      let scoreA = editScoreA === '' ? null : parseInt(editScoreA, 10);
      let scoreB = editScoreB === '' ? null : parseInt(editScoreB, 10);
      let setsA = null;
      let setsB = null;
      let filledSets = [];

      if (isSetSport) {
        ({ filled: filledSets, setsA, setsB, scoreA, scoreB } = setScoreOverride(editSets, row));
      }

      const scoreChanged = isSetSport
        ? setsA !== (row.sets_a ?? 0) || setsB !== (row.sets_b ?? 0)
        : scoreA !== (row.score_a ?? null) || scoreB !== (row.score_b ?? null);

      const steps = statusSteps(row.status, editStatus);
      if (steps.before) {
        row = await apiRequest(`/api/match/${row.id}/${steps.before}`);
      }
      if (scoreChanged || (isSetSport && filledSets.length > 0)) {
        row = await apiRequest(`/api/match/${row.id}/override`, {
          body: {
            score_a: scoreA ?? 0,
            score_b: scoreB ?? 0,
            sets_a: setsA,
            sets_b: setsB,
            sets: isSetSport ? filledSets : undefined,
            reason: editReason || undefined,
          },
        });
      }
      if (steps.after === 'finish') {
        row = await apiRequest(`/api/match/${row.id}/finish`);
      } else if (steps.after === 'patch') {
        row = await apiRequest('/api/admin/matches', {
          method: 'PATCH',
          body: { id: row.id, status: editStatus },
        });
      }

      const savedSets = isSetSport && filledSets.length > 0;
      setMatches((prev) =>
        prev.map((m) =>
          m.id === editingMatch.id
            ? { ...m, ...row, ...(savedSets && { match_sets: mergeEditedSets(m.match_sets, filledSets) }) }
            : m
        )
      );
      setEditingMatch(null);
      toast.success('อัปเดตผลการแข่งขันเรียบร้อย');
    } catch (err) {
      fail(err, 'เกิดข้อผิดพลาดในการอัปเดต');
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
      setMatches((prev) => applyResetToList(prev, matchToReset, res));
      setMatchToReset(null);
      setResetReason('');
      setPageError('');
      // reset can be opened on top of the score modal — close that too
      if (editingMatch?.id === matchToReset.id) setEditingMatch(null);
      toast.success('รีเซ็ตผลการแข่งขันเรียบร้อย (ล้างคะแนนกลับเป็นยังไม่แข่ง)');
    } catch (err) {
      fail(err, 'รีเซ็ตผลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  /** confirm, then POST /api/match/[id]/<action> and merge `patch` into the row */
  const runRowAction = async (m, { title, detail, confirmLabel, action, patch, success, failure }) => {
    if (!(await confirm({ title, message: `${matchLabel(m)}\n\n${detail}`, confirmLabel }))) return;
    setLoading(true);
    setPageError('');
    try {
      const res = await apiRequest(`/api/match/${m.id}/${action}`, { method: 'POST' });
      setMatches((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...res, ...patch } : x)));
      toast.success(success);
    } catch (err) {
      fail(err, failure);
    } finally {
      setLoading(false);
    }
  };

  const handleReopenMatch = (m) =>
    runRowAction(m, {
      title: 'ยืนยันเปิดให้แข่งขันต่อสำหรับคู่นี้?',
      detail: 'สถานะจะเปลี่ยนกลับเป็น "กำลังแข่งขัน" (Live) เพื่อให้กรรมการสนามสามารถบันทึกคะแนนต่อได้',
      confirmLabel: 'เปิดแข่งต่อ',
      action: 'reopen',
      patch: { status: 'live', is_walkover: false },
      success: 'เปิดให้แข่งขันต่อเรียบร้อย (Live)',
      failure: 'เปิดแข่งขันต่อไม่สำเร็จ',
    });

  const handleStartMatch = (m) =>
    runRowAction(m, {
      title: 'ยืนยันเริ่มการแข่งขันคู่นี้?',
      detail: 'สถานะจะเปลี่ยนเป็น "กำลังแข่งขัน (Live)" เพื่อเปิดให้เริ่มลงคะแนนสดได้ทันที',
      confirmLabel: 'เริ่มแข่ง',
      action: 'start',
      patch: { status: 'live' },
      success: 'เริ่มการแข่งขันแล้ว (Live)',
      failure: 'เริ่มการแข่งขันไม่สำเร็จ',
    });

  const handleWalkover = async (winner) => {
    if (!editingMatch) return;
    const name =
      winner === 'a' ? teamName(editingMatch.team_a_id, 'ทีม A') : teamName(editingMatch.team_b_id, 'ทีม B');

    if (
      !(await confirm({
        title: `ยืนยันตัดสินให้ "${name}" ชนะบาย?`,
        message: `${matchLabel(editingMatch)}\n\nระบบจะปรับคะแนนชนะบาย จบการแข่งขัน และส่งผลต่อสายการแข่งขันทันที`,
        confirmLabel: 'ยืนยันชนะบาย',
        danger: true,
      }))
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
      toast.success('ตัดสินชนะบายเรียบร้อย');
    } catch (err) {
      fail(err, 'เกิดข้อผิดพลาดในการตัดสินชนะบาย');
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
      toast.success('อัปเดตกำหนดการแข่งขันเรียบร้อย');
    } catch (err) {
      fail(err, 'บันทึกไม่สำเร็จ', setScheduleError);
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
      toast.success('ลบแมตช์แข่งขันเรียบร้อย');
    } catch (err) {
      fail(err, 'ลบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return {
    sports,
    teams,
    confirmDialog,
    sportById,
    teamById,
    teamName,
    loading,
    pageError,
    setPageError,
    filters: { selectedSport, setSelectedSport, selectedStatus, setSelectedStatus },
    filteredMatches,
    row: {
      onEditScore: openEditScore,
      onEditSchedule: openSchedule,
      onReset: (m) => openReset(m),
      onStart: handleStartMatch,
      onReopen: handleReopenMatch,
      onDelete: setMatchToDelete,
    },
    add: {
      isOpen: showAddModal,
      open: () => setShowAddModal(true),
      close: () => setShowAddModal(false),
      form: addForm,
      setField: setAddField,
      error: formError,
      submit: handleCreateMatch,
    },
    score: {
      match: editingMatch,
      close: () => setEditingMatch(null),
      status: editStatus,
      setStatus: setEditStatus,
      scoreA: editScoreA,
      setScoreA: setEditScoreA,
      scoreB: editScoreB,
      setScoreB: setEditScoreB,
      sets: editSets,
      setSetScore: setEditSetScore,
      addSet: addEditSet,
      reason: editReason,
      setReason: setEditReason,
      submit: handleUpdateScore,
      walkover: handleWalkover,
      openReset: () => openReset(editingMatch, 'รีเซ็ตจากหน้าต่างบันทึกผล'),
    },
    schedule: {
      match: scheduleMatch,
      form: scheduleForm,
      setField: setScheduleField,
      error: scheduleError,
      close: () => setScheduleMatch(null),
      submit: handleUpdateSchedule,
    },
    reset: {
      match: matchToReset,
      reason: resetReason,
      setReason: setResetReason,
      close: () => setMatchToReset(null),
      confirm: handleResetMatch,
    },
    remove: {
      match: matchToDelete,
      close: () => setMatchToDelete(null),
      confirm: handleDelete,
    },
  };
}
