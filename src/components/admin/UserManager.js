'use client';
import { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Banner from '@/components/ui/Banner';
import FormField from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import { apiRequest } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Shield, Pencil, Trash2, AlertTriangle } from '@/components/animate-ui/icons';

export default function UserManager({ initialUsers = [], sports = [] }) {
  const [users, setUsers] = useState(initialUsers);
  const [pageError, setPageError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('staff');
  const [selectedSports, setSelectedSports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userToDelete, setUserToDelete] = useState(null);
  const { user: currentAuthUser } = useAuth();

  const handleSportToggle = (sportId) => {
    if (selectedSports.includes(sportId)) {
      setSelectedSports(selectedSports.filter((id) => id !== sportId));
    } else {
      setSelectedSports([...selectedSports, sportId]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password || !displayName.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    setLoading(true);
    try {
      const created = await apiRequest('/api/admin/users', {
        body: {
          email: email.trim(),
          password,
          display_name: displayName.trim(),
          role,
          assigned_sport_ids: role === 'staff' ? selectedSports : [],
        },
      });
      setUsers((prev) => [created, ...prev]);
      setShowAddModal(false);
      setEmail('');
      setPassword('');
      setDisplayName('');
      setSelectedSports([]);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    setLoading(true);
    try {
      await apiRequest(`/api/admin/users?id=${userToDelete.id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (err) {
      setPageError(err.message || 'ไม่สามารถลบผู้ใช้งานได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Banner kind="error" onClose={() => setPageError('')}>
        {pageError}
      </Banner>
      <GlassCard
        style={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem',
        }}
      >
        <span className="um-count">
          ผู้ใช้งานในระบบทั้งหมด: <strong className="um-count-num">{users.length}</strong> คน
        </span>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary btn-sm"
          style={{ padding: '0.6rem 1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={16} /> เพิ่มผู้ใช้งานใหม่
        </button>
      </GlassCard>

      {/* Users Table */}
      <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table className="data-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>ชื่อที่แสดง</th>
              <th>สิทธิ์การใช้งาน</th>
              <th>กีฬาที่ได้รับมอบหมาย (Staff)</th>
              <th style={{ width: '120px', textAlign: 'center' }}>การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = currentAuthUser?.id === u.auth_user_id;
              return (
                <tr key={u.id}>
                  <td>
                    <strong className="um-strong">{u.display_name}</strong>
                    {isSelf && <span className="um-you">(คุณ)</span>}
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background:
                          u.role === 'super_admin' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(59, 130, 246, 0.25)',
                        color: u.role === 'super_admin' ? 'var(--gold-600)' : '#60a5fa',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {u.role === 'super_admin' ? (
                        <>
                          <Shield size={13} /> Super Admin
                        </>
                      ) : (
                        <>
                          <Pencil size={13} /> Staff บันทึกคะแนน
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    {u.role === 'super_admin' ? (
                      <span className="um-all">ทุกชนิดกีฬา (สิทธิ์เต็ม)</span>
                    ) : u.staff_sport_assignments?.length ? (
                      <div className="um-sports">
                        {u.staff_sport_assignments.map((a, i) => (
                          <span
                            key={i}
                            className="badge"
                            style={{ background: 'var(--surface-2)', fontSize: '0.75rem' }}
                          >
                            {a.sports?.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="um-none">ยังไม่ระบุ</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {!isSelf && (
                      <button
                        onClick={() => setUserToDelete(u)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          color: 'var(--danger-text)',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <Trash2 size={13} /> ลบ
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="เพิ่มบัญชีผู้ใช้งานระบบ">
        <form onSubmit={handleCreate} className="um-modal-body">
          {error && (
            <p className="um-error">
              <AlertTriangle size={14} /> {error}
            </p>
          )}

          <FormField label="ชื่อ - นามสกุล ผู้ใช้งาน" required>
            <input
              type="text"
              className="form-input"
              placeholder="เช่น นายเอกชัย ใจซื่อ"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="อีเมลสำหรับเข้าสู่ระบบ" required>
            <input
              type="email"
              className="form-input"
              placeholder="staff@sci-games.pkru.ac.th"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>

          <FormField label="รหัสผ่านเริ่มต้น" required>
            <input
              type="password"
              className="form-input"
              placeholder="อย่างน้อย 6 ตัวอักษร"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </FormField>

          <FormField label="ระดับสิทธิ์การใช้งาน" required>
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)} required>
              <option value="staff">Staff (เจ้าหน้าที่ลงคะแนนในสนาม)</option>
              <option value="super_admin">Super Admin (ผู้ดูแลระบบสูงสุด)</option>
            </select>
          </FormField>

          {role === 'staff' && (
            <div className="um-field">
              <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                มอบหมายชนิดกีฬาที่บันทึกคะแนนได้:
              </label>
              <div className="um-sport-grid">
                {sports.map((s) => (
                  <label key={s.id} className="form-checkbox" style={{ fontSize: '0.88rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedSports.includes(s.id)}
                      onChange={() => handleSportToggle(s.id)}
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="um-modal-actions">
            <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary btn-sm">
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'กำลังสร้าง...' : 'สร้างบัญชี'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} title="ยืนยันการลบบัญชีผู้ใช้">
        <div className="um-modal-body">
          <p className="um-confirm-text">
            คุณต้องการลบบัญชี <strong>{userToDelete?.display_name}</strong> ออกจากระบบใช่หรือไม่?
          </p>
          <div className="um-confirm-actions">
            <button
              onClick={() => setUserToDelete(null)}
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
