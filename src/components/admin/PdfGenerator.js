'use client';
import { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Banner from '@/components/ui/Banner';
import TeamBadge from '@/components/ui/TeamBadge';
import { generateRosterPdf } from '@/lib/pdf';
import JSZip from 'jszip';
import { Package, Download, Medal, Timer } from '@/components/animate-ui/icons';

export default function PdfGenerator({ sports = [], teams = [], registrations = [] }) {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [pageError, setPageError] = useState('');
  const [downloadingKey, setDownloadingKey] = useState(null);

  // Group athletes by sport_id and team_id
  const getAthletesFor = (sportId, teamId) => {
    return registrations
      .filter((r) => r.sport_id === sportId && r.athlete?.team_id === teamId && r.status === 'registered')
      .map((r) => r.athlete);
  };

  const handleDownloadSingle = (sport, team) => {
    const key = `${sport.id}-${team.id}`;
    setDownloadingKey(key);
    try {
      const athletes = getAthletesFor(sport.id, team.id);
      const doc = generateRosterPdf({
        sportName: sport.name,
        teamName: team.name,
        athletes,
        printDate: new Date().toLocaleDateString('th-TH'),
      });
      doc.save(`roster_${sport.name}_${team.name}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setPageError('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF');
    } finally {
      setDownloadingKey(null);
    }
  };

  const handleDownloadAllZip = async () => {
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('SciGames_Rosters_2026');

      for (const sport of sports) {
        for (const team of teams) {
          const athletes = getAthletesFor(sport.id, team.id);
          const doc = generateRosterPdf({
            sportName: sport.name,
            teamName: team.name,
            athletes,
            printDate: new Date().toLocaleDateString('th-TH'),
          });
          const pdfBlob = doc.output('blob');
          folder.file(`รายชื่อ_${sport.name}_${team.name}.pdf`, pdfBlob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SciGames_2026_All_Rosters.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error bundling ZIP:', err);
      setPageError('เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP');
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div>
      <Banner kind="error" onClose={() => setPageError('')}>{pageError}</Banner>
      {/* Action Header */}
      <GlassCard
        style={{
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text)', marginBottom: '0.25rem' }}>
            ใบส่งรายชื่อนักกีฬาทางการ (Roster PDF)
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-2)' }}>
            มีช่องสำหรับลงลายมือชื่อนักกีฬาในสนาม เอกสารมาตรฐาน A4 รวม 24 รายการ
          </p>
        </div>

        <button
          onClick={handleDownloadAllZip}
          disabled={downloadingZip}
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.5rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <Package size={18} />
          <span>{downloadingZip ? 'กำลังสร้างไฟล์ ZIP...' : 'ดาวน์โหลด PDF ทั้งหมด (.ZIP)'}</span>
        </button>
      </GlassCard>

      {/* Grid of Sport x Team cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {sports.map((sport) => (
          <div key={sport.id}>
            <h4
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--gold-600)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Medal size={20} style={{ color: 'var(--gold-600)' }} />
              <span>กีฬา: {sport.name}</span>
            </h4>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
              }}
            >
              {teams.map((team) => {
                const count = getAthletesFor(sport.id, team.id).length;
                const isDownloading = downloadingKey === `${sport.id}-${team.id}`;

                return (
                  <GlassCard
                    key={team.id}
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                        <TeamBadge
                          name={team.name}
                          colorHex={team.color_hex}
                          emoji={team.logo_emoji}
                          size="md"
                        />
                        <span
                          className="badge"
                          style={{
                            background: 'var(--surface-2)',
                            fontSize: '0.8rem',
                          }}
                        >
                          {count} คน
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '1rem' }}>
                        {sport.name} - {team.name}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDownloadSingle(sport, team)}
                      disabled={isDownloading}
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', padding: '0.45rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    >
                      {isDownloading ? <Timer size={14} /> : <Download size={14} />}
                      <span>{isDownloading ? 'กำลังสร้าง...' : 'ดาวน์โหลด PDF'}</span>
                    </button>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
