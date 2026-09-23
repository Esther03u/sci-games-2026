import DepartmentMapper from '@/components/admin/DepartmentMapper';
import { loadPage } from '@/lib/queries/page';
import { getTeams, rows } from '@/lib/queries/core';

export const metadata = {
  title: 'จับคู่สาขาวิชาและสี - Admin',
  description: 'กำหนดและจัดการการจับคู่สาขาวิชาเข้ากับทีมสี',
};

export const dynamic = 'force-dynamic';

export default async function AdminDepartmentsPage() {
  const { departments, teams } = await loadPage(
    '/admin/departments',
    async (sb) => {
      const [d, t] = await Promise.all([
        sb.from('departments').select('*, teams(name, color_hex)').order('name'),
        getTeams(sb),
      ]);
      return { departments: rows(d), teams: rows(t) };
    },
    { departments: [], teams: [] }
  );

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">จัดการการจับคู่สาขาวิชาและสี</h1>
        <p className="page-subtitle">กำหนดว่าแต่ละสาขาวิชาในคณะวิทยาศาสตร์และเทคโนโลยีสังกัดทีมสีใด</p>
      </div>

      <DepartmentMapper initialDepartments={departments} teams={teams} />
    </div>
  );
}
