import SettingsForm from '@/components/admin/SettingsForm';
import { Clock } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'ตั้งค่าระบบ - Admin',
  description: 'ตั้งค่าเวลาแก้ไขคะแนนหลังจบแมตช์และเปิด/ปิดระบบลงคะแนนสด',
};

export const dynamic = 'force-dynamic';

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Clock size={26} style={{ color: 'var(--gold-600)' }} /> ตั้งค่าระบบลงคะแนน
        </h1>
        <p className="page-subtitle">ค่าเหล่านี้มีผลทันทีกับกรรมการทุกสนาม</p>
      </div>
      <SettingsForm />
    </div>
  );
}
