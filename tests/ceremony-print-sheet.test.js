// tests/ceremony-print-sheet.test.js
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import CeremonyPrintSheet from '@/components/admin/CeremonyPrintSheet';

const teams = [
  { id: 'red', name: 'สีแดง', color_hex: '#ef4444' },
  { id: 'blue', name: 'สีฟ้า', color_hex: '#0284c7' },
];
const events = [
  {
    key: 'futsal|ชาย',
    sport_name: 'ฟุตซอล',
    category: 'ชาย',
    done: true,
    places: [
      { place: 1, team_id: 'red' },
      { place: 2, team_id: 'blue' },
    ],
  },
];
const standings = [
  { id: 'red', name: 'สีแดง', color_hex: '#ef4444', total_points: 85, rank: 1, golds: 1, silvers: 0, bronzes: 0 },
  { id: 'blue', name: 'สีฟ้า', color_hex: '#0284c7', total_points: 75, rank: 2, golds: 0, silvers: 1, bronzes: 0 },
];

describe('CeremonyPrintSheet component', () => {
  it('renders title, events, and grand finale cleanly without emojis', () => {
    const element = React.createElement(CeremonyPrintSheet, {
      events,
      standings,
      teams,
      options: {
        ceremonyTitle: 'พิธีมอบรางวัล 2569',
        ceremonyDate: '11 ต.ค. 2569',
        includeFourthPlace: false,
      },
    });
    const html = renderToStaticMarkup(element);
    expect(html).toContain('พิธีมอบรางวัล 2569');
    expect(html).toContain('ฟุตซอล');
    expect(html).toContain('สีแดง');
    expect(html).toContain('ceremony-print-area');
    // Ensure zero emojis in HTML output
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
    expect(emojiRegex.test(html)).toBe(false);
  });

  it('renders 11 events across 3 A4 pages with running headers, footers, and page numbers', () => {
    const elevenEvents = Array.from({ length: 11 }, (_, i) => ({
      key: `sport-${i + 1}|ทั่วไป`,
      sport_name: `กีฬาประเภท ${i + 1}`,
      category: 'ทั่วไป',
      done: true,
      places: [
        { place: 1, team_id: 'red' },
        { place: 2, team_id: 'blue' },
      ],
    }));

    const element = React.createElement(CeremonyPrintSheet, {
      events: elevenEvents,
      standings,
      teams,
      options: {
        ceremonyTitle: 'พิธีมอบรางวัล 2569',
        ceremonyDate: '11 ต.ค. 2569',
        includeFourthPlace: false,
      },
    });

    const html = renderToStaticMarkup(element);

    // Check that 3 distinct A4 pages were rendered
    const pageMatches = html.match(/class="ceremony-page"/g);
    expect(pageMatches).not.toBeNull();
    expect(pageMatches.length).toBe(3);

    // Check page running footers
    expect(html).toContain('หน้าที่ 1 จาก 3');
    expect(html).toContain('หน้าที่ 2 จาก 3');
    expect(html).toContain('หน้าที่ 3 จาก 3');

    // Check screen preview badges
    expect(html).toContain('แผ่นที่ 1 จาก 3 (ขนาดมาตรฐาน A4: 210 × 297 มม.)');
    expect(html).toContain('แผ่นที่ 2 จาก 3 (ขนาดมาตรฐาน A4: 210 × 297 มม.)');
    expect(html).toContain('แผ่นที่ 3 จาก 3 (ขนาดมาตรฐาน A4: 210 × 297 มม.)');

    // Grand Finale should be on the last page
    expect(html).toContain('การประกาศรางวัล ถ้วยคะแนนรวมเจ้าสนาม (Grand Finale)');

    // Ensure zero emojis
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
    expect(emojiRegex.test(html)).toBe(false);
  });
});

