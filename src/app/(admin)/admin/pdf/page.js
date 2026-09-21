import PdfGenerator from '@/components/admin/PdfGenerator';
import { loadPage } from '@/lib/queries/page';
import { getSports, getTeams, rows } from '@/lib/queries/core';
import { FileText } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'พิมพ์เอกสารและ PDF - Admin',
  description: 'ส่งออกใบส่งรายชื่อนักกีฬาทางการสำหรับเจ้าหน้าที่และสนามแข่งขัน',
};

export const dynamic = 'force-dynamic';

export default async function AdminPdfPage() {
  const { sports, teams, registrations } = await loadPage(
    '/admin/pdf',
    async (sb) => {
      const [s, t, r] = await Promise.all([
        getSports(sb),
        getTeams(sb),
        sb
          .from('registrations')
          .select('*, athlete:athletes(id, student_id, full_name, team_id, department_id, departments(name))')
          .eq('status', 'registered'),
      ]);
      return { sports: rows(s), teams: rows(t), registrations: rows(r) };
    },
    { sports: [], teams: [], registrations: [] }
  );

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileText size={28} style={{ color: 'var(--gold-600)' }} /> ส่งออกใบส่งรายชื่อนักกีฬา (PDF)
        </h1>
        <p className="page-subtitle">
          ดาวน์โหลดเอกสารใบรายชื่อนักกีฬาแยกตามชนิดกีฬาและสี เพื่อใช้ตรวจเช็คตัวนักศึกษาในสนาม
        </p>
      </div>

      <PdfGenerator
        sports={sports}
        teams={teams}
        registrations={registrations}
      />
    </div>
  );
}
