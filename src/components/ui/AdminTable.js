'use client';
import GlassCard from '@/components/ui/GlassCard';

/**
 * Minimal styled table for admin lists where rows are written as JSX.
 * (DataTable.js is the column-config/sortable variant for plain data.)
 *
 *   <AdminTable columns={['เวลา', 'ผู้ดูแล', '']} minWidth={640}>
 *     {rows.map((r) => <tr key={r.id} style={TR}><Td>…</Td></tr>)}
 *     {rows.length === 0 && <EmptyRow colSpan={3}>ไม่มีรายการ</EmptyRow>}
 *   </AdminTable>
 */
export default function AdminTable({ columns = [], minWidth = 640, children, style }) {
  return (
    <GlassCard style={{ padding: 0, overflowX: 'auto', ...style }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth }}>
        <thead>
          <tr style={{ background: 'var(--surface-2)', color: 'var(--text-3)', textAlign: 'left' }}>
            {columns.map((c, i) => (
              <th key={i} style={TH}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </GlassCard>
  );
}

export const TH = { padding: '0.6rem 0.85rem', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' };
export const TD = { padding: '0.55rem 0.85rem', color: 'var(--text-2)', verticalAlign: 'middle' };
/** Spread on <tr> for the standard row divider. */
export const TR = { borderTop: '1px solid var(--glass-border)' };

export function Td({ children, style, ...rest }) {
  return (
    <td style={{ ...TD, ...style }} {...rest}>
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ ...TD, textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        {children}
      </td>
    </tr>
  );
}
