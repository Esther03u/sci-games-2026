'use client';

/** กติกาการแข่งขัน: rule summary from the handbook. */
export default function RulesTab({ sport, rulesSummary }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-text)' }}>
        ระเบียบการแข่งขันตามสูจิบัตร ({sport?.name})
      </div>
      <div
        style={{
          background: 'var(--surface-2)',
          borderRadius: '14px',
          padding: '1rem',
          border: '1px solid var(--border)',
        }}
      >
        <ul
          style={{
            paddingLeft: '1.2rem',
            margin: 0,
            fontSize: '0.85rem',
            lineHeight: 1.8,
            color: 'var(--text-2)',
          }}
        >
          {(
            rulesSummary || [
              'ปฏิบัติตามระเบียบการแข่งขันในสูจิบัตร',
              'การตัดสินของคณะกรรมการถือเป็นที่สิ้นสุด',
            ]
          ).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        <p style={{ margin: '0.75rem 0 0', fontSize: '0.78rem', color: 'var(--text-3)' }}>
          สรุปจากสูจิบัตร — กติกาฉบับเต็มดาวน์โหลดได้ที่หน้า{' '}
          <a href="/handbook" style={{ color: 'var(--accent-text)', fontWeight: 700 }}>
            สูจิบัตรและกำหนดการ
          </a>
        </p>
      </div>
    </div>
  );
}
