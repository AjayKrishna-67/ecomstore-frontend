'use client';

import { Price } from '@/components/products/Price';
import { OrderDetailFragment, CurrencyCode } from '@/generated/graphql';
import { useTranslation } from 'react-i18next';

interface CartTotalsProps {
  order?: OrderDetailFragment | null;
  editable?: boolean;
}

export function CartTotals({ order, editable = true }: CartTotalsProps) {
  const { t } = useTranslation();

  if (!order) {
    return null;
  }

  const subtotal = order.lines.reduce(
    (acc: number, line) => acc + (line.linePriceWithTax ?? 0),
    0,
  );
  const shipping = order.shippingWithTax ?? 0;
  const total = order.totalWithTax ?? 0;

  // Check if a shipping method is selected
  const isShippingMethodSelected = !!order.shippingLines?.[0]?.shippingMethod;

  const rewardPointDiscount = Math.abs(
    order.surcharges
      ?.filter((s) => s.price < 0)
      .reduce((acc, s) => acc + s.price, 0) ?? 0,
  );

  // Calculate coupon discount from order.discounts (actual computed amounts)
  // Vendure uses both 'PROMOTION' and 'DISTRIBUTED_ORDER_PROMOTION' types
  const couponDiscountAmount = Math.abs(
    (order.discounts ?? [])
      .filter((d) => d.type === 'PROMOTION' || d.type === 'DISTRIBUTED_ORDER_PROMOTION')
      .reduce((acc, d) => acc + (d.amountWithTax ?? d.amount ?? 0), 0),
  );

  const hasDiscount =
    (order.couponCodes?.length ?? 0) > 0 && couponDiscountAmount > 0;

  return (
    <dl className="border-border-theme py-3 space-y-3">
      <div className="flex items-center justify-between">
        <dt className="text-sm">Subtotal</dt>
        <dd className="text-sm font-medium text-text-primary">
          <Price
            priceWithTax={subtotal}
            currencyCode={order.currencyCode as CurrencyCode}
          />
        </dd>
      </div>

      <div className="flex items-center justify-between">
        <dt className="text-sm">Shipping</dt>
        <dd className="text-sm font-medium text-text-primary">
          {isShippingMethodSelected && shipping === 0 ? (
            <span className="text-green-600 font-semibold">Free Delivery</span>
          ) : isShippingMethodSelected ? (
            <Price
              priceWithTax={shipping}
              currencyCode={order.currencyCode as CurrencyCode}
            />
          ) : (
            <span className="text-text-muted">--</span>
          )}
        </dd>
      </div>

      <div className="flex items-center justify-between">
        <dt className="text-sm">Coupon Discounts</dt>
        <dd className="text-sm font-medium text-red-600">
          {hasDiscount ? (
            <>
              -
              <Price
                priceWithTax={couponDiscountAmount}
                currencyCode={order.currencyCode as CurrencyCode}
              />
              <span className="text-xs text-text-tertiary ml-2">
                ({order.couponCodes?.join(', ')})
              </span>
            </>
          ) : (
            '--'
          )}
        </dd>
      </div>

      <div className="flex items-center justify-between">
        <dt className="text-sm">Reward Point Discount</dt>
        <dd className="text-sm font-medium text-green-700 flex items-center space-x-2">
          {rewardPointDiscount > 0 ? (
            <>
              -
              <Price
                priceWithTax={rewardPointDiscount}
                currencyCode={order.currencyCode as CurrencyCode}
              />
            </>
          ) : (
            '--'
          )}
        </dd>
      </div>

      <div className="flex items-center justify-between border-t border-b border-border-theme pt-6 pb-6">
        <dt className="text-base font-medium">Total</dt>
        <dd className="text-base font-medium text-text-primary">
          <Price
            priceWithTax={total}
            currencyCode={order.currencyCode as CurrencyCode}
          />
        </dd>
      </div>
    </dl>
  );
}
