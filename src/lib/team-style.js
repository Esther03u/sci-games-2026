// Per-team colour palette used by MatchCard / MatchDetailModal (gradients,
// glow, ambient, ring). Teams are matched by colour hex, id or Thai name so
// both DB rows and the handbook fallback data resolve to the same palette.

const PALETTES = [
  {
    match: { hex: ['#ef4444'], id: 'red', names: ['แดง'] },
    style: {
      hex: '#ef4444',
      gradient: 'linear-gradient(145deg, #ff5c5c 0%, #ef4444 52%, var(--danger-text) 100%)',
      glow: 'rgba(239, 68, 68, 0.55)',
      ambient: 'rgba(239, 68, 68, 0.12)',
      ring: 'rgba(239, 68, 68, 0.35)',
    },
  },
  {
    match: { hex: ['#0284c7', '#3b82f6'], id: 'blue', names: ['ฟ้า', 'น้ำเงิน'] },
    style: {
      hex: '#0284c7',
      gradient: 'linear-gradient(145deg, #38bdf8 0%, #0ea5e9 52%, #0284c7 100%)',
      glow: 'rgba(2, 132, 199, 0.55)',
      ambient: 'rgba(2, 132, 199, 0.12)',
      ring: 'rgba(2, 132, 199, 0.35)',
    },
  },
  {
    match: { hex: ['#10b981', '#22c55e'], id: 'green', names: ['เขียว'] },
    style: {
      hex: '#10b981',
      gradient: 'linear-gradient(145deg, #34d399 0%, #10b981 52%, #047857 100%)',
      glow: 'rgba(16, 185, 129, 0.55)',
      ambient: 'rgba(16, 185, 129, 0.12)',
      ring: 'rgba(16, 185, 129, 0.35)',
    },
  },
  {
    match: { hex: ['#8b5cf6', '#7c3aed'], id: 'purple', names: ['ม่วง'] },
    style: {
      hex: '#8b5cf6',
      gradient: 'linear-gradient(145deg, #c084fc 0%, #8b5cf6 52%, #6d28d9 100%)',
      glow: 'rgba(139, 92, 246, 0.55)',
      ambient: 'rgba(139, 92, 246, 0.12)',
      ring: 'rgba(139, 92, 246, 0.35)',
    },
  },
];

/** @returns {{hex: string, gradient: string, glow: string, ambient: string, ring: string}} */
export function getTeamStyle(team) {
  const hex = (team?.color_hex || '').toLowerCase();
  const id = (team?.id || '').toLowerCase();
  const name = (team?.name || '').toLowerCase();

  for (const { match, style } of PALETTES) {
    if (match.hex.includes(hex) || id.includes(match.id) || match.names.some((n) => name.includes(n))) {
      return style;
    }
  }

  const fallbackHex = team?.color_hex || '#ca8a04';
  return {
    hex: fallbackHex,
    gradient: team?.bg_gradient || `linear-gradient(145deg, ${fallbackHex}, #854d0e)`,
    glow: `${fallbackHex}55`,
    ambient: `${fallbackHex}14`,
    ring: `${fallbackHex}35`,
  };
}
