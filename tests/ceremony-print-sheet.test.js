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
});
