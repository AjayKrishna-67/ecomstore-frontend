'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { CartContents } from './CartContents';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Price } from '@/components/products/Price';
import { CurrencyCode, OrderDetailFragment } from '@/generated/graphql';
import { useTranslation } from 'react-i18next';
import { shortenStockReason } from '@/lib/cart-errors';

export interface CartLoaderData {
  activeOrder?: OrderDetailFragment | null;
}

type UnavailableItemSummary = {
  reason?: string | null;
  productName?: string | null;
  variantName?: string | null;
};

function formatUnavailableReason(reason?: string | null): string {
  if (!reason) return 'This item is currently unavailable.';
  const normalized = reason.toUpperCase();
  switch (normalized) {
    case 'OUT_OF_STOCK':
    case 'INSUFFICIENT_STOCK':
    case 'ORDER_LINE_OUT_OF_STOCK':
      return 'This item is out of stock.';
    case 'PRODUCT_DISABLED':
    case 'PRODUCT_VARIANT_DISABLED':
    case 'DISABLED':
      return 'This item is currently Unavailable.';
    default:
      const cleaned = reason
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();
      if (!cleaned) return 'This item is currently unavailable.';
      return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}.`;
  }
}

export function CartTray({
  open,
  onClose,
  activeOrder,
  adjustOrderLine,
  removeItem,
  removeAllItems,
  activeOrderError,
}: {
  open: boolean;
  onClose: (closed: boolean) => void;
  activeOrder: OrderDetailFragment | null | undefined;
  adjustOrderLine?: (lineId: string, quantity: number) => void;
  removeItem?: (lineId: string) => void;
  removeAllItems?: () => void;
  activeOrderError?: { errorCode: string; message: string } | null;
}) {
  const currencyCode = activeOrder?.currencyCode || CurrencyCode.Usd;
  const pathname = usePathname();
  const editable = !pathname.startsWith('/checkout');
  const { t } = useTranslation();
  const validationStatus = activeOrder?.validationStatus;
  const totalQuantity = activeOrder?.totalQuantity ?? 0;

  const [visibleError, setVisibleError] = useState<string | null>(null);

  useEffect(() => {
    if (
      activeOrderError?.message &&
      activeOrderError.errorCode !== 'NO_ACTIVE_ORDER_ERROR'
    ) {
      const errorMsg =
        activeOrderError.errorCode === 'ORDER_INTERCEPTOR_ERROR'
          ? (activeOrderError as any).interceptorError ||
            activeOrderError.message
          : activeOrderError.message;
      setVisibleError(errorMsg);
      const timer = setTimeout(() => setVisibleError(null), 5000);
      return () => clearTimeout(timer);
    } else {
      setVisibleError(null);
    }
  }, [activeOrderError]);

  const unavailableItemsByLineId = (
    validationStatus?.unavailableItems ?? []
  ).reduce<Record<string, UnavailableItemSummary>>((acc, item) => {
    if (item && item.orderLineId) {
      acc[item.orderLineId] = {
        reason: item.reason,
        productName: item.productName,
        variantName: item.variantName,
      };
    }
    return acc;
  }, {});

  const quantityViolationsByLineId = (
    activeOrder?.quantityLimitStatus?.violations ?? []
  ).reduce<
    Record<
      string,
      {
        reason: string;
        maxQuantity: number;
        currentQuantity: number;
        productName: string;
      }
    >
  >((acc, v) => {
    if (v && v.orderLineId) {
      acc[v.orderLineId] = {
        reason: v.reason,
        maxQuantity: v.maxQuantity,
        currentQuantity: v.currentQuantity,
        productName: v.productName,
      };
    }
    return acc;
  }, {});

  const outOfStockLineIds = new Set(
    (activeOrder?.lines ?? [])
      .filter((line) => line.productVariant.stockLevel === 'OUT_OF_STOCK')
      .map((line) => line.id),
  );

  const blockedLineSummaries = (activeOrder?.lines ?? []).reduce<
    Array<{ id: string; label: string; message: string }>
  >((acc, line) => {
    const unavailableEntry = unavailableItemsByLineId[line.id];
    const isOutOfStock = outOfStockLineIds.has(line.id);
    const lineIsAvailable = (line as any).isAvailable;
    const lineUnavailableReason = (line as any).unavailableReason as
      | string
      | null
      | undefined;
    const isLineUnavailable = lineIsAvailable === false;
    if (!unavailableEntry && !isOutOfStock && !isLineUnavailable) return acc;
    const message =
      isLineUnavailable && lineUnavailableReason
        ? shortenStockReason(lineUnavailableReason)
        : isOutOfStock
          ? 'This item is out of stock.'
          : formatUnavailableReason(unavailableEntry?.reason);
    const label =
      unavailableEntry?.variantName ||
      line.productVariant.name ||
      unavailableEntry?.productName ||
      line.productVariant.product.slug ||
      'Item';
    acc.push({ id: line.id, label, message });
    return acc;
  }, []);

  const isOrderValid = validationStatus?.isValid !== false;
  const hasUnavailableItems = validationStatus?.hasUnavailableItems ?? false;
  const hasQuantityViolations =
    activeOrder?.quantityLimitStatus?.hasViolations ?? false;

  // Aggregate cart quantities per variant. When the same product is split
  // across multiple lines (different addon combinations), the backend's
  // per-line validation can miss the case where the *total* of those lines
  // exceeds the variant's effective limit. The effective limit is the lower
  // of: (a) maxOrderQuantity custom field, and (b) stockLevel when Vendure is
  // configured to return a numeric string (ExactStockDisplayStrategy).
  // stockLevel === 'OUT_OF_STOCK' is treated as 0.
  const variantOverflows = (() => {
    const resolveLimit = (variant: any): number | null => {
      const max = variant?.customFields?.maxOrderQuantity;
      const stockRaw = variant?.stockLevel;
      const stockNumeric =
        typeof stockRaw === 'string' && /^\d+$/.test(stockRaw)
          ? Number(stockRaw)
          : stockRaw === 'OUT_OF_STOCK'
            ? 0
            : null;
      const candidates = [
        typeof max === 'number' ? max : null,
        stockNumeric,
      ].filter((n): n is number => typeof n === 'number');
      if (candidates.length === 0) return null;
      return Math.min(...candidates);
    };
    const groups = new Map<
      string,
      { totalQty: number; max: number; productName: string }
    >();
    for (const line of activeOrder?.lines ?? []) {
      const variantId = line.productVariant?.id;
      const limit = resolveLimit(line.productVariant);
      if (!variantId || limit === null) continue;
      const existing = groups.get(variantId);
      if (existing) {
        existing.totalQty += line.quantity;
      } else {
        groups.set(variantId, {
          totalQty: line.quantity,
          max: limit,
          productName: line.productVariant.name ?? 'Item',
        });
      }
    }
    return Array.from(groups.values()).filter((g) => g.totalQty > g.max);
  })();
  const hasVariantOverflow = variantOverflows.length > 0;

  const hasValidationIssue =
    !isOrderValid ||
    hasUnavailableItems ||
    blockedLineSummaries.length > 0 ||
    hasQuantityViolations ||
    hasVariantOverflow;
  const canCheckout = totalQuantity > 0 && !hasValidationIssue;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 overflow-hidden z-50"
        onClose={onClose}
      >
        <div className="absolute inset-0 overflow-hidden">
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-y-0 right-0 pl-0 sm:pl-10 max-w-full flex">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-200"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="w-screen sm:max-w-md">
                <div className="h-full flex flex-col bg-background shadow-2xl">
                  {/* Header */}
                  <div className="px-5 py-4 border-b border-border-theme bg-surface">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-btn-primary/10 rounded-xl">
                          <ShoppingBagIcon className="w-5 h-5 text-btn-primary" />
                        </div>
                        <div>
                          <Dialog.Title className="text-base font-semibold text-text-primary">
                            {t('cart.title')}
                          </Dialog.Title>
                          {totalQuantity > 0 && (
                            <p className="text-xs text-text-muted">
                              {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editable && totalQuantity > 0 && removeAllItems && (
                          <button
                            type="button"
                            className="text-xs font-medium text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            onClick={removeAllItems}
                          >
                            Clear All
                          </button>
                        )}
                        <button
                          type="button"
                          className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                          onClick={() => onClose(false)}
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cart items */}
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    {totalQuantity ? (
                      <CartContents
                        orderLines={activeOrder?.lines ?? []}
                        currencyCode={currencyCode}
                        editable={editable}
                        removeItem={removeItem}
                        adjustOrderLine={adjustOrderLine}
                        unavailableItemsByLineId={unavailableItemsByLineId}
                        quantityViolationsByLineId={quantityViolationsByLineId}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
                        <div className="p-4 bg-surface-hover rounded-full">
                          <ShoppingBagIcon className="w-10 h-10 text-text-muted" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-text-secondary">
                            {t('cart.empty')}
                          </p>
                          <p className="text-sm text-text-muted mt-1">
                            Add some products to get started
                          </p>
                        </div>
                        <button
                          onClick={() => onClose(false)}
                          className="mt-2 px-6 py-2 text-sm font-medium text-btn-primary-text bg-btn-primary rounded-xl hover:bg-btn-primary-hover transition-colors"
                        >
                          Continue Shopping
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Footer — subtotal + checkout */}
                  {totalQuantity > 0 && editable && (
                    <div className="border-t border-border-theme bg-surface px-5 py-4 space-y-3">
                      {/* Error banners */}
                      {visibleError && (
                        <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3">
                          <p className="text-sm font-medium text-red-700 dark:text-red-400">
                            {visibleError}
                          </p>
                        </div>
                      )}

                      {hasValidationIssue && (() => {
                        // Prefer the backend's specific reason text so the
                        // banner shows e.g. "Only 3 available, kindly decrease
                        // quantity" instead of a generic fallback. We dedupe
                        // by reason because multiple lines of the same variant
                        // produce the same text.
                        const backendReasons = Array.from(
                          new Set(
                            [
                              ...(validationStatus?.unavailableItems ?? []),
                              ...(activeOrder?.quantityLimitStatus?.violations ?? []),
                            ]
                              .map((x: any) => x?.reason)
                              .filter((r: any): r is string => typeof r === 'string' && r.length > 0),
                          ),
                        );
                        // Names of the specific cart items blocking checkout so
                        // the shopper knows exactly which product to decrease or
                        // remove. Variant overflows render their own per-item
                        // detail below, so they're excluded here to avoid repeats.
                        const affectedItemNames = Array.from(
                          new Set(
                            [
                              ...blockedLineSummaries.map((s) => s.label),
                              ...(activeOrder?.quantityLimitStatus?.violations ?? []).map(
                                (v: any) => v?.variantName || v?.productName,
                              ),
                            ].filter(
                              (n: any): n is string =>
                                typeof n === 'string' && n.length > 0,
                            ),
                          ),
                        );
                        return (
                          <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 p-3 space-y-1">
                            <p className="text-xs text-red-600 dark:text-red-400">
                              {hasVariantOverflow
                                ? 'Kindly decrease the quantity to proceed to checkout.'
                                : validationStatus?.message
                                  ? validationStatus.message
                                  : backendReasons[0]
                                    ? backendReasons[0]
                                    : hasQuantityViolations && !blockedLineSummaries.length
                                      ? 'Please decrease the quantity of items exceeding the limit to proceed to checkout.'
                                      : 'Please decrease the quantity of unavailable items or remove them from your cart to proceed to checkout.'}
                            </p>
                            {!hasVariantOverflow && affectedItemNames.length > 0 && (
                              <p className="text-[11px] font-medium text-red-500 dark:text-red-400">
                                {affectedItemNames.length === 1
                                  ? 'Affected item: '
                                  : 'Affected items: '}
                                {affectedItemNames.join(', ')}
                              </p>
                            )}
                            {hasVariantOverflow &&
                              variantOverflows.map((v) => (
                                <p
                                  key={v.productName}
                                  className="text-[11px] text-red-500 dark:text-red-400"
                                >
                                  {v.productName}: {v.totalQty} in cart, max {v.max} per order.
                                </p>
                              ))}
                          </div>
                        );
                      })()}

                      {/* Subtotal */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-text-secondary">
                          {t('common.subtotal')}
                        </p>
                        <p className="text-lg font-bold text-text-primary">
                          <Price
                            priceWithTax={activeOrder?.subTotalWithTax ?? 0}
                            currencyCode={currencyCode}
                          />
                        </p>
                      </div>
                      <p className="text-xs text-text-muted">
                        {t('cart.shippingMessage')}
                      </p>

                      {/* Checkout button */}
                      {canCheckout ? (
                        <Link
                          href="/checkout"
                          onClick={() => onClose(false)}
                          className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl text-base font-semibold text-btn-primary-text bg-btn-primary hover:bg-btn-primary-hover shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          Proceed to Checkout
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="flex items-center justify-center w-full px-6 py-3 rounded-xl text-base font-medium text-text-muted bg-surface-hover border border-border-theme cursor-not-allowed"
                        >
                          {t('cart.checkout')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
