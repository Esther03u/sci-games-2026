import UserManager from '@/components/admin/UserManager';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Users } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'จัดการผู้ใช้งานและสิทธิ์ - Admin',
  description: 'จัดการบัญชีผู้ดูแลระบบ (Admin) และเจ้าหน้าที่ลงคะแนน (Staff)',
};

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  let users = [];
  let sports = [];

  try {
    const supabase = await createServerSupabaseClient();
    const [usersRes, sportsRes] = await Promise.all([
      supabase
        .from('admin_users')
        .select('*, staff_sport_assignments(*, sports(name))')
        .order('created_at', { ascending: false }),
      supabase.from('sports').select('*').order('sort_order'),
    ]);

    if (usersRes.data) users = usersRes.data;
    if (sportsRes.data) sports = sportsRes.data;
  } catch (err) {
    console.error('Error fetching admin users:', err);
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Users size={28} style={{ color: 'var(--gold-600)' }} /> จัดการผู้ใช้งานระบบและกำหนดสิทธิ์
        </h1>
        <p className="page-subtitle">
          สร้างบัญชี Super Admin และกำหนดชนิดกีฬาให้เจ้าหน้าที่ Staff แต่ละสนาม
        </p>
      </div>

      <UserManager initialUsers={users} sports={sports} />
    </div>
  );
}
