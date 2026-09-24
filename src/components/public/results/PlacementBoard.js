import { pointsForPlace } from '@/lib/placements';

// /results: "ผลรายการ" — 1st–4th of every event (sport × category) from its
// final and third-place match — and the overall table, which stays hidden
// until an admin opens the podium (decision 25 ก.ย.). Server-rendered from
// lib/queries/placements; points appear only once revealed.

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉', 4: '4' };

function TeamChip({ team }) {
  if (!team) return <span style={{ color: 'var(--text-3)' }}>—</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
      <span
        aria-hidden="true"
        style={{ width: 10, height: 10, borderRadius: '50%', background: team.color_hex || '#64748b' }}
      />
      {team.name}
    </span>
  );
}

/**
 * @param {{ events: Array<{key: string, sport_name: string, category: string, places: Array<{place: number, team_id: string}>, done: boolean}>,
 *           standings: Array<object>, teams: Array<object>, points: number[], revealed: boolean }} props
 */
export default function PlacementBoard({ events, standings, teams, points, revealed }) {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const doneCount = events.filter((e) => e.done).length;

  return (
    <section style={{ margin: '0 0 2.5rem' }} aria-labelledby="placements-title">
      <div style={{ marginBottom: '1rem' }}>
        <h2 id="placements-title" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
          อันดับแต่ละรายการ
        </h2>
        <p style={{ color: 'var(--text-2)', fontSize: '0.88rem', margin: 0 }}>
          ชนะชิงชนะเลิศ = ที่ 1 · แพ้ = ที่ 2 · ชนะชิงที่ 3 = ที่ 3 · แพ้ = ที่ 4 — จบแล้ว {doneCount}/
          {events.length} รายการ
        </p>
      </div>

      {revealed ? (
        <div className="glass-card" style={{ padding: 0, overflowX: 'auto', marginBottom: '1.25rem' }}>
          <table className="data-table" style={{ minWidth: 420 }}>
            <caption
              style={{ textAlign: 'left', padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--text)' }}
            >
              ตารางคะแนนรวม (ที่ 1–4 = {points.join(' / ')} คะแนน)
            </caption>
            <thead>
              <tr>
                <th>อันดับ</th>
                <th>สี</th>
                <th style={{ textAlign: 'center' }}>🥇</th>
                <th style={{ textAlign: 'center' }}>🥈</th>
                <th style={{ textAlign: 'center' }}>🥉</th>
                <th style={{ textAlign: 'center' }}>ที่ 4</th>
                <th style={{ textAlign: 'right' }}>คะแนน</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 800 }}>{r.rank}</td>
                  <td>
                    <TeamChip team={r} />
                  </td>
                  <td style={{ textAlign: 'center' }}>{r.golds}</td>
                  <td style={{ textAlign: 'center' }}>{r.silvers}</td>
                  <td style={{ textAlign: 'center' }}>{r.bronzes}</td>
                  <td style={{ textAlign: 'center' }}>{r.fourths}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }}>{r.total_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p
          className="glass-card"
          style={{
            padding: '0.85rem 1rem',
            margin: '0 0 1.25rem',
            color: 'var(--text-2)',
            fontSize: '0.9rem',
          }}
        >
          🏆 คะแนนรวมจะประกาศในพิธีปิด — ติดตามการเปิดโพเดียมที่หน้าแรก
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))',
          gap: '0.85rem',
        }}
      >
        {events.map((e) => (
          <div key={e.key} className="glass-card" style={{ padding: '0.9rem 1rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.5rem',
                marginBottom: '0.5rem',
              }}
            >
              <strong style={{ color: 'var(--text)' }}>
                {e.sport_name} · {e.category}
              </strong>
              <span style={{ fontSize: '0.75rem', color: e.done ? 'var(--success-text)' : 'var(--text-3)' }}>
                {e.done ? 'จบแล้ว' : 'ยังแข่งไม่จบ'}
              </span>
            </div>
            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.3rem' }}>
              {[1, 2, 3, 4].map((place) => {
                const hit = e.places.find((p) => p.place === place);
                return (
                  <li
                    key={place}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem',
                      minHeight: 28,
                    }}
                  >
                    <span style={{ width: 24, textAlign: 'center' }} aria-label={`ที่ ${place}`}>
                      {MEDAL[place]}
                    </span>
                    <TeamChip team={hit && teamById.get(hit.team_id)} />
                    {revealed && hit && (
                      <span style={{ marginLeft: 'auto', color: 'var(--text-3)', fontSize: '0.8rem' }}>
                        +{pointsForPlace(place, points)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
