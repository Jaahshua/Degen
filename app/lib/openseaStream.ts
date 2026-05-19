/**
 * Singleton WebSocket client for the OpenSea Stream relay running on
 * Railway. Components don't talk to this directly — they use the
 * `useOpenSeaStream(slug, handler)` hook in app/hooks/.
 *
 * Wire it up by setting NEXT_PUBLIC_STREAM_URL on Vercel to the
 * Railway endpoint (e.g. wss://degensea-stream.up.railway.app). Until
 * that env var is set, every subscribe() call no-ops and the rest of
 * the app keeps falling back to the periodic OpenSea REST poll.
 *
 * Expected wire protocol (matches the OpenSea Stream API shape that
 * the upstream client emits — easy for the Railway proxy to forward):
 *
 *   client -> server
 *     { "type": "subscribe",   "slug": "cryptopunks" }
 *     { "type": "unsubscribe", "slug": "cryptopunks" }
 *
 *   server -> client (per event)
 *     {
 *       "event_type": "item_listed",
 *       "payload": {
 *         "collection": { "slug": "cryptopunks" },
 *         "base_price": "42500000000000000000",     // wei
 *         "payment_token": { "symbol": "ETH", "decimals": 18 },
 *         "item": { "permalink": "...", "metadata": { "name": "..." } },
 *         "maker": { "address": "0x…" }
 *       }
 *     }
 *
 * Other useful event_types we'll plug in next: item_sold,
 * item_received_offer, item_cancelled, item_metadata_updated,
 * collection_offer.
 */

export type StreamEvent = {
  event_type: string;
  payload?: {
    collection?: { slug?: string };
    base_price?: string;
    payment_token?: { symbol?: string; decimals?: number };
    item?: any;
    maker?: { address?: string };
    [k: string]: any;
  };
  [k: string]: any;
};

type Handler = (event: StreamEvent) => void;

const handlers = new Map<string, Set<Handler>>();
let ws: WebSocket | null = null;
let attempts = 0;
let reconnectTimer: number | null = null;

function getUrl(): string {
  if (typeof window === 'undefined') return '';
  return process.env.NEXT_PUBLIC_STREAM_URL || '';
}

function ensureConnected() {
  if (typeof window === 'undefined') return;
  const url = getUrl();
  if (!url) return;
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  try {
    ws = new WebSocket(url);
    ws.onopen = () => {
      attempts = 0;
      // Re-subscribe to every active slug after a reconnect.
      for (const slug of handlers.keys()) {
        ws?.send(JSON.stringify({ type: 'subscribe', slug }));
      }
    };
    ws.onmessage = (e) => {
      try {
        const data: StreamEvent = JSON.parse(e.data);
        const slug = data?.payload?.collection?.slug
                  ?? (data as any)?.collection?.slug;
        if (!slug) return;
        const subs = handlers.get(slug);
        subs?.forEach(h => {
          try { h(data); } catch { /* ignore handler errors */ }
        });
      } catch {
        /* malformed frame — ignore */
      }
    };
    ws.onclose = () => {
      ws = null;
      attempts += 1;
      const delay = Math.min(30_000, 1_000 * Math.pow(2, attempts));
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      reconnectTimer = window.setTimeout(ensureConnected, delay);
    };
    ws.onerror = () => { /* close handler will retry */ };
  } catch {
    /* WebSocket constructor threw — swallow */
  }
}

export function subscribe(slug: string, handler: Handler): () => void {
  if (!slug) return () => {};

  let set = handlers.get(slug);
  const isNewSlug = !set;
  if (!set) {
    set = new Set();
    handlers.set(slug, set);
  }
  set.add(handler);

  if (isNewSlug && ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'subscribe', slug }));
  }
  ensureConnected();

  return () => {
    set!.delete(handler);
    if (set!.size === 0) {
      handlers.delete(slug);
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'unsubscribe', slug }));
      }
    }
  };
}

export function isStreamEnabled(): boolean {
  return !!getUrl();
}
