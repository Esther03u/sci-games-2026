'use client';
import { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import TeamBadge from '@/components/ui/TeamBadge';
import FormField from '@/components/ui/FormField';
import { formatDate } from '@/lib/utils';
import { Search, AlertTriangle, BadgeCheck } from '@/components/animate-ui/icons';

export default function CheckStatusPage() {
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [athleteData, setAthleteData] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setAthleteData(null);

    if (!studentId.trim() || !phone.trim()) {
      setError('กรุณากรอกรหัสนักศึกษาและเบอร์โทรศัพท์ที่ใช้ตอนลงทะเบียน');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId.trim(),
          phone: phone.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || 'ไม่พบข้อมูลการลงทะเบียน');
      } else {
        setAthleteData(json.data);
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
          <Search size={32} style={{ color: '#fbbf24' }} /> ตรวจสอบสถานะการสมัคร
        </h1>
        <p className="page-subtitle">
          กรอกรหัสนักศึกษาและเบอร์โทรศัพท์เพื่อตรวจสอบชนิดกีฬาและสีที่สังกัด
        </p>
      </div>

      {/* Query Form */}
      <GlassCard style={{ padding: '2rem', marginBottom: '2rem' }}>
        <form onSubmit={handleSearch}>
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#fca5a5',
                padding: '0.75rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          <FormField label="รหัสนักศึกษา" required id="search_student_id">
            <input
              id="search_student_id"
              type="text"
              className="form-input"
              placeholder="ตัวอย่าง 66-1234-12345"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            />
          </FormField>

          <FormField label="เบอร์โทรศัพท์ที่ใช้ลงทะเบียน" required id="search_phone">
            <input
              id="search_phone"
              type="tel"
              className="form-input"
              placeholder="0812345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </FormField>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            {loading ? 'กำลังค้นหา...' : (
              <>
                <Search size={16} /> ค้นหาสถานะ
              </>
            )}
          </button>
        </form>
      </GlassCard>

      {/* Results Display */}
      {athleteData && (
        <GlassCard className="animate-fade-in" style={{ padding: '2rem' }}>
          <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', color: '#09090b' }}>{athleteData.full_name}</h3>
              <p style={{ color: '#52525b', fontSize: '0.9rem' }}>
                รหัส: {athleteData.student_id} | {athleteData.department}
              </p>
            </div>
            <TeamBadge
              name={athleteData.team_name}
              colorHex={athleteData.team_color}
              emoji={athleteData.team_emoji}
              size="md"
            />
          </div>

          <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: '1.25rem' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#ca8a04' }}>
              รายการกีฬาที่ลงทะเบียนไว้:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {athleteData.registrations?.map((reg) => (
                <div
                  key={reg.id}
                  className="flex-between"
                  style={{
                    background: '#f4f4f5',
                    border: '1px solid #e4e4e7',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div>
                    <strong style={{ color: '#09090b' }}>{reg.sport_name}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#71717a', marginLeft: '0.5rem' }}>
                      ({reg.sport_type === 'team' ? 'ประเภททีม' : 'ประเภทเดี่ยว'})
                    </span>
                  </div>
                  <span className="badge" style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                    <BadgeCheck size={14} /> ลงทะเบียนแล้ว
                  </span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '1.5rem' }}>
              ลงทะเบียนเมื่อ: {formatDate(athleteData.registered_at)}
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
