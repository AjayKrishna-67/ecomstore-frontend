'use client';

import { useState, useRef } from 'react';
import { revalidateActiveOrder } from './use-active-order';

/**
 * Creates a fetcher-like object compatible with the Remix useFetcher() interface
 * used by ProductCard and other components.
 */
export function useOrderFetcher() {
  const [data, setData] = useState<any>(null);

  const fetcher = useRef({
    data: null as any,
    state: 'idle' as string,
    submit: async (
      formData: FormData,
      options?: { method?: string; action?: string },
    ) => {
      try {
        const res = await fetch(options?.action || '/api/active-order', {
          method: options?.method || 'POST',
          body: formData,
        });
        const result = await res.json();
        setData(result);
        revalidateActiveOrder();
      } catch (error) {
        console.error('Order fetcher error:', error);
      }
    },
  }).current;

  // Keep data in sync
  fetcher.data = data;

  return fetcher;
}
