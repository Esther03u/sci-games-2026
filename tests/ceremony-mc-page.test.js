// tests/ceremony-mc-page.test.js
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import McTeleprompter from '@/components/admin/McTeleprompter';

const sports = [{ id: 'futsal', name: 'ฟุตซอล', sort_order: 1 }];
const teams = [
  { id: 'red', name: 'สีแดง', color_hex: '#ef4444' },
  { id: 'blue', name: 'สีน้ำเงิน', color_hex: '#3b82f6' },
];
const events = [
  {
    key: 'futsal|ชาย',
    sport_name: 'ฟุตซอล',
    category: 'ชาย',
    places: [
      { place: 1, team_id: 'red', team_name: 'สีแดง', points: 40 },
      { place: 2, team_id: 'blue', team_name: 'สีน้ำเงิน', points: 25 },
    ],
    done: true,
  },
];
const standings = [
  { id: 'red', name: 'สีแดง', total_points: 80, rank: 1, gold: 2, silver: 0, bronze: 0 },
  { id: 'blue', name: 'สีน้ำเงิน', total_points: 50, rank: 2, gold: 0, silver: 2, bronze: 0 },
];

describe('McTeleprompter component', () => {
  it('renders stage view, teleprompter navigation, and zero emojis', () => {
    const element = React.createElement(McTeleprompter, {
      initialEvents: events,
      initialStandings: standings,
      sports,
      teams,
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('mc-stage-shell');
    expect(html).toContain('stage-light');
    expect(html).toContain('ซิงก์ผลสด');
    expect(html).toContain('แผ่นที่ 1');
    expect(html).toContain('หน้าก่อนหน้า');
    expect(html).toContain('หน้าถัดไป');
    expect(html).toContain('พิธีมอบรางวัลและปิดการแข่งขัน');
    expect(html).toContain('ฟุตซอล');
    expect(html).toContain('สีแดง');

    // Strict check: zero unicode emojis
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u;
    expect(emojiRegex.test(html)).toBe(false);
  });
});
