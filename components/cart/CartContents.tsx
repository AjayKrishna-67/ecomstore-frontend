'use client';

import Link from 'next/link';
import { Price } from '@/components/products/Price';
import { ActiveOrderQuery, CurrencyCode } from '@/generated/graphql';
import { useTranslation } from 'react-i18next';
import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { trackUpdateQuantity } from '@/lib/fbpixel';

type UnavailableItemMap = Record<
  string,
  {
    reason?: string | null;
    productName?: string | null;
    variantName?: string | null;
  }
>;

function formatStockLabel(stockLevel?: string | null): string {
  switch (stockLevel) {
    case 'IN_STOCK':
      return 'In stock';
    case 'LOW_STOCK':
      return 'Low stock';
    case 'OUT_OF_STOCK':
      return 'Out of stock';
    default:
      return '';
  }
}

type QuantityViolationMap = Record<
  string,
  {
    reason: string;
    maxQuantity: number;
    currentQuantity: number;
    productName: string;
  }
>;

export function CartContents({
  orderLines,
  currencyCode,
  editable = true,
  adjustOrderLine,
  removeItem,
  unavailableItemsByLineId,
  quantityViolationsByLineId,
}: {
  orderLines: NonNullable<ActiveOrderQuery['activeOrder']>['lines'];
  currencyCode: CurrencyCode;
  editable: boolean;
  adjustOrderLine?: (lineId: string, quantity: number) => void;
  removeItem?: (lineId: string) => void;
  unavailableItemsByLineId?: UnavailableItemMap;
  quantityViolationsByLineId?: QuantityViolationMap;
}) {
  const { t } = useTranslation();
  const isEditable = editable !== false;
  const [removingItems, setRemovingItems] = useState<string[]>([]);

  const handleQuantityChange = (lineId: string, delta: number) => {
    if (adjustOrderLine) {
      const line = orderLines.find((l) => l.id === lineId);
      if (line) {
        const newQuantity = Math.max(1, Math.min(50, line.quantity + delta));
        trackUpdateQuantity({
          lineId,
          variantId: line.productVariant?.id,
          quantity: newQuantity,
          delta,
        });
        adjustOrderLine(lineId, newQuantity);
      }
    }
  };

  const handleRemoveItem = (lineId: string) => {
    if (removeItem && !removingItems.includes(lineId)) {
      setRemovingItems((prev) => [...prev, lineId]);
      removeItem(lineId);
    }
  };

  return (
    <div className="space-y-3">
      {(orderLines ?? []).map((line) => {
        const unavailableEntry = unavailableItemsByLineId
          ? unavailableItemsByLineId[line.id]
          : undefined;
        const stockLevel = line.productVariant.stockLevel;
        const isOutOfStock = stockLevel === 'OUT_OF_STOCK';
        const lineIsAvailable = (line as any).isAvailable;
        const lineUnavailableReason = (line as any).unavailableReason as
          | string
          | null
          | undefined;
        const isUnavailable = Boolean(unavailableEntry);
        const quantityViolation = quantityViolationsByLineId?.[line.id];
        const isUnavailableVisual = isOutOfStock || isUnavailable;

        const lineNeedsQuantityAdjust =
          lineIsAvailable === false &&
          lineUnavailableReason &&
          !isOutOfStock &&
          !isUnavailable;

        const showQuantityControls =
          editable &&
          (!isUnavailableVisual || lineNeedsQuantityAdjust || !!quantityViolation);

        const stockColor =
          isUnavailable || isOutOfStock
            ? 'text-red-500 dark:text-red-400'
            : stockLevel === 'LOW_STOCK'
              ? 'text-amber-500 dark:text-amber-400'
              : 'text-green-500 dark:text-green-400';

        return (
          <div
            key={line.id}
            className={`relative flex gap-3 p-3 rounded-xl border transition-all duration-200 ${
              isUnavailableVisual
                ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10'
                : quantityViolation
                  ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10'
                  : 'border-border-theme bg-surface hover:shadow-sm'
            }`}
          >
            {/* Product image */}
            <Link
              href={`/products/${line.productVariant.product.slug}`}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-surface-hover ${
                isUnavailableVisual ? 'opacity-50' : ''
              }`}
            >
              <img
                src={line.featuredAsset?.preview + '?preset=thumb'}
                alt={line.productVariant.name}
                className="w-full h-full object-cover"
              />
            </Link>

            {/* Product details */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              {/* Name + Price row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/products/${line.productVariant.product.slug}`}
                    className="text-sm font-medium text-text-primary hover:text-text-secondary line-clamp-2 leading-snug"
                  >
                    {line.productVariant.name}
                  </Link>
                  {stockLevel && (
                    <span className={`text-[11px] font-semibold ${stockColor}`}>
                      {isUnavailable
                        ? 'Out of stock'
                        : formatStockLabel(stockLevel)}
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-text-primary whitespace-nowrap">
                  <Price
                    priceWithTax={line.linePriceWithTax}
                    currencyCode={currencyCode}
                  />
                </span>
              </div>

              {/* Per-line warnings intentionally hidden — the aggregated
                  cart-level banner above the checkout button now carries the
                  same backend reason text, avoiding duplicate red lines on
                  each addon-variant card. */}

              {/* Addon selections — hidden when the line has no addons. */}
              {Array.isArray((line as any).addonSelections) && (line as any).addonSelections.length > 0 && (
                <div className="mt-1.5 space-y-0.5">
                  {(line as any).addonSelections.map((group: any) => (
                    <div key={group.groupId} className="text-[11px] leading-snug">
                      <span className="font-semibold text-text-secondary">
                        {group.groupName}:
                      </span>{' '}
                      <span className={(line as any).addonsAvailable === false ? 'text-red-500 line-through' : 'text-text-tertiary'}>
                        {(group.items ?? [])
                          .map((it: any) => it.itemName)
                          .join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity + Remove row */}
              <div className="flex items-center justify-between mt-2">
                {showQuantityControls ? (
                  <div className="flex items-center rounded-lg border border-border-theme bg-background overflow-hidden">
                    <button
                      type="button"
                      disabled={!isEditable}
                      onClick={() => handleQuantityChange(line.id, -1)}
                      className="p-1.5 text-text-secondary hover:bg-surface-hover disabled:opacity-40 transition-colors"
                    >
                      <MinusIcon className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1 text-sm font-semibold text-text-primary min-w-[2rem] text-center">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={!isEditable}
                      onClick={() => handleQuantityChange(line.id, 1)}
                      className="p-1.5 text-text-secondary hover:bg-surface-hover disabled:opacity-40 transition-colors"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-text-muted">
                    Qty: {line.quantity}
                  </span>
                )}

                {isEditable && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(line.id)}
                    disabled={removingItems.includes(line.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-40 transition-colors"
                    title="Remove item"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
