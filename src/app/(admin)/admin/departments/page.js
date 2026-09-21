import DepartmentMapper from '@/components/admin/DepartmentMapper';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Building2 } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'จับคู่สาขาวิชาและสี - Admin',
  description: 'กำหนดและจัดการการจับคู่สาขาวิชาเข้ากับทีมสี',
};

export const dynamic = 'force-dynamic';

export default async function AdminDepartmentsPage() {
  let departments = [];
  let teams = [];

  try {
    const supabase = await createServerSupabaseClient();
    const [deptRes, teamsRes] = await Promise.all([
      supabase
        .from('departments')
        .select('*, teams(name, color_hex)')
        .order('name'),
      supabase.from('teams').select('*').order('sort_order'),
    ]);

    if (deptRes.data) departments = deptRes.data;
    if (teamsRes.data) teams = teamsRes.data;
  } catch (err) {
    console.error('Error loading departments page data:', err);
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Building2 size={28} style={{ color: 'var(--gold-600)' }} /> จัดการการจับคู่สาขาวิชาและสี
        </h1>
        <p className="page-subtitle">
          กำหนดว่าแต่ละสาขาวิชาในคณะวิทยาศาสตร์และเทคโนโลยีสังกัดทีมสีใด
        </p>
      </div>

      <DepartmentMapper initialDepartments={departments} teams={teams} />
    </div>
  );
}
