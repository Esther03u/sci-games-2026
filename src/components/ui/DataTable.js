'use client';
import { useState, useMemo } from 'react';
import { Search } from '@/components/animate-ui/icons';

export default function DataTable({
  columns = [],
  data = [],
  searchable = false,
  searchKeys = [],
  placeholder = 'ค้นหา...',
  emptyMessage = 'ไม่พบข้อมูล',
}) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const filtered = useMemo(() => {
    if (!search || !searchKeys.length) return data;
    const q = search.toLowerCase().trim();
    return data.filter((row) =>
      searchKeys.some((key) => String(row[key] || '').toLowerCase().includes(q))
    );
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortCol) return filtered;
    return [...filtered].sort((a, b) => {
      const va = a[sortCol] ?? '';
      const vb = b[sortCol] ?? '';
      const cmp = String(va).localeCompare(String(vb), 'th', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir]);

  const handleSort = (colKey) => {
    if (sortCol === colKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(colKey);
      setSortDir('asc');
    }
  };

  return (
    <div>
      {searchable && (
        <div style={{ marginBottom: '1rem', position: 'relative', maxWidth: '320px' }}>
          <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
            <Search size={16} />
          </div>
          <input
            type="text"
            className="form-input"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.4rem' }}
          />
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{
                    cursor: col.sortable !== false ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                >
                  {col.label}
                  {sortCol === col.key && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem 1rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr key={row.id || i}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
