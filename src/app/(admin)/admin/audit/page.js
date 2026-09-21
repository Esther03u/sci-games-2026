import AuditLog from '@/components/admin/AuditLog';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { FileText } from '@/components/animate-ui/icons';

export const metadata = {
  title: 'ประวัติการแก้ไข - Admin',
  description: 'ประวัติคะแนนทุกการกดและการเปลี่ยนแปลงข้อมูลโดยผู้ดูแล',
};

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  let events = [];
  let logs = [];
  let sports = [];
  let teams = [];
  let matches = [];
  try {
    const supabase = await createServerSupabaseClient();
    const [ev, lg, sp, tm, mt] = await Promise.all([
      supabase.from('score_events').select('*').order('created_at', { ascending: false }).limit(500),
      // audit_logs is admin-only under RLS; the session cookie carries the role
      supabase.from('audit_logs').select('*, admin_users(display_name)').order('created_at', { ascending: false }).limit(300),
      supabase.from('sports').select('id, name, scoring_type').order('sort_order'),
      supabase.from('teams').select('id, name, color_hex').order('sort_order'),
      supabase.from('matches').select('id, sport_id, team_a_id, team_b_id, match_date, match_time, round, status'),
    ]);
    events = ev.data || [];
    logs = lg.data || [];
    sports = sp.data || [];
    teams = tm.data || [];
    matches = mt.data || [];
  } catch (err) {
    console.error('Error loading /admin/audit:', err);
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileText size={26} style={{ color: 'var(--gold-600)' }} /> ประวัติการแก้ไข
        </h1>
        <p className="page-subtitle">ทุกการกด +1/−1 จากสนาม และทุกการเปลี่ยนแปลงข้อมูลโดยผู้ดูแล — ย้อนคะแนนที่ผิดได้จากที่นี่</p>
      </div>
      <AuditLog events={events} logs={logs} sports={sports} teams={teams} matches={matches} />
    </div>
  );
}
