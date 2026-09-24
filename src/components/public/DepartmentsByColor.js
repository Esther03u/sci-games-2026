'use client';

// "สาขาในแต่ละสี" — one card per colour listing its departments.
// Supports both React Bits <ScrollStack /> view and 4-column Grid view.
// In /admin/departments, it automatically stays in Grid view with action buttons.

import { useState } from 'react';
import ScrollStack, { ScrollStackItem } from '@/components/ui/ScrollStack';
import { Layers, Grid3X3, ArrowDown } from 'lucide-react';

/**
 * @param {{ teams: Array<{id: string, name: string, color_hex?: string, logo_emoji?: string}>,
 *           departments: Array<{id: string, name: string, team_id: string|null}>,
 *           renderActions?: (dept: object) => import('react').ReactNode,
 *           renderFooter?: (team: object) => import('react').ReactNode,
 *           defaultMode?: 'stack' | 'grid' }} props
 */
export default function DepartmentsByColor({
  teams,
  departments,
  renderActions,
  renderFooter,
  defaultMode = 'stack',
}) {
  const isAdmin = Boolean(renderActions || renderFooter);
  const [mode, setMode] = useState(isAdmin ? 'grid' : defaultMode);

  const byTeam = new Map(teams.map((t) => [t.id, []]));
  const unassigned = [];
  for (const d of departments) (byTeam.get(d.team_id) || unassigned).push(d);

  const cards = teams.map((t) => ({ key: t.id, team: t, list: byTeam.get(t.id) || [] }));
  if (unassigned.length) {
    cards.unshift({
      key: 'none',
      team: { id: null, name: 'ยังไม่ได้จัดสี', color_hex: '#f59e0b' },
      list: unassigned,
    });
  }

  return (
    <div className="dept-color-section">
      {/* View Switcher (Public only) */}
      {!isAdmin && (
        <div className="dept-view-bar">
          <span className="dept-stack-hint">
            {mode === 'stack' ? (
              <>
                <ArrowDown size={14} className="dept-hint-icon" />
                เลื่อนลงเพื่อดูสีถัดไป (Scroll Stack)
              </>
            ) : (
              'แสดงทั้งหมดแบบ 4 คอลัมน์'
            )}
          </span>
          <div className="dept-view-toggle" role="tablist" aria-label="รูปแบบการแสดงผล">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'stack'}
              className={`dept-view-btn ${mode === 'stack' ? 'active' : ''}`}
              onClick={() => setMode('stack')}
            >
              <Layers size={15} />
              <span>การ์ดซ้อน (Stack)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'grid'}
              className={`dept-view-btn ${mode === 'grid' ? 'active' : ''}`}
              onClick={() => setMode('grid')}
            >
              <Grid3X3 size={15} />
              <span>ตาราง (Grid)</span>
            </button>
          </div>
        </div>
      )}

      {/* Mode A: ScrollStack (React Bits) */}
      {mode === 'stack' && !isAdmin ? (
        <div className="dept-stack-container">
          <ScrollStack
            itemDistance={75}
            itemScale={0.038}
            itemStackDistance={24}
            stackPosition="16%"
            scaleEndPosition="8%"
            baseScale={0.88}
            blurAmount={1}
            rotationAmount={0}
          >
            {cards.map(({ key, team, list }) => (
              <ScrollStackItem
                key={key}
                itemClassName="dept-stack-card"
                style={{ '--team': team.color_hex || '#64748b' }}
              >
                <div className="dept-stack-head">
                  <div className="dept-stack-title-group">
                    <span className="dept-stack-dot" aria-hidden="true" />
                    <strong className="dept-stack-name">{team.name}</strong>
                  </div>
                  <span className="dept-stack-count-badge">{list.length} สาขาวิชา</span>
                </div>

                {list.length === 0 ? (
                  <p className="dept-color-empty">ยังไม่มีสาขา</p>
                ) : (
                  <ul className="dept-stack-list">
                    {list.map((d) => (
                      <li key={d.id} className="dept-stack-item">
                        <span className="dept-stack-item-bullet" aria-hidden="true" />
                        <span className="dept-stack-item-name">{d.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollStackItem>
            ))}
          </ScrollStack>
        </div>
      ) : (
        /* Mode B: Classic Grid */
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
      )}
    </div>
  );
}
