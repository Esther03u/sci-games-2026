// tests/ceremony-console.test.js
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import CeremonyConsole from '@/components/admin/CeremonyConsole';

const sports = [{ id: 'futsal', name: 'ฟุตซอล', sort_order: 1 }];
const teams = [{ id: 'red', name: 'สีแดง', color_hex: '#ef4444' }];
const events = [{ key: 'futsal|ชาย', sport_name: 'ฟุตซอล', category: 'ชาย', places: [], done: true }];
const standings = [{ id: 'red', name: 'สีแดง', total_points: 80, rank: 1 }];

describe('CeremonyConsole component', () => {
  it('renders control sidebar and print trigger without emojis', () => {
    const element = React.createElement(CeremonyConsole, {
      events,
      standings,
      sports,
      teams,
    });
    const html = renderToStaticMarkup(element);
    expect(html).toContain('แผงควบคุมและตั้งค่า');
    expect(html).toContain('พิมพ์เอกสาร / บันทึก PDF');
    expect(html).toContain('ceremony-sheet-wrapper');
    expect(html).toContain('หน้าถัดไป');
    expect(html).toContain('หน้าก่อนหน้า');
    expect(html).toContain('ทีละหน้า');
    expect(html).toContain('สแกน QR สำหรับพิธีกร (/mc)');

    // Ensure zero emojis in HTML output
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
    expect(emojiRegex.test(html)).toBe(false);
  });
});
