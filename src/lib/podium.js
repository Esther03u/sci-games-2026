// Shared rule for app_settings.podium_countdown: is the overall podium open?
// Used by the server (standings API / home page) and PodiumCountdown, so a
// fast-forward counts as revealed on both sides — the admin's "เร่งเวลาแล้วเฉลย"
// saves { status: 'fast_forward', revealed: false }.

/** @param {{ revealed?: boolean, status?: string } | null | undefined} settings */
export function isPodiumRevealed(settings) {
  return (
    settings?.revealed === true || settings?.status === 'revealed' || settings?.status === 'fast_forward'
  );
}
