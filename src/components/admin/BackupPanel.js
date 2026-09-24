'use client';

import { useState, useCallback } from 'react';
import GlassCard from '@/components/ui/GlassCard';

const TABLE_LABELS = {
  teams: { label: 'ทีม (สี)', icon: '🎨' },
  sports: { label: 'กีฬา', icon: '⚽' },
  departments: { label: 'สาขาวิชา', icon: '🏛️' },
  athletes: { label: 'นักกีฬา', icon: '🏃' },
  registrations: { label: 'ลงทะเบียน', icon: '📋' },
  matches: { label: 'การแข่งขัน', icon: '🏆' },
  score_events: { label: 'บันทึกคะแนน', icon: '📊' },
  announcements: { label: 'ประกาศ', icon: '📢' },
  sport_schedules: { label: 'ตารางเวลา', icon: '📅' },
  sport_pins: { label: 'PIN กรรมการ', icon: '🔐' },
  admin_users: { label: 'ผู้ดูแลระบบ', icon: '👤' },
  app_settings: { label: 'ตั้งค่าระบบ', icon: '⚙️' },
  audit_logs: { label: 'ประวัติการแก้ไข', icon: '📝' },
};

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('th-TH', {
    dateStyle: 'long',
    timeStyle: 'medium',
  });
}

export default function BackupPanel() {
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const handleExport = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/backup', { cache: 'no-store' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.message || `เกิดข้อผิดพลาด (${res.status})`);
      }

      const blob = await res.blob();
      const text = await blob.text();
      const parsed = JSON.parse(text);

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sci-games-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setResult({
        meta: parsed.meta,
        size: blob.size,
      });
      setHistory((prev) => [
        {
          date: new Date().toISOString(),
          size: blob.size,
          tables: parsed.meta.tables.length,
          totalRows: parsed.meta.tables.reduce((s, t) => s + t.count, 0),
        },
        ...prev.slice(0, 9),
      ]);
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Main Export Card */}
      <GlassCard
        style={{
          padding: '2.5rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(139, 92, 246, 0.06))',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--gold-500), var(--gold-700))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            fontSize: '2rem',
            boxShadow: '0 8px 32px rgba(245, 158, 11, 0.3)',
          }}
        >
          💾
        </div>

        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--text)',
            marginBottom: '0.5rem',
            fontFamily: 'var(--font-heading)',
          }}
        >
          สำรองข้อมูลระบบ
        </h2>
        <p
          style={{
            color: 'var(--text-3)',
            fontSize: '0.92rem',
            marginBottom: '2rem',
            maxWidth: '500px',
            margin: '0 auto 2rem',
            lineHeight: 1.6,
          }}
        >
          ส่งออกข้อมูลทั้งหมดเป็นไฟล์ JSON เพื่อเก็บสำรองไว้ในเครื่อง
          <br />
          รวม 13 ตารางข้อมูล: ทีม, กีฬา, นักกีฬา, ผลแข่ง, คะแนน, ประกาศ และอื่นๆ
        </p>

        <button
          onClick={handleExport}
          disabled={status === 'loading'}
          className="btn btn-primary"
          style={{
            padding: '0.85rem 2.5rem',
            fontSize: '1.05rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {status === 'loading' ? (
            <>
              <span className="spinner" style={{ width: '18px', height: '18px' }} />
              กำลังส่งออกข้อมูล...
            </>
          ) : (
            <>
              <span style={{ fontSize: '1.2rem' }}>📥</span>
              ดาวน์โหลด Backup
            </>
          )}
        </button>

        {status === 'loading' && (
          <p style={{ marginTop: '1rem', color: 'var(--text-3)', fontSize: '0.85rem' }}>
            กำลังรวบรวมข้อมูลจากฐานข้อมูล... อาจใช้เวลาสักครู่
          </p>
        )}
      </GlassCard>

      {/* Error Alert */}
      {status === 'error' && (
        <GlassCard
          style={{
            padding: '1.25rem 1.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.3rem' }}>❌</span>
          <div>
            <strong style={{ color: '#fca5a5' }}>ส่งออกไม่สำเร็จ</strong>
            <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
              {error}
            </p>
          </div>
        </GlassCard>
      )}

      {/* Success Result */}
      {status === 'done' && result && (
        <GlassCard
          style={{
            padding: '1.5rem',
            background: 'rgba(34, 197, 94, 0.06)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.25rem',
            }}
          >
            <span style={{ fontSize: '1.3rem' }}>✅</span>
            <div>
              <strong style={{ color: '#4ade80', fontSize: '1.05rem' }}>ส่งออกสำเร็จ!</strong>
              <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', margin: '0.15rem 0 0' }}>
                {formatDate(result.meta.exported_at)} — ขนาดไฟล์ {formatFileSize(result.size)}
              </p>
            </div>
          </div>

          {/* Table Breakdown */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '0.6rem',
            }}
          >
            {result.meta.tables.map((t) => {
              const info = TABLE_LABELS[t.name] || { label: t.name, icon: '📄' };
              return (
                <div
                  key={t.name}
                  style={{
                    padding: '0.6rem 0.8rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <span>{info.icon}</span>
                  <span style={{ color: 'var(--text-2)', flex: 1 }}>{info.label}</span>
                  <span
                    style={{
                      color: t.count > 0 ? 'var(--gold-400)' : 'var(--text-3)',
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {t.count.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>

          {result.meta.errors && result.meta.errors.length > 0 && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                fontSize: '0.82rem',
                color: 'var(--gold-400)',
              }}
            >
              ⚠️ บางตารางมีปัญหา:{' '}
              {result.meta.errors.map((e) => `${e.table} (${e.error})`).join(', ')}
            </div>
          )}
        </GlassCard>
      )}

      {/* Download History */}
      {history.length > 0 && (
        <GlassCard style={{ padding: '1.5rem' }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>🕒</span> ประวัติการดาวน์โหลด (เซสชันนี้)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {history.map((h, i) => (
              <div
                key={i}
                style={{
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <span style={{ color: 'var(--text-2)' }}>{formatDate(h.date)}</span>
                <span style={{ color: 'var(--text-3)' }}>
                  {h.tables} ตาราง · {h.totalRows.toLocaleString()} แถว ·{' '}
                  {formatFileSize(h.size)}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Info Box */}
      <GlassCard
        style={{
          padding: '1.25rem 1.5rem',
          background: 'rgba(59, 130, 246, 0.06)',
          border: '1px solid rgba(59, 130, 246, 0.15)',
        }}
      >
        <h3
          style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span>ℹ️</span> เกี่ยวกับระบบ Backup
        </h3>
        <ul
          style={{
            margin: 0,
            paddingLeft: '1.2rem',
            color: 'var(--text-3)',
            fontSize: '0.85rem',
            lineHeight: 1.8,
          }}
        >
          <li>ไฟล์ JSON ที่ดาวน์โหลดมีข้อมูลทุกตารางสำคัญในระบบ</li>
          <li>PIN ของกรรมการจะถูกซ่อนค่า hash — เก็บเฉพาะ metadata</li>
          <li>ข้อมูลผู้ดูแลระบบจะไม่รวมรหัสผ่าน (ใช้ Supabase Auth)</li>
          <li>
            ทุกครั้งที่ส่งออก จะถูกบันทึกใน <strong>ประวัติการแก้ไข (Audit Log)</strong>
          </li>
          <li>แนะนำให้ดาวน์โหลดเก็บไว้อย่างน้อยวันละ 1 ครั้ง ช่วงมีการแข่งขัน</li>
          <li>เก็บไฟล์ backup ไว้หลายที่ เช่น Google Drive, USB เพื่อความปลอดภัย</li>
        </ul>
      </GlassCard>
    </div>
  );
}
