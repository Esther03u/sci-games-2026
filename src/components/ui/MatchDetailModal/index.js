'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getTeamStyle } from '@/lib/team-style';
import { findHandbookSport } from '@/data/handbook';
import { getMatchView, setScoreRows } from '@/lib/match-view';
import ModalHeader from './ModalHeader';
import ModalScoreboard from './ModalScoreboard';
import SummaryTab from './SummaryTab';
import RulesTab from './RulesTab';
import VenueTab from './VenueTab';

const TABS = [
  { id: 'summary', label: 'ภาพรวม' },
  { id: 'rules', label: 'กติกาการแข่งขัน' },
  { id: 'venue', label: 'สถานที่ & เวลา' },
];

export default function MatchDetailModal({
  match,
  sport,
  teams = [],
  isOpen,
  isScheduleView = false,
  sets = [],
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!match) return null;

  const handbook = findHandbookSport(sport);
  const matchDuration = sport?.matchDuration || handbook?.matchDuration;
  const rulesSummary = sport?.rulesSummary || handbook?.rulesSummary;

  const view = getMatchView(match, teams, { isScheduleView, sport });
  const { isFinal, isThird, isPendingA, isPendingB, teamA, teamB, isLive, isFinished, roundText, catText } =
    view;

  // every set with a score, including the one in progress (marked •)
  const setRows =
    !isScheduleView && sport?.scoring_type === 'sets' && (isFinished || isLive)
      ? setScoreRows(sets, { includeLive: true })
      : [];

  const styleA = getTeamStyle(teamA);
  const styleB = getTeamStyle(teamB);

  const matchTimeStr =
    match.time_display || (match.match_time ? match.match_time.slice(0, 5) + ' น.' : '--:-- น.');

  return (
    <motion.div
      className="match-modal-overlay"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem 0.5rem',
        willChange: 'opacity',
      }}
    >
      <motion.div
        className="match-modal-container"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: 'var(--bg-elevated)',
          border: isFinal
            ? '2px solid rgba(245, 158, 11, 0.85)'
            : isThird
              ? '2px solid rgba(234, 88, 12, 0.8)'
              : '1px solid var(--border)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          color: 'var(--text)',
          boxShadow: isFinal
            ? '0 20px 40px -10px rgba(245, 158, 11, 0.3), 0 0 20px rgba(251, 191, 36, 0.15)'
            : isThird
              ? '0 20px 40px -10px rgba(234, 88, 12, 0.25), 0 0 20px rgba(251, 146, 60, 0.15)'
              : '0 20px 40px -10px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          position: 'relative',
          willChange: 'transform, opacity',
          transform: 'translateZ(0)',
        }}
      >
        <ModalHeader
          match={match}
          sport={sport}
          isFinal={isFinal}
          isThird={isThird}
          isFinished={isFinished}
          isLive={isLive}
          isScheduleView={isScheduleView}
          roundText={roundText}
          catText={catText}
          onClose={onClose}
        />

        <ModalScoreboard
          match={match}
          sport={sport}
          view={view}
          styleA={styleA}
          styleB={styleB}
          isScheduleView={isScheduleView}
          matchTimeStr={matchTimeStr}
        />

        {/* Navigation Sub-Tabs */}
        <div className="md-tabs">
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.08 }}
              style={{
                position: 'relative',
                flex: 1,
                minHeight: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.45rem 0.35rem',
                fontSize: '0.78rem',
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--text)' : 'var(--text-3)',
                background: 'transparent',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                touchAction: 'manipulation',
              }}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId={`matchModalTabPill-${match.id}`}
                  className="md-tab-pill"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="md-tab-label">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="md-tab-body">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {activeTab === 'summary' && (
                <SummaryTab
                  match={match}
                  teamA={teamA}
                  teamB={teamB}
                  isPendingA={isPendingA}
                  isPendingB={isPendingB}
                  setRows={setRows}
                  isScheduleView={isScheduleView}
                  roundText={roundText}
                  catText={catText}
                  matchTimeStr={matchTimeStr}
                  matchDuration={matchDuration}
                />
              )}
              {activeTab === 'rules' && <RulesTab sport={sport} rulesSummary={rulesSummary} />}
              {activeTab === 'venue' && <VenueTab match={match} sport={sport} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
