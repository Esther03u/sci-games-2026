'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EVENT_DAYS } from '@/lib/format';
import { filterSchedule, groupBySport, groupByTime } from '@/lib/schedule-grid';
import CeremonyProgramme from '@/components/public/CeremonyProgramme';
import { useLiveScores } from '@/hooks/useLiveScores';
import ScheduleFilters from './ScheduleFilters';
import SportView from './SportView';
import TimeView from './TimeView';
import EmptySchedule from './EmptySchedule';

const DAYS = [
  { key: 'all', label: 'ทุกวัน', sub: '8-11 ต.ค.', shortLabel: 'ทุกวัน' },
  ...EVENT_DAYS.map((d) => ({
    key: d.date,
    label: d.short,
    shortLabel: d.short.replace(' ต.ค.', ''),
    sub: d.sub,
  })),
];

const CATEGORIES = [
  { key: 'all', label: 'ทุกประเภท' },
  { key: 'ชาย', label: 'ทีมชาย' },
  { key: 'หญิง', label: 'ทีมหญิง' },
  { key: 'ผสม', label: 'คู่ผสม' },
];

export default function ScheduleGrid({
  matches: initialMatches = [],
  sports: initialSports = [],
  teams: initialTeams = [],
}) {
  const live = useLiveScores(
    { matches: initialMatches, sports: initialSports, teams: initialTeams },
    { realtime: false, publicView: true, pollMs: 12000 }
  );
  const matches = live.matches || initialMatches;
  const sports = live.sports.length > 0 ? live.sports : initialSports;
  const teams = live.teams.length > 0 ? live.teams : initialTeams;

  const [viewMode, setViewMode] = useState('sport'); // 'sport' | 'time'
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredMatches = useMemo(
    () => filterSchedule(matches, { day: selectedDay, sport: selectedSport, category: selectedCategory }),
    [matches, selectedDay, selectedSport, selectedCategory]
  );
  const scheduleData = useMemo(() => groupByTime(filteredMatches, sports), [filteredMatches, sports]);
  const sportData = useMemo(() => groupBySport(filteredMatches, sports), [filteredMatches, sports]);

  const resetFilters = () => {
    setSelectedDay('all');
    setSelectedSport('all');
    setSelectedCategory('all');
  };

  return (
    <div>
      <ScheduleFilters
        matches={matches}
        sports={sports}
        days={DAYS}
        categories={CATEGORIES}
        filteredCount={filteredMatches.length}
        viewMode={viewMode}
        selectedDay={selectedDay}
        selectedSport={selectedSport}
        selectedCategory={selectedCategory}
        onViewMode={setViewMode}
        onDay={setSelectedDay}
        onSport={setSelectedSport}
        onCategory={setSelectedCategory}
        onReset={resetFilters}
      />

      {/* Matches Display Grouped by Date */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewMode}-${selectedDay}-${selectedSport}-${selectedCategory}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {filteredMatches.length === 0 ? (
            <EmptySchedule onReset={resetFilters} />
          ) : viewMode === 'sport' ? (
            <SportView groups={sportData} teams={teams} />
          ) : (
            <TimeView scheduleData={scheduleData} sports={sports} teams={teams} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Official Ceremony Programme for Sunday 11 Oct */}
      {(selectedDay === 'all' || selectedDay === '2026-10-11') && (
        <CeremonyProgramme selectedDay={selectedDay} />
      )}
    </div>
  );
}
