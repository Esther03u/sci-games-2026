import PinManager from '@/components/admin/PinManager';
import { loadPage } from '@/lib/queries/page';
import { loadSportsOnly } from '@/lib/queries/admin';
import { Shield } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'PIN กรรมการ - Admin',
  description: 'สร้างและจัดการรหัส PIN สำหรับกรรมการลงคะแนนแต่ละกีฬา',
};

export const dynamic = 'force-dynamic';

export default async function AdminPinsPage() {
  const { sports } = await loadPage('/admin/pins', loadSportsOnly, { sports: [] });

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Shield size={26} style={{ color: 'var(--gold-600)' }} /> PIN กรรมการ
        </h1>
        <p className="page-subtitle">
          รหัส 6 หลักต่อกีฬาสำหรับกรรมการชั่วคราว — ไม่ต้องสมัครบัญชี ปิดได้ทันที มีบันทึกว่าใครกด
        </p>
      </div>
      <PinManager sports={sports} />
    </div>
  );
}
