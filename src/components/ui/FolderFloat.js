'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import './FolderFloat.css';

const M = Matter?.default || Matter;
const { Bodies, Body, Composite, Engine } = M;

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const DEFAULT_ITEMS = [
  'Try a warmer palette',
  'Tighten the spacing',
  'Logo feels small',
  'Love the new hero',
];
const PAD = 14;
const CHAR = 4.8;
const GAP = 4;
const DRAG_MIN = 4;
const ZONE_PAD = 6;

const jitter = (i) => {
  const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return x - Math.floor(x);
};

const layout = (list, spread, lift, tilt, sizes, rowHeight = 15, cluster = false) => {
  const n = list.length;
  if (cluster && n > 0) {
    // Elliptical cloud / cluster layout with natural overlap and wider spread
    const rx = Math.max(95, spread * 1.02);
    const ry = Math.min(80, Math.max(62, rx * 0.52));
    // Center Y sits so bottom of cluster emerges right from the folder flap and top clears title
    const cy = -Math.round(lift + ry * 0.95);
    const phi = 2.39996323; // Golden angle in radians
    const pos = [];

    for (let i = 0; i < n; i++) {
      // Fermat spiral distribution with power factor 0.64 for uniform outward dispersion
      const rNorm = Math.pow((i + 0.5) / n, 0.64);
      const theta = i * phi;

      const j1 = jitter(i * 3 + 1);
      const j2 = jitter(i * 7 + 5);
      const j3 = jitter(i * 11 + 9);

      const jx = (j1 - 0.5) * 10;
      const jy = (j2 - 0.5) * 8;
      const rTilt = tilt * (j3 * 2 - 1);

      const x = rx * rNorm * Math.cos(theta) + jx;
      const yCenter = cy + ry * rNorm * Math.sin(theta) + jy;

      const bh = sizes[i]?.h ?? 28;
      pos[i] = {
        x,
        y: yCenter - bh / 2,
        r: rTilt,
        zIndex: 10 + Math.floor(j2 * 40),
      };
    }
    return pos;
  }

  // Fallback row layout
  const rows = [];
  let row = [];
  let width = 0;
  list.forEach((item, i) => {
    const pw = sizes[i]?.w ?? PAD + item.label.length * CHAR;
    if (row.length && width + GAP + pw > spread * 2) {
      rows.push({ items: row, width });
      row = [];
      width = 0;
    }
    row.push({ i, pw });
    width += (row.length > 1 ? GAP : 0) + pw;
  });
  if (row.length) rows.push({ items: row, width });
  const pos = [];
  rows.forEach((r, ri) => {
    let x = -r.width / 2;
    const shift = (ri % 2 ? 1 : -1) * Math.min(10, spread * 0.06);
    r.items.forEach(({ i, pw }) => {
      const j = jitter(i);
      pos[i] = {
        x: x + pw / 2 + shift + (j - 0.5) * 4,
        y: -lift - ri * rowHeight - j * 3,
        r: tilt * (j * 2 - 1),
        zIndex: i + 1,
      };
      x += pw + GAP;
    });
  });
  return pos;
};

export default function FolderFloat({
  items = DEFAULT_ITEMS,
  label = 'Design feedback',
  sublabel = '',
  trigger = 'hover',
  defaultOpen = false,
  closeOnSelect = true,
  physics = true,
  drift = 0.5,
  cluster = false,
  onSelect,
  onOpenChange,
  folderColor = '#3f3f46',
  frontColor = '#52525b',
  paperColor = '#f5f5f5',
  itemColor = '#f5f5f5',
  itemTextColor = '#18181b',
  labelColor = '#f5f5f5',
  width = 200,
  height = 148,
  radius = 14,
  spread = 180,
  lift = 26,
  tilt = 8,
  rowHeight = 38,
  flapAngle = 34,
  restAngle = 16,
  openDuration = 520,
  stagger = 45,
  bounce = 0.3,
  className = '',
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [popped, setPopped] = useState(-1);
  const [live, setLive] = useState(false);
  const [sizes, setSizes] = useState([]);
  const anchorRef = useRef(null);
  const pillRefs = useRef([]);
  const world = useRef({
    engine: null,
    bodies: [],
    sizes: [],
    raf: 0,
    last: 0,
    t0: 0,
    drag: null,
    zone: null,
    live: false,
  });
  const latest = useRef({ onSelect, onOpenChange, drift, reduce: false });
  useEffect(() => {
    latest.current.onSelect = onSelect;
    latest.current.onOpenChange = onOpenChange;
    latest.current.drift = drift;
  }, [onSelect, onOpenChange, drift]);
  const popTimer = useRef(undefined);
  const liveTimer = useRef(undefined);
  const containerRef = useRef(null);
  const [actualSpread, setActualSpread] = useState(spread);

  useIsomorphicLayoutEffect(() => {
    const updateSpread = () => {
      if (typeof window !== 'undefined') {
        const maxAvail = Math.floor((window.innerWidth - 68) / 2);
        setActualSpread(Math.min(spread, Math.max(90, maxAvail)));
      }
    };
    updateSpread();
    window.addEventListener('resize', updateSpread);
    return () => window.removeEventListener('resize', updateSpread);
  }, [spread]);

  const list = items.map((item) => (typeof item === 'string' ? { label: item, value: item } : item));
  const n = list.length;
  const sub = sublabel || `${n} ${n === 1 ? 'note' : 'notes'}`;
  const pos = layout(list, actualSpread, lift, tilt, sizes, rowHeight, cluster);

  const labelsKey = list.map((item) => item.label).join('|');
  useIsomorphicLayoutEffect(() => {
    const measure = () => {
      const next = pillRefs.current
        .slice(0, n)
        .map((el) => (el ? { w: el.offsetWidth, h: el.offsetHeight } : null));
      if (next.some((s) => !s)) return;
      setSizes((prev) =>
        prev.length === next.length && prev.every((s, i) => s.w === next[i].w && s.h === next[i].h)
          ? prev
          : next
      );
    };
    measure();
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(measure);
    }
  }, [n, labelsKey]);

  const stopPhysics = useCallback(() => {
    const w = world.current;
    clearTimeout(liveTimer.current);
    cancelAnimationFrame(w.raf);
    w.raf = 0;
    if (w.engine) {
      w.bodies.forEach((b, i) => {
        const el = pillRefs.current[i];
        if (!el) return;
        el.style.setProperty('--x', `${b.position.x.toFixed(1)}px`);
        el.style.setProperty('--y', `${(b.position.y - w.sizes[i].h / 2).toFixed(1)}px`);
      });
      Composite.clear(w.engine.world, false, true);
      Engine.clear(w.engine);
      w.engine = null;
    }
    w.bodies = [];
    w.drag = null;
    w.live = false;
    setLive(false);
  }, []);

  const startPhysics = useCallback(() => {
    const w = world.current;
    if (w.engine) return;
    const els = pillRefs.current.slice(0, n);
    if (els.some((el) => !el)) return;
    const engine = Engine.create({ gravity: { x: 0, y: 0 } });
    engine.enableSleeping = false;
    w.engine = engine;
    w.sizes = els.map((el) => ({ w: el.offsetWidth, h: el.offsetHeight }));
    const ys = pos.map((p) => p.y);
    const xs = pos.map((p) => p.x);
    const zone = {
      left: Math.min(-actualSpread, ...xs) - ZONE_PAD - 20,
      right: Math.max(actualSpread, ...xs) + ZONE_PAD + 20,
      top: Math.min(...ys) - ZONE_PAD - 8,
      bottom: Math.max(...ys.map((y, i) => y + (w.sizes[i]?.h || 28))) + 12,
    };
    w.zone = zone;
    w.bodies = els.map((el, i) => {
      const { w: bw, h: bh } = w.sizes[i];
      const homeX = pos[i].x;
      const homeY = pos[i].y + bh / 2;
      const b = Bodies.rectangle(homeX, homeY, bw * 0.65, bh * 0.65, {
        chamfer: { radius: Math.min((bh * 0.65) / 2 - 1, 6) },
        collisionFilter: {
          group: -1, // Negative group ensures overlapping bodies don't violently collide
        },
        restitution: 0.15,
        friction: 0.06,
        frictionAir: 0.12,
        inertia: Infinity,
      });
      b.plugin = {
        phase: jitter(i) * Math.PI * 2,
        homeX,
        homeY,
        baseR: pos[i].r,
      };
      return b;
    });
    const T = 80;
    const walls = [
      Bodies.rectangle((zone.left + zone.right) / 2, zone.top - T / 2, zone.right - zone.left + 2 * T, T, {
        isStatic: true,
      }),
      Bodies.rectangle((zone.left + zone.right) / 2, zone.bottom + T / 2, zone.right - zone.left + 2 * T, T, {
        isStatic: true,
      }),
      Bodies.rectangle(zone.left - T / 2, (zone.top + zone.bottom) / 2, T, zone.bottom - zone.top + 2 * T, {
        isStatic: true,
      }),
      Bodies.rectangle(zone.right + T / 2, (zone.top + zone.bottom) / 2, T, zone.bottom - zone.top + 2 * T, {
        isStatic: true,
      }),
    ];
    Composite.add(engine.world, [...w.bodies, ...walls]);
    w.live = true;
    w.last = 0;
    w.t0 = performance.now();
    setLive(true);
    const tick = (now) => {
      const s = world.current;
      if (!s.engine) return;
      const dt = s.last ? Math.min(32, now - s.last) : 16;
      s.last = now;
      const t = (now - s.t0) / 1000;
      const driftMult = latest.current.drift ?? 0.5;
      s.bodies.forEach((b, i) => {
        if (s.drag && s.drag.i === i) return;
        const ph = b.plugin.phase;
        const homeX = b.plugin.homeX ?? pos[i].x;
        const homeY = b.plugin.homeY ?? (pos[i].y + s.sizes[i].h / 2);

        // Soft lunar zero-gravity orbit target (dreamy, slow, gentle)
        const lunarAmpX = (4 + (i % 4) * 1.5) * driftMult;
        const lunarAmpY = (5 + (i % 5) * 1.6) * driftMult;
        const lunarSpeedX = 0.35 + (i % 3) * 0.08;
        const lunarSpeedY = 0.42 + (i % 4) * 0.07;

        const targetX = homeX + Math.sin(t * lunarSpeedX + ph) * lunarAmpX;
        const targetY = homeY + Math.cos(t * lunarSpeedY + ph * 1.3) * lunarAmpY;

        // Smooth spring pull towards the floating target position
        const springK = 0.00022;
        const springX = (targetX - b.position.x) * springK;
        const springY = (targetY - b.position.y) * springK;

        Body.applyForce(b, b.position, {
          x: springX * b.mass,
          y: springY * b.mass,
        });
      });
      Engine.update(s.engine, dt);
      s.bodies.forEach((b, i) => {
        const el = pillRefs.current[i];
        if (!el) return;
        el.style.setProperty('--x', `${b.position.x.toFixed(1)}px`);
        el.style.setProperty('--y', `${(b.position.y - s.sizes[i].h / 2).toFixed(1)}px`);
        // Subtle weightless sway in lunar gravity
        const baseR = b.plugin.baseR ?? pos[i].r;
        const swayR = Math.sin(t * 0.35 + ph) * 2.5;
        el.style.setProperty('--r', `${(baseR + swayR).toFixed(2)}deg`);
      });
      s.raf = requestAnimationFrame(tick);
    };
    w.raf = requestAnimationFrame(tick);
  }, [n, actualSpread, lift, pos]);

  const set = useCallback(
    (next) => {
      if (!next) stopPhysics();
      setOpen((prev) => {
        if (prev === next) return prev;
        latest.current.onOpenChange?.(next);
        return next;
      });
    },
    [stopPhysics]
  );

  useEffect(() => {
    clearTimeout(liveTimer.current);
    if (!open || !physics || latest.current.reduce) {
      return undefined;
    }
    liveTimer.current = setTimeout(startPhysics, openDuration + (n - 1) * stagger + 80);
    return () => {
      clearTimeout(liveTimer.current);
      stopPhysics();
    };
  }, [open, physics, openDuration, stagger, n, startPhysics, stopPhysics]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      latest.current.reduce = mq.matches;
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(popTimer.current);
      stopPhysics();
    },
    [stopPhysics]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      const timer = setTimeout(() => set(true), 250);
      return () => clearTimeout(timer);
    }

    let delayTimer;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            clearTimeout(delayTimer);
            delayTimer = setTimeout(() => {
              set(true);
            }, 180);
          } else {
            clearTimeout(delayTimer);
            if (!world.current.drag) {
              set(false);
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => {
      clearTimeout(delayTimer);
      observer.disconnect();
    };
  }, [set]);

  const pick = (item, i) => {
    latest.current.onSelect?.(item.value, i);
    clearTimeout(popTimer.current);
    setPopped(i);
    popTimer.current = setTimeout(() => setPopped(-1), 320);
    if (closeOnSelect) set(false);
  };

  const pointerAt = (e) => {
    const r = anchorRef.current?.getBoundingClientRect();
    return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : { x: 0, y: 0 };
  };
  const down = (e, i) => {
    const w = world.current;
    if (!w.live || e.button !== 0) return;
    const b = w.bodies[i];
    if (!b) return;
    const p = pointerAt(e);
    w.drag = {
      i,
      id: e.pointerId,
      dx: b.position.x - p.x,
      dy: b.position.y - p.y,
      sx: e.clientX,
      sy: e.clientY,
      moved: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };
  const move = (e, i) => {
    const w = world.current;
    const d = w.drag;
    if (!d || d.i !== i || d.id !== e.pointerId) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) >= DRAG_MIN) {
      d.moved = true;
      e.currentTarget.setAttribute('data-drag', '');
    }
    if (!d.moved) return;
    const b = w.bodies[i];
    const { w: bw, h: bh } = w.sizes[i];
    const z = w.zone;
    const p = pointerAt(e);
    const x = Math.min(z.right - bw / 2, Math.max(z.left + bw / 2, p.x + d.dx));
    const y = Math.min(z.bottom - bh / 2, Math.max(z.top + bh / 2, p.y + d.dy));
    Body.setVelocity(b, { x: (x - b.position.x) * 0.6, y: (y - b.position.y) * 0.6 });
    Body.setPosition(b, { x, y });
  };
  const up = (e, i, item) => {
    const w = world.current;
    const d = w.drag;
    if (!d || d.i !== i || d.id !== e.pointerId) return;
    w.drag = null;
    e.currentTarget.removeAttribute('data-drag');
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    if (!d.moved && e.type === 'pointerup') pick(item, i);
  };

  const hover = trigger === 'hover';

  return (
    <div
      ref={containerRef}
      className={`folder-float${className ? ` ${className}` : ''}`}
      data-open={open ? '' : undefined}
      data-live={live ? '' : undefined}
      data-physics={physics ? '' : undefined}
      data-trigger={trigger}
      onPointerEnter={hover ? () => set(true) : undefined}
      onPointerLeave={
        hover
          ? () => {
              if (!world.current.drag) set(false);
            }
          : undefined
      }
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          set(false);
        }
      }}
      style={{
        '--ff-w': `${width}px`,
        '--ff-h': `${height}px`,
        '--ff-r': `${radius}px`,
        '--ff-back': folderColor,
        '--ff-front': frontColor,
        '--ff-paper': paperColor,
        '--ff-item': itemColor,
        '--ff-item-ink': itemTextColor,
        '--ff-label': labelColor,
        '--ff-spread': `${actualSpread}px`,
        '--ff-lift': `${lift}px`,
        '--ff-angle': `${flapAngle}deg`,
        '--ff-rest': `${restAngle}deg`,
        '--ff-open': `${openDuration}ms`,
        '--ff-close': `${Math.round(openDuration * 0.6)}ms`,
        '--ff-stagger': `${stagger}ms`,
        '--ff-n': n,
        '--ff-spring': `cubic-bezier(0.34, ${(1 + bounce * 1.9).toFixed(2)}, 0.64, 1)`,
      }}
    >
      <div ref={anchorRef} className="folder-float__items">
        {list.map((item, i) => {
          const p = pos[i];
          return (
            <button
              key={`${item.value}-${i}`}
              ref={(el) => {
                pillRefs.current[i] = el;
              }}
              type="button"
              className="folder-float__item"
              tabIndex={open ? 0 : -1}
              aria-hidden={!open}
              data-pop={popped === i ? '' : undefined}
              style={{
                '--i': i,
                '--x': `${p.x.toFixed(1)}px`,
                '--y': `${p.y.toFixed(1)}px`,
                '--r': `${p.r.toFixed(2)}deg`,
                '--z': p?.zIndex ?? i + 1,
              }}
              onPointerDown={(e) => down(e, i)}
              onPointerMove={(e) => move(e, i)}
              onPointerUp={(e) => up(e, i, item)}
              onPointerCancel={(e) => up(e, i, item)}
              onClick={(e) => {
                if (!world.current.live || e.detail === 0) pick(item, i);
              }}
            >
              <span className="folder-float__drift">{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="folder-float__folder">
        <span className="folder-float__back" aria-hidden="true" />
        <span className="folder-float__paper" aria-hidden="true" />
        <span className="folder-float__front" aria-hidden="true">
          <span className="folder-float__label">{label}</span>
          <span className="folder-float__sub">{sub}</span>
        </span>
        <button
          type="button"
          className="folder-float__trigger"
          aria-expanded={open}
          aria-label={`${label}, ${sub}`}
          onClick={() => set(!open)}
        />
      </div>
    </div>
  );
}
