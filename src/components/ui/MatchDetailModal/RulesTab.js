'use client';

/** กติกาการแข่งขัน: rule summary from the handbook. */
export default function RulesTab({ sport, rulesSummary }) {
  return (
    <div className="md-tab-stack">
      <div className="md-section-title">ระเบียบการแข่งขันตามสูจิบัตร ({sport?.name})</div>
      <div className="md-box">
        <ul className="md-rules">
          {(
            rulesSummary || [
              'ปฏิบัติตามระเบียบการแข่งขันในสูจิบัตร',
              'การตัดสินของคณะกรรมการถือเป็นที่สิ้นสุด',
            ]
          ).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        <p className="md-rules-note">
          สรุปจากสูจิบัตร — กติกาฉบับเต็มดาวน์โหลดได้ที่หน้า{' '}
          <a href="/handbook" style={{ color: 'var(--accent-text)', fontWeight: 700 }}>
            สูจิบัตรและกำหนดการ
          </a>
        </p>
      </div>
    </div>
  );
}
