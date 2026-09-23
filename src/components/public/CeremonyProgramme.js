import GlassCard from '@/components/ui/GlassCard';
import { CEREMONY_PROGRAMME } from '@/data/handbook';
import { fmtEventDayLong } from '@/lib/format';

/**
 * The parts of the official programme that are not matches — registration,
 * the opening ceremony, the giant-volleyball exhibition, the prize-giving and
 * the closing (final/กำหนดการ69.pdf). They live in the handbook rather than
 * the `matches` table, so the schedule page renders them on their own.
 */
export default function CeremonyProgramme() {
  if (!CEREMONY_PROGRAMME.length) return null;

  return (
    <section style={{ marginTop: '2.5rem' }}>
      {CEREMONY_PROGRAMME.map((day) => (
        <GlassCard key={day.date} style={{ padding: '1.5rem' }}>
          <h2
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--text)',
              marginBottom: '0.35rem',
            }}
          >
            กำหนดการพิธีการ · {fmtEventDayLong(day.date)}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1.1rem' }}>
            นอกเหนือจากการแข่งขันในตารางด้านบน
          </p>

          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
            {day.items.map((item) => (
              <li
                key={item.time}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(7.5rem, auto) 1fr',
                  gap: '0.85rem',
                  alignItems: 'baseline',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--surface-2)',
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-text)' }}>
                  {item.time}
                </span>
                <span>
                  <strong style={{ color: 'var(--text)', fontSize: '0.95rem' }}>{item.title}</strong>
                  {item.detail && (
                    <span
                      style={{
                        display: 'block',
                        fontSize: '0.83rem',
                        color: 'var(--text-2)',
                        marginTop: '0.2rem',
                        lineHeight: 1.6,
                      }}
                    >
                      {item.detail}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>

          {day.note && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.9rem' }}>
              หมายเหตุ: {day.note}
            </p>
          )}
        </GlassCard>
      ))}
    </section>
  );
}
