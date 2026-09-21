'use client';
import { useState, useMemo } from 'react';
import DataTable from '@/components/ui/DataTable';
import TeamBadge from '@/components/ui/TeamBadge';
import Modal from '@/components/ui/Modal';
import GlassCard from '@/components/ui/GlassCard';
import Banner from '@/components/ui/Banner';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/format';
import { useAuth } from '@/hooks/useAuth';
import { Search, FileText, Trash2, AlertTriangle } from '@/components/animate-ui/icons';

export default function AthleteManager({ initialAthletes = [], teams = [], sports = [] }) {
  const [athletes, setAthletes] = useState(initialAthletes);
  const [pageError, setPageError] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [athleteToDelete, setAthleteToDelete] = useState(null);
  const [athleteToCancel, setAthleteToCancel] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const { adminUser } = useAuth();

  const filtered = useMemo(() => {
    return athletes.filter((a) => {
      const teamMatch = selectedTeam === 'all' || a.teams?.name === selectedTeam;
      const q = search.toLowerCase().trim();
      const textMatch =
        !q ||
        a.full_name?.toLowerCase().includes(q) ||
        a.student_id?.toLowerCase().includes(q) ||
        a.departments?.name?.toLowerCase().includes(q);
      return teamMatch && textMatch;
    });
  }, [athletes, selectedTeam, search]);

  const handleDelete = async () => {
    if (!athleteToDelete) return;
    setProcessing(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('athletes')
        .delete()
        .eq('id', athleteToDelete.id);

      if (!error) {
        setAthletes((prev) => prev.filter((a) => a.id !== athleteToDelete.id));
        setAthleteToDelete(null);
      } else {
        setPageError('เกิดข้อผิดพลาดในการลบ: ' + error.message);
      }
    } catch (err) {
      setPageError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelRegistration = async (registrationId) => {
    setProcessing(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('registrations')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: adminUser?.id,
        })
        .eq('id', registrationId);

      if (!error) {
        setAthletes((prev) =>
          prev.map((a) => ({
            ...a,
            registrations: a.registrations?.map((r) =>
              r.id === registrationId ? { ...r, status: 'cancelled' } : r
            ),
          }))
        );
        if (selectedAthlete) {
          setSelectedAthlete((prev) => ({
            ...prev,
            registrations: prev.registrations?.map((r) =>
              r.id === registrationId ? { ...r, status: 'cancelled' } : r
            ),
          }));
        }
      } else {
        setPageError('เกิดข้อผิดพลาด: ' + error.message);
      }
    } catch (err) {
      setPageError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      key: 'student_id',
      label: 'รหัสนักศึกษา',
      render: (val) => <span style={{ fontFamily: 'monospace', color: 'var(--gold-700)' }}>{val}</span>,
    },
    {
      key: 'full_name',
      label: 'ชื่อ - นามสกุล',
      render: (val) => <strong style={{ color: 'var(--mono-900)' }}>{val}</strong>,
    },
    {
      key: 'department',
      label: 'สาขาวิชา',
      render: (_, row) => row.departments?.name || '-',
    },
    {
      key: 'team',
      label: 'สังกัดสี',
      render: (_, row) => (
        <TeamBadge
          name={row.teams?.name}
          colorHex={row.teams?.color_hex}
          emoji={row.teams?.logo_emoji}
          size="sm"
        />
      ),
    },
    {
      key: 'phone',
      label: 'เบอร์โทร',
      render: (val) => (
        <span style={{ fontSize: '0.85rem', color: 'var(--mono-700)' }}>
          {val || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'การดำเนินการ',
      sortable: false,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setSelectedAthlete(row)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <FileText size={13} /> รายละเอียด
          </button>
          <button
            onClick={() => setAthleteToDelete(row)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', color: 'var(--danger-text)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <Trash2 size={13} /> ลบ
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Banner kind="error" onClose={() => setPageError('')}>{pageError}</Banner>
      {/* Search & Team Filter Bar */}
      <GlassCard
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--mono-400)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="form-input"
              placeholder="ค้นหาชื่อ / รหัสนักศึกษา / สาขา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '260px', paddingLeft: '2.2rem' }}
            />
          </div>
          <select
            className="form-select"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">ทุกสี ({athletes.length} คน)</option>
            {teams.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ color: 'var(--mono-700)', fontSize: '0.9rem' }}>
          แสดง <strong style={{ color: 'var(--gold-600)' }}>{filtered.length}</strong> คน
        </div>
      </GlassCard>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="ไม่พบข้อมูลนักกีฬา"
      />

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedAthlete}
        onClose={() => setSelectedAthlete(null)}
        title="ข้อมูลนักกีฬา"
      >
        {selectedAthlete && (
          <div style={{ padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '1.25rem', color: 'var(--mono-900)', marginBottom: '0.25rem' }}>
                  {selectedAthlete.full_name}
                </h4>
                <p style={{ color: 'var(--mono-700)', fontSize: '0.9rem' }}>
                  รหัสนักศึกษา: {selectedAthlete.student_id}
                </p>
                <p style={{ color: 'var(--mono-700)', fontSize: '0.9rem' }}>
                  สาขาวิชา: {selectedAthlete.departments?.name}
                </p>
                <p style={{ color: 'var(--mono-700)', fontSize: '0.9rem' }}>
                  เบอร์โทร: <strong>{selectedAthlete.phone}</strong>
                </p>
              </div>
              <TeamBadge
                name={selectedAthlete.teams?.name}
                colorHex={selectedAthlete.teams?.color_hex}
                emoji={selectedAthlete.teams?.logo_emoji}
                size="md"
              />
            </div>

            <div style={{ borderTop: '1px solid var(--mono-200)', paddingTop: '1rem' }}>
              <h5 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--gold-600)' }}>
                รายการกีฬาที่สมัคร:
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedAthlete.registrations?.map((reg) => (
                  <div
                    key={reg.id}
                    className="flex-between"
                    style={{
                      background: 'var(--mono-100)',
                      padding: '0.65rem 0.9rem',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--mono-900)' }}>
                        {reg.sports?.name}
                      </span>
                      <span
                        className="badge"
                        style={{
                          marginLeft: '0.5rem',
                          background: reg.status === 'registered' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: reg.status === 'registered' ? 'var(--success-text)' : 'var(--danger-text)',
                          fontSize: '0.75rem',
                        }}
                      >
                        {reg.status === 'registered' ? 'สมัครแล้ว' : 'ยกเลิก'}
                      </span>
                    </div>

                    {reg.status === 'registered' && (
                      <button
                        onClick={() => handleCancelRegistration(reg.id)}
                        disabled={processing}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', color: 'var(--danger-text)' }}
                      >
                        ยกเลิกการสมัคร
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!athleteToDelete}
        onClose={() => setAthleteToDelete(null)}
        title="ยืนยันการลบนักกีฬา"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--mono-900)', lineHeight: 1.6 }}>
            คุณต้องการลบข้อมูลของ <strong>{athleteToDelete?.full_name}</strong> (รหัส {athleteToDelete?.student_id}) ออกจากระบบหรือไม่?
            <br />
            <span style={{ color: 'var(--danger-text)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertTriangle size={14} /> การกระทำนี้จะลบการลงทะเบียนกีฬาทั้งหมดของนักศึกษาผู้นี้ด้วย
            </span>
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setAthleteToDelete(null)}
              className="btn btn-secondary btn-sm"
              disabled={processing}
            >
              ยกเลิก
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-primary btn-sm"
              disabled={processing}
              style={{ background: '#ef4444' }}
            >
              {processing ? 'กำลังลบ...' : 'ยืนยันลบ'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
