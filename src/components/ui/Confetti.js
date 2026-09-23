'use client';

import { useEffect, useRef } from 'react';

/**
 * Lightweight, zero-dependency canvas confetti explosion.
 * Automatically cleans up after durationMs.
 */
export default function Confetti({ durationMs = 4500 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Color palette matching Sci Games 2026 teams + gold champion theme
    const colors = [
      '#f59e0b', // Gold
      '#fbbf24', // Amber
      '#ef4444', // Red team
      '#3b82f6', // Blue team
      '#22c55e', // Green team
      '#eab308', // Yellow team
      '#ec4899', // Pink
      '#8b5cf6', // Purple
    ];

    const particleCount = Math.min(120, Math.floor(window.innerWidth / 10));
    const particles = Array.from({ length: particleCount }, () => ({
      x: width * (0.2 + Math.random() * 0.6),
      y: height * 0.35 + (Math.random() * 50 - 25),
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 12 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12,
      gravity: 0.28,
      drag: 0.98,
      alpha: 1,
      decay: Math.random() * 0.005 + 0.004,
    }));

    const startTime = performance.now();

    const render = (now) => {
      ctx.clearRect(0, 0, width, height);

      let activeParticles = 0;
      for (const p of particles) {
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.alpha = Math.max(0, p.alpha - p.decay);

        if (p.alpha > 0 && p.y < height + 20) {
          activeParticles++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }

      if (activeParticles > 0 && now - startTime < durationMs) {
        animId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [durationMs]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}
