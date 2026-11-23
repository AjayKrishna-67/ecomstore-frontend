'use client';

import {
  createContext,
  useContext,
  useCallback,
  useState,
  ReactNode,
  createElement,
} from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { trackAddToCart, trackRemoveFromCart } from '@/lib/fbpixel';

const ACTIVE_ORDER_KEY = '/api/active-order';

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch active order');
  return res.json();
}

interface ActiveOrderContextType {
  activeOrder: any | null;
  adjustOrderLine: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  addItemToOrder: (variantId: string, quantity?: number) => void;
  removeAllItems: () => void;
  refresh: () => void;
  isLoading: boolean;
  error: any;
}

const ActiveOrderContext = createContext<ActiveOrderContextType | null>(null);

export function ActiveOrderProvider({ children }: { children: ReactNode }) {
  const { data, error: swrError, isLoading, mutate } = useSWR(
    ACTIVE_ORDER_KEY,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    },
  );

  const activeOrder = data?.activeOrder ?? null;
  const [orderError, setOrderError] = useState<any>(null);

  // Expose business logic errors from API responses (e.g. INSUFFICIENT_STOCK_ERROR)
  const error = orderError || swrError;

  const submitAction = useCallback(
    async (formData: Record<string, string>) => {
      const body = new FormData();
      Object.entries(formData).forEach(([k, v]) => body.append(k, v));

      try {
        const res = await fetch(ACTIVE_ORDER_KEY, {
          method: 'POST',
          body,
        });
        const result = await res.json();
        if (result?.error) {
          setOrderError(result.error);
        } else {
          setOrderError(null);
        }
      } catch (e) {
        console.error('Active order action error:', e);
      }
      mutate();
    },
    [mutate],
  );

  const removeItem = useCallback(
    (lineId: string) => {
      const line = activeOrder?.lines?.find((l: any) => l.id === lineId);
      trackRemoveFromCart({
        lineId,
        variantId: line?.productVariant?.id,
        quantity: line?.quantity,
        value:
          typeof line?.linePriceWithTax === 'number'
            ? line.linePriceWithTax / 100
            : 0,
        currency: activeOrder?.currencyCode || 'INR',
      });
      submitAction({ action: 'removeItem', lineId });
    },
    [submitAction, activeOrder],
  );

  const adjustOrderLine = useCallback(
    (lineId: string, quantity: number) => {
      submitAction({
        action: 'adjustItem',
        lineId,
        quantity: quantity.toString(),
      });
    },
    [submitAction],
  );

  const addItemToOrder = useCallback(
    (variantId: string, quantity: number = 1) => {
      trackAddToCart({
        variantId,
        quantity,
        currency: activeOrder?.currencyCode || 'INR',
      });
      submitAction({
        action: 'addItemToOrder',
        variantId,
        quantity: quantity.toString(),
      });
    },
    [submitAction, activeOrder],
  );

  const removeAllItems = useCallback(() => {
    submitAction({ action: 'removeAllItems' });
  }, [submitAction]);

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return createElement(
    ActiveOrderContext.Provider,
    {
      value: {
        activeOrder,
        adjustOrderLine,
        removeItem,
        addItemToOrder,
        removeAllItems,
        refresh,
        isLoading,
        error,
      },
    },
    children,
  );
}

export function useActiveOrder() {
  const context = useContext(ActiveOrderContext);
  if (!context) {
    throw new Error('useActiveOrder must be used within ActiveOrderProvider');
  }
  return context;
}

/**
 * Trigger a global revalidation of active order from anywhere.
 * Returns the promise so callers can await the refetch before navigating.
 */
export function revalidateActiveOrder() {
  return globalMutate(ACTIVE_ORDER_KEY);
}
