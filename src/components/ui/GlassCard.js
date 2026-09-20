'use client';

export default function GlassCard({
  children,
  className = '',
  style = {},
  hover = true,
  ...props
}) {
  return (
    <div
      className={`glass-card ${hover ? '' : 'no-hover'} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}
