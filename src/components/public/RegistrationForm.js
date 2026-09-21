'use client';
import { useState, useEffect } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import TeamBadge from '@/components/ui/TeamBadge';
import FormField from '@/components/ui/FormField';
import Modal from '@/components/ui/Modal';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { BadgeCheck, AlertTriangle, Send, Search, Home } from '@/components/animate-ui/icons';

export default function RegistrationForm() {
  const [departments, setDepartments] = useState([]);
  const [sports, setSports] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedSports, setSelectedSports] = useState([]);
  const [pdpaConsent, setPdpaConsent] = useState(false);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();
        if (!supabase) return;

        const [deptRes, sportsRes] = await Promise.all([
          supabase.from('departments').select('id, name, team_id, teams(name, color_hex, logo_emoji)').order('name'),
          supabase.from('sports').select('*').order('sort_order'),
        ]);

        if (deptRes.data) setDepartments(deptRes.data);
        if (sportsRes.data) setSports(sportsRes.data);
      } catch (err) {
        console.error('Failed to load departments or sports:', err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, []);

  const selectedDept = departments.find((d) => d.id === departmentId);
  const selectedTeam = selectedDept?.teams;

  const handleSportToggle = (sportId) => {
    if (selectedSports.includes(sportId)) {
      setSelectedSports(selectedSports.filter((id) => id !== sportId));
    } else {
      if (selectedSports.length >= 2) {
        setFormError('สามารถเลือกสมัครกีฬาได้ไม่เกิน 2 รายการ');
        return;
      }
      setFormError('');
      setSelectedSports([...selectedSports, sportId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!studentId.trim()) {
      setFormError('กรุณากรอกรหัสนักศึกษา');
      return;
    }
    if (!fullName.trim()) {
      setFormError('กรุณากรอกชื่อและนามสกุล');
      return;
    }
    if (!departmentId) {
      setFormError('กรุณาเลือกสาขาวิชา');
      return;
    }
    if (!phone.trim()) {
      setFormError('กรุณากรอกเบอร์โทรศัพท์สำหรับติดต่อ');
      return;
    }
    if (selectedSports.length === 0) {
      setFormError('กรุณาเลือกชนิดกีฬาที่ต้องการสมัครอย่างน้อย 1 รายการ');
      return;
    }
    if (selectedSports.length > 2) {
      setFormError('เลือกสมัครกีฬาได้ไม่เกิน 2 รายการ');
      return;
    }
    if (!pdpaConsent) {
      setFormError('กรุณายินยอมให้จัดเก็บข้อมูลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId.trim(),
          full_name: fullName.trim(),
          department_id: departmentId,
          sport_ids: selectedSports,
          phone: phone.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setFormError(json.message || 'การลงทะเบียนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      } else {
        setSuccessData(json.data);
      }
    } catch (err) {
      setFormError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <GlassCard style={{ padding: '2rem 2.5rem' }}>
        <form onSubmit={handleSubmit}>
          {formError && (
            <div
              style={{
                background: '#fee2e2',
                border: '1px solid #fca5a5',
                color: 'var(--danger-text)',
                padding: '0.85rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
                fontSize: '0.92rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} style={{ color: 'var(--danger-text)', flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            </div>
          )}

          {/* 1. Student ID */}
          <FormField label="รหัสนักศึกษา" required id="student_id">
            <input
              id="student_id"
              type="text"
              className="form-input"
              placeholder="ตัวอย่าง 66-1234-12345"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            />
          </FormField>

          {/* 2. Full Name */}
          <FormField label="ชื่อ - นามสกุล" required id="full_name">
            <input
              id="full_name"
              type="text"
              className="form-input"
              placeholder="นายสมชาย ใจดี"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </FormField>

          {/* 3. Department */}
          <FormField label="สาขาวิชา" required id="department">
            <select
              id="department"
              className="form-select"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
            >
              <option value="">-- เลือกสาขาวิชาของคุณ --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Live Team Color Preview */}
            {selectedTeam && (
              <div
                style={{
                  marginTop: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                }}
              >
                <span style={{ color: 'var(--text-2)' }}>สังกัดทีมสี:</span>
                <TeamBadge
                  name={selectedTeam.name}
                  colorHex={selectedTeam.color_hex}
                  emoji={selectedTeam.logo_emoji}
                  size="sm"
                />
              </div>
            )}
          </FormField>

          {/* 4. Phone */}
          <FormField label="เบอร์โทรศัพท์ติดต่อ" required id="phone">
            <input
              id="phone"
              type="tel"
              className="form-input"
              placeholder="0812345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '4px', display: 'block' }}>
              * ข้อมูลเบอร์โทรจะถูกเก็บเป็นความลับสำหรับสโมสรติดต่อเท่านั้น และไม่แสดงต่อสาธารณะ
            </span>
          </FormField>

          {/* 5. Sport Selection */}
          <div style={{ margin: '1.75rem 0' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
              ชนิดกีฬาที่ต้องการสมัคร (เลือก 1 - 2 รายการ) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            {loadingInitial ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.9rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                กำลังโหลดรายการกีฬา...
              </div>
            ) : sports.length === 0 ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.9rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                ไม่พบรายการกีฬาที่เปิดรับสมัคร
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {sports.map((sport) => {
                  const isChecked = selectedSports.includes(sport.id);
                  return (
                    <label
                      key={sport.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        background: isChecked ? 'var(--accent-surface)' : 'var(--surface-2)',
                        border: isChecked ? '1.5px solid var(--accent-border)' : '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isChecked ? '0 2px 8px rgba(202, 138, 4, 0.12)' : 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSportToggle(sport.id)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--accent-text)', cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isChecked ? 'var(--accent-text)' : 'var(--text)' }}>
                          {sport.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: isChecked ? 'var(--accent-text)' : 'var(--text-3)' }}>
                          {sport.sport_type === 'team' ? 'ประเภททีม' : 'ประเภทเดี่ยว'}
                          {sport.max_players_per_team ? ` (จำกัด ${sport.max_players_per_team} คน/สี)` : ''}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. PDPA Consent */}
          <div style={{ margin: '1.5rem 0', padding: '1rem', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={pdpaConsent}
                onChange={(e) => setPdpaConsent(e.target.checked)}
                required
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-2)', lineHeight: 1.5 }}>
                ข้าพเจ้ายินยอมให้สโมสรนักศึกษาคณะวิทยาศาสตร์และเทคโนโลยี เก็บ รวบรวม และใช้ข้อมูลส่วนบุคคลนี้เพื่อวัตถุประสงค์ในการจัดการแข่งขันกีฬาสานสัมพันธ์ (Sci Games 2026) ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
              </span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '0.85rem',
              fontSize: '1.05rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {submitting ? (
              'กำลังส่งข้อมูล...'
            ) : (
              <>
                <Send size={18} />
                <span>ยืนยันการสมัครกีฬา</span>
              </>
            )}
          </button>
        </form>
      </GlassCard>

      {/* Success Modal */}
      <Modal
        isOpen={!!successData}
        onClose={() => setSuccessData(null)}
        title="สมัครกีฬาสำเร็จ!"
      >
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <BadgeCheck size={64} style={{ color: '#22c55e' }} animateOnHover />
          </div>
          <h4 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: 700 }}>
            {successData?.athlete_name}
          </h4>
          <p style={{ color: 'var(--text-2)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            รหัสนักศึกษา: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{successData?.student_id}</span> | {successData?.department}
          </p>

          <div
            style={{
              padding: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem',
              background: 'var(--surface-2)',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span style={{ fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>สีประจำทีมของคุณคือ:</span>
            <TeamBadge
              name={successData?.team_name}
              colorHex={successData?.team_color}
              emoji={successData?.team_emoji}
              size="lg"
            />
          </div>

          <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1.75rem' }}>
            คุณสามารถตรวจสอบสถานะการลงทะเบียนและดูรายชื่อเพื่อนร่วมทีมได้ตลอดเวลา
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link
              href="/check-status"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Search size={15} />
              <span>ตรวจสอบสถานะ</span>
            </Link>
            <Link
              href="/"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Home size={15} />
              <span>กลับหน้าแรก</span>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}
