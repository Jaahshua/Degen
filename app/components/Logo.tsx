'use client';

import { useState } from 'react';

/**
 * Renders /degensea-logo.png. If the file isn't present in /public,
 * falls back to the gradient text so the page is never broken.
 *
 * Sized by an explicit `height` prop (px). Width auto-scales to the
 * image's aspect ratio so the logo never gets distorted.
 */
export default function Logo({
  height = 32,
  glow = true,
}: {
  height?: number;
  glow?: boolean;
}) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <span
        style={{
          fontSize: height * 0.78,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          textShadow: glow ? '0 0 16px rgba(255,61,138,0.5)' : 'none',
          lineHeight: 1,
          display: 'inline-block',
        }}
      >
        <span className="text-sunset">DEGEN</span>
        <span style={{ color: '#fff' }}>SEA</span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/degensea-logo.png"
      alt="DEGENSEA"
      onError={() => setErrored(true)}
      style={{
        height,
        width: 'auto',
        display: 'block',
        filter: glow ? 'drop-shadow(0 6px 20px rgba(255,61,138,0.35))' : 'none',
      }}
    />
  );
}
