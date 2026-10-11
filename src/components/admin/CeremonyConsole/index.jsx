'use client';
import { useState } from 'react';
import CeremonyPrintSheet from '@/components/admin/CeremonyPrintSheet';
import { orderEvents, paginateCeremonyEvents } from '@/lib/ceremony';
import { useCeremonyLiveSync } from '@/hooks/useCeremonyLiveSync';
import { usePageKeys } from '@/hooks/usePageKeys';
import ControlPanel from './ControlPanel';
import PreviewToolbar, { BottomPager } from './PreviewToolbar';
import McQrModal from './McQrModal';
import { useCeremonyPrefs } from './useCeremonyPrefs';

const CEREMONY_DATE = '11 ตุลาคม 2569';

/** /admin/ceremony — order the award queue, preview / print the A4 cue sheets, hand the MC a QR. */
export default function CeremonyConsole({ events = [], standings = [], teams = [], mcPath = '/mc' }) {
  const {
    events: liveEvents,
    standings: liveStandings,
    isRefreshing,
    refresh,
  } = useCeremonyLiveSync({ initialEvents: events, initialStandings: standings, intervalMs: 12000 });

  const [prefs, updatePrefs] = useCeremonyPrefs(events.map((e) => e.key));
  const { orderPreset, customKeys, includeFourthPlace, fontSize } = prefs;
  const [filterCompletedOnly, setFilterCompletedOnly] = useState(false);
  const [ceremonyTitle, setCeremonyTitle] = useState('พิธีมอบรางวัลและปิดการแข่งขัน Sci Games 2026');
  const [awardPresenter, setAwardPresenter] = useState('คณบดีคณะวิทยาศาสตร์และเทคโนโลยี');
  const [mcNotes, setMcNotes] = useState('ขอให้นักกีฬาทุกสีเข้าแถวหน้าโพเดียมอย่างพร้อมเพรียง');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('single'); // 'single' (ทีละหน้า) | 'all' (ทุกหน้า)
  const [showQrModal, setShowQrModal] = useState(false);

  // Swap neighbours in the queue → the order becomes 'custom'
  const moveQueue = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= customKeys.length) return;
    const next = [...customKeys];
    [next[index], next[target]] = [next[target], next[index]];
    updatePrefs({ customKeys: next, orderPreset: 'custom' }, { save: true });
  };

  const handleResetOrder = () => {
    updatePrefs({ customKeys: liveEvents.map((e) => e.key), orderPreset: 'official' }, { save: true });
  };

  // Filter & Order
  let displayEvents = orderEvents(liveEvents, orderPreset, customKeys);
  if (filterCompletedOnly) {
    displayEvents = displayEvents.filter((e) => e.done);
  }

  const totalPages = Math.max(1, paginateCeremonyEvents(displayEvents).length);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const prevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const turnPageToTop = (turn) => () => {
    turn();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  usePageKeys(setCurrentPage, totalPages);

  return (
    <div className={`ceremony-console${isFullscreen ? ' is-fullscreen' : ''}`}>
      {/* Left Control Panel */}
      {!isFullscreen ? (
        <ControlPanel
          isRefreshing={isRefreshing}
          onRefresh={refresh}
          onResetOrder={handleResetOrder}
          onPrint={() => window.print()}
          onShowQr={() => setShowQrModal(true)}
          orderPreset={orderPreset}
          onOrderPreset={(value) => updatePrefs({ orderPreset: value }, { save: true })}
          filterCompletedOnly={filterCompletedOnly}
          onFilterCompletedOnly={setFilterCompletedOnly}
          includeFourthPlace={includeFourthPlace}
          onIncludeFourthPlace={(value) => updatePrefs({ includeFourthPlace: value })}
          fontSize={fontSize}
          onFontSize={(value) => updatePrefs({ fontSize: value }, { save: true })}
          displayEvents={displayEvents}
          onMoveUp={(idx) => moveQueue(idx, -1)}
          onMoveDown={(idx) => moveQueue(idx, 1)}
          ceremonyTitle={ceremonyTitle}
          onCeremonyTitle={setCeremonyTitle}
          awardPresenter={awardPresenter}
          onAwardPresenter={setAwardPresenter}
          mcNotes={mcNotes}
          onMcNotes={setMcNotes}
        />
      ) : null}

      {/* Right A4 Preview Viewport */}
      <div>
        <PreviewToolbar
          totalPages={totalPages}
          currentPage={safeCurrentPage}
          viewMode={viewMode}
          onViewMode={setViewMode}
          onPage={(pageNum) => {
            setCurrentPage(pageNum);
            setViewMode('single');
          }}
          onPrev={prevPage}
          onNext={nextPage}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
        />

        {/* The Sheets Preview Wrapper */}
        <div className="ceremony-sheet-wrapper">
          <CeremonyPrintSheet
            events={displayEvents}
            standings={liveStandings}
            teams={teams}
            options={{
              ceremonyTitle,
              ceremonyDate: CEREMONY_DATE,
              awardPresenter,
              mcNotes,
              includeFourthPlace,
              fontSize,
            }}
            activePage={safeCurrentPage}
            viewMode={viewMode}
          />
        </div>

        {/* Bottom Page Navigation (Single-page mode only) */}
        {viewMode === 'single' && totalPages > 1 ? (
          <BottomPager
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPrev={turnPageToTop(prevPage)}
            onNext={turnPageToTop(nextPage)}
          />
        ) : null}
      </div>

      {/* QR Code Modal for MC Stage Access */}
      {showQrModal ? <McQrModal mcPath={mcPath} onClose={() => setShowQrModal(false)} /> : null}
    </div>
  );
}
