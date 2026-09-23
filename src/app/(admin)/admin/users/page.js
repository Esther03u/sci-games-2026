import UserManager from '@/components/admin/UserManager';
import { loadPage } from '@/lib/queries/page';
import { getSports, rows } from '@/lib/queries/core';

export const metadata = {
  title: 'จัดการผู้ใช้งานและสิทธิ์ - Admin',
  description: 'จัดการบัญชีผู้ดูแลระบบ (Admin) และเจ้าหน้าที่ลงคะแนน (Staff)',
};

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const { users, sports } = await loadPage(
    '/admin/users',
    async (sb) => {
      const [u, sp] = await Promise.all([
        sb
          .from('admin_users')
          .select('*, staff_sport_assignments(*, sports(name))')
          .order('created_at', { ascending: false }),
        getSports(sb),
      ]);
      return { users: rows(u), sports: rows(sp) };
    },
    { users: [], sports: [] }
  );

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">
          จัดการผู้ใช้งานระบบและกำหนดสิทธิ์
        </h1>
        <p className="page-subtitle">สร้างบัญชี Super Admin และกำหนดชนิดกีฬาให้เจ้าหน้าที่ Staff แต่ละสนาม</p>
      </div>

      <UserManager initialUsers={users} sports={sports} />
    </div>
  );
}
