export type Collection = {
  slug: string;
  ticker: string;
  name: string;
  floor: number;
  change24h: number;
  volume24h: number;
  owners: number;
  supply: number;
  imageUrl?: string;
};

/**
 * Look up an arbitrary OpenSea slug (not in our curated list) and
 * return a hydrated Collection, or null if both endpoints come back
 * empty (slug doesn't exist or got rate-limited). Used by the search
 * box so users can pull up *any* collection by its OpenSea slug.
 */
export async function searchOpenSeaSlug(slug: string): Promise<Collection | null> {
  const headers = { Accept: 'application/json' };
  const safe = async (url: string) => {
    try {
      const r = await fetch(url, { headers });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  };

  const [stats, meta] = await Promise.all([
    safe(`https://api.opensea.io/api/v2/collections/${slug}/stats`),
    safe(`https://api.opensea.io/api/v2/collections/${slug}`),
  ]);
  if (!stats && !meta) return null;

  const oneDay = stats?.intervals?.find((i: any) => i.interval === 'one_day');
  const name = meta?.name || slug;
  return {
    slug,
    name,
    ticker: deriveTicker(name, slug),
    imageUrl: meta?.image_url,
    floor:     Number(stats?.total?.floor_price) || 0,
    volume24h: Number(oneDay?.volume) || 0,
    change24h: Number(oneDay?.volume_change) || 0,
    owners:    Number(stats?.total?.num_owners) || 0,
    supply:    Number(meta?.total_supply) || 10000,
  };
}

function deriveTicker(name: string, slug: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words.map(w => w[0]).join('').toUpperCase().slice(0, 6);
  }
  if (words.length === 1) return words[0].toUpperCase().slice(0, 6);
  return slug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

/**
 * Try a few slug variants for a free-text query (lowercase, hyphenated,
 * collapsed) and return the first hit, or null.
 */
export async function searchOpenSea(query: string): Promise<Collection | null> {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const variants = Array.from(new Set([
    q,                                            // as-is
    q.replace(/\s+/g, '-'),                       // spaces -> hyphens
    q.replace(/\s+/g, ''),                        // no spaces
    q.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
    q.replace(/[^a-z0-9]/g, ''),                  // alphanumeric only
  ].filter(Boolean)));

  for (const slug of variants) {
    const hit = await searchOpenSeaSlug(slug);
    if (hit) return hit;
  }
  return null;
}

/* ============================================================
   BUBBLE MAP — synthetic top-holder data for the wallet tracker.
   Used by the Bubbles view. Marked synthetic because OpenSea's
   per-wallet holdings endpoint needs auth; we can wire that up
   later with NEXT_PUBLIC_OPENSEA_API_KEY.
   ============================================================ */

export type Wallet = {
  id: number;
  address: string;
  holdings: number;
  cluster: number;   // 0 = standalone, 1+ = part of a suspicious cluster
};

export function generateBubbleMap(slug: string, supply: number, count = 36): Wallet[] {
  let seed = 0;
  for (let i = 0; i < slug.length; i++) seed = (seed * 31 + slug.charCodeAt(i)) | 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) | 0;
    return (Math.abs(seed) % 10000) / 10000;
  };

  const wallets: Wallet[] = [];
  for (let i = 0; i < count; i++) {
    // Pareto-ish tail: top wallets hold a lot, fall off fast
    const share = Math.pow(0.86, i) * 0.08 * (0.6 + rand() * 0.8);
    const holdings = Math.max(1, Math.round(supply * share));
    // ~30% land in one of three clusters; the rest are standalone
    const r = rand();
    const cluster =
      r < 0.10 ? 1 :  // suspicious / dev wallets
      r < 0.20 ? 2 :  // insider cluster
      r < 0.30 ? 3 :  // whale cluster
      0;
    wallets.push({
      id: i,
      address: makeAddr(seed ^ (i * 7919)),
      holdings,
      cluster,
    });
  }
  return wallets;
}

export type BubblePos = { x: number; y: number; r: number };

export function layoutBubbles(
  wallets: Wallet[],
  width: number,
  height: number,
  iterations = 140,
): BubblePos[] {
  const N = wallets.length;
  if (N === 0) return [];

  // Radius scaled by sqrt(holdings) so visual area ≈ proportional to holdings.
  const maxH = Math.max(...wallets.map(w => w.holdings));
  const minR = 8;
  const maxR = Math.min(width, height) * 0.13;
  const radii = wallets.map(w => minR + (maxR - minR) * Math.sqrt(w.holdings / maxH));

  // Seeded layout: spread around the center on a spiral so the
  // simulation starts from a stable shape every time.
  const positions = wallets.map((_, i) => {
    const a = i * 2.4;
    const d = 12 + i * 4;
    return {
      x: width / 2 + Math.cos(a) * d,
      y: height / 2 + Math.sin(a) * d,
      vx: 0,
      vy: 0,
    };
  });

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < N; i++) {
      let fx = 0, fy = 0;

      // Soft pull toward center
      fx += (width / 2 - positions[i].x) * 0.012;
      fy += (height / 2 - positions[i].y) * 0.012;

      // Mutual repulsion / collision
      for (let j = 0; j < N; j++) {
        if (i === j) continue;
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const minDist = radii[i] + radii[j] + 4;
        if (dist < minDist) {
          const push = (minDist - dist) / dist * 0.45;
          fx += dx * push;
          fy += dy * push;
        }
      }

      // Cluster cohesion: same-cluster wallets pull each other together
      const cluster = wallets[i].cluster;
      if (cluster > 0) {
        for (let j = 0; j < N; j++) {
          if (i === j || wallets[j].cluster !== cluster) continue;
          fx += (positions[j].x - positions[i].x) * 0.014;
          fy += (positions[j].y - positions[i].y) * 0.014;
        }
      }

      positions[i].vx = (positions[i].vx + fx) * 0.7;
      positions[i].vy = (positions[i].vy + fy) * 0.7;
    }
    for (let i = 0; i < N; i++) {
      positions[i].x += positions[i].vx;
      positions[i].y += positions[i].vy;
      // Clamp to canvas
      positions[i].x = Math.max(radii[i] + 2, Math.min(width  - radii[i] - 2, positions[i].x));
      positions[i].y = Math.max(radii[i] + 2, Math.min(height - radii[i] - 2, positions[i].y));
    }
  }

  return positions.map((p, i) => ({ x: p.x, y: p.y, r: radii[i] }));
}

/* ============================================================
   SNIPER BOT — persistable per-user sniper configurations,
   stored in localStorage. Real execution requires wallet +
   mempool / RPC plumbing; this models the user-facing config
   and tracks status.
   ============================================================ */

export type StrategyId =
  // buy-side
  | 'snipe-mint' | 'buy-floor' | 'buy-underpriced' | 'whale-copy' | 'dump-cascade'
  // flip
  | 'flip'
  // sell-side
  | 'take-profit' | 'stop-loss' | 'trailing-stop' | 'rug-guard' | 'offer-accept';

export type StrategyKind = 'buy' | 'sell' | 'flip';

export type Strategy = {
  id: StrategyId;
  label: string;
  kind: StrategyKind;
  blurb: string;
  valueLabel?: string;
  valueUnit?: 'eth' | 'pct' | 'score';
  extra?: 'wallet';
  full: boolean; // fully implemented (vs. configurable scaffold)
};

export const STRATEGIES: Strategy[] = [
  // BUY
  { id: 'snipe-mint',      label: 'Snipe Mint',          kind: 'buy',  blurb: 'Fire the instant a mint opens.',                                                  full: false },
  { id: 'buy-floor',       label: 'Buy the Floor',       kind: 'buy',  blurb: 'Buy when the floor drops to your price.', valueLabel: 'Buy at or below',  valueUnit: 'eth', full: false },
  { id: 'buy-underpriced', label: 'Underpriced Listing', kind: 'buy',  blurb: 'Grab any listing posted under floor.',    valueLabel: 'Under floor by',   valueUnit: 'pct', full: false },
  { id: 'whale-copy',      label: 'Whale Copy',          kind: 'buy',  blurb: 'Buy when a wallet you track buys.',        extra: 'wallet',                                  full: false },
  { id: 'dump-cascade',    label: 'Buy the Dump',        kind: 'buy',  blurb: 'Buy when the floor craters fast.',         valueLabel: 'Floor drops by',   valueUnit: 'pct', full: false },
  // FLIP
  { id: 'flip',            label: 'Flip Bot',            kind: 'flip', blurb: 'Buy at floor, auto-relist at a markup.',   valueLabel: 'Relist markup',    valueUnit: 'pct', full: true },
  // SELL
  { id: 'take-profit',     label: 'Take Profit',         kind: 'sell', blurb: 'Sell when the floor rises to target.',     valueLabel: 'Sell at or above', valueUnit: 'eth', full: false },
  { id: 'stop-loss',       label: 'Stop Loss',           kind: 'sell', blurb: 'Sell if the floor falls to your line.',    valueLabel: 'Sell at or below', valueUnit: 'eth', full: false },
  { id: 'trailing-stop',   label: 'Trailing Stop',       kind: 'sell', blurb: 'Sell if floor drops X% from its peak.',    valueLabel: 'Trail by',         valueUnit: 'pct', full: false },
  { id: 'rug-guard',       label: 'Rug Guard',           kind: 'sell', blurb: 'Auto-sell if wallet-risk spikes.',         valueLabel: 'Risk threshold',   valueUnit: 'score', full: true },
  { id: 'offer-accept',    label: 'Auto-Accept Offers',  kind: 'sell', blurb: 'Accept any offer above your price.',       valueLabel: 'Accept at or above', valueUnit: 'eth', full: false },
];

export const STRATEGY_MAP = Object.fromEntries(
  STRATEGIES.map(s => [s.id, s]),
) as Record<StrategyId, Strategy>;

export type Sniper = {
  id: string;
  slug: string;
  name: string;
  strategy: StrategyId;
  value?: number;          // Ξ / % / risk-score depending on strategy
  watchWallet?: string;    // whale-copy
  maxPrice: number;        // buy: max pay/item · sell: min accept/item
  quantity: number;
  gas: 'standard' | 'fast' | 'instant';
  network: 'ethereum' | 'base';
  createdAt: number;
  status: 'watching' | 'triggered' | 'stopped' | 'done';
  triggeredAt?: number;
  // flip runtime
  leg?: 'buying' | 'holding' | 'sold';
  buyFill?: number;
  sellFill?: number;
  // rug-guard runtime
  riskBaseline?: number;
  riskNow?: number;
};

/**
 * Deterministic 0–100 wallet-risk score for a collection — same math
 * the Bubble Map uses, exposed so Rug Guard snipers can watch it.
 */
export function collectionRiskScore(slug: string, supply: number): number {
  const wallets = generateBubbleMap(slug, supply, 36);
  if (!wallets.length) return 0;
  const top = wallets[0].holdings / supply * 100;
  const top10 = wallets.slice(0, 10).reduce((s, w) => s + w.holdings, 0) / supply * 100;
  const inClusters = wallets.filter(w => w.cluster > 0).reduce((s, w) => s + w.holdings, 0) / supply * 100;
  const score = Math.min(40, top * 6) + Math.min(30, top10 * 0.8) + Math.min(30, inClusters * 1.2);
  return Math.min(100, Math.round(score));
}

const SNIPER_KEY = 'degensea-snipers';

export function readSnipers(): Sniper[] {
  try { return JSON.parse(localStorage.getItem(SNIPER_KEY) || '[]'); } catch { return []; }
}
export function writeSnipers(list: Sniper[]) {
  try { localStorage.setItem(SNIPER_KEY, JSON.stringify(list)); } catch {}
}

/**
 * Live-fetch OpenSea stats + metadata for a single slug. Returns a
 * merged Collection where any field OpenSea returned overrides the
 * fallback. Used by Markets, Drops, and TokenDetail so they all share
 * one source of live truth.
 */
export async function fetchOpenSeaCollection(
  fallback: Collection,
): Promise<Collection> {
  const slug = fallback.slug;
  const headers = { Accept: 'application/json' };
  const safe = async (url: string) => {
    try {
      const r = await fetch(url, { headers });
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  };

  const [stats, meta] = await Promise.all([
    safe(`https://api.opensea.io/api/v2/collections/${slug}/stats`),
    safe(`https://api.opensea.io/api/v2/collections/${slug}`),
  ]);

  const oneDay = stats?.intervals?.find((i: any) => i.interval === 'one_day');
  return {
    ...fallback,
    floor:     Number(stats?.total?.floor_price) || fallback.floor,
    volume24h: Number(oneDay?.volume) || fallback.volume24h,
    change24h: Number(oneDay?.volume_change) || fallback.change24h,
    owners:    Number(stats?.total?.num_owners) || fallback.owners,
    supply:    Number(meta?.total_supply) || fallback.supply,
    name:      meta?.name || fallback.name,
    imageUrl:  meta?.image_url || fallback.imageUrl,
  };
}

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
  { slug: 'quirkies',            ticker: 'QUIRK',  name: 'Quirkies',        floor:  0.04, change24h:  3.5, volume24h:   18, owners: 2800, supply:  5000  },
  { slug: 'quirklings',          ticker: 'QRKL',   name: 'Quirklings',      floor:  0.02, change24h: -1.2, volume24h:    9, owners: 3100, supply:  7777  },
  { slug: 'inx-token',           ticker: 'INX',    name: 'INX',             floor:  0.03, change24h:  5.0, volume24h:   12, owners: 1900, supply:  10000 },
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

export function generateCandles(
  slug: string,
  basePrice: number,
  count = 60,
  volMul = 1,
): Candle[] {
  let seed = 0;
  for (let i = 0; i < slug.length; i++) seed = (seed * 31 + slug.charCodeAt(i)) | 0;
  const out: Candle[] = [];
  let price = basePrice * (1 - 0.04 * volMul);
  for (let i = 0; i < count; i++) {
    seed = (seed * 1664525 + 1013904223) | 0;
    const r  = (Math.abs(seed)             % 10000) / 10000;
    seed = (seed * 1664525 + 1013904223) | 0;
    const r2 = (Math.abs(seed ^ 0x9e3779b1) % 10000) / 10000;
    seed = (seed * 1664525 + 1013904223) | 0;
    const r3 = (Math.abs(seed ^ 0x7f4a7c15) % 10000) / 10000;

    const open  = price;
    const trend = (i / count - 0.35) * basePrice * 0.0035 * volMul;
    const close = open + (r - 0.5) * basePrice * 0.018 * volMul + trend;
    const wick  = basePrice * 0.012 * volMul * (0.4 + r2);
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

/* ============================================================
   RECENT TRENDING — curated slugs of (relatively) recent NFT
   collections that historically post strong OpenSea volume.
   Fetched live from the public v2 /stats endpoint at runtime.
   ============================================================ */

export type RecentBase = {
  slug: string;
  name: string;
  ticker: string;
  supply: number;
  mintedDaysAgo: number;
};

export const RECENT_TRENDING: RecentBase[] = [
  { slug: 'pudgypenguins',          name: 'Pudgy Penguins',     ticker: 'PUDGY',  supply:  8888, mintedDaysAgo:  920 },
  { slug: 'milady',                 name: 'Milady Maker',       ticker: 'MILADY', supply: 10000, mintedDaysAgo: 1180 },
  { slug: 'memeland-captainz',      name: 'The Captainz',       ticker: 'CPTNZ',  supply:  9999, mintedDaysAgo:  700 },
  { slug: 'mocaverse',              name: 'Mocaverse',          ticker: 'MOCA',   supply:  8888, mintedDaysAgo:  540 },
  { slug: 'nakamigos',              name: 'Nakamigos',          ticker: 'NKMG',   supply: 20000, mintedDaysAgo:  800 },
  { slug: 'renga',                  name: 'RENGA',              ticker: 'RENGA',  supply: 10000, mintedDaysAgo:  680 },
  { slug: 'lilpudgys',              name: 'Lil Pudgys',         ticker: 'LILP',   supply: 22222, mintedDaysAgo:  780 },
  { slug: 'redacted-remilio-babies',name: 'Remilio Babies',     ticker: 'REMIL',  supply: 10000, mintedDaysAgo: 760 },
  { slug: 'pixelmon-trainer',       name: 'Pixelmon Trainers',  ticker: 'PIXEL',  supply: 10005, mintedDaysAgo: 1010 },
  { slug: 'azuki-elementals',       name: 'Azuki Elementals',   ticker: 'ELEM',   supply: 20000, mintedDaysAgo:  700 },
  { slug: 'memeland-potatoz',       name: 'The Potatoz',        ticker: 'POTZ',   supply:  9999, mintedDaysAgo: 1050 },
  { slug: 'degods',                 name: 'DeGods',             ticker: 'DEGOD',  supply: 10000, mintedDaysAgo:  900 },
];

export type Trending = RecentBase & {
  floor: number;
  volume24h: number;
  change24h: number;
  owners: number;
  imageUrl?: string;
  live: boolean; // true if data came from the network
};

async function fetchJson(url: string): Promise<any | null> {
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function fetchTrendingCollection(base: RecentBase): Promise<Trending> {
  const [stats, meta] = await Promise.all([
    fetchJson(`https://api.opensea.io/api/v2/collections/${base.slug}/stats`),
    fetchJson(`https://api.opensea.io/api/v2/collections/${base.slug}`),
  ]);

  const oneDay = stats?.intervals?.find((i: any) => i.interval === 'one_day');
  const floor = Number(stats?.total?.floor_price) || mockFloor(base.slug);
  const vol   = Number(oneDay?.volume)             || mockVol(base.slug);
  const change = Number(oneDay?.volume_change)     || (((base.slug.charCodeAt(0) * 13) % 80) - 30);
  const owners = Number(stats?.total?.num_owners)  || Math.round(base.supply * 0.55);

  return {
    ...base,
    floor,
    volume24h: vol,
    change24h: change,
    owners,
    imageUrl: meta?.image_url,
    live: !!stats,
  };
}

function mockFloor(slug: string) {
  let s = 0;
  for (let i = 0; i < slug.length; i++) s = (s * 31 + slug.charCodeAt(i)) | 0;
  return Math.max(0.05, Math.abs(s % 800) / 100); // 0.05–8 Ξ
}
function mockVol(slug: string) {
  let s = 0;
  for (let i = 0; i < slug.length; i++) s = (s * 17 + slug.charCodeAt(i)) | 0;
  return Math.max(20, Math.abs(s % 2400));
}

export const formatAgeSec = (s: number) => {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};
