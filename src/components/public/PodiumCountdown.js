'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Counter from '@/components/ui/Counter';
import Confetti from '@/components/ui/Confetti';
import { Clock, Zap } from '@/components/animate-ui/icons';
import { isPodiumRevealed } from '@/lib/podium';

const POLL_MS = 8000;
// A viewer sees "fast forward" up to POLL_MS + the API's 5 s edge cache after
// the admin pressed it; within this window they still get the animation,
// later than that the podium is simply revealed.
const FAST_FORWARD_WINDOW_MS = 20000;

export default function PodiumCountdown({
  initialSettings = {},
  onRevealChange,
  isRevealed = false,
  previewMode = false,
}) {
  const [settings, setSettings] = useState(() => ({
    enabled: true,
    status: 'countdown',
    target_time: '2026-10-11T16:30:00+07:00',
    title: 'นับถอยหลังสู่การประกาศผลคะแนนรวม',
    subtitle: 'ร่วมลุ้นว่าสีไหนจะได้ครองอันดับเท่าไหร่ในงาน Sci Games 2026',
    revealed: false,
    fast_forward_at: null,
    ...initialSettings,
  }));

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [isHolding, setIsHolding] = useState(false);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const fastForwardRunningRef = useRef(false);
  const lastProcessedFfRef = useRef(null);

  // Sync the parent with the server-provided settings when they change. Not on
  // every isRevealed change: after a fast-forward the saved settings still say
  // revealed: false, and re-syncing then snapped the podium back to the countdown.
  const initialRevealed = isPodiumRevealed(initialSettings);
  const initialFfAt = initialSettings?.status === 'fast_forward' ? initialSettings.fast_forward_at : null;
  useEffect(() => {
    // a page opened after the fast-forward shows the result without replaying it
    if (initialFfAt) lastProcessedFfRef.current = initialFfAt;
    onRevealChange?.(initialRevealed);
  }, [initialRevealed, initialFfAt, onRevealChange]);

  // Fast-forward animation sequence: Rapid spin -> Slowdown -> Reveal
  const triggerFastForwardAnimation = useCallback(() => {
    if (fastForwardRunningRef.current) return;
    fastForwardRunningRef.current = true;
    setIsFastForwarding(true);

    // Initial countdown values to accelerate from
    let simSeconds = 59;
    let simMinutes = 15;
    let simHours = 2;
    let simDays = 0;

    // Phase 1: Rapid Acceleration (0 to ~2200ms) - Rapid spinning numbers
    const phase1Interval = setInterval(() => {
      simSeconds = (simSeconds - 7 + 60) % 60;
      if (simMinutes > 0) simMinutes = Math.max(0, simMinutes - 3);
      if (simHours > 0) simHours = Math.max(0, simHours - 1);
      simDays = 0;

      setTimeLeft({
        days: simDays,
        hours: simHours,
        minutes: simMinutes,
        seconds: simSeconds,
      });
    }, 60);

    // Transition to Phase 2: Deceleration suspense (~2200ms)
    setTimeout(() => {
      clearInterval(phase1Interval);

      // Final countdown ticks: 5, 4, 3, 2, 1, 0 with dramatic timing
      let finalTicks = [5, 4, 3, 2, 1, 0];
      let tickIdx = 0;

      const runTick = () => {
        if (tickIdx < finalTicks.length) {
          const sec = finalTicks[tickIdx];
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: sec });
          tickIdx++;
          // Suspense timing: gradually slowing down slightly
          const delay = 350 + tickIdx * 70;
          setTimeout(runTick, delay);
        } else {
          // Phase 3: The Big Reveal!
          setIsFastForwarding(false);
          fastForwardRunningRef.current = false;
          setShowConfetti(true);
          onRevealChange?.(true);
        }
      };

      runTick();
    }, 2200);
  }, [onRevealChange]);

  // Poll the (edge-cached) settings. Spectators deliberately don't open a
  // Supabase Realtime channel: the free tier allows 200 connections for the
  // whole project and the referees' scoring screens need them.
  useEffect(() => {
    if (previewMode) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/public/podium-settings', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (json?.data) {
          const fresh = json.data;
          setSettings((prev) => ({ ...prev, ...fresh }));

          const ffAt = fresh.status === 'fast_forward' ? fresh.fast_forward_at : null;
          if (ffAt && lastProcessedFfRef.current !== ffAt) {
            // a new fast-forward: animate if it just happened, otherwise reveal directly
            lastProcessedFfRef.current = ffAt;
            const ageMs = Date.now() - new Date(ffAt).getTime();
            if (ageMs < FAST_FORWARD_WINDOW_MS) triggerFastForwardAnimation();
            else onRevealChange?.(true);
            return;
          }
          // the running animation reveals when it ends
          if (fastForwardRunningRef.current) return;
          const revealed = isPodiumRevealed(fresh);
          if (revealed !== isRevealed) onRevealChange?.(revealed);
        }
      } catch {
        // silent polling catch
      }
    }, POLL_MS);

    return () => clearInterval(pollInterval);
  }, [previewMode, isRevealed, onRevealChange, triggerFastForwardAnimation]);

  // Main countdown timer ticker
  useEffect(() => {
    if (isRevealed || isFastForwarding) return;

    const calcTime = () => {
      const target = new Date(settings.target_time).getTime();
      const now = Date.now();
      const diff = target - now;

      // Condition 1: Reached 00:00:00 -> Hold time and wait for admin!
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsHolding(true);
        return;
      }

      // Normal countdown ticking
      setIsHolding(false);
      const totalSeconds = Math.floor(diff / 1000);
      const d = Math.floor(totalSeconds / 86400);
      const h = Math.floor((totalSeconds % 86400) / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
    };

    calcTime();
    const interval = setInterval(calcTime, 1000);

    return () => clearInterval(interval);
  }, [settings.target_time, isRevealed, isFastForwarding]);

  if (settings.enabled === false && !previewMode) {
    return null;
  }

  // Once revealed, hide the countdown completely (only trigger confetti celebration)
  if (isRevealed) {
    return showConfetti ? <Confetti durationMs={5000} /> : null;
  }

  return (
    <>
      {showConfetti && <Confetti durationMs={5000} />}

      <div className={`podium-countdown-container ${isFastForwarding ? 'is-fastforward' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key="countdown-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pdc-stack"
          >
            {/* Status Header Badge */}
            <div className="podium-countdown-title-wrap">
              {isFastForwarding ? (
                <span className="podium-countdown-badge fastforward">
                  <Zap size={14} style={{ color: '#d97706' }} />
                  <span>กำลังเร่งเวลาสู่การประกาศผลคะแนน!</span>
                </span>
              ) : isHolding ? (
                <span className="podium-countdown-badge holding">
                  <Clock size={14} style={{ color: 'var(--accent-text)' }} />
                  <span>ถึงเวลากำหนดแล้ว · ปิดผนึกผลคะแนน รอสัญญาณประกาศผล...</span>
                </span>
              ) : (
                <span className="podium-countdown-badge">
                  <Clock size={14} style={{ color: 'var(--accent-text)' }} />
                  <span>{settings.title || 'นับถอยหลังสู่การประกาศผลคะแนนรวม'}</span>
                </span>
              )}
            </div>

            {/* 4 Unit Countdown Grid using <Counter /> from React Bits */}
            <div className="podium-countdown-grid">
              {/* Days */}
              <div className="podium-time-card">
                <Counter
                  value={timeLeft.days}
                  places={timeLeft.days >= 100 ? [100, 10, 1] : [10, 1]}
                  fontSize={26}
                  padding={4}
                  gap={2}
                  textColor="var(--text)"
                  fontWeight={800}
                  gradientFrom="var(--surface-card)"
                  gradientTo="transparent"
                  gradientHeight={8}
                />
                <span className="podium-time-label">วัน</span>
              </div>

              <span className={`podium-time-sep ${!isHolding ? 'blink' : ''}`}>:</span>

              {/* Hours */}
              <div className="podium-time-card">
                <Counter
                  value={timeLeft.hours}
                  places={[10, 1]}
                  fontSize={26}
                  padding={4}
                  gap={2}
                  textColor="var(--text)"
                  fontWeight={800}
                  gradientFrom="var(--surface-card)"
                  gradientTo="transparent"
                  gradientHeight={8}
                />
                <span className="podium-time-label">ชม.</span>
              </div>

              <span className={`podium-time-sep ${!isHolding ? 'blink' : ''}`}>:</span>

              {/* Minutes */}
              <div className="podium-time-card">
                <Counter
                  value={timeLeft.minutes}
                  places={[10, 1]}
                  fontSize={26}
                  padding={4}
                  gap={2}
                  textColor="var(--text)"
                  fontWeight={800}
                  gradientFrom="var(--surface-card)"
                  gradientTo="transparent"
                  gradientHeight={8}
                />
                <span className="podium-time-label">นาที</span>
              </div>

              <span className={`podium-time-sep ${!isHolding ? 'blink' : ''}`}>:</span>

              {/* Seconds */}
              <div className="podium-time-card">
                <Counter
                  value={timeLeft.seconds}
                  places={[10, 1]}
                  fontSize={26}
                  padding={4}
                  gap={2}
                  textColor={isFastForwarding ? '#ef4444' : 'var(--text)'}
                  fontWeight={800}
                  gradientFrom="var(--surface-card)"
                  gradientTo="transparent"
                  gradientHeight={8}
                />
                <span className="podium-time-label">วินาที</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
