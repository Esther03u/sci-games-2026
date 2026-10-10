import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// admin / ceremony styles are loaded only where they are used (optimize 11 ต.ค.)
describe('stylesheet split', () => {
  const globals = readFileSync('src/app/globals.css', 'utf8');

  it('globals.css does not pull in admin or ceremony styles', () => {
    expect(globals).not.toMatch(/@import ['"][^'"]*admin\.css/);
    expect(globals).not.toMatch(/@import ['"][^'"]*ceremony-print\.css/);
  });

  it('the admin layout and the ceremony print sheet import them', () => {
    expect(readFileSync('src/app/(admin)/layout.js', 'utf8')).toMatch(/import '@\/styles\/admin\.css'/);
    expect(readFileSync('src/components/admin/CeremonyPrintSheet.jsx', 'utf8')).toMatch(
      /import '@\/styles\/ceremony-print\.css'/
    );
  });
});
