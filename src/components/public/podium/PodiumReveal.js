'use client';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown } from '@/components/animate-ui/icons';
import Confetti from '@/components/ui/Confetti';
import { computeStandings, normalizePlacementPoints, usesHandbookScale } from '@/lib/placements';
import {
  barHeight,
  buildRevealTimeline,
  displayScore,
  PLACE_SHORT,
  teamBreakdown,
} from '@/lib/podium-reveal';
import CountUp from './CountUp';
import ScoreBreakdown from './ScoreBreakdown';
import { useRevealPlayer } from './useRevealPlayer';

/**
 * The overall podium (plan docs/plans/2026-10-10-podium-reveal.md): one bar
 * per colour in fixed colour order. 'mystery' — equal bars, no scores;
 * 'play' — grows event by event with "+points" pops (~40 s); 'final' — the
 * result straight away with a replay button. When done each bar opens its
 * score breakdown.
 *
 * `teams` must be the real colour list; `events` / `points` come from
 * /api/standings only after the reveal — or from mockEvents() when
 * `simulated` (admin preview, labelled as made-up data).
 */
export default function PodiumReveal({
  teams = [],
  events = [],
  points,
  mode = 'mystery',
  simulated = false,
  teaser = null, // [{ team_id, masked: 'X2.3X' }] — admin switch, before the reveal only
}) {
  const pts = normalizePlacementPoints(points);
  const ordered = useMemo(
    () => [...teams].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [teams]
  );
  const timeline = useMemo(() => buildRevealTimeline(events, ordered, pts), [events, ordered, pts]);
  const ranks = useMemo(
    () => Object.fromEntries(computeStandings(events, ordered, pts).map((r) => [r.id, r.rank])),
    [events, ordered, pts]
  );
  const { phase, stepIdx, grown, replay, skip } = useRevealPlayer(timeline.steps.length, mode);
  const [selected, setSelected] = useState(null);
  const teaserById = Object.fromEntries((teaser || []).map((t) => [t.team_id, t.masked]));

  const mystery = phase === 'idle';
  const done = phase === 'done';
  const step = stepIdx >= 0 ? timeline.steps[stepIdx] : null;
  // bars grow only once the current step's name has been shown
  const shownStep = step && grown ? step : stepIdx > 0 ? timeline.steps[stepIdx - 1] : null;
  const totals = done || phase === 'outro' ? timeline.final : shownStep?.totals || {};
  const showScaled = done || phase === 'outro';
  const pops = step && grown && phase === 'step' ? step.gains : [];

  const selectedTeam = selected && ordered.find((t) => t.id === selected);

  return (
    <div className={`pr ${mystery ? 'is-mystery' : ''} ${done ? 'is-done' : ''}`}>
      {simulated && <div className="pr-sim">ข้อมูลจำลอง — ไม่ใช่ผลคะแนนจริง</div>}

      <div className="pr-caption" aria-live="polite">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div key="intro" className="pr-caption-text" {...fade}>
              กำลังเฉลยคะแนน…
            </motion.div>
          )}
          {phase === 'step' && step && (
            <motion.div key={step.key} className="pr-caption-text" {...fade}>
              <span className="pr-caption-count">
                รายการ {step.index}/{timeline.eventsTotal}
              </span>{' '}
              {step.label}
            </motion.div>
          )}
          {(phase === 'outro' || done) && (
            <motion.div key="done" className="pr-caption-text" {...fade}>
              {simulated ? 'ผลการจำลอง' : 'ผลคะแนนรวม Sci Games 2026'}
              <span className="pr-caption-hint">กดที่แท่งเพื่อดูที่มาของคะแนน</span>
            </motion.div>
          )}
          {mystery && (
            <motion.div key="mystery" className="pr-caption-text" {...fade}>
              รอเฉลยคะแนนรวม
              {teaser?.length > 0 && <span className="pr-caption-hint">สปอยล์คะแนนให้ลุ้นนิดหน่อย 👀</span>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="pr-stage">
        {ordered.map((team) => {
          const raw = totals[team.id] ?? 0;
          const hex = team.color_hex || '#64748b';
          const rank = ranks[team.id];
          const pop = pops.find((g) => g.team_id === team.id);
          const height = mystery || phase === 'intro' ? barHeight(0) : barHeight(raw);
          const b = done ? teamBreakdown(team.id, events, pts) : null;
          const label = `${team.name}${done ? ` ${displayScore(raw, pts)} คะแนน อันดับ ${rank}` : ''}`;
          return (
            <div key={team.id} className="pr-col" style={{ '--team': hex }}>
              <div className="pr-track">
                <motion.button
                  type="button"
                  className="pr-bar"
                  disabled={!done}
                  aria-label={done ? `${label} — ดูที่มาของคะแนน` : team.name}
                  onClick={() => done && setSelected(team.id)}
                  initial={false}
                  animate={{ height: `${height}%` }}
                  transition={{ type: 'spring', stiffness: 70, damping: 16 }}
                >
                  <AnimatePresence>
                    {pop && (
                      <motion.div
                        key={`${step.key}-${team.id}`}
                        className={`pr-pop p${pop.place}`}
                        initial={{ opacity: 0, y: 10, scale: 0.6 }}
                        animate={{
                          opacity: [0, 1, 1, 0],
                          y: [10, -12, -26, -44],
                          scale: [0.6, 1.15, 1, 0.95],
                        }}
                        transition={{ duration: 2.2, times: [0, 0.18, 0.7, 1], ease: 'easeOut' }}
                      >
                        <strong>+{pop.points}</strong>
                        <em>{PLACE_SHORT[pop.place]}</em>
                        <span>{step.label}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {done && rank === 1 && (
                    <motion.span
                      className="pr-crown"
                      initial={{ y: 18, opacity: 0, scale: 0.4 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.15 }}
                      aria-hidden="true"
                    >
                      <span className="pr-crown-bob">
                        <Crown size={36} />
                      </span>
                    </motion.span>
                  )}
                  <span className="pr-score">
                    {mystery && teaserById[team.id] ? (
                      <Teaser masked={teaserById[team.id]} />
                    ) : mystery || phase === 'intro' ? (
                      '?'
                    ) : showScaled ? (
                      <CountUp value={displayScore(raw, pts)} decimals={usesHandbookScale(pts) ? 2 : 0} />
                    ) : (
                      <CountUp value={raw} />
                    )}
                  </span>
                  {done && <span className={`pr-rank r${rank}`}>อันดับ {rank}</span>}
                  {b && (
                    <span className="pr-tip" role="tooltip">
                      🥇×{b.medals[1]} 🥈×{b.medals[2]} 🥉×{b.medals[3]} · ดิบ {b.raw}/{b.maxRaw}
                    </span>
                  )}
                </motion.button>
              </div>
              <div className="pr-name">{team.name}</div>
            </div>
          );
        })}
      </div>

      <div className="pr-actions">
        {(phase === 'intro' || phase === 'step') && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={skip}>
            ข้ามไปดูผล ›
          </button>
        )}
        {done && timeline.steps.length > 0 && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={replay}>
            ▶ ดูการเฉลยอีกครั้ง
          </button>
        )}
        {done && timeline.eventsDone < timeline.eventsTotal && (
          <span className="pr-partial">
            นับจาก {timeline.eventsDone}/{timeline.eventsTotal} รายการที่แข่งจบแล้ว
          </span>
        )}
      </div>

      {phase === 'outro' && mode === 'play' && <Confetti durationMs={5000} />}

      {selectedTeam && (
        <ScoreBreakdown
          team={selectedTeam}
          breakdown={teamBreakdown(selectedTeam.id, events, pts)}
          rank={ranks[selectedTeam.id]}
          points={pts}
          eventsDone={timeline.eventsDone}
          eventsTotal={timeline.eventsTotal}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

/** "X2.3X" with each hidden digit drawn as a blurred placeholder (the real digit is not in the page). */
function Teaser({ masked }) {
  return (
    <span className="pr-teaser" aria-label={`สปอยล์คะแนน ${masked.replace(/X/g, '?')}`}>
      {[...masked].map((c, i) =>
        c === 'X' ? (
          <span key={i} className="pr-teaser-x" aria-hidden="true">
            ?
          </span>
        ) : (
          <span key={i} aria-hidden="true">
            {c}
          </span>
        )
      )}
    </span>
  );
}

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.25 },
};
