'use client';
import { Maximize2, Minimize2, Sun, Moon, RefreshCw, Radio, CheckCircle2 } from 'lucide-react';
import { useHydrated } from '@/hooks/useHydrated';

const formatTime = (d) =>
  d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** Sticky top bar: live-sync badge, wake-lock badge, refresh / theme / fullscreen. */
export default function McStageHeader({
  lastSync,
  wakeLockActive,
  isRefreshing,
  onRefresh,
  stageTheme,
  onToggleTheme,
  isFullscreen,
  onToggleFullscreen,
}) {
  const hydrated = useHydrated();
  const themeLabel = stageTheme === 'light' ? 'เปลี่ยนเป็นธีมเวที (มืด)' : 'เปลี่ยนเป็นธีมสว่าง';
  const fullscreenLabel = isFullscreen ? 'ย่อกลับขนาดปกติ' : 'ขยายเต็มจอ';

  return (
    <header className="mc-stage-header">
      <div className="mc-stage-status">
        <div className="mc-sync-badge">
          <Radio size={13} className="animate-pulse" />
          {/* server and client clocks differ — no time until hydrated */}
          <span>ซิงก์ผลสด ({hydrated ? formatTime(lastSync) : '--:--:--'})</span>
        </div>

        {wakeLockActive ? (
          <span className="mc-wake-badge" title="หน้าจอจะไม่ดับอัตโนมัติขณะอยู่บนเวที">
            <CheckCircle2 size={13} />
            <span className="hidden-sm">จอไม่ดับ</span>
          </span>
        ) : null}
      </div>

      {/* Quick Toolbar */}
      <div className="mc-stage-toolbar">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="btn btn-secondary btn-sm mc-tool-btn"
          aria-label="รีเฟรชผลคะแนนทันที"
          title="รีเฟรชผลคะแนนทันที"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          <span className="mc-tool-btn-label">อัปเดต</span>
        </button>

        <button
          onClick={onToggleTheme}
          className="btn btn-secondary btn-sm mc-tool-icon"
          aria-label={themeLabel}
          title={themeLabel}
        >
          {stageTheme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        <button
          onClick={onToggleFullscreen}
          className="btn btn-secondary btn-sm mc-tool-icon"
          aria-label={fullscreenLabel}
          title={fullscreenLabel}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>
    </header>
  );
}
