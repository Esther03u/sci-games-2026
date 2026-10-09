'use client';
import { useMemo, useState } from 'react';
import { EVENT_DAYS } from '@/lib/format';
import { roundLabel } from '@/lib/labels';
import { groupMatches } from '../scoring';

/** Sport / date / search state of the match picker and the matches it leaves visible. */
export function useMatchPicker({ matches, sports, teams, editWindowMinutes, now, isAdmin }) {
  // Sports present in the visible matches
  const availableSports = useMemo(() => {
    const ids = new Set(matches.map((m) => m.sport_id));
    return sports.filter((s) => ids.has(s.id));
  }, [matches, sports]);

  // If only 1 sport available (PIN referee or single-sport staff), lock to it.
  // Otherwise check localStorage if a sport was previously picked.
  const [selectedSport, setSelectedSport] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('staff_selected_sport') || null;
    }
    return null;
  });

  const [selectedDate, setSelectedDate] = useState('all');
  const [search, setSearch] = useState('');

  // Effective sport ID:
  // - If availableSports has exactly 1 sport -> always lock strictly to that sport!
  // - If multiple sports exist and selectedSport matches one of them -> use that sport
  // - If selectedSport === 'all' (explicit admin choice) -> 'all'
  // - Otherwise -> null (prompts to choose sport first)
  const effectiveSportId = useMemo(() => {
    if (availableSports.length === 1) return availableSports[0].id;
    if (selectedSport === 'all') return 'all';
    if (selectedSport && availableSports.some((s) => s.id === selectedSport)) {
      return selectedSport;
    }
    return null;
  }, [availableSports, selectedSport]);

  const currentSport = useMemo(() => {
    if (!effectiveSportId || effectiveSportId === 'all') return null;
    return sports.find((s) => s.id === effectiveSportId) || null;
  }, [effectiveSportId, sports]);

  // Handle sport selection
  const handleSelectSport = (sportId) => {
    setSelectedSport(sportId);
    if (typeof window !== 'undefined') {
      if (sportId) {
        localStorage.setItem('staff_selected_sport', sportId);
      } else {
        localStorage.removeItem('staff_selected_sport');
      }
    }
    setSelectedDate('all');
    setSearch('');
  };

  // Dates present in matches of current sport scope
  const availableDates = useMemo(() => {
    const scope =
      effectiveSportId && effectiveSportId !== 'all'
        ? matches.filter((m) => m.sport_id === effectiveSportId)
        : matches;
    const dateSet = new Set(scope.map((m) => m.match_date));
    return EVENT_DAYS.filter((d) => dateSet.has(d.date));
  }, [matches, effectiveSportId]);

  // Apply filters to matches of the chosen sport scope
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (effectiveSportId && effectiveSportId !== 'all' && m.sport_id !== effectiveSportId) {
        return false;
      }
      if (selectedDate !== 'all' && m.match_date !== selectedDate) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const s = sports.find((x) => x.id === m.sport_id);
        const a = teams.find((t) => t.id === m.team_a_id);
        const b = teams.find((t) => t.id === m.team_b_id);
        const sportMatch = (s?.name || '').toLowerCase().includes(q);
        const teamAMatch = (a?.name || '').toLowerCase().includes(q);
        const teamBMatch = (b?.name || '').toLowerCase().includes(q);
        const venueMatch =
          (m.venue || '').toLowerCase().includes(q) || (m.court || '').toLowerCase().includes(q);
        const roundText = roundLabel(m.round) || '';
        const roundMatch =
          roundText.toLowerCase().includes(q) || (m.category || '').toLowerCase().includes(q);
        if (!sportMatch && !teamAMatch && !teamBMatch && !venueMatch && !roundMatch) return false;
      }
      return true;
    });
  }, [matches, effectiveSportId, selectedDate, search, sports, teams]);

  const hasFilter = selectedDate !== 'all' || Boolean(search.trim());

  const resetFilters = () => {
    setSelectedDate('all');
    setSearch('');
  };

  // Group active filtered matches into live / upcoming / recent
  const groups = useMemo(() => {
    return groupMatches(filteredMatches, { editWindowMinutes, now, isAdmin });
  }, [filteredMatches, editWindowMinutes, now, isAdmin]);

  return {
    availableSports,
    selectedSport,
    setSelectedSport,
    selectedDate,
    setSelectedDate,
    search,
    setSearch,
    effectiveSportId,
    currentSport,
    handleSelectSport,
    availableDates,
    filteredMatches,
    hasFilter,
    resetFilters,
    groups,
  };
}
