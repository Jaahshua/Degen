'use client';

import { useState } from 'react';

const DRIVE_URL = 'https://drive.google.com/thumbnail?id=1IW2DicPl-aSJjxo7wbpN8k8Dkvi5FDha&sz=w1024';

/**
 * Tries /degensea-logo.png first (so once it's committed to /public it
 * takes over automatically), then falls back to the Google Drive
 * thumbnail URL (works immediately since the file is shared publicly),
 * then to gradient text if both fail.
 */
type Stage = 'local' | 'drive' | 'text';

export default function Logo({
  height = 32,
  glow = true,
}: {
  height?: number;
  glow?: boolean;
}) {
  const [stage, setStage] = useState<Stage>('local');

  if (stage === 'text') {
    return (
      <span
        style={{
          fontSize: height * 0.78,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          textShadow: glow ? '0 0 16px rgba(220,38,38,0.55)' : 'none',
          lineHeight: 1,
          display: 'inline-block',
        }}
      >
        <span className="text-sunset">DEGEN</span>
        <span style={{ color: '#fff' }}>SEA</span>
      </span>
    );
  }

  const src = stage === 'local' ? '/degensea-logo.png' : DRIVE_URL;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="DEGENSEA"
      onError={() => setStage(s => (s === 'local' ? 'drive' : 'text'))}
      style={{
        height,
        width: 'auto',
        display: 'block',
        filter: glow ? 'drop-shadow(0 6px 24px rgba(220,38,38,0.45))' : 'none',
      }}
    />
  );
}
