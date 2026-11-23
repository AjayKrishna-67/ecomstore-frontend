'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Price } from '@/components/products/Price';
import { CurrencyCode } from '@/generated/graphql';
import { OrderStateBadge } from '@/components/account/OrderStateBadge';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

type FulfillmentLine = {
  __typename?: 'FulfillmentLine';
  quantity: number;
  fulfillment: {
    id: string;
    state: string;
    updatedAt: string;
    trackingCode?: string;
  };
};

type Asset = {
  __typename?: 'Asset';
  id: string;
  source: string;
  preview: string;
};

type OrderLine = {
  __typename?: 'OrderLine';
  id?: string;
  quantity: number;
  discountedLinePriceWithTax: number;
  discountedUnitPriceWithTax: number;
  fulfillmentLines?: FulfillmentLine[] | null;
  featuredAsset?: Asset | null;
  productVariant: {
    __typename?: 'ProductVariant';
    id: string;
    name: string;
    currencyCode: string;
    product: {
      __typename?: 'Product';
      slug: string;
    };
  };
  unitPrice?: number;
  unitPriceWithTax?: number;
  linePriceWithTax?: number;
};

type OrderDiscount = {
  amount: number;
  amountWithTax: number;
  description: string;
  adjustmentSource?: string;
  type?: string;
};

type ShippingLine = {
  priceWithTax: number;
  shippingMethod: {
    id: string;
    code: string;
    name: string;
    description?: string;
  };
};

type Fulfillment = {
  id: string;
  state: string;
  trackingCode?: string;
  updatedAt: string;
};

type Order = {
  __typename?: 'Order';
  id: string;
  code: string;
  state: string;
  active?: boolean;
  orderPlacedAt?: string;
  currencyCode: string;
  subTotal: number;
  subTotalWithTax: number;
  total: number;
  totalWithTax: number;
  shipping?: number;
  shippingWithTax?: number;
  lines: OrderLine[];
  discounts: OrderDiscount[];
  taxSummary?: Array<{ taxBase: number; taxTotal: number }>;
  shippingLines: ShippingLine[];
  fulfillments?: Fulfillment[];
  customFields?: {
    otherInstructions?: string;
    clientRequestToCancel?: number;
  };
};

type OrderHistoryItemProps = {
  order: Order;
  className?: string;
};

function stripeClassFor(state?: string): string {
  switch (state) {
    case 'Draft':
    case 'AddingItems':
      return 'bg-gray-300 dark:bg-gray-600';
    case 'PaymentAuthorized':
    case 'PaymentSettled':
    case 'Shipped':
      return 'bg-blue-500';
    case 'Delivered':
      return 'bg-green-500';
    case 'PartiallyShipped':
    case 'PartiallyDelivered':
    case 'Modifying':
    case 'ArrangingPayment':
    case 'ArrangingAdditionalPayment':
      return 'bg-amber-500';
    case 'CancellationRequested':
      return 'bg-orange-500';
    case 'Cancelled':
      return 'bg-red-500';
    default:
      return 'bg-border-strong';
  }
}

export default function OrderHistoryItem({
  order,
  className = '',
}: OrderHistoryItemProps) {
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const router = useRouter();
  const { t } = useTranslation();
  const [fetcherState, setFetcherState] = useState<'idle' | 'submitting'>(
    'idle',
  );
  const [actionData, setActionData] = useState<
    { success?: boolean; message?: string } | undefined
  >(undefined);

  const canCancelOrder =
    order?.state &&
    !['Cancelled', 'CancellationRequested', 'Delivered', 'Shipped'].includes(
      order.state,
    );

  const hasPendingCancelRequest =
    order?.customFields?.clientRequestToCancel !== undefined &&
    order.customFields.clientRequestToCancel !== null &&
    order.customFields.clientRequestToCancel > 0;

  const handleCancelOrder = async () => {
    if (!order?.id || !order?.totalWithTax) return;
    if (!cancelReason || cancelReason.trim() === '') return;

    const formData = new FormData();
    formData.append('intent', 'cancel-order');
    formData.append('orderId', order.id);
    formData.append('reason', cancelReason.trim());

    setFetcherState('submitting');
    try {
      const res = await fetch('/api/cancel-order', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setActionData(data);
      if (data.success) router.refresh();
    } finally {
      setFetcherState('idle');
    }
    setShowCancelDialog(false);
    setCancelReason('');
  };

  const isSubmitting = fetcherState === 'submitting';
  const shipping = order.shippingWithTax ?? 0;
  const currency = order.currencyCode as CurrencyCode;
  const itemCount = order.lines.reduce((acc, l) => acc + l.quantity, 0);
  const subtotalFromLines = order.lines.reduce(
    (acc, line) => acc + (line.discountedLinePriceWithTax ?? 0),
    0,
  );
  const totalWithTax = order.totalWithTax ?? 0;
  const discount = subtotalFromLines + shipping - totalWithTax;
  const hasDiscount =
    (order.discounts?.length ?? 0) > 0 && discount > 0;

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-border-theme bg-surface ${className}`}
    >
      {/* Status stripe */}
      <div
        className={`absolute inset-y-0 left-0 w-1 ${stripeClassFor(order.state)}`}
        aria-hidden
      />

      {/* Action banner */}
      {actionData && (
        <div
          className={`pl-5 pr-4 py-2 text-sm ${
            actionData.success
              ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-300 border-b border-green-200 dark:border-green-900/50'
              : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300 border-b border-red-200 dark:border-red-900/50'
          }`}
        >
          {actionData.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-border-theme">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider font-medium text-text-tertiary">
            {t('order.number')}
          </div>
          <div className="font-mono text-sm font-semibold text-text-primary truncate">
            {order.code || '--'}
          </div>
          <div
            className="text-xs text-text-tertiary mt-0.5"
            title={
              order.orderPlacedAt
                ? new Date(order.orderPlacedAt).toLocaleString()
                : ''
            }
          >
            {order.orderPlacedAt
              ? new Date(order.orderPlacedAt).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : 'Not placed yet'}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <OrderStateBadge state={order.state} />
          {hasPendingCancelRequest && order.state !== 'Cancelled' && (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium text-orange-700 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-300">
              Cancel pending
            </span>
          )}
          <span className="text-[11px] text-text-tertiary mt-0.5">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {/* Line items — always visible, shown once */}
      <ul className="divide-y divide-border-theme">
        {order.lines.map((line, key) => {
          const shippedQty =
            line.fulfillmentLines?.reduce(
              (acc, f) => acc + f.quantity,
              0,
            ) ?? 0;
          const variantCurrency = line.productVariant
            .currencyCode as CurrencyCode;
          return (
            <li
              key={line.id || key}
              className="px-5 py-3 flex items-start gap-4"
            >
              <Link
                href={`/products/${line.productVariant.product.slug}`}
                className="shrink-0"
              >
                <img
                  src={
                    line.featuredAsset?.source ||
                    '/placeholder.svg?height=64&width=64'
                  }
                  alt={line.productVariant.name}
                  className="w-16 h-16 object-cover rounded-lg border border-border-theme"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${line.productVariant.product.slug}`}
                  className="text-sm font-semibold text-text-primary hover:text-btn-primary line-clamp-2"
                >
                  {line.productVariant.name}
                </Link>
                <div className="mt-1 text-xs text-text-tertiary flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span>Qty: {line.quantity}</span>
                  {line.discountedUnitPriceWithTax != null &&
                    Object.values(CurrencyCode).includes(variantCurrency) && (
                      <span>
                        <Price
                          priceWithTax={line.discountedUnitPriceWithTax}
                          currencyCode={variantCurrency}
                        />{' '}
                        each
                      </span>
                    )}
                  <span>
                    {shippedQty === 0
                      ? t('order.notShipped')
                      : `${shippedQty} of ${line.quantity} ${t(
                          'order.items.fulfilled',
                        )}`}
                  </span>
                </div>
              </div>

              <div className="text-sm font-semibold text-text-primary text-right shrink-0">
                {line.discountedLinePriceWithTax != null &&
                Object.values(CurrencyCode).includes(variantCurrency) ? (
                  <Price
                    priceWithTax={line.discountedLinePriceWithTax}
                    currencyCode={variantCurrency}
                  />
                ) : (
                  '--'
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Summary */}
      <div className="px-5 py-3 bg-surface-hover border-t border-border-theme">
        <dl className="max-w-xs ml-auto space-y-1 text-sm">
          <div className="flex justify-between text-text-secondary">
            <dt>Subtotal</dt>
            <dd>
              <Price
                priceWithTax={subtotalFromLines}
                currencyCode={currency}
              />
            </dd>
          </div>
          <div className="flex justify-between text-text-secondary">
            <dt>Shipping</dt>
            <dd>
              <Price priceWithTax={shipping} currencyCode={currency} />
            </dd>
          </div>
          {hasDiscount && (
            <div className="flex justify-between text-red-600 dark:text-red-400">
              <dt>Discount</dt>
              <dd>
                −
                <Price priceWithTax={discount} currencyCode={currency} />
              </dd>
            </div>
          )}
          <div className="flex justify-between pt-1.5 mt-1 border-t border-border-theme font-semibold text-text-primary">
            <dt>Total</dt>
            <dd>
              <Price
                priceWithTax={totalWithTax}
                currencyCode={currency}
              />
            </dd>
          </div>
        </dl>
      </div>

      {/* Cancel dialog (still available; trigger is currently hidden) */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowCancelDialog(false);
              setCancelReason('');
            }}
          />
          <div className="relative bg-surface border border-border-theme rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Cancel Order
            </h3>
            <p className="text-text-secondary mb-4">
              Are you sure you want to cancel order {order.code}? This action
              will submit a cancellation request that requires admin approval.
            </p>
            <div className="mb-6">
              <label
                htmlFor="cancel-reason"
                className="block text-sm font-medium text-text-secondary mb-2"
              >
                Reason for Cancellation <span className="text-red-500">*</span>
              </label>
              <textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancelling this order..."
                className="w-full px-3 py-2 bg-input-bg text-text-primary placeholder:text-text-muted border border-input-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                rows={4}
                required
              />
              {(!cancelReason || cancelReason.trim() === '') && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Please provide a reason for cancellation
                </p>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelReason('');
                }}
                className="px-4 py-2 rounded-md bg-surface-hover text-text-primary border border-border-theme disabled:opacity-50"
                disabled={isSubmitting}
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-500 disabled:opacity-50"
                disabled={
                  isSubmitting || !cancelReason || cancelReason.trim() === ''
                }
              >
                {isSubmitting ? 'Processing...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
