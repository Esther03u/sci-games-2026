'use client';
import { useEffect, useMemo, useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import PodiumReveal from '@/components/public/podium/PodiumReveal';
import { mockEvents } from '@/lib/podium-reveal';

/**
 * Admin rehearsal of the podium reveal with random made-up results. Reads only
 * the public colour list; never touches the real totals or the reveal setting.
 */
export default function PodiumSimulator() {
  const [teams, setTeams] = useState([]);
  const [run, setRun] = useState(null); // { seed } while a simulation is shown

  useEffect(() => {
    let active = true;
    fetch('/api/live-summary')
      .then((r) => r.json())
      .then((j) => {
        if (active) setTeams(j?.data?.teams || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const events = useMemo(() => (run && teams.length >= 4 ? mockEvents(teams, run.seed) : []), [run, teams]);

  return (
    <GlassCard style={{ padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
      <div className="sf-head">
        <div>
          <h2 className="sf-h2">จำลองการเฉลยโพเดียม</h2>
          <p className="sf-desc">
            เล่นแอนิเมชันเฉลยด้วย<strong>ผลสมมติแบบสุ่ม</strong> ไว้ซ้อมบนจอ — ไม่ใช้คะแนนจริง ไม่บันทึกอะไร
            และไม่เปิดคะแนนให้ผู้ชม
          </p>
        </div>
      </div>
      <div className="psim-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={teams.length < 4}
          onClick={() => setRun({ seed: Date.now() })}
        >
          ▶ จำลองการเฉลย (ข้อมูลสมมติ)
        </button>
        {run && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRun(null)}>
            ปิดการจำลอง
          </button>
        )}
      </div>
      {run && events.length > 0 && (
        <div className="psim-stage">
          <PodiumReveal key={run.seed} teams={teams} events={events} mode="play" simulated />
        </div>
      )}
    </GlassCard>
  );
}
