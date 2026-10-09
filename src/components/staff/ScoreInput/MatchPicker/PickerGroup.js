'use client';

/** A titled section (กำลังแข่ง / ถัดไป / เพิ่งจบ) of picker cards; children are the cards. */
export default function PickerGroup({ title, count, emptyText, icon = null, children }) {
  return (
    <section className="mpg">
      <div className="mpg-head">
        {icon}
        <h3 className="mpg-title">{title}</h3>
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
        <div className="mpg-empty">{emptyText}</div>
      ) : (
        <div className="mpg-list">{children}</div>
      )}
    </section>
  );
}
