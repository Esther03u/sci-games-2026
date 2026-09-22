// WCAG 2.1 Contrast Checker for Sci Games 2026 Design Tokens

function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '').trim();
  const num = parseInt(cleanHex, 16);
  if (cleanHex.length === 3) {
    const r = (num >> 8) & 0xf;
    const g = (num >> 4) & 0xf;
    const b = num & 0xf;
    return [(r << 4) | r, (g << 4) | g, (b << 4) | b];
  }
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function getLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hexToRgb(hex1));
  const lum2 = getLuminance(hexToRgb(hex2));
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

const themeTokens = {
  light: {
    bg: '#fafafa',
    surface: '#ffffff',
    surface2: '#f4f4f5',
    text: '#09090b',
    text2: '#52525b',
    text3: '#71717a',
    accentText: '#a16207',
    dangerText: '#b91c1c',
    successText: '#15803d',
    infoText: '#1d4ed8',
  },
  dark: {
    bg: '#0b0b0e',
    surface: '#18181b',
    surface2: '#1f1f24',
    text: '#fafafa',
    text2: '#d4d4d8',
    text3: '#a1a1aa',
    accentText: '#fde047',
    dangerText: '#fca5a5',
    successText: '#86efac',
    infoText: '#93c5fd',
  },
};

const checks = [
  { name: '--text on --bg', fg: 'text', bg: 'bg', minRatio: 4.5 },
  { name: '--text-2 on --bg', fg: 'text2', bg: 'bg', minRatio: 4.5 },
  { name: '--text on --surface', fg: 'text', bg: 'surface', minRatio: 4.5 },
  { name: '--text-2 on --surface', fg: 'text2', bg: 'surface', minRatio: 4.5 },
  { name: '--text-3 on --surface', fg: 'text3', bg: 'surface', minRatio: 3.0 },
  { name: '--accent-text on --surface', fg: 'accentText', bg: 'surface', minRatio: 4.5 },
  { name: '--danger-text on --surface', fg: 'dangerText', bg: 'surface', minRatio: 4.5 },
  { name: '--success-text on --surface', fg: 'successText', bg: 'surface', minRatio: 4.5 },
  { name: '--info-text on --surface', fg: 'infoText', bg: 'surface', minRatio: 4.5 },
];

let failed = false;

for (const theme of ['light', 'dark']) {
  console.log(`\nChecking WCAG contrast for [${theme.toUpperCase()}] theme:`);
  const tokens = themeTokens[theme];

  for (const check of checks) {
    const fgHex = tokens[check.fg];
    const bgHex = tokens[check.bg];
    const ratio = getContrastRatio(fgHex, bgHex);
    const pass = ratio >= check.minRatio;
    const status = pass ? '✓ PASS' : '✗ FAIL';
    console.log(
      `  ${status} [${ratio.toFixed(2)}:1 >= ${check.minRatio}:1] ${check.name} (${fgHex} on ${bgHex})`
    );

    if (!pass) {
      failed = true;
    }
  }
}

if (failed) {
  console.error('\nContrast verification FAILED! Some pairs do not meet WCAG guidelines.\n');
  process.exit(1);
} else {
  console.log('\nAll contrast checks PASSED successfully! 🎉\n');
}
