export type Collection = {
  slug: string;
  ticker: string;
  name: string;
  floor: number;
  change24h: number;
  volume24h: number;
  owners: number;
  supply: number;
};

export const COLLECTIONS: Collection[] = [
  { slug: 'cryptopunks',         ticker: 'PUNKS',  name: 'CryptoPunks',     floor: 42.5,  change24h:  6.8, volume24h: 1280, owners: 3700, supply: 10000 },
  { slug: 'boredapeyachtclub',   ticker: 'BAYC',   name: 'Bored Ape YC',    floor: 11.2,  change24h: -2.4, volume24h:  640, owners: 5400, supply: 10000 },
  { slug: 'pudgypenguins',       ticker: 'PUDGY',  name: 'Pudgy Penguins',  floor:  8.9,  change24h:  4.1, volume24h:  410, owners: 5100, supply:  8888 },
  { slug: 'azuki',               ticker: 'AZUKI',  name: 'Azuki',           floor:  4.6,  change24h:  1.8, volume24h:  320, owners: 4900, supply: 10000 },
  { slug: 'doodles-official',    ticker: 'DOODLE', name: 'Doodles',         floor:  1.4,  change24h: -0.9, volume24h:  120, owners: 6200, supply: 10000 },
  { slug: 'milady',              ticker: 'MILADY', name: 'Milady Maker',    floor:  3.1,  change24h: 12.3, volume24h:  290, owners: 5600, supply: 10000 },
  { slug: 'memeland-captainz',   ticker: 'CPTNZ',  name: 'The Captainz',    floor:  2.8,  change24h:  5.6, volume24h:  180, owners: 4300, supply:  9999 },
  { slug: 'mfers',               ticker: 'MFER',   name: 'mfers',           floor:  0.9,  change24h: -3.2, volume24h:   95, owners: 5800, supply: 10021 },
  { slug: 'lilpudgys',           ticker: 'LILP',   name: 'Lil Pudgys',      floor:  0.7,  change24h:  8.4, volume24h:  150, owners: 7100, supply: 22222 },
  { slug: 'remilio-babies',      ticker: 'REMIL',  name: 'Remilio Babies',  floor:  1.8,  change24h: 22.1, volume24h:  210, owners: 3200, supply:  10000 },
];

export type Drop = {
  id: string;
  name: string;
  ticker: string;
  artist: string;
  supply: number;
  priceEth: number;
  // unix ms until mint goes live (relative offset from now generated client-side)
  liveInSeconds: number;
  hot?: boolean;
  // gradient swatch tokens used for the cover
  hue1: string; hue2: string; hue3: string;
};

export const DROPS: Drop[] = [
  { id: 'd1', name: 'NEONSUN GENESIS',  ticker: 'NEON',  artist: 'pxlheat',   supply: 4444,  priceEth: 0.069, liveInSeconds: 60 * 12,         hot: true,  hue1: '#ff7a9b', hue2: '#ff9966', hue3: '#fdb869' },
  { id: 'd2', name: 'PALM REVERIE',     ticker: 'PALMS', artist: 'lo-fimi',   supply: 8888,  priceEth: 0.042, liveInSeconds: 60 * 60 * 3,                hue1: '#5b2c8e', hue2: '#c54a8e', hue3: '#ff7a9b' },
  { id: 'd3', name: 'MIAMI MIRRORS',    ticker: 'MIRR',  artist: 'pastelboy', supply: 2222,  priceEth: 0.15,  liveInSeconds: 60 * 60 * 18,    hot: true,  hue1: '#1f2469', hue2: '#5b2c8e', hue3: '#ff7a9b' },
  { id: 'd4', name: 'OFF-DUTY MOON',    ticker: 'MOON',  artist: 'arpeggio',  supply: 5555,  priceEth: 0.025, liveInSeconds: 60 * 60 * 26,               hue1: '#c54a8e', hue2: '#ff7a9b', hue3: '#ff9966' },
  { id: 'd5', name: 'VAPORCOAST',       ticker: 'VAPOR', artist: 'b-side',    supply: 3333,  priceEth: 0.08,  liveInSeconds: 60 * 60 * 48,               hue1: '#1f2469', hue2: '#c54a8e', hue3: '#fdb869' },
  { id: 'd6', name: 'STREETLIGHT SAINT',ticker: 'SAINT', artist: 'rgb-pope',  supply: 1111,  priceEth: 0.5,   liveInSeconds: 60 * 60 * 72,    hot: true,  hue1: '#5b2c8e', hue2: '#ff9966', hue3: '#fdb869' },
];

export type LaunchToken = {
  id: string;
  ticker: string;
  name: string;
  dev: string;       // truncated address
  ageMin: number;
  priceUsd: number;
  marketcap: number;
  holders: number;
  change24h: number;
  bondingPct: number; // 0..100, how close to graduating
  hue1: string; hue2: string;
};

export const LAUNCH_TOKENS: LaunchToken[] = [
  { id: 'l1',  ticker: 'MIAMI',     name: 'Miami Vice Coin',     dev: '0x4f3a…b21c', ageMin:    2, priceUsd: 0.0000124,  marketcap:  62_400, holders:   188, change24h:  248,  bondingPct: 18, hue1:'#ff7a9b', hue2:'#ff9966' },
  { id: 'l2',  ticker: 'NEONSUN',   name: 'Neon Sun',            dev: '0x91ee…02f9', ageMin:    7, priceUsd: 0.0000089,  marketcap:  41_200, holders:   142, change24h:  102,  bondingPct: 12, hue1:'#c54a8e', hue2:'#fdb869' },
  { id: 'l3',  ticker: 'VICEINU',   name: 'Vice Inu',            dev: '0xa0c1…7711', ageMin:   14, priceUsd: 0.0000412,  marketcap: 198_000, holders:   612, change24h:   38,  bondingPct: 64, hue1:'#5b2c8e', hue2:'#ff7a9b' },
  { id: 'l4',  ticker: 'PALMOS',    name: 'Palmos',              dev: '0x88dd…4421', ageMin:   31, priceUsd: 0.0000231,  marketcap: 102_500, holders:   329, change24h:   12,  bondingPct: 41, hue1:'#1f2469', hue2:'#c54a8e' },
  { id: 'l5',  ticker: 'PINKMOON',  name: 'Pink Moon Society',   dev: '0xfaaa…cc01', ageMin:   58, priceUsd: 0.0001120,  marketcap: 411_000, holders:  1023, change24h:   -8,  bondingPct: 88, hue1:'#ff7a9b', hue2:'#fdb869' },
  { id: 'l6',  ticker: 'PALMHEAT',  name: 'Palm Heat',           dev: '0x2317…91aa', ageMin:   95, priceUsd: 0.0000051,  marketcap:  21_100, holders:    91, change24h:  -52,  bondingPct:  4, hue1:'#c54a8e', hue2:'#ff9966' },
  { id: 'l7',  ticker: 'SUNSETBRO', name: 'Sunset Bro',          dev: '0xbe11…7700', ageMin:  142, priceUsd: 0.0000334,  marketcap: 152_400, holders:   441, change24h:    4,  bondingPct: 51, hue1:'#1f2469', hue2:'#ff7a9b' },
  { id: 'l8',  ticker: 'GULFCOAST', name: 'Gulf Coast',          dev: '0x4422…01ed', ageMin:  211, priceUsd: 0.0000412,  marketcap: 188_000, holders:   612, change24h:   24,  bondingPct: 60, hue1:'#5b2c8e', hue2:'#fdb869' },
  { id: 'l9',  ticker: 'COCONUTS',  name: 'Coconuts',            dev: '0x9999…aabb', ageMin:  302, priceUsd: 0.0000123,  marketcap:  54_900, holders:   201, change24h:   -2,  bondingPct: 22, hue1:'#ff9966', hue2:'#fdb869' },
  { id: 'l10', ticker: 'VAPORWAVE', name: 'Vaporwave Token',     dev: '0xa01c…3344', ageMin:  618, priceUsd: 0.0002420,  marketcap: 998_000, holders:  2200, change24h:   88,  bondingPct: 96, hue1:'#5b2c8e', hue2:'#ff7a9b' },
  { id: 'l11', ticker: 'OCEANDR',   name: 'Ocean Drive',         dev: '0xdead…beef', ageMin:  844, priceUsd: 0.0000089,  marketcap:  38_400, holders:   151, change24h:   18,  bondingPct: 15, hue1:'#1f2469', hue2:'#c54a8e' },
  { id: 'l12', ticker: 'CABANA',    name: 'Cabana',              dev: '0x7711…0091', ageMin: 1102, priceUsd: 0.0000631,  marketcap: 281_000, holders:   821, change24h:    6,  bondingPct: 73, hue1:'#c54a8e', hue2:'#ff9966' },
];

export const formatUsd = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(7)}`;
};

export const formatAge = (m: number) => {
  if (m < 60) return `${m}m`;
  if (m < 60 * 24) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / (60 * 24))}d`;
};

export const formatCountdown = (s: number) => {
  if (s <= 0) return 'LIVE';
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}D ${h}H ${m}M`;
  if (h > 0) return `${h}H ${m}M ${sec}S`;
  return `${m}M ${sec}S`;
};

export const formatEth = (n: number, decimals = 3) =>
  n >= 100 ? n.toFixed(1) : n >= 10 ? n.toFixed(2) : n.toFixed(decimals);

export const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const HEX = '0123456789abcdef';
export function makeAddr(seed: number) {
  // Tiny seeded PRNG so the same row keeps the same wallet across renders
  let s = seed | 0;
  let out = '0x';
  for (let i = 0; i < 40; i++) {
    s = (s * 1664525 + 1013904223) | 0;
    out += HEX[(s >>> 24) & 0xf];
  }
  return out;
}

export type Trade = {
  id: number;
  ageSec: number;
  type: 'BUY' | 'SELL' | 'SWEEP' | 'BID';
  price: number;
  amount: number;
  maker: string;
};

export function generateTrades(slug: string, floor: number, count = 22): Trade[] {
  // deterministic per-slug so the table doesn't visually thrash between renders
  let seed = 0;
  for (let i = 0; i < slug.length; i++) seed = (seed * 31 + slug.charCodeAt(i)) | 0;
  const out: Trade[] = [];
  let t = 2;
  for (let i = 0; i < count; i++) {
    seed = (seed * 1664525 + 1013904223) | 0;
    const r = (Math.abs(seed) % 10000) / 10000;
    const r2 = (Math.abs(seed ^ 0x9e3779b1) % 10000) / 10000;
    const r3 = (Math.abs(seed ^ 0x7f4a7c15) % 10000) / 10000;

    const type: Trade['type'] =
      r < 0.55 ? 'BUY' : r < 0.85 ? 'SELL' : r < 0.94 ? 'SWEEP' : 'BID';
    const drift = (r2 - 0.5) * 0.04 * floor;
    const price = Math.max(0.001, floor + drift);
    const amount =
      type === 'SWEEP' ? 2 + Math.floor(r3 * 5) :
      type === 'BID'   ? 1 :
                         Math.max(1, Math.floor(r3 * 3));
    out.push({
      id: i,
      ageSec: t,
      type,
      price,
      amount,
      maker: makeAddr(seed ^ i),
    });
    t += 3 + Math.floor(r3 * 90);
  }
  return out;
}

export type Holder = { rank: number; address: string; holds: number; pct: number };

export function generateHolders(slug: string, supply: number, count = 8): Holder[] {
  let seed = 0;
  for (let i = 0; i < slug.length; i++) seed = (seed * 17 + slug.charCodeAt(i)) | 0;
  const out: Holder[] = [];
  let remainingPct = 28;
  for (let i = 0; i < count; i++) {
    seed = (seed * 1103515245 + 12345) | 0;
    const r = (Math.abs(seed) % 10000) / 10000;
    const slice = i === 0 ? 4.5 + r * 2 : Math.max(0.4, remainingPct * (0.18 + r * 0.18));
    remainingPct = Math.max(0, remainingPct - slice);
    out.push({
      rank: i + 1,
      address: makeAddr(seed ^ (i * 7919)),
      holds: Math.max(1, Math.round((slice / 100) * supply)),
      pct: Number(slice.toFixed(2)),
    });
  }
  return out;
}

export type Candle = { o: number; h: number; l: number; c: number };

export function generateCandles(slug: string, basePrice: number, count = 60): Candle[] {
  let seed = 0;
  for (let i = 0; i < slug.length; i++) seed = (seed * 31 + slug.charCodeAt(i)) | 0;
  const out: Candle[] = [];
  let price = basePrice * 0.92;
  for (let i = 0; i < count; i++) {
    seed = (seed * 1664525 + 1013904223) | 0;
    const r  = (Math.abs(seed)             % 10000) / 10000;
    seed = (seed * 1664525 + 1013904223) | 0;
    const r2 = (Math.abs(seed ^ 0x9e3779b1) % 10000) / 10000;
    seed = (seed * 1664525 + 1013904223) | 0;
    const r3 = (Math.abs(seed ^ 0x7f4a7c15) % 10000) / 10000;

    const open  = price;
    const trend = (i / count - 0.35) * basePrice * 0.0035;
    const close = open + (r - 0.5) * basePrice * 0.018 + trend;
    const wick  = basePrice * 0.012 * (0.4 + r2);
    const hi    = Math.max(open, close) + wick * r2;
    const lo    = Math.min(open, close) - wick * (1 - r3) * 0.9;
    out.push({ o: open, h: hi, l: lo, c: close });
    price = close;
  }
  // Last candle settles near basePrice for visual continuity
  const last = out[out.length - 1];
  last.c = basePrice;
  last.h = Math.max(last.h, basePrice);
  last.l = Math.min(last.l, basePrice * 0.998);
  return out;
}

export const formatAgeSec = (s: number) => {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};
