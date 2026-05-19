'use client';

import { useState } from 'react';
import type { Collection } from '../data';

/**
 * Shows the live NFT artwork (OpenSea image_url) for a collection at any
 * size. Gracefully degrades to a gradient-and-ticker tile if the image
 * is missing or fails to load.
 */
export default function Thumb({
  collection,
  size = 56,
  radius = 16,
}: {
  collection: Collection;
  size?: number;
  radius?: number;
}) {
  const [errored, setErrored] = useState(false);
  const hueA = (collection.ticker.charCodeAt(0) * 23) % 360;
  const hueB = (collection.ticker.charCodeAt(1) * 41) % 360;

  if (collection.imageUrl && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={collection.imageUrl}
        alt={collection.name}
        onError={() => setErrored(true)}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: 'cover',
          flexShrink: 0,
          display: 'block',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(135deg, hsl(${hueA} 70% 45%), hsl(${hueB} 70% 55%))`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.25) 0%, transparent 45%)',
        }}
      />
      <span
        style={{
          position: 'relative',
          color: '#fff',
          fontWeight: 900,
          fontSize: size * 0.32,
          letterSpacing: '-0.02em',
          textShadow: '0 2px 6px rgba(0,0,0,0.55)',
        }}
      >
        {collection.ticker.slice(0, 2)}
      </span>
    </div>
  );
}
