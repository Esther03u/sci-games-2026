'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import Counter from '@/components/ui/Counter';
import Confetti from '@/components/ui/Confetti';
import { createClient } from '@/lib/supabase/client';
import { Trophy, Sparkles, Clock, Zap } from '@/components/animate-ui/icons';

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

  // Keep track of parent reveal state if passed
  useEffect(() => {
    if (initialSettings?.revealed !== undefined && initialSettings.revealed !== isRevealed) {
      onRevealChange?.(Boolean(initialSettings.revealed));
    }
  }, [initialSettings?.revealed, isRevealed, onRevealChange]);

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

  // Handle Realtime sync + periodic polling
  useEffect(() => {
    if (previewMode) return;

    const supabase = createClient();
    const channelName = `podium-sync-${Math.random().toString(36).slice(2, 7)}`;
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'podium_update' }, ({ payload }) => {
        if (!payload) return;
        setSettings((prev) => ({ ...prev, ...payload }));

        // Handle instant or fast_forward trigger
        if (payload.status === 'fast_forward' && payload.fast_forward_at) {
          if (lastProcessedFfRef.current !== payload.fast_forward_at) {
            lastProcessedFfRef.current = payload.fast_forward_at;
            triggerFastForwardAnimation();
          }
        } else if (payload.revealed) {
          onRevealChange?.(true);
        } else if (payload.revealed === false) {
          onRevealChange?.(false);
        }
      })
      .subscribe();

    // Fallback polling every 8s
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/public/podium-settings', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (json?.data) {
          const fresh = json.data;
          setSettings((prev) => ({ ...prev, ...fresh }));

          if (
            fresh.status === 'fast_forward' &&
            fresh.fast_forward_at &&
            lastProcessedFfRef.current !== fresh.fast_forward_at
          ) {
            const ageMs = Date.now() - new Date(fresh.fast_forward_at).getTime();
            if (ageMs < 8000) {
              lastProcessedFfRef.current = fresh.fast_forward_at;
              triggerFastForwardAnimation();
            } else if (!isRevealed) {
              onRevealChange?.(true);
            }
          } else if (fresh.revealed !== isRevealed) {
            onRevealChange?.(Boolean(fresh.revealed));
          }
        }
      } catch {
        // silent polling catch
      }
    }, 8000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
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

  return (
    <>
      {showConfetti && <Confetti durationMs={5000} />}

      <div className={`podium-countdown-container ${isFastForwarding ? 'is-fastforward' : ''}`}>
        <AnimatePresence mode="wait">
          {isRevealed ? (
            <motion.div
              key="revealed-banner"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="podium-revealed-banner"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                    flexShrink: 0,
                  }}
                >
                  <Trophy size={22} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)', margin: 0 }}>
                    ประกาศผลคะแนนรวมอย่างเป็นทางการแล้ว!
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', margin: '0.15rem 0 0' }}>
                    ขอแสดงความยินดีกับทุกสีในการแข่งขัน Sci Games 2026
                  </p>
                </div>
              </div>
              <Link
                href="/standings"
                className="btn btn-primary btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>ดูตารางคะแนนฉบับเต็ม</span>
                <span>→</span>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="countdown-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
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
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
