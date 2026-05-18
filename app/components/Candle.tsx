'use client';

import { useMemo } from 'react';
import type { Candle } from '../data';

function fmtY(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}m`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  if (n >= 1)   return n.toFixed(2);
  return n.toFixed(3);
}

function fmtTime(minutesAgo: number) {
  const now = new Date(2026, 4, 17, 23, 30);
  const d = new Date(now.getTime() - minutesAgo * 60_000);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function Candle({
  candles, currentPrice, width = 360, height = 300,
}: {
  candles: Candle[]; currentPrice: number; width?: number; height?: number;
}) {
  const padRight  = 52;
  const padBottom = 22;
  const padTop    = 8;

  const innerW = width  - padRight;
  const innerH = height - padTop - padBottom;

  const { lo, hi } = useMemo(() => {
    let a = Infinity, b = -Infinity;
    for (const c of candles) { if (c.l < a) a = c.l; if (c.h > b) b = c.h; }
    const range = b - a;
    return { lo: a - range * 0.08, hi: b + range * 0.08 };
  }, [candles]);

  const yOf = (p: number) => padTop + ((hi - p) / (hi - lo)) * innerH;
  const xOf = (i: number) => (i + 0.5) * (innerW / candles.length);
  const candleW = Math.max(1.5, (innerW / candles.length) * 0.62);

  const gridN = 7;
  const gridLines = Array.from({ length: gridN }, (_, i) => {
    const ratio = i / (gridN - 1);
    const y = padTop + ratio * innerH;
    const price = hi - ratio * (hi - lo);
    return { y, price };
  });

  const timeMarks = [0.05, 0.3, 0.55, 0.8, 0.97].map(r => {
    const idx = Math.floor(r * (candles.length - 1));
    return { x: xOf(idx), label: fmtTime(Math.round((1 - r) * (candles.length - 1))) };
  });

  const cy = yOf(currentPrice);

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {/* Grid + y-axis labels */}
      {gridLines.map((g, i) => (
        <g key={i}>
          <line x1={0} y1={g.y} x2={innerW} y2={g.y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
          <text
            x={width - 4} y={g.y + 4}
            fill="rgba(255,255,255,0.45)"
            fontSize={10}
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
          >
            {fmtY(g.price)}
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
            <line x1={x} y1={yOf(c.h)} x2={x} y2={yOf(c.l)} stroke={fill} strokeWidth={1} />
            <rect
              x={x - candleW / 2}
              y={bodyTop}
              width={candleW}
              height={Math.max(1, bodyBot - bodyTop)}
              fill={fill}
            />
          </g>
        );
      })}

      {/* Current price line */}
      <line x1={0} y1={cy} x2={innerW} y2={cy} stroke="#ef4444" strokeOpacity={0.7} strokeDasharray="3 3" strokeWidth={1} />
      <rect x={innerW} y={cy - 9} width={padRight} height={18} fill="#ef4444" rx={3} />
      <text
        x={innerW + padRight / 2} y={cy + 4}
        fill="#fff" fontSize={10} fontWeight={700} textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
      >
        {fmtY(currentPrice)}
      </text>

      {/* Time marks */}
      {timeMarks.map((t, i) => (
        <text
          key={i}
          x={t.x} y={height - 4}
          fill="rgba(255,255,255,0.45)"
          fontSize={10}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
        >
          {t.label}
        </text>
      ))}
    </svg>
  );
}
