'use client';

export default function TeamBadge({ name, colorHex, size = 'md' }) {
  const sizes = { sm: '0.75rem', md: '0.9rem', lg: '1.1rem' };
  const dotSizes = { sm: '7px', md: '9px', lg: '11px' };

  return (
    <span
      className="badge"
      style={{
        background: `${colorHex || '#666'}22`,
        color: colorHex || '#fff',
        fontSize: sizes[size] || sizes.md,
        border: `1px solid ${colorHex || '#666'}44`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
      }}
    >
      <span
        style={{
          width: dotSizes[size] || '9px',
          height: dotSizes[size] || '9px',
          borderRadius: '50%',
          backgroundColor: colorHex || 'currentColor',
          boxShadow: `0 0 8px ${colorHex || 'currentColor'}aa`,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      <span>{name}</span>
    </span>
  );
}
