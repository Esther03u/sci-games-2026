'use client';

import { motion } from 'motion/react';
import GlassCard from '@/components/ui/GlassCard';
import { CEREMONY_PROGRAMME } from '@/data/handbook';
import { fmtEventDayLong } from '@/lib/format';

/**
 * The parts of the official programme that are not matches — registration,
 * the opening ceremony, the giant-volleyball exhibition, the prize-giving and
 * the closing (final/กำหนดการ69.pdf). They live in the handbook rather than
 * the `matches` table, so the schedule page renders them on their own.
 */
export default function CeremonyProgramme({ selectedDay = 'all' }) {
  if (selectedDay !== 'all' && selectedDay !== '2026-10-11') return null;
  if (!CEREMONY_PROGRAMME.length) return null;

  return (
    <section style={{ marginTop: '2.5rem' }}>
      {CEREMONY_PROGRAMME.map((day) => (
        <motion.div
          key={day.date}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: '1.5rem' }}
        >
          <GlassCard style={{ padding: '1.5rem' }}>
            <h2
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: 'var(--text)',
                marginBottom: '0.35rem',
              }}
            >
              กำหนดการพิธีการและกิจกรรมส่งท้าย · {fmtEventDayLong(day.date)}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1.1rem' }}>
              ลำดับพิธีเปิด กิจกรรมพิเศษ และพิธีปิดการแข่งขันอย่างเป็นทางการ ตามเอกสารกำหนดการ
            </p>

            <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
              {day.items.map((item) => (
                <li
                  key={item.time}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'baseline',
                    gap: '0.5rem 1rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--surface-2)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--accent-text)',
                      minWidth: '7.5rem',
                      flexShrink: 0,
                    }}
                  >
                    {item.time}
                  </span>
                  <div style={{ flex: '1 1 200px' }}>
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
                  </div>
                </li>
              ))}
            </ol>

            {day.note && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.9rem' }}>
                หมายเหตุ: {day.note}
              </p>
            )}
          </GlassCard>
        </motion.div>
      ))}
    </section>
  );
}
