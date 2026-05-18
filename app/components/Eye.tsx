'use client';

export default function Eye({ size = 16, lit }: { size?: number; lit: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{
        display: 'block',
        opacity: lit ? 1 : 0.45,
        transition: 'opacity 300ms ease, filter 300ms ease',
        filter: lit ? 'drop-shadow(0 0 4px rgba(220,38,38,0.7))' : 'none',
        flexShrink: 0,
      }}
    >
      {lit ? (
        <g>
          <ellipse cx="12" cy="12" rx="10.5" ry="7.5" fill="#fef4e0" />
          <path d="M 2 10 Q 7 8 11 10" stroke="#dc2626" fill="none" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M 2 14 Q 7 16 11 14" stroke="#991b1b" fill="none" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M 22 10 Q 17 8 13 10" stroke="#dc2626" fill="none" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M 22 14 Q 17 16 13 14" stroke="#991b1b" fill="none" strokeWidth="0.8" strokeLinecap="round" />
          <circle cx="12" cy="12" r="4.5" fill="#1a0a0a" />
          <circle cx="12" cy="12" r="3.6" fill="#3a1810" />
          <circle cx="12" cy="12" r="2.4" fill="#5b1f12" />
          <circle cx="12" cy="12" r="1.6" fill="#000" />
          <circle cx="10.9" cy="10.9" r="0.6" fill="#fff" opacity="0.9" />
        </g>
      ) : (
        <ellipse
          cx="12" cy="12" rx="10" ry="7"
          fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="0.9"
        />
      )}
    </svg>
  );
}
