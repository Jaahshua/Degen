'use client';

/**
 * Small pixel-art-style eye that animates through three states:
 *   - 'closed'    : empty slot, dark almond
 *   - 'normal'    : open clean eye (blue iris, white highlight)
 *   - 'bloodshot' : same eye + red vein squiggles + blood drip
 *
 * All sizing is on explicit width/height attributes so it never
 * depends on Tailwind compiling arbitrary classes.
 */
export type EyeState = 'closed' | 'normal' | 'bloodshot';

export default function Eye({
  size = 20,
  state = 'closed',
}: {
  size?: number;
  state?: EyeState;
}) {
  if (state === 'closed') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        style={{ display: 'block', flexShrink: 0, opacity: 0.45 }}
      >
        <ellipse cx="12" cy="12" rx="10" ry="6" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      style={{
        display: 'block',
        flexShrink: 0,
        filter:
          state === 'bloodshot'
            ? 'drop-shadow(0 0 4px rgba(220,38,38,0.6))'
            : 'drop-shadow(0 0 3px rgba(31,124,204,0.55))',
        transition: 'filter 250ms ease',
      }}
    >
      {/* dark rim */}
      <circle cx="12" cy="12" r="10.5" fill="#4a1818" />
      {/* sclera */}
      <circle cx="12" cy="12" r="9.5" fill="#f5e9d0" />

      {/* iris */}
      <circle cx="12" cy="12" r="5.5" fill="#0e3d70" />
      <circle cx="12" cy="12" r="5"   fill="#1f7ccc" />
      {/* iris rays (lighter blue) */}
      <rect x="11.5" y="7"    width="1" height="2"   fill="#5db8ff" />
      <rect x="11.5" y="15"   width="1" height="2"   fill="#5db8ff" />
      <rect x="7"    y="11.5" width="2" height="1"   fill="#5db8ff" />
      <rect x="15"   y="11.5" width="2" height="1"   fill="#5db8ff" />
      <rect x="8.5"  y="8.5"  width="1" height="1"   fill="#5db8ff" />
      <rect x="14.5" y="8.5"  width="1" height="1"   fill="#5db8ff" />
      <rect x="8.5"  y="14.5" width="1" height="1"   fill="#5db8ff" />
      <rect x="14.5" y="14.5" width="1" height="1"   fill="#5db8ff" />

      {/* pupil */}
      <circle cx="12" cy="12" r="2.2" fill="#000" />
      {/* highlights */}
      <rect x="10"   y="9.5"  width="1.6" height="1.6" fill="#fff" />
      <rect x="13.5" y="9.5"  width="0.8" height="0.8" fill="#fff" opacity="0.7" />

      {/* bloodshot extras */}
      {state === 'bloodshot' && (
        <g>
          {/* vein squiggles around the sclera */}
          <path d="M 3 9   L 5 8.5 L 6 10 L 7 9.5" stroke="#dc2626" fill="none" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M 2.5 13 L 4 13.5 L 5 12.5 L 6 13.5" stroke="#dc2626" fill="none" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M 4 17 L 5 16 L 6.5 17 L 7.5 16.5" stroke="#dc2626" fill="none" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M 21 9   L 19 8.5 L 18 10 L 17 9.5" stroke="#dc2626" fill="none" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M 21.5 13 L 20 13.5 L 19 12.5 L 18 13.5" stroke="#dc2626" fill="none" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M 20 17 L 19 16 L 17.5 17 L 16.5 16.5" stroke="#dc2626" fill="none" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M 9 4 L 10 5 L 11 4.5 L 12 5.5" stroke="#dc2626" fill="none" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M 13 4.5 L 14 5.5 L 15 4.5" stroke="#dc2626" fill="none" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M 9 20 L 10 19 L 11 20 L 12 19.5" stroke="#dc2626" fill="none" strokeWidth="0.9" strokeLinecap="round" />
          {/* blood drip on lower right */}
          <path d="M 18.5 18.5 L 19.5 20 L 19 21 L 18.5 21.5 L 18 21 L 18 19.5 Z" fill="#dc2626" />
        </g>
      )}
    </svg>
  );
}
