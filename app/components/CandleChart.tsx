'use client';

import { useMemo, useState } from 'react';
import type { Candle } from '../data';

const PAD_RIGHT = 56;     // y-axis labels
const PAD_BOTTOM = 26;    // x-axis labels
const PAD_TOP = 8;

function fmtPrice(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}m`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}k`;
  return n.toFixed(2);
}
function fmtTime(min: number) {
  // min = minutes back from "now"; turn into clock time HH:MM
  const now = new Date(2026, 4, 17, 23, 30);
  const d = new Date(now.getTime() - min * 60_000);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function CandleChart({
  candles, currentPrice, height = 320,
}: {
  candles: Candle[];
  currentPrice: number;
  height?: number;
}) {
  const [hover, setHover] = useState<{ x: number; y: number; i: number } | null>(null);

  const { min, max } = useMemo(() => {
    let lo = Infinity, hi = -Infinity;
    for (const c of candles) { if (c.l < lo) lo = c.l; if (c.h > hi) hi = c.h; }
    const range = hi - lo;
    return { min: lo - range * 0.08, max: hi + range * 0.08 };
  }, [candles]);

  const W = 100, H = 100;
  const innerW = W - (PAD_RIGHT / 360) * W;
  const innerH = H - (PAD_BOTTOM / height) * H - (PAD_TOP / height) * H;
  const top = (PAD_TOP / height) * H;

  const yOf = (p: number) => top + ((max - p) / (max - min)) * innerH;
  const xOf = (i: number) => (i + 0.5) * (innerW / candles.length);

  const candleW = (innerW / candles.length) * 0.62;
  const gridN = 8;
  const gridLines = Array.from({ length: gridN }, (_, i) => {
    const ratio = i / (gridN - 1);
    const y = top + ratio * innerH;
    const price = max - ratio * (max - min);
    return { y, price };
  });

  const timeMarks = [0, 0.25, 0.5, 0.75, 0.95].map(r => {
    const idx = Math.floor(r * (candles.length - 1));
    return {
      x: xOf(idx),
      label: fmtTime(Math.round((1 - r) * (candles.length - 1))),
    };
  });

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    if (px > innerW) { setHover(null); return; }
    const i = Math.min(candles.length - 1, Math.max(0, Math.floor(px / (innerW / candles.length))));
    setHover({ x: xOf(i), y: yOf(candles[i].c), i });
  };

  const currentY = yOf(currentPrice);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      {/* Grid + y labels */}
      {gridLines.map((g, i) => (
        <g key={i}>
          <line
            x1={0} y1={g.y} x2={innerW} y2={g.y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.15"
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={W - 2} y={g.y + 1.4}
            fill="rgba(255,255,255,0.45)"
            fontSize="2.6"
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
          >
            {fmtPrice(g.price)}
          </text>
        </g>
      ))}

      {/* Candles */}
      {candles.map((c, i) => {
        const x = xOf(i);
        const up = c.c >= c.o;
        const fill = up ? '#22c55e' : '#ef4444';
        const bodyTop = yOf(Math.max(c.o, c.c));
        const bodyBot = yOf(Math.min(c.o, c.c));
        return (
          <g key={i}>
            <line
              x1={x} y1={yOf(c.h)} x2={x} y2={yOf(c.l)}
              stroke={fill}
              strokeWidth="0.18"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x={x - candleW / 2}
              y={bodyTop}
              width={candleW}
              height={Math.max(0.4, bodyBot - bodyTop)}
              fill={fill}
            />
          </g>
        );
      })}

      {/* Current price line + label */}
      <line
        x1={0} y1={currentY} x2={innerW} y2={currentY}
        stroke="#ef4444" strokeOpacity="0.7"
        strokeDasharray="0.6,0.6" strokeWidth="0.18"
        vectorEffect="non-scaling-stroke"
      />
      <rect
        x={innerW - 0.2} y={currentY - 1.7}
        width={W - innerW + 0.2}
        height="3.4" fill="#ef4444" rx="0.4"
      />
      <text
        x={innerW + (W - innerW) / 2 - 0.2}
        y={currentY + 1}
        fill="#fff"
        fontSize="2.4"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontWeight="700"
      >
        {fmtPrice(currentPrice)}
      </text>

      {/* Hover crosshair */}
      {hover && (
        <g>
          <line x1={hover.x} y1={top} x2={hover.x} y2={top + innerH} stroke="rgba(255,255,255,0.25)" strokeDasharray="0.5,0.5" strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
          <line x1={0} y1={hover.y} x2={innerW} y2={hover.y} stroke="rgba(255,255,255,0.25)" strokeDasharray="0.5,0.5" strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
        </g>
      )}

      {/* X-axis time marks */}
      <g>
        {timeMarks.map((t, i) => (
          <text
            key={i}
            x={t.x} y={H - 0.5}
            fill="rgba(255,255,255,0.45)"
            fontSize="2.4"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
          >
            {t.label}
          </text>
        ))}
      </g>
    </svg>
  );
}
