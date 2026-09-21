import PinManager from '@/components/admin/PinManager';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Shield } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'PIN กรรมการ - Admin',
  description: 'สร้างและจัดการรหัส PIN สำหรับกรรมการลงคะแนนแต่ละกีฬา',
};

export const dynamic = 'force-dynamic';

export default async function AdminPinsPage() {
  let sports = [];
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.from('sports').select('id, name').order('sort_order');
    sports = data || [];
  } catch (err) {
    console.error('Error loading /admin/pins:', err);
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Shield size={26} style={{ color: 'var(--gold-600)' }} /> PIN กรรมการ
        </h1>
        <p className="page-subtitle">รหัส 6 หลักต่อกีฬาสำหรับกรรมการชั่วคราว — ไม่ต้องสมัครบัญชี ปิดได้ทันที มีบันทึกว่าใครกด</p>
      </div>
      <PinManager sports={sports} />
    </div>
  );
}
