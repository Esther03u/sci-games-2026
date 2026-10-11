'use client';
import { useState } from 'react';
import CeremonyPrintSheet from '@/components/admin/CeremonyPrintSheet';
import { paginateCeremonyEvents } from '@/lib/ceremony';
import { useCeremonyLiveSync } from '@/hooks/useCeremonyLiveSync';
import { usePageKeys } from '@/hooks/usePageKeys';
import McStageHeader from './McStageHeader';
import McPagerFooter from './McPagerFooter';
import { useStageTheme } from './useStageTheme';
import { useWakeLock } from './useWakeLock';

const SHEET_OPTIONS = {
  ceremonyTitle: 'พิธีมอบรางวัลและปิดการแข่งขัน Sci Games 2026',
  ceremonyDate: '11 ตุลาคม 2569',
  awardPresenter: 'คณบดีคณะวิทยาศาสตร์และเทคโนโลยี',
  mcNotes: 'ขอให้นักกีฬาทุกสีเข้าแถวหน้าโพเดียมอย่างพร้อมเพรียง',
  fontSize: 'medium',
};

/** /mc — the MC's live cue sheet on a phone or tablet, one A4 sheet at a time. */
export default function McTeleprompter({ initialEvents = [], initialStandings = [], teams = [], accessKey }) {
  const { events, standings, isRefreshing, lastSync, refresh } = useCeremonyLiveSync({
    initialEvents,
    initialStandings,
    accessKey,
    intervalMs: 8000,
  });
  const [stageTheme, toggleStageTheme] = useStageTheme();
  const wakeLockActive = useWakeLock();
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  const totalPages = Math.max(1, paginateCeremonyEvents(events).length);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const prevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  usePageKeys(setCurrentPage, totalPages, { stage: true });

  // Swipe left → next page, swipe right → previous
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50) nextPage();
    else if (diff < -50) prevPage();
    setTouchStartX(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  const turnPageToTop = (turn) => () => {
    turn();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`mc-stage-shell ${stageTheme === 'dark' ? 'stage-dark' : 'stage-light'}`}
      onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={handleTouchEnd}
    >
      <McStageHeader
        lastSync={lastSync}
        wakeLockActive={wakeLockActive}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        stageTheme={stageTheme}
        onToggleTheme={toggleStageTheme}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      <main className="mc-stage-main">
        {/* Navigation Pills Bar */}
        <div className="mc-page-pills">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            const isActive = pageNum === safeCurrentPage;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                aria-current={isActive ? 'page' : undefined}
                className={`btn btn-sm mc-page-pill ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              >
                แผ่นที่ {pageNum}
              </button>
            );
          })}
        </div>

        {/* Current Sheet View (Responsive card on mobile, standard A4 on desktop & print) */}
        <div className="mc-sheet-frame">
          <CeremonyPrintSheet
            events={events}
            standings={standings}
            teams={teams}
            options={SHEET_OPTIONS}
            activePage={safeCurrentPage}
            viewMode="single"
          />
        </div>
      </main>

      <McPagerFooter
        currentPage={safeCurrentPage}
        totalPages={totalPages}
        onPrev={turnPageToTop(prevPage)}
        onNext={turnPageToTop(nextPage)}
      />
    </div>
  );
}
