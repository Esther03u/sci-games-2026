'use client';

/** A titled section (กำลังแข่ง / ถัดไป / เพิ่งจบ) of picker cards; children are the cards. */
export default function PickerGroup({ title, count, emptyText, icon = null, children }) {
  return (
    <section style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
        {icon}
        <h3
          style={{
            fontSize: '0.88rem',
            fontWeight: 700,
            color: 'var(--text)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            margin: 0,
          }}
        >
          {title}
        </h3>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '1px 7px',
            borderRadius: '999px',
            background: count > 0 ? 'var(--surface-3)' : 'var(--border)',
            color: count > 0 ? 'var(--text)' : 'var(--text-muted)',
          }}
        >
          {count}
        </span>
      </div>

      {count === 0 ? (
        <div
          style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            padding: '0.85rem 1rem',
            background: 'var(--surface-2)',
            borderRadius: '10px',
            border: '1px dashed var(--border)',
            textAlign: 'center',
          }}
        >
          {emptyText}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{children}</div>
      )}
    </section>
  );
}
