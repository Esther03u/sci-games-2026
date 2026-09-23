import { describe, it, expect } from 'vitest';
import { OFFICIAL_DOCUMENTS } from '../src/data/documents';
import fs from 'fs';
import path from 'path';

describe('Official Documents Metadata & Assets', () => {
  it('exports a valid list of official documents', () => {
    expect(Array.isArray(OFFICIAL_DOCUMENTS)).toBe(true);
    expect(OFFICIAL_DOCUMENTS.length).toBeGreaterThanOrEqual(2);
  });

  it('contains handbook and schedule with correct properties', () => {
    const ids = OFFICIAL_DOCUMENTS.map((d) => d.id);
    expect(ids).toContain('handbook-2026');
    expect(ids).toContain('schedule-2026');

    for (const doc of OFFICIAL_DOCUMENTS) {
      expect(doc.title).toBeTruthy();
      expect(doc.downloadUrl).toMatch(/^\/docs\//);
      expect(doc.fileName).toMatch(/\.pdf$/);
      expect(doc.highlights.length).toBeGreaterThan(0);
    }
  });

  it('has corresponding static PDF files in public/docs directory', () => {
    for (const doc of OFFICIAL_DOCUMENTS) {
      const publicPath = path.join(process.cwd(), 'public', doc.downloadUrl.replace(/^\//, ''));
      expect(fs.existsSync(publicPath)).toBe(true);
      const stat = fs.statSync(publicPath);
      expect(stat.size).toBeGreaterThan(1000); // verify file is not empty
    }
  });
});
