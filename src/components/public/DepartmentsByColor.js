// "สาขาในแต่ละสี" — one card per colour listing its departments. Used read-only
// on the home page (behind app_settings.show_departments_public) and as the
// base look of /admin/departments.

/**
 * @param {{ teams: Array<{id: string, name: string, color_hex?: string, logo_emoji?: string}>,
 *           departments: Array<{id: string, name: string, team_id: string|null}>,
 *           renderActions?: (dept: object) => import('react').ReactNode,
 *           renderFooter?: (team: object) => import('react').ReactNode }} props
 */
export default function DepartmentsByColor({ teams, departments, renderActions, renderFooter }) {
  const byTeam = new Map(teams.map((t) => [t.id, []]));
  const unassigned = [];
  for (const d of departments) (byTeam.get(d.team_id) || unassigned).push(d);

  const cards = teams.map((t) => ({ key: t.id, team: t, list: byTeam.get(t.id) }));
  if (unassigned.length) {
    cards.unshift({
      key: 'none',
      team: { id: null, name: 'ยังไม่ได้จัดสี', color_hex: '#f59e0b' },
      list: unassigned,
    });
  }

  return (
    <div className="dept-color-grid">
      {cards.map(({ key, team, list }) => (
        <div key={key} className="dept-color-card" style={{ '--team': team.color_hex || '#64748b' }}>
          <div className="dept-color-head">
            <span className="dept-color-dot" aria-hidden="true" />
            <strong>{team.name}</strong>
            <span className="dept-color-count">{list.length} สาขา</span>
          </div>
          {list.length === 0 ? (
            <p className="dept-color-empty">ยังไม่มีสาขา</p>
          ) : (
            <ul className="dept-color-list">
              {list.map((d) => (
                <li key={d.id}>
                  <span>{d.name}</span>
                  {renderActions && <span className="dept-color-actions">{renderActions(d)}</span>}
                </li>
              ))}
            </ul>
          )}
          {renderFooter && renderFooter(team)}
        </div>
      ))}
    </div>
  );
}
