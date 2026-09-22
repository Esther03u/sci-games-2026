// JSDoc typedefs mirroring the Supabase schema (supabase/migrations/*) and
// the shapes passed between server pages, hooks and components. Import for
// editor help only — there is no runtime export:
//
//   /** @typedef {import('@/lib/types').Match} Match */
//   /** @param {Match[]} matches */
//
// Keep in sync when adding a migration. Not TypeScript on purpose (see
// docs/plans/2026-09-21-refactor.md §6).

/** @typedef {'upcoming' | 'live' | 'finished' | 'postponed'} MatchStatus */
/** @typedef {'points' | 'sets'} ScoringType */
/** @typedef {'a' | 'b'} TeamSlot */
/** @typedef {'score' | 'start' | 'finish_set' | 'finish_match' | 'reopen' | 'override' | 'undo'} ScoreEventType */
/** @typedef {'staff' | 'admin' | 'pin'} ActorType */
/** @typedef {'super_admin' | 'staff'} UserRole */
/** @typedef {'registered' | 'cancelled'} RegistrationStatus */

/**
 * @typedef {Object} Sport
 * @property {string} id                     uuid
 * @property {string} name
 * @property {string} sport_type
 * @property {number|null} max_players_per_team
 * @property {number} win_points
 * @property {number} draw_points
 * @property {number} lose_points
 * @property {number} sort_order              card order on /live and the schedule
 * @property {ScoringType} scoring_type
 * @property {number} sets_to_win             1 for points sports
 * @property {number|null} points_per_set
 * @property {string|null} icon
 * @property {string} created_at
 */

/**
 * @typedef {Object} Team
 * @property {string} id
 * @property {string} name                    'สีแดง' | 'สีฟ้า' | 'สีเขียว' | 'สีม่วง'
 * @property {string} color_hex
 * @property {string|null} logo_emoji
 * @property {number} sort_order
 * @property {string} created_at
 */

/**
 * @typedef {Object} Match
 * @property {string} id
 * @property {string} sport_id
 * @property {string|null} team_a_id          null until a bracket slot is filled
 * @property {string|null} team_b_id
 * @property {string} match_date              'YYYY-MM-DD'
 * @property {string} match_time              'HH:MM' or 'HH:MM:SS'
 * @property {string} venue
 * @property {MatchStatus} status
 * @property {number|null} score_a            points sports: total; sets sports: points in the current set
 * @property {number|null} score_b
 * @property {number} points_a                league points awarded (view team_standings)
 * @property {number} points_b
 * @property {number} current_set             1-based
 * @property {number} sets_a                  sets won (sets sports only)
 * @property {number} sets_b
 * @property {string|null} last_score_at
 * @property {TeamSlot|null} last_scored_team
 * @property {string|null} started_at
 * @property {string|null} finished_at
 * @property {string|null} round              bracket round key (see lib/labels ROUND_LABEL)
 * @property {string|null} next_match_id      winner advances here
 * @property {TeamSlot|null} next_match_slot
 * @property {string|null} loser_next_match_id
 * @property {TeamSlot|null} loser_next_match_slot
 * @property {string|null} category           'ชาย' | 'หญิง' | 'ผสม' (display only, migration 004)
 * @property {number|null} match_number       order within the sport (คู่ที่ N)
 * @property {string|null} updated_by
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} MatchSet
 * @property {string} id
 * @property {string} match_id
 * @property {number} set_number
 * @property {number} score_a
 * @property {number} score_b
 * @property {'live' | 'finished'} status
 * @property {string|null} started_at
 * @property {string|null} finished_at
 */

/**
 * Append-only log written by the scoring RPCs; drives the ↑ indicator,
 * undo and the admin audit views.
 * @typedef {Object} ScoreEvent
 * @property {string} id
 * @property {string} match_id
 * @property {number|null} set_number
 * @property {TeamSlot|null} team
 * @property {number} delta                   +1 / −1 for 'score', 0 for lifecycle events
 * @property {ScoreEventType} event_type
 * @property {ActorType} actor_type
 * @property {string|null} actor_admin_user_id
 * @property {string|null} actor_pin_id
 * @property {string|null} actor_label
 * @property {string|null} undone_by          id of the 'undo' event that reverted this one
 * @property {Record<string, any>|null} meta  e.g. { to: { a, b } } after a score
 * @property {string} created_at
 */

/**
 * @typedef {Object} Announcement
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {boolean} is_pinned
 * @property {string|null} created_by
 * @property {string} published_at
 * @property {string} created_at
 */

/**
 * @typedef {Object} Department
 * @property {string} id
 * @property {string} name
 * @property {string} team_id
 * @property {string} created_at
 * @property {Pick<Team, 'name' | 'color_hex' | 'logo_emoji'>} [teams]   joined by the admin queries
 */

/**
 * @typedef {Object} Athlete
 * @property {string} id
 * @property {string} student_id
 * @property {string} full_name
 * @property {string|null} department_id
 * @property {string|null} team_id
 * @property {string|null} phone              not exposed to anon (view athletes_public)
 * @property {string} created_at
 */

/**
 * @typedef {Object} Registration
 * @property {string} id
 * @property {string} athlete_id
 * @property {string} sport_id
 * @property {RegistrationStatus} status
 * @property {string|null} cancelled_at
 * @property {string|null} cancelled_by
 * @property {string} created_at
 */

/**
 * @typedef {Object} AdminUser
 * @property {string} id
 * @property {string} auth_user_id
 * @property {string} display_name
 * @property {UserRole} role
 * @property {string} created_at
 */

/**
 * @typedef {Object} SportPin
 * @property {string} id
 * @property {string} sport_id
 * @property {string} label
 * @property {boolean} is_active
 * @property {string|null} expires_at
 * @property {string|null} last_used_at
 * @property {string|null} created_by
 * @property {string} created_at
 */

// ---------------------------------------------------------------- app shapes

/**
 * Who is making a scoring/admin request (lib/auth/resolveActor).
 * @typedef {Object} Actor
 * @property {ActorType} type
 * @property {string} [adminUserId]           admin / staff
 * @property {string} [authUserId]            admin / staff
 * @property {string} [pinId]                 pin
 * @property {string} label
 * @property {'*' | string[]} sportIds        '*' = every sport (admin)
 */

/**
 * Server-rendered payload for /live, /live/[sportId], /results and the
 * admin Live Monitor (lib/queries/live loadLiveData → useLiveScores).
 * @typedef {Object} LiveData
 * @property {Sport[]} sports
 * @property {Team[]} teams
 * @property {Match[]} matches
 * @property {MatchSet[]} sets
 * @property {ScoreEvent[]} events            empty unless loaded with { withEvents: true }
 */

/** @typedef {Record<string, MatchSet[]>} SetsByMatch    match_id → sets sorted by set_number */
/** @typedef {Record<string, { team: TeamSlot, at: number }>} Bumps    recent +score per match */

/**
 * Standard JSON envelope from the API routes.
 * @template T
 * @typedef {Object} ApiResult
 * @property {boolean} success
 * @property {T} [data]
 * @property {string} [message]               Thai, safe to show to the user
 * @property {string} [error_code]            e.g. 'MATCH_NOT_LIVE', 'INVALID_BODY'
 */

export {};
