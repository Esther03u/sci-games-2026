'use client';
// Admin match table (/admin/matches). State and API calls live in
// useMatchEditor; each modal is its own file in this folder.
import GlassCard from '@/components/ui/GlassCard';
import Banner from '@/components/ui/Banner';
import { Plus, Info } from '@/components/animate-ui/icons';
import { useMatchEditor } from './useMatchEditor';
import MatchRow from './MatchRow';
import AddMatchModal from './AddMatchModal';
import ScoreModal from './ScoreModal';
import ScheduleModal from './ScheduleModal';
import ResetModal from './ResetModal';
import DeleteModal from './DeleteModal';

export default function MatchEditor({ initialMatches = [], sports = [], teams = [] }) {
  const ed = useMatchEditor({ initialMatches, sports, teams });
  const { filters } = ed;
  const lookups = { sportById: ed.sportById, teamName: ed.teamName, loading: ed.loading };

  return (
    <div>
      <Banner kind="error" onClose={() => ed.setPageError('')}>
        {ed.pageError}
      </Banner>
      {/* Top action bar */}
      <GlassCard
        style={{
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Sport Filter */}
          <select
            className="form-select"
            value={filters.selectedSport}
            onChange={(e) => filters.setSelectedSport(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">ทุกชนิดกีฬา</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="form-select"
            value={filters.selectedStatus}
            onChange={(e) => filters.setSelectedStatus(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">ทุกสถานะ</option>
            <option value="upcoming">ยังไม่แข่ง</option>
            <option value="live">กำลังแข่ง</option>
            <option value="finished">จบแล้ว</option>
            <option value="postponed">เลื่อน</option>
          </select>
        </div>

        <button
          onClick={ed.add.open}
          className="btn btn-primary btn-sm"
          style={{ padding: '0.6rem 1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={16} />
          <span>สร้างแมตช์แข่งขันใหม่</span>
        </button>
      </GlassCard>

      {/* Feature Guide Banner */}
      <div
        style={{
          marginBottom: '1.25rem',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <Info size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: '260px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
            ฟังก์ชันการจัดการและบันทึกผลการแข่งขัน:
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-2)', lineHeight: 1.5 }}>
            • <strong>[รีเซ็ตผล]:</strong> ล้างคะแนนกลับเป็นยังไม่แข่ง <em>(ตารางแข่งและคู่แข่งไม่หาย)</em>
            <br />• <strong>[บันทึกผล]:</strong> กรอกแต้มรายเซต (วอลเลย์บอล/เซปักตะกร้อ) หรือแต้มรวม
            พร้อมปุ่มตัดสินชนะบาย
            <br />• <strong>[ลบ]:</strong> ใช้เฉพาะเมื่อต้องการลบแมตช์นี้ออกจากตารางสูจิบัตรอย่างถาวร
          </div>
        </div>
      </div>

      {/* Matches Table */}
      <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table className="data-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>ชนิดกีฬา</th>
              <th>คู่แข่งขัน</th>
              <th style={{ textAlign: 'center' }}>ผลคะแนน</th>
              <th>สถานะ</th>
              <th>วัน / เวลา / สนาม</th>
              <th style={{ minWidth: '320px', textAlign: 'center' }}>การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {ed.filteredMatches.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-3)' }}>
                  ไม่พบรายการแข่งขัน
                </td>
              </tr>
            ) : (
              ed.filteredMatches.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  sport={ed.sportById.get(m.sport_id)}
                  teamA={ed.teamById.get(m.team_a_id)}
                  teamB={ed.teamById.get(m.team_b_id)}
                  actions={ed.row}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddMatchModal add={ed.add} sports={sports} teams={teams} loading={ed.loading} />
      <ScoreModal score={ed.score} {...lookups} />
      <ScheduleModal schedule={ed.schedule} teams={teams} loading={ed.loading} />
      <ResetModal reset={ed.reset} {...lookups} />
      <DeleteModal remove={ed.remove} {...lookups} />
      {ed.confirmDialog}
    </div>
  );
}
