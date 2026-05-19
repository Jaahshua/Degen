'use client';

import { useEffect } from 'react';
import { subscribe, type StreamEvent } from '../lib/openseaStream';

/**
 * Subscribe to live OpenSea events for a given collection slug. The
 * handler fires for every event the relay forwards for that slug; the
 * subscription is torn down on unmount (and when slug changes).
 *
 * No-op if NEXT_PUBLIC_STREAM_URL isn't set — the rest of the app
 * keeps using its existing REST poll path.
 */
export function useOpenSeaStream(
  slug: string | undefined,
  handler: (event: StreamEvent) => void,
) {
  useEffect(() => {
    if (!slug) return;
    return subscribe(slug, handler);
    // We intentionally omit `handler` from deps so consumers can pass
    // an inline arrow without thrashing the subscription. Wrap in
    // useCallback at the call site if you need handler updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
}
