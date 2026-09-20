import PdfGenerator from '@/components/admin/PdfGenerator';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { FileText } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'พิมพ์เอกสารและ PDF - Admin',
  description: 'ส่งออกใบส่งรายชื่อนักกีฬาทางการสำหรับเจ้าหน้าที่และสนามแข่งขัน',
};

export const dynamic = 'force-dynamic';

export default async function AdminPdfPage() {
  let sports = [];
  let teams = [];
  let registrations = [];

  try {
    const supabase = await createServerSupabaseClient();
    const [sportsRes, teamsRes, regRes] = await Promise.all([
      supabase.from('sports').select('*').order('sort_order'),
      supabase.from('teams').select('*').order('sort_order'),
      supabase
        .from('registrations')
        .select('*, athlete:athletes(id, student_id, full_name, team_id, department_id, departments(name))')
        .eq('status', 'registered'),
    ]);

    if (sportsRes.data) sports = sportsRes.data;
    if (teamsRes.data) teams = teamsRes.data;
    if (regRes.data) registrations = regRes.data;
  } catch (err) {
    console.error('Error loading PDF generation data:', err);
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileText size={28} style={{ color: '#fbbf24' }} /> ส่งออกใบส่งรายชื่อนักกีฬา (PDF)
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
