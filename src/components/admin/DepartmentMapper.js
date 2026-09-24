'use client';
import { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Banner from '@/components/ui/Banner';
import FormField from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import { apiRequest } from '@/lib/api/client';
import { Plus, Pencil, Trash2, AlertTriangle } from '@/components/animate-ui/icons';
import DepartmentsByColor from '@/components/public/DepartmentsByColor';

export default function DepartmentMapper({ initialDepartments = [], teams = [] }) {
  const [departments, setDepartments] = useState(initialDepartments);
  const [pageError, setPageError] = useState('');
  const [name, setName] = useState('');
  const [teamId, setTeamId] = useState(teams[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Editing state
  const [editingDept, setEditingDept] = useState(null);
  const [editName, setEditName] = useState('');
  const [editTeamId, setEditTeamId] = useState('');

  // Delete state
  const [deptToDelete, setDeptToDelete] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !teamId) {
      setError('กรุณากรอกชื่อสาขาวิชาและเลือกทีมสี');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest('/api/admin/departments', {
        body: { name: name.trim(), team_id: teamId },
      });
      setDepartments((prev) => [...prev, data]);
      setName('');
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingDept) return;
    setLoading(true);
    try {
      const data = await apiRequest('/api/admin/departments', {
        method: 'PATCH',
        body: { id: editingDept.id, name: editName.trim(), team_id: editTeamId },
      });
      setDepartments((prev) => prev.map((d) => (d.id === editingDept.id ? data : d)));
      setEditingDept(null);
    } catch (err) {
      setPageError(err.message || 'แก้ไขไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deptToDelete) return;
    setLoading(true);
    try {
      await apiRequest(`/api/admin/departments?id=${deptToDelete.id}`, { method: 'DELETE' });
      setDepartments((prev) => prev.filter((d) => d.id !== deptToDelete.id));
      setDeptToDelete(null);
    } catch (err) {
      setPageError(
        err.status === 409
          ? 'ไม่สามารถลบสาขานี้ได้ เนื่องจากมีนักศึกษาลงทะเบียนในสาขานี้แล้ว'
          : err.message || 'ลบไม่สำเร็จ'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Banner kind="error" onClose={() => setPageError('')}>
        {pageError}
      </Banner>
      {/* Add Department Form */}
      <GlassCard style={{ padding: '1.5rem 2rem', marginBottom: '2rem' }}>
        <h3
          style={{
            fontSize: '1.2rem',
            marginBottom: '1rem',
            color: 'var(--gold-600)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <Plus size={18} />
          <span>เพิ่มสาขาวิชาและจับคู่สี</span>
        </h3>
        <form
          onSubmit={handleAdd}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}
        >
          <div style={{ flex: 2, minWidth: '220px' }}>
            <FormField label="ชื่อสาขาวิชา" required>
              <input
                id="dept_name"
                type="text"
                className="form-input"
                placeholder="เช่น วิทยาการคอมพิวเตอร์"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </FormField>
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <FormField label="สังกัดทีมสี" required>
              <select
                className="form-select"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginBottom: '1.25rem', padding: '0.65rem 1.25rem' }}
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึกสาขา'}
          </button>
        </form>
        {error && (
          <p
            style={{
              color: 'var(--danger-text)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginTop: '0.5rem',
            }}
          >
            <AlertTriangle size={15} />
            <span>{error}</span>
          </p>
        )}
      </GlassCard>

      {/* Departments grouped by colour — who is in which team at a glance */}
      <DepartmentsByColor
        teams={teams}
        departments={departments}
        renderActions={(dept) => (
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              aria-label={`แก้ไข ${dept.name}`}
              title="แก้ชื่อ / ย้ายสี"
              style={{ minWidth: 36, minHeight: 36, padding: '0.25rem 0.5rem' }}
              onClick={() => {
                setEditingDept(dept);
                setEditName(dept.name);
                setEditTeamId(dept.team_id);
              }}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              aria-label={`ลบ ${dept.name}`}
              title="ลบ"
              style={{ minWidth: 36, minHeight: 36, padding: '0.25rem 0.5rem', color: 'var(--danger-text)' }}
              onClick={() => setDeptToDelete(dept)}
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
        renderFooter={(team) =>
          team.id && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '0.65rem', width: '100%', minHeight: 40 }}
              onClick={() => {
                setTeamId(team.id);
                document.getElementById('dept_name')?.focus();
              }}
            >
              <Plus size={14} /> เพิ่มสาขาใน{team.name}
            </button>
          )
        }
      />

      {/* Edit Modal */}
      <Modal isOpen={!!editingDept} onClose={() => setEditingDept(null)} title="แก้ไขการจับคู่สาขาวิชา">
        <form onSubmit={handleUpdate} style={{ padding: '0.5rem 0' }}>
          <FormField label="ชื่อสาขาวิชา" required>
            <input
              type="text"
              className="form-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="สังกัดทีมสี" required>
            <select
              className="form-select"
              value={editTeamId}
              onChange={(e) => setEditTeamId(e.target.value)}
              required
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </FormField>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={() => setEditingDept(null)} className="btn btn-secondary btn-sm">
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deptToDelete} onClose={() => setDeptToDelete(null)} title="ยืนยันการลบสาขาวิชา">
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            คุณต้องการลบสาขา <strong>{deptToDelete?.name}</strong> ออกจากระบบใช่หรือไม่?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              onClick={() => setDeptToDelete(null)}
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
