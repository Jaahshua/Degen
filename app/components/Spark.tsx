export default function Spark({
  data, up, w = 60, h = 24, strokeWidth = 1.6,
}: {
  data: number[]; up: boolean; w?: number; h?: number; strokeWidth?: number;
}) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 2 - ((d - min) / range) * (h - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const color = up ? '#10c87c' : '#ef4444';
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" points={pts}
        style={{ filter: `drop-shadow(0 0 4px ${up ? 'rgba(16,200,124,0.55)' : 'rgba(239,68,68,0.55)'})` }} />
    </svg>
  );
}

export function sparkline(base: number, change: number, n = 18) {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const trend = base * (1 - change / 200) + base * (change / 100) * t;
    const noise = (Math.sin(i * 1.3 + base) + Math.cos(i * 0.7) * 0.5) * base * 0.012;
    out.push(trend + noise);
  }
  return out;
}
