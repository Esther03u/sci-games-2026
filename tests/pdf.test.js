import { describe, expect, it } from 'vitest';
import { generateRosterPdf } from '@/lib/pdf';

describe('generateRosterPdf', () => {
  it('builds a PDF with the roster table (jspdf-autotable v5 API)', () => {
    const doc = generateRosterPdf({
      sportName: 'Futsal',
      teamName: 'Red',
      athletes: [
        { student_id: '650001', full_name: 'A', department_name: 'CS' },
        { student_id: '650002', full_name: 'B', departments: { name: 'IT' } },
      ],
      printDate: '9/10/2569',
    });
    const bytes = doc.output('arraybuffer');
    expect(bytes.byteLength).toBeGreaterThan(1000);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
  });

  it('still works with no athletes', () => {
    expect(() => generateRosterPdf({ athletes: [] })).not.toThrow();
  });
});
