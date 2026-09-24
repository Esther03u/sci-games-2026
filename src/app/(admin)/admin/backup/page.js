import BackupPanel from '@/components/admin/BackupPanel';

export const metadata = {
  title: 'สำรองข้อมูล — Sci Admin',
  description: 'ส่งออกข้อมูลทั้งหมดของระบบ Sci Games 2026 เป็นไฟล์ JSON',
};

export const dynamic = 'force-dynamic';

export default function BackupPage() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>
          สำรองข้อมูล
        </h1>
        <p className="page-subtitle">
          ส่งออกข้อมูลทั้งหมดเป็นไฟล์ JSON เพื่อเก็บสำรองไว้กรณีฉุกเฉิน
        </p>
      </div>

      <BackupPanel />
    </div>
  );
}
