'use client';

import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Truck, ShieldCheck } from 'lucide-react';
import { CartContents } from '@/components/cart/CartContents';
import { CartTotals } from '@/components/cart/CartTotals';
import { ShippingMethodSelector } from '@/components/checkout/ShippingMethodSelector';
import { RazorpayPayments } from '@/components/checkout/razorpay/RazorpayPayments';
import { OrderInstructions } from '@/components/checkout/OrderInstructions';
import { GoogleLoginButton } from '@/components/Google/GoogleLoginButton';
import { CouponModal } from '@/components/couponcode/CouponModal';
import ToastNotification from '@/components/ToastNotification';
import { useActiveOrder, revalidateActiveOrder } from '@/hooks/use-active-order';
import { trackInitiateCheckout, trackRemoveCoupon } from '@/lib/fbpixel';

// Mirrors CartTray.formatUnavailableReason so the checkout gate surfaces the
// same human-readable text for stock/availability issues.
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

interface CheckoutPageClientProps {
  needsLogin: boolean;
  activeOrder: any;
  data: {
    availableCountries: any;
    eligibleShippingMethods: any;
    eligiblePaymentMethods: any;
    activeCustomer: any;
    collections: any[];
    couponCodes: any[];
    loyaltyPoints: number | null;
    pointsPerRupee: number;
    orderInstructions: string;
    customerGroups: Array<{ id: string; name: string }>;
  } | null;
}

export function CheckoutPageClient({
  needsLogin,
  activeOrder: initialOrder,
  data,
}: CheckoutPageClientProps) {
  const router = useRouter();
  const { activeOrder: liveOrder, adjustOrderLine, removeItem, refresh, error: orderError } = useActiveOrder();
  const activeOrder = liveOrder ?? initialOrder;

  // Shipping prices are recomputed by the backend against the current order
  // (value-based rates, free-shipping thresholds, etc.), so the server-seeded
  // list goes stale as soon as the cart changes. Refetch whenever the item
  // count or pre-shipping subtotal changes — not on the shipping selection
  // itself, which would loop. Falls back to the seeded list on first paint or
  // if the request fails.
  const shippingMethodsKey = activeOrder?.id
    ? `/api/eligible-shipping-methods?q=${activeOrder.totalQuantity ?? 0}&s=${activeOrder.subTotalWithTax ?? 0}`
    : null;
  const { data: shippingMethodsData } = useSWR(
    shippingMethodsKey,
    (url: string) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, keepPreviousData: true },
  );
  const eligibleShippingMethods =
    shippingMethodsData?.eligibleShippingMethods ??
    data?.eligibleShippingMethods ??
    [];

  const paymentMode = 'razorpay-payment' as const;
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [showAllCartItems, setShowAllCartItems] = useState(false);
  const [showAddressToast, setShowAddressToast] = useState(false);
  const [autoRemovedCouponMsg, setAutoRemovedCouponMsg] = useState('');
  const [autoAddedVariantIds, setAutoAddedVariantIds] = useState<string[]>([]);
  const [isNavigatingToHome, setIsNavigatingToHome] = useState(false);
  const [orderErrorToast, setOrderErrorToast] = useState<string | null>(null);
  // The active-order error is shared app-wide, so an error raised in the cart
  // is still present when checkout mounts. Capture it once so we can ignore it
  // here — the checkout toast should only fire for errors caused by edits made
  // on the checkout page itself.
  const initialOrderErrorRef = useRef(orderError);

  const customer = activeOrder?.customer;
  const shippingAddress = activeOrder?.shippingAddress;
  const isSignedIn = !!data?.activeCustomer?.id;
  const addresses = data?.activeCustomer?.addresses ?? [];

  const isShippingMethodSelected = !!activeOrder?.shippingLines?.[0]?.shippingMethod;

  // Aggregate cart quantities per variant and detect overflow against the
  // lower of maxOrderQuantity (custom field) and numeric stockLevel. Mirrors
  // CartTray so URL-jumping to /checkout can't bypass the gate.
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
    for (const line of (activeOrder as any)?.lines ?? []) {
      const variantId = line?.productVariant?.id;
      const limit = resolveLimit(line?.productVariant);
      if (!variantId || limit === null) continue;
      const existing = groups.get(variantId);
      if (existing) existing.totalQty += line.quantity;
      else
        groups.set(variantId, {
          totalQty: line.quantity,
          max: limit,
          productName: line.productVariant.name ?? 'Item',
        });
    }
    return Array.from(groups.values()).filter((g) => g.totalQty > g.max);
  })();
  const hasVariantOverflow = variantOverflows.length > 0;

  // Stock / availability issues the backend's validationStatus may not flag:
  // an OUT_OF_STOCK variant still in the cart, or a line the server marked
  // unavailable. Mirrors CartTray.blockedLineSummaries so /checkout enforces
  // the same gate the cart drawer does.
  const unavailableItemsByLineId = (
    (activeOrder as any)?.validationStatus?.unavailableItems ?? []
  ).reduce((acc: Record<string, any>, item: any) => {
    if (item?.orderLineId) acc[item.orderLineId] = item;
    return acc;
  }, {});
  const blockedLineSummaries = ((activeOrder as any)?.lines ?? []).reduce(
    (acc: Array<{ id: string; label: string; message: string }>, line: any) => {
      const unavailableEntry = unavailableItemsByLineId[line.id];
      const isOutOfStock = line?.productVariant?.stockLevel === 'OUT_OF_STOCK';
      const lineUnavailable = line?.isAvailable === false;
      if (!unavailableEntry && !isOutOfStock && !lineUnavailable) return acc;
      const message =
        lineUnavailable && line?.unavailableReason
          ? line.unavailableReason
          : isOutOfStock
            ? 'This item is out of stock.'
            : formatUnavailableReason(unavailableEntry?.reason);
      const label =
        unavailableEntry?.variantName ||
        line?.productVariant?.name ||
        unavailableEntry?.productName ||
        line?.productVariant?.product?.slug ||
        'Item';
      acc.push({ id: line.id, label, message });
      return acc;
    },
    [],
  );
  const hasBlockedLines = blockedLineSummaries.length > 0;

  // Names of the items blocking the order so the shopper knows exactly which
  // product to decrease or remove. Variant overflows list their own per-item
  // detail below, so they're excluded here to avoid repeats.
  const affectedItemNames = Array.from(
    new Set(
      [
        ...blockedLineSummaries.map((s: any) => s.label),
        ...((activeOrder as any)?.quantityLimitStatus?.violations ?? []).map(
          (v: any) => v?.variantName || v?.productName,
        ),
      ].filter((n: any): n is string => typeof n === 'string' && n.length > 0),
    ),
  );

  const appliedCouponCode = activeOrder?.couponCodes?.[0];
  const appliedCouponDetails = appliedCouponCode
    ? data?.couponCodes.find((c: any) => c.couponCode === appliedCouponCode)
    : null;

  useEffect(() => {
    if (activeOrder?.id) {
      trackInitiateCheckout(activeOrder);
    }
    // Fire once per checkout entry, keyed by order id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrder?.id]);

  useEffect(() => {
    // Skip the error carried over from the cart — only surface errors from
    // edits made here in checkout (a fresh edit sets a new error object).
    if (orderError === initialOrderErrorRef.current) return;
    if (orderError?.errorCode && orderError.errorCode !== 'NO_ACTIVE_ORDER_ERROR') {
      const msg = orderError.errorCode === 'ORDER_INTERCEPTOR_ERROR'
        ? orderError.interceptorError || orderError.message
        : orderError.message;
      if (msg) setOrderErrorToast(msg);
    }
  }, [orderError]);

  useEffect(() => {
    if (isSignedIn && addresses.length && !shippingAddress?.streetLine1) {
      const defaultAddr = addresses.find((a: any) => a.defaultShippingAddress) || addresses[0];
      if (defaultAddr) {
        submitSelectedAddress(addresses.indexOf(defaultAddr));
      }
    }
  }, [isSignedIn, addresses.length]);

  useEffect(() => {
    const lines = activeOrder?.lines ?? [];
    if (lines.length === 0) {
      setIsNavigatingToHome(true);
      const timer = setTimeout(() => router.push('/'), 500);
      return () => clearTimeout(timer);
    }
  }, [activeOrder, activeOrder?.lines?.length, router]);

  const submitSelectedAddress = (index: number) => {
    const selectedAddress = data?.activeCustomer?.addresses?.[index];
    if (!selectedAddress) return;
    const fields: Record<string, string> = {
      action: 'setCheckoutShipping',
      fullName: selectedAddress.fullName ?? '',
      streetLine1: selectedAddress.streetLine1 ?? '',
      streetLine2: selectedAddress.streetLine2 ?? '',
      company: selectedAddress.company ?? '',
      city: selectedAddress.city ?? '',
      province: selectedAddress.province ?? '',
      postalCode: selectedAddress.postalCode ?? '',
      phoneNumber: selectedAddress.phoneNumber ?? '',
      countryCode: selectedAddress.country?.code ?? 'IN',
    };
    const formData = new FormData();
    Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
    fetch('/api/active-order', { method: 'POST', body: formData }).then(() => refresh());
  };

  const submitSelectedShippingMethod = (value?: string) => {
    if (!isSignedIn || !addresses.length) {
      setShowAddressToast(true);
      return;
    }
    if (value) {
      const formData = new FormData();
      formData.append('action', 'setShippingMethod');
      formData.append('shippingMethodId', value);
      fetch('/api/active-order', { method: 'POST', body: formData }).then(() => refresh());
    }
  };

  function triggerCouponValidation() {
    if (appliedCouponCode) {
      fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validateCoupons' }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.couponValid === false && data.message) {
            setAutoRemovedCouponMsg(data.message);
          }
        })
        .catch(() => {});
    }
  }

  function handleRemoveItem(lineId: string) {
    removeItem(lineId);
    setTimeout(() => triggerCouponValidation(), 500);
  }

  function handleAdjustOrderLine(lineId: string, quantity: number) {
    adjustOrderLine(lineId, quantity);
    setTimeout(() => triggerCouponValidation(), 500);
  }

  function handleRemoveCoupon() {
    if (!appliedCouponCode) return;
    trackRemoveCoupon(appliedCouponCode);
    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'removeCoupon',
        couponCode: appliedCouponCode,
        autoAddedVariantIds,
      }),
    })
      .then((r) => r.json())
      .then(() => {
        setAutoAddedVariantIds([]);
        // Refresh the active order so the applied-coupon row + totals update
        // immediately instead of only after a manual page refresh.
        revalidateActiveOrder();
      })
      .catch(() => {});
  }

  if (isNavigatingToHome) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-btn-primary mx-auto mb-4" />
          <p className="text-text-secondary">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  // Guest login gate
  if (needsLogin) {
    return (
      <div className="mt-20">
        <div className="lg:max-w-7xl max-w-2xl mx-auto pt-8 pb-24 px-4 sm:px-6 lg:px-8">
          <h1 className="text-center mb-10 text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            Checkout
          </h1>
          <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
            <div>
              <div className="bg-surface rounded-2xl shadow-sm border border-border-theme p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-2">Sign in to continue</h2>
                <p className="text-sm text-text-secondary mb-6">Sign in with your Google account to complete your order.</p>
                <div className="flex justify-center mb-6">
                  <GoogleLoginButton redirectTo="/checkout" size="large" text="signin_with" width={300} />
                </div>
                <div className="mt-8 border-t border-border-theme pt-6">
                  <h3 className="text-sm font-semibold text-text-primary mb-4">What happens next?</h3>
                  <ol className="space-y-3 text-sm text-text-secondary">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-btn-primary text-btn-primary-text flex items-center justify-center text-xs font-bold">1</span>
                      <span>Sign in securely with Google</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-btn-primary text-btn-primary-text flex items-center justify-center text-xs font-bold">2</span>
                      <span>Choose your delivery address</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-btn-primary text-btn-primary-text flex items-center justify-center text-xs font-bold">3</span>
                      <span>Select a shipping method and pay online</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border-theme">
                <h2 className="text-lg font-semibold text-text-primary mb-6">Order Summary</h2>
                <CartContents orderLines={activeOrder?.lines ?? []} currencyCode={activeOrder?.currencyCode ?? 'INR'} editable={false} />
                <CartTotals order={activeOrder} editable={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const allLines = activeOrder?.lines ?? [];
  const visibleLines = showAllCartItems ? allLines : allLines.slice(0, 3);

  return (
    <div className="mt-20">
      <div className="lg:max-w-7xl max-w-2xl mx-auto pt-6 pb-24 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="text-text-muted hover:text-text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Checkout</h1>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Left Column — 7 cols */}
          <div className="lg:col-span-7 space-y-5">

            {/* 1. Delivery Address */}
            <section className="bg-surface border border-border-theme rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border-theme bg-surface-hover">
                <MapPin className="w-5 h-5 text-btn-primary" />
                <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Delivery Address</h2>
                {isSignedIn && addresses.length > 0 && (
                  <Link href="/account/addresses" className="ml-auto text-xs font-medium text-btn-primary hover:underline">
                    Edit
                  </Link>
                )}
              </div>
              <div className="px-5 py-4">
                {isSignedIn && addresses.length ? (
                  (() => {
                    const defaultShippingAddress = addresses.find((addr: any) => addr.defaultShippingAddress);
                    const addressToShow = defaultShippingAddress || addresses[0];
                    return (
                      <div className="text-sm text-text-secondary leading-relaxed">
                        <p className="font-semibold text-text-primary">
                          {addressToShow?.fullName} &bull; {addressToShow?.phoneNumber}
                        </p>
                        <p className="mt-1">
                          {[addressToShow?.streetLine1, addressToShow?.streetLine2, addressToShow?.city, addressToShow?.province, addressToShow?.postalCode, addressToShow?.country?.name].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    );
                  })()
                ) : (
                  <div>
                    <p className="text-sm text-text-secondary mb-3">You have no saved address yet.</p>
                    <Link
                      href="/account/addresses?redirectTo=/checkout"
                      className="inline-block bg-btn-primary text-btn-primary-text px-4 py-2 rounded-xl hover:bg-btn-primary-hover text-sm font-medium transition-colors"
                    >
                      Add Address
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* 2. Order Instructions */}
            {activeOrder?.id && (
              <OrderInstructions orderId={activeOrder.id} initialValue={data?.orderInstructions ?? ''} disabled={false} />
            )}

            {/* 3. Shipping Method */}
            {data && (
              <section className="bg-surface border border-border-theme rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border-theme bg-surface-hover">
                  <Truck className="w-5 h-5 text-btn-primary" />
                  <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Shipping Method</h2>
                </div>
                <div className="px-5 py-4">
                  <ShippingMethodSelector
                    eligibleShippingMethods={eligibleShippingMethods}
                    currencyCode={activeOrder?.currencyCode}
                    shippingMethodId={activeOrder?.shippingLines?.[0]?.shippingMethod?.id ?? ''}
                    onChange={submitSelectedShippingMethod}
                  />
                </div>
              </section>
            )}

            {/* 4. Place Order */}
            <section className="bg-surface border border-border-theme rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border-theme bg-surface-hover">
                <ShieldCheck className="w-5 h-5 text-btn-primary" />
                <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Review & Place Order</h2>
              </div>
              <div className="px-5 py-4">
                <p className="text-xs text-text-tertiary mb-4 leading-relaxed">
                  By placing your order, you confirm that you have read and accept our Terms of Use, Terms of Sale, Returns Policy and Privacy Policy.
                </p>

                {((activeOrder as any)?.validationStatus?.isValid === false ||
                  (activeOrder as any)?.quantityLimitStatus?.hasViolations ||
                  hasBlockedLines ||
                  hasVariantOverflow) && (() => {
                  const backendReasons = Array.from(
                    new Set(
                      [
                        ...((activeOrder as any)?.validationStatus?.unavailableItems ?? []),
                        ...((activeOrder as any)?.quantityLimitStatus?.violations ?? []),
                      ]
                        .map((x: any) => x?.reason)
                        .filter((r: any): r is string => typeof r === 'string' && r.length > 0),
                    ),
                  );
                  return (
                    <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 space-y-1">
                      <p className="text-sm font-medium text-red-700 dark:text-red-400">
                        {hasVariantOverflow
                          ? 'Kindly decrease the quantity in your cart before placing the order.'
                          : (activeOrder as any).validationStatus?.message
                            ? (activeOrder as any).validationStatus.message
                            : backendReasons[0]
                              ? backendReasons[0]
                              : (activeOrder as any).quantityLimitStatus?.hasViolations && !hasBlockedLines
                                ? 'Please decrease the quantity of items exceeding the limit in your cart before placing the order.'
                                : 'Please decrease the quantity of unavailable items or remove them from your cart before placing the order.'}
                      </p>
                      {!hasVariantOverflow && affectedItemNames.length > 0 && (
                        <p className="text-xs font-medium text-red-600 dark:text-red-400">
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
                            className="text-xs text-red-600 dark:text-red-400"
                          >
                            {v.productName}: {v.totalQty} in cart, max {v.max} per order.
                          </p>
                        ))}
                    </div>
                  );
                })()}

                {isShippingMethodSelected &&
                  (activeOrder as any)?.validationStatus?.isValid !== false &&
                  !(activeOrder as any)?.quantityLimitStatus?.hasViolations &&
                  !hasBlockedLines &&
                  !hasVariantOverflow && (
                  <>
                    {data?.eligiblePaymentMethods?.find((m: any) => m.code === paymentMode) ? (
                      <RazorpayPayments
                        orderCode={activeOrder?.code ?? ''}
                        amount={activeOrder?.totalWithTax ?? 0}
                        currencyCode={activeOrder?.currencyCode ?? 'INR'}
                        customerEmail={customer?.emailAddress ?? ''}
                        customerName={`${customer?.firstName ?? ''} ${customer?.lastName ?? ''}`.trim()}
                        customerPhone={shippingAddress?.phoneNumber ?? ''}
                      />
                    ) : (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Online payment is not available. Please contact support.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {!isShippingMethodSelected && (
                  <div className="text-center py-2">
                    <p className="text-sm text-text-muted">
                      Select a shipping method to continue
                    </p>
                  </div>
                )}
              </div>
            </section>

            {eligibleShippingMethods.length === 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-700 dark:text-red-400">No shipping methods available. Please contact support.</p>
              </div>
            )}
          </div>

          {/* Right Column — 5 cols, sticky */}
          <div className="lg:col-span-5 mt-8 lg:mt-0">
            <div className="lg:sticky lg:top-28 space-y-5">

              {/* Order Summary Card */}
              <div className="bg-surface border border-border-theme rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border-theme bg-surface-hover">
                  <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                    Order Summary
                  </h2>
                </div>

                <div className="px-5 py-4">
                  <CartTotals order={activeOrder} />
                </div>
              </div>

              {/* Cart Items Card */}
              <div className="bg-surface border border-border-theme rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border-theme bg-surface-hover flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
                    Items ({allLines.length})
                  </h2>
                </div>

                <div className="px-4 py-4">
                  <CartContents
                    orderLines={visibleLines}
                    currencyCode={activeOrder?.currencyCode ?? 'INR'}
                    editable={true}
                    removeItem={handleRemoveItem}
                    adjustOrderLine={handleAdjustOrderLine}
                  />

                  {allLines.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllCartItems(!showAllCartItems)}
                      className="w-full mt-3 py-2 text-sm font-medium text-btn-primary hover:text-btn-primary-hover transition-colors"
                    >
                      {showAllCartItems ? 'Show Less' : `Show All Items (${allLines.length})`}
                    </button>
                  )}
                </div>
              </div>

              {/* Coupon Section */}
              <div className="bg-surface border border-border-theme rounded-2xl overflow-hidden">
                <div className="px-5 py-4">
                  {appliedCouponCode && appliedCouponDetails ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-700 dark:text-green-400">
                            {appliedCouponDetails.name || appliedCouponCode}
                          </p>
                          <p className="text-xs text-text-muted">&ldquo;{appliedCouponCode}&rdquo; applied</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="px-3 py-1 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTimeout(() => setIsCouponModalOpen(true), 50)}
                      className="w-full py-2.5 text-sm font-semibold text-btn-primary border-2 border-dashed border-btn-primary/40 rounded-xl hover:border-btn-primary hover:bg-btn-primary/5 transition-all"
                    >
                      Have a coupon code? Apply here
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coupon Modal */}
      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        coupons={(data?.couponCodes ?? []) as any}
        activeOrder={activeOrder}
        appliedCoupon={activeOrder?.couponCodes?.[0] || null}
        customerGroups={data?.customerGroups ?? []}
        onApplied={(ids) => setAutoAddedVariantIds(ids)}
      />

      {/* Toasts */}
      <ToastNotification show={showAddressToast} type="error" title="Address Required" message="Address is required to place an order." onClose={() => setShowAddressToast(false)} />
      <ToastNotification show={!!autoRemovedCouponMsg} type="warning" title="Coupon Removed" message={autoRemovedCouponMsg} onClose={() => setAutoRemovedCouponMsg('')} autoDismiss={true} dismissDuration={5000} />
      <ToastNotification show={!!orderErrorToast} type="error" title="Order Error" message={orderErrorToast || ''} onClose={() => setOrderErrorToast(null)} autoDismiss={true} dismissDuration={5000} />
    </div>
  );
}
