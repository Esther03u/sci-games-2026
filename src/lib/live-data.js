// Initial data for the spectator live pages (server side). The client hook
// useLiveScores() takes over from here with realtime updates.
export async function loadLiveData(supabase) {
  const [sportsRes, teamsRes, matchesRes, setsRes] = await Promise.all([
    supabase.from('sports').select('*').order('sort_order'),
    supabase.from('teams').select('*').order('sort_order'),
    supabase.from('matches').select('*').order('match_date').order('match_time'),
    supabase.from('match_sets').select('*').order('set_number'),
  ]);
  return {
    sports: sportsRes.data || [],
    teams: teamsRes.data || [],
    matches: matchesRes.data || [],
    sets: setsRes.data || [],
  };
}
