'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import CeremonyPrintSheet from '@/components/admin/CeremonyPrintSheet';
import {
  paginateCeremonyEvents,
  haveCeremonyEventsChanged,
  haveStandingsChanged,
} from '@/lib/ceremony';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  RefreshCw,
  Radio,
  CheckCircle2,
} from 'lucide-react';

export default function McTeleprompter({
  initialEvents = [],
  initialStandings = [],
  sports = [],
  teams = [],
}) {
  const [events, setEvents] = useState(initialEvents);
  const [standings, setStandings] = useState(initialStandings);
  const [currentPage, setCurrentPage] = useState(1);
  const [stageTheme, setStageTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('sci_games_mc_theme');
        if (saved === 'dark' || saved === 'light') return saved;
      } catch {}
    }
    return 'light'; // Default: light theme (โหมดสว่าง อ่านง่ายชัดเจน)
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [lastSync, setLastSync] = useState(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  const etagRef = useRef(null);
  const eventsRef = useRef(events);
  const standingsRef = useRef(standings);

  useEffect(() => {
    eventsRef.current = events;
    standingsRef.current = standings;
  }, [events, standings]);

  const toggleStageTheme = () => {
    setStageTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('sci_games_mc_theme', next);
        }
      } catch {}
      return next;
    });
  };

  const wakeLockRef = useRef(null);

  const pages = paginateCeremonyEvents(events);
  const totalPages = Math.max(1, pages.length);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  // 1. Screen Wake Lock API (keep phone/tablet screen on during ceremony)
  useEffect(() => {
    let released = false;

    const acquireLock = async () => {
      if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
        try {
          const lock = await navigator.wakeLock.request('screen');
          if (released) {
            lock.release().catch(() => {});
            return;
          }
          wakeLockRef.current = lock;
          setWakeLockActive(true);
          lock.addEventListener('release', () => {
            setWakeLockActive(false);
          });
        } catch {
          setWakeLockActive(false);
        }
      }
    };

    acquireLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        acquireLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      released = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  // 2. Keyboard & Presenter Clicker Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentPage((p) => Math.min(totalPages, p + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentPage((p) => Math.max(1, p - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages]);

  // 3. Smart Live Auto-Sync: Poll /api/ceremony/live with conditional ETag & zero-rerender diffing
  const fetchLatestData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const headers = {};
      if (etagRef.current) {
        headers['If-None-Match'] = etagRef.current;
      }
      const res = await fetch('/api/ceremony/live', { cache: 'no-store', headers });
      if (res.status === 304) {
        // Data unchanged on CDN/server; skip re-render completely
        setLastSync(new Date());
        setIsRefreshing(false);
        return;
      }
      const newEtag = res.headers.get('etag');
      if (newEtag) etagRef.current = newEtag;

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const nextEvents = json.data.events;
          const nextStandings = json.data.standings;
          if (nextEvents && haveCeremonyEventsChanged(eventsRef.current, nextEvents)) {
            setEvents(nextEvents);
          }
          if (nextStandings && haveStandingsChanged(standingsRef.current, nextStandings)) {
            setStandings(nextStandings);
          }
          setLastSync(new Date());
        }
      }
    } catch {
      // Ignore network errors gracefully
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      fetchLatestData();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchLatestData]);

  // Refetch immediately when tab/phone screen becomes visible or reconnects online
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchLatestData();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', fetchLatestData);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', fetchLatestData);
    };
  }, [fetchLatestData]);

  // 4. Touch Swipe Gestures
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      // Swipe left -> Next Page
      setCurrentPage((p) => Math.min(totalPages, p + 1));
    } else if (diff < -50) {
      // Swipe right -> Prev Page
      setCurrentPage((p) => Math.max(1, p - 1));
    }
    setTouchStartX(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (d) => {
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div
      className={`mc-stage-shell ${stageTheme === 'dark' ? 'stage-dark' : 'stage-light'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        minHeight: '100vh',
        background: stageTheme === 'dark' ? '#090d16' : '#f1f5f9',
        color: stageTheme === 'dark' ? '#f8fafc' : '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-kanit), "Kanit", sans-serif',
      }}
    >
      {/* Top Floating Stage Header Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: stageTheme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: stageTheme === 'dark' ? '1px solid #334155' : '1px solid #cbd5e1',
          padding: '0.65rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.6rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              background: '#065f46',
              color: '#a7f3d0',
            }}
          >
            <Radio size={13} className="animate-pulse" />
            <span>ซิงก์ผลสด ({formatTime(lastSync)})</span>
          </div>

          {wakeLockActive ? (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#facc15',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
              title="หน้าจอจะไม่ดับอัตโนมัติขณะอยู่บนเวที"
            >
              <CheckCircle2 size={13} />
              <span className="hidden-sm">จอไม่ดับ</span>
            </span>
          ) : null}
        </div>

        {/* Quick Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={fetchLatestData}
            disabled={isRefreshing}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.3rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            title="รีเฟรชผลคะแนนทันที"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            <span style={{ fontSize: '0.78rem' }}>อัปเดต</span>
          </button>

          <button
            onClick={toggleStageTheme}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.3rem 0.55rem' }}
            title={stageTheme === 'light' ? 'เปลี่ยนเป็นธีมเวที (มืด)' : 'เปลี่ยนเป็นธีมสว่าง'}
          >
            {stageTheme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.3rem 0.55rem' }}
            title="ขยายเต็มจอ"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </header>

      {/* Main Sheet Viewport */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '1rem 0.5rem',
          maxWidth: '100%',
          width: '100%',
          boxSizing: 'border-box',
          overflowX: 'hidden',
        }}
      >
        {/* Navigation Pills Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
            width: '100%',
          }}
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            const isActive = pageNum === safeCurrentPage;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '0.35rem 0.85rem',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.85rem',
                  borderRadius: '999px',
                }}
              >
                แผ่นที่ {pageNum}
              </button>
            );
          })}
        </div>

        {/* Current Sheet View (Responsive card on mobile, standard A4 on desktop & print) */}
        <div
          style={{
            maxWidth: '860px',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}
        >
          <CeremonyPrintSheet
            events={events}
            standings={standings}
            teams={teams}
            options={{
              ceremonyTitle: 'พิธีมอบรางวัลและปิดการแข่งขัน Sci Games 2026',
              ceremonyDate: '11 ตุลาคม 2569',
              awardPresenter: 'คณบดีคณะวิทยาศาสตร์และเทคโนโลยี',
              mcNotes: 'ขอให้นักกีฬาทุกสีเข้าแถวหน้าโพเดียมอย่างพร้อมเพรียง',
              fontSize: 'medium',
            }}
            activePage={safeCurrentPage}
            viewMode="single"
          />
        </div>
      </main>

      {/* Bottom Sticky Action Bar (Giant Next / Previous Buttons for Stage) */}
      <footer
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 50,
          background: stageTheme === 'dark' ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(12px)',
          borderTop: stageTheme === 'dark' ? '1px solid #334155' : '1px solid #cbd5e1',
          padding: '0.65rem 0.75rem',
          paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.4rem',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.3)',
        }}
      >
        <button
          onClick={() => {
            setCurrentPage((p) => Math.max(1, p - 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          disabled={safeCurrentPage <= 1}
          className="btn btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontWeight: 700,
            padding: '0.65rem 0.9rem',
            fontSize: '0.88rem',
            flexShrink: 0,
            opacity: safeCurrentPage <= 1 ? 0.35 : 1,
            cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <ChevronLeft size={18} />
          <span>หน้าก่อนหน้า</span>
        </button>

        <div style={{ textAlign: 'center', minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
            แผ่นที่ {safeCurrentPage} / {totalPages}
          </div>
          <div
            style={{
              fontSize: '0.68rem',
              opacity: 0.75,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            แตะหรือปัดซ้าย-ขวาเพื่อเปลี่ยนหน้า
          </div>
        </div>

        <button
          onClick={() => {
            setCurrentPage((p) => Math.min(totalPages, p + 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          disabled={safeCurrentPage >= totalPages}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontWeight: 800,
            padding: '0.65rem 1rem',
            fontSize: '0.9rem',
            flexShrink: 0,
            opacity: safeCurrentPage >= totalPages ? 0.35 : 1,
            cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          <span>หน้าถัดไป</span>
          <ChevronRight size={18} />
        </button>
      </footer>
    </div>
  );
}
