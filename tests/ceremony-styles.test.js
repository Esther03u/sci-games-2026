// tests/ceremony-styles.test.js
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('ceremony print styles', () => {
  it('defines the ceremony-print.css with @media print and required classes', () => {
    const cssPath = path.resolve(process.cwd(), 'src/styles/ceremony-print.css');
    expect(fs.existsSync(cssPath)).toBe(true);

    const content = fs.readFileSync(cssPath, 'utf8');
    expect(content).toContain('@media print');
    expect(content).toContain('.ceremony-sheet');
    expect(content).toContain('.event-card-cue');
    expect(content).toContain('page-break-inside: avoid');
    expect(content).toContain('.grand-finale-card');
  });
});
