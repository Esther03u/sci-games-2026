'use client';

import React from 'react';
import { Trophy, Flame, Shield, Award, Crown, Sparkles } from '@/components/animate-ui/icons';

export function FutsalIcon({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="12,7 15.5,9.5 14,14 10,14 8.5,9.5" fill={color} fillOpacity="0.18" />
      <path d="M12 7V2" />
      <path d="m15.5 9.5 4.5-2" />
      <path d="m14 14 3.5 4" />
      <path d="M10 14 6.5 18" />
      <path d="m8.5 9.5-4.5-2" />
    </svg>
  );
}

export function VolleyballIcon({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 0-7.07 17.07" />
      <path d="M12 22a10 10 0 0 0 7.07-17.07" />
      <path d="m4.93 4.93 14.14 14.14" />
    </svg>
  );
}

export function BasketballIcon({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M4.93 4.93c4.24 4.24 4.24 10.9 0 15.14" />
      <path d="M19.07 4.93c-4.24 4.24-4.24 10.9 0 15.14" />
    </svg>
  );
}

export function TakrawIcon({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <ellipse cx="12" cy="12" rx="5" ry="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="4.5" y1="6" x2="19.5" y2="18" />
      <line x1="4.5" y1="18" x2="19.5" y2="6" />
    </svg>
  );
}

export function PetanqueIcon({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <circle cx="9" cy="13" r="7" />
      <path d="M4 11c2.5 1.5 5 1.5 8 0" />
      <path d="M5 15c2.5 1.5 5 1.5 7 0" />
      <circle cx="18" cy="8" r="3.5" fill={color} fillOpacity="0.25" />
    </svg>
  );
}

export function SportIcon({
  sportId = '',
  sportName = '',
  size = 18,
  color = 'currentColor',
  className = '',
  style = {},
}) {
  const id = (sportId || '').toLowerCase();
  const name = (sportName || '').toLowerCase();

  if (id.includes('futsal') || name.includes('ฟุตซอล') || name.includes('futsal')) {
    return <FutsalIcon size={size} color={color} className={className} style={style} />;
  }
  if (id.includes('volleyball') || name.includes('วอลเลย์') || name.includes('volleyball')) {
    return <VolleyballIcon size={size} color={color} className={className} style={style} />;
  }
  if (id.includes('takraw') || name.includes('ตะกร้อ') || name.includes('takraw')) {
    return <TakrawIcon size={size} color={color} className={className} style={style} />;
  }
  if (id.includes('basketball') || name.includes('บาส') || name.includes('basketball')) {
    return <BasketballIcon size={size} color={color} className={className} style={style} />;
  }
  if (id.includes('petanque') || name.includes('เปตอง') || name.includes('petanque')) {
    return <PetanqueIcon size={size} color={color} className={className} style={style} />;
  }

  return (
    <Trophy
      size={size}
      style={{ color, display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      className={className}
    />
  );
}

export function TeamIcon({
  teamId = '',
  teamName = '',
  color = '#ffffff',
  size = 18,
  style = {},
}) {
  const id = (teamId || '').toLowerCase();
  const name = (teamName || '').toLowerCase();

  if (id.includes('red') || name.includes('แดง')) {
    return <Flame size={size} style={{ color, display: 'inline-block', verticalAlign: 'middle', ...style }} />;
  }
  if (id.includes('blue') || name.includes('ฟ้า') || name.includes('น้ำเงิน')) {
    return <Shield size={size} style={{ color, display: 'inline-block', verticalAlign: 'middle', ...style }} />;
  }
  if (id.includes('green') || name.includes('เขียว')) {
    return <Award size={size} style={{ color, display: 'inline-block', verticalAlign: 'middle', ...style }} />;
  }
  if (id.includes('purple') || name.includes('ม่วง')) {
    return <Crown size={size} style={{ color, display: 'inline-block', verticalAlign: 'middle', ...style }} />;
  }
  return <Shield size={size} style={{ color, display: 'inline-block', verticalAlign: 'middle', ...style }} />;
}

export default SportIcon;
