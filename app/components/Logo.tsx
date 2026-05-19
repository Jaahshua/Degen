'use client';

import { useEffect, useState } from 'react';

const DRIVE_URL = 'https://drive.google.com/thumbnail?id=1IW2DicPl-aSJjxo7wbpN8k8Dkvi5FDha&sz=w1024';

type Stage = 'local' | 'drive' | 'text';
type Crop = { natW: number; natH: number; minX: number; minY: number; maxX: number; maxY: number };

/**
 * Tries /degensea-logo.png first, then the public Drive thumbnail URL,
 * then falls back to gradient text. Once an image loads, scans its alpha
 * channel on an offscreen canvas to find the tight bounding box of
 * non-transparent pixels, then re-renders the image at a scale that
 * makes the visible content (not the padding) exactly `height` tall.
 * If the canvas read is tainted by CORS (cross-origin source), silently
 * falls back to displaying the image at its natural height.
 */
export default function Logo({
  height = 32,
  glow = true,
}: {
  height?: number;
  glow?: boolean;
}) {
  const [stage, setStage] = useState<Stage>('local');
  const [crop, setCrop] = useState<Crop | null>(null);

  const src = stage === 'local' ? '/degensea-logo.png' : DRIVE_URL;

  useEffect(() => {
    if (stage === 'text') return;
    setCrop(null);
    let cancelled = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

        let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
        let found = false;
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            if (data[(y * canvas.width + x) * 4 + 3] > 30) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              found = true;
            }
          }
        }
        if (found && !cancelled) {
          setCrop({ natW: canvas.width, natH: canvas.height, minX, minY, maxX, maxY });
        }
      } catch {
        /* CORS taint — render image as-is */
      }
    };
    img.onerror = () => {
      if (cancelled) return;
      setStage(s => (s === 'local' ? 'drive' : 'text'));
    };
    img.src = src;

    return () => { cancelled = true; };
  }, [src, stage]);

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

  if (crop) {
    const cropW = crop.maxX - crop.minX + 1;
    const cropH = crop.maxY - crop.minY + 1;
    const scale = height / cropH;
    return (
      <div
        style={{
          position: 'relative',
          height,
          width: cropW * scale,
          overflow: 'hidden',
          display: 'block',
          filter: glow ? 'drop-shadow(0 6px 24px rgba(220,38,38,0.45))' : 'none',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="DEGENSEA"
          style={{
            position: 'absolute',
            left: -crop.minX * scale,
            top: -crop.minY * scale,
            width: crop.natW * scale,
            height: crop.natH * scale,
            display: 'block',
            maxWidth: 'none',
          }}
        />
      </div>
    );
  }

  // Pre-detection / CORS-fallback: render as-is at requested height.
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
