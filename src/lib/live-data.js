// Initial data for the spectator live pages (server side). The client hook
// useLiveScores() takes over from here with realtime updates.
export async function loadLiveData(supabase) {
  const [sportsRes, teamsRes, matchesRes, setsRes, eventsRes] = await Promise.all([
    supabase.from('sports').select('*').order('sort_order'),
    supabase.from('teams').select('*').order('sort_order'),
    supabase.from('matches').select('*').order('match_date').order('match_time'),
    supabase.from('match_sets').select('*').order('set_number'),
    supabase.from('score_events').select('*').order('created_at', { ascending: false }).limit(300),
  ]);
  return {
    sports: sportsRes.data || [],
    teams: teamsRes.data || [],
    matches: matchesRes.data || [],
    sets: setsRes.data || [],
    events: eventsRes.data || [],
  };
}
