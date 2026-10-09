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
    <section className="cp">
      {CEREMONY_PROGRAMME.map((day) => (
        <motion.div
          key={day.date}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="cp-wrap"
        >
          <GlassCard style={{ padding: '1.5rem' }}>
            <h2 className="cp-title">กำหนดการพิธีการและกิจกรรมส่งท้าย · {fmtEventDayLong(day.date)}</h2>
            <p className="cp-intro">
              ลำดับพิธีเปิด กิจกรรมพิเศษ และพิธีปิดการแข่งขันอย่างเป็นทางการ ตามเอกสารกำหนดการ
            </p>

            <ol className="cp-list">
              {day.items.map((item) => (
                <li key={item.time} className="cp-item">
                  <span className="cp-time">{item.time}</span>
                  <div className="cp-body">
                    <strong className="cp-name">{item.title}</strong>
                    {item.detail && <span className="cp-detail">{item.detail}</span>}
                  </div>
                </li>
              ))}
            </ol>

            {day.note && <p className="cp-note">หมายเหตุ: {day.note}</p>}
          </GlassCard>
        </motion.div>
      ))}
    </section>
  );
}
