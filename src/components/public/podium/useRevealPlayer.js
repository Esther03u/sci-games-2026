'use client';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

// ~42 s for 11 events (decision 10 ต.ค.): intro, then per event the name
// first, then every colour's bar grows with its "+points" pop, then a pause;
// the outro is the winner showcase.
export const TIMING = { intro: 2000, label: 800, step: 3200, outro: 4500 };

/**
 * Walks the reveal timeline. phase: 'idle' (nothing shown yet) → 'intro' →
 * 'step' (stepIdx 0…n-1; `grown` once the bars for that step may grow) →
 * 'outro' → 'done'.
 * @param {number} stepCount
 * @param {'mystery'|'play'|'final'} mode
 */
export function useRevealPlayer(stepCount, mode) {
  const reduce = useReducedMotion();
  const start = mode === 'play' && !reduce ? 'intro' : mode === 'mystery' ? 'idle' : 'done';
  const [state, setState] = useState({ phase: start, stepIdx: -1, grown: false, mode });

  // the parent switched mode (countdown reached zero / replay / admin preview)
  if (state.mode !== mode) setState({ phase: start, stepIdx: -1, grown: false, mode });

  const { phase, stepIdx, grown } = state;

  useEffect(() => {
    let ms;
    let next;
    if (phase === 'intro') {
      ms = TIMING.intro;
      next = stepCount ? { phase: 'step', stepIdx: 0, grown: false } : { phase: 'outro' };
    } else if (phase === 'step' && !grown) {
      ms = TIMING.label;
      next = { grown: true };
    } else if (phase === 'step') {
      ms = TIMING.step - TIMING.label;
      next =
        stepIdx + 1 < stepCount
          ? { stepIdx: stepIdx + 1, grown: false }
          : { phase: 'outro', stepIdx, grown: true };
    } else if (phase === 'outro') {
      ms = TIMING.outro;
      next = { phase: 'done' };
    } else {
      return undefined;
    }
    const id = setTimeout(() => setState((s) => ({ ...s, ...next })), ms);
    return () => clearTimeout(id);
  }, [phase, stepIdx, grown, stepCount]);

  const replay = () =>
    setState((s) => ({ ...s, phase: reduce ? 'done' : 'intro', stepIdx: -1, grown: false }));
  const skip = () => setState((s) => ({ ...s, phase: 'done' }));

  return { phase, stepIdx, grown, replay, skip };
}
