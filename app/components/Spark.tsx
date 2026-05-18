'use client';

export function sparkline(base: number, change: number, n = 24) {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const trend = base * (1 - change / 200) + base * (change / 100) * t;
    const noise = (Math.sin(i * 1.3 + base) + Math.cos(i * 0.7) * 0.5) * base * 0.012;
    out.push(trend + noise);
  }
  return out;
}

export default function Spark({
  data, up, width = 80, height = 36, strokeWidth = 1.8,
}: {
  data: number[]; up: boolean; width?: number; height?: number; strokeWidth?: number;
}) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - 4) + 2;
    const y = height - 2 - ((d - min) / range) * (height - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const color = up ? '#22c55e' : '#ef4444';
  return (
    <svg
      width={width}
      height={height}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
        style={{
          filter: `drop-shadow(0 0 4px ${up ? 'rgba(34,197,94,0.55)' : 'rgba(239,68,68,0.55)'})`,
        }}
      />
    </svg>
  );
}
