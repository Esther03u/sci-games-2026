import { describe, expect, it } from 'vitest';
import { getMatchView, medalRound } from '@/lib/match-view';

const RED = { id: 't1', name: 'สีแดง', color_hex: '#dc2626', logo_emoji: '🔴' };
const BLUE = { id: 't2', name: 'สีฟ้า', color_hex: '#0ea5e9', logo_emoji: '🔵' };
const teams = [RED, BLUE];

describe('medalRound', () => {
  it('detects finals and third-place matches by Thai text or bracket code', () => {
    expect(medalRound('ชิงชนะเลิศ')).toEqual({ isFinal: true, isThird: false, isMedalRound: true });
    expect(medalRound('final')).toEqual({ isFinal: true, isThird: false, isMedalRound: true });
    expect(medalRound('ชิงอันดับ 3 (ชาย)')).toEqual({ isFinal: false, isThird: true, isMedalRound: true });
    expect(medalRound('third')).toEqual({ isFinal: false, isThird: true, isMedalRound: true });
    expect(medalRound('รอบแรก')).toEqual({ isFinal: false, isThird: false, isMedalRound: false });
    expect(medalRound(null)).toEqual({ isFinal: false, isThird: false, isMedalRound: false });
  });
});

describe('getMatchView', () => {
  it('resolves both teams from the team list', () => {
    const v = getMatchView({ team_a_id: 't1', team_b_id: 't2', round: 'รอบแรก' }, teams);
    expect(v.teamA).toBe(RED);
    expect(v.teamB).toBe(BLUE);
    expect(v.isPendingA).toBe(false);
    expect(v.roundText).toBe('รอบแรก');
  });

  it('uses gold / bronze / grey placeholders for undecided slots', () => {
    const final = getMatchView({ team_a_id: null, team_b_id: 't2', round: 'ชิงชนะเลิศ' }, teams);
    expect(final.isPendingA).toBe(true);
    expect(final.teamA).toEqual({
      id: null,
      name: 'รอผลการแข่งขัน',
      color_hex: '#f59e0b',
      medal: 'gold',
      logo_emoji: '',
      isPending: true,
    });
    const third = getMatchView({ round: 'third' }, teams);
    expect(third.teamB).toMatchObject({ color_hex: '#ea580c', medal: 'bronze', isPending: true });
    expect(third.roundText).toBe('ชิงที่ 3');
    const other = getMatchView({ round: 'รอบแรก' }, teams);
    expect(other.teamA).toMatchObject({ color_hex: '#64748b', medal: null });
  });

  it('falls back to a side colour when the team id is unknown', () => {
    const v = getMatchView({ team_a_id: 'gone', team_b_id: 'gone2' }, teams);
    expect(v.teamA).toEqual({ id: 'gone', name: 'ทีม A', color_hex: '#ef4444', logo_emoji: '🔴' });
    expect(v.teamB).toEqual({ id: 'gone2', name: 'ทีม B', color_hex: '#0284c7', logo_emoji: '🔵' });
  });

  it('marks the winner only for finished matches with both scores', () => {
    const base = { team_a_id: 't1', team_b_id: 't2' };
    expect(getMatchView({ ...base, status: 'finished', score_a: 3, score_b: 1 }, teams)).toMatchObject({
      isFinished: true,
      teamAWins: true,
      teamBWins: false,
    });
    expect(getMatchView({ ...base, status: 'finished', score_a: 1, score_b: 1 }, teams)).toMatchObject({
      teamAWins: false,
      teamBWins: false,
    });
    expect(getMatchView({ ...base, status: 'live', score_a: 0, score_b: 2 }, teams)).toMatchObject({
      isLive: true,
      teamBWins: false,
    });
  });

  it('shows sets won for set-scored sports (score_a/score_b hold the final set points)', () => {
    const volley = { scoring_type: 'sets' };
    const m = {
      team_a_id: 't1',
      team_b_id: 't2',
      status: 'finished',
      score_a: 13,
      score_b: 15,
      sets_a: 1,
      sets_b: 2,
    };
    expect(getMatchView(m, teams, { sport: volley })).toMatchObject({
      scoreA: 1,
      scoreB: 2,
      teamAWins: false,
      teamBWins: true,
    });
    expect(getMatchView(m, teams, { sport: { scoring_type: 'points' } })).toMatchObject({
      scoreA: 13,
      scoreB: 15,
    });
    // live: the current set's points (sets won are shown beside "เซต N")
    expect(getMatchView({ ...m, status: 'live' }, teams, { sport: volley })).toMatchObject({
      scoreA: 13,
      scoreB: 15,
    });
  });

  it('hides scores and live/finished state in schedule view', () => {
    const v = getMatchView({ status: 'finished', score_a: 3, score_b: 1 }, teams, { isScheduleView: true });
    expect(v).toMatchObject({
      isLive: false,
      isFinished: false,
      scoreA: null,
      scoreB: null,
      teamAWins: false,
    });
  });

  it('adds the category to the round text unless it is already there', () => {
    expect(getMatchView({ round: 'รอบแรก', category: 'ชาย' }).catText).toBe(' (ชาย)');
    expect(getMatchView({ round: 'รอบแรก (ชาย)', category: 'ชาย' }).catText).toBe('');
    expect(getMatchView({ round: null }).roundText).toBe('รอบการแข่งขัน');
  });
});
