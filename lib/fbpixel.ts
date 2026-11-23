// Meta (Facebook) Pixel helper.
//
// Wraps `window.fbq` with typed helpers for the standard events we fire across
// the app. The pixel script itself is bootstrapped from <MetaPixel /> in the
// root layout — these helpers are safe to call before the script loads
// (they queue via the fbq shim) and on the server (they no-op).

export const FB_PIXEL_ID =
  process.env.NEXT_PUBLIC_FB_PIXEL_ID || '2005773946642133';

declare global {
  interface Window {
    fbq?: ((...args: any[]) => void) & {
      callMethod?: (...args: any[]) => void;
      queue?: any[];
      loaded?: boolean;
      version?: string;
      push?: (...args: any[]) => void;
    };
    _fbq?: any;
  }
}

function safeFbq(...args: any[]) {
  if (typeof window === 'undefined') return;
  if (typeof window.fbq !== 'function') return;
  try {
    (window.fbq as any)(...args);
  } catch (e) {
    // Never let analytics break product flows.
    console.warn('[fbpixel] event failed', e);
  }
}

export const pageView = () => safeFbq('track', 'PageView');

export const trackStandard = (event: string, params?: Record<string, any>) =>
  safeFbq('track', event, params);

export const trackCustom = (event: string, params?: Record<string, any>) =>
  safeFbq('trackCustom', event, params);

// ---- Vendure-shape helpers ---------------------------------------------------
// Vendure exposes prices in minor units (paise/cents). Convert to major units
// for Meta — Meta's `value` field expects a decimal currency amount.
const toMajor = (minor: number | undefined | null) =>
  typeof minor === 'number' ? Math.round(minor) / 100 : 0;

const variantPrice = (line: any): number => {
  const p =
    line?.linePriceWithTax ??
    line?.discountedLinePriceWithTax ??
    line?.proratedLinePriceWithTax ??
    line?.unitPriceWithTax;
  return toMajor(p);
};

const orderCurrency = (order: any) => order?.currencyCode || 'INR';

// Sign in / sign up — Meta doesn't have a "Login" standard event, but
// CompleteRegistration covers signup and a custom Login covers the rest.
export const trackLogin = (method: 'email' | 'google' | string = 'email') => {
  trackCustom('Login', { method });
};

export const trackSignUp = (method: 'email' | 'google' | string = 'google') => {
  trackStandard('CompleteRegistration', {
    registration_method: method,
    status: true,
  });
};

export const trackLogout = () => {
  trackCustom('Logout');
};

// Add to cart — fired right after addItemToOrder is requested. We don't always
// have the full variant on hand, so accept a flexible shape.
export const trackAddToCart = (args: {
  variantId: string;
  quantity?: number;
  price?: number; // major units already
  currency?: string;
  productName?: string;
}) => {
  trackStandard('AddToCart', {
    content_ids: [args.variantId],
    content_type: 'product',
    contents: [{ id: args.variantId, quantity: args.quantity ?? 1 }],
    content_name: args.productName,
    value: args.price ?? 0,
    currency: args.currency || 'INR',
  });
};

export const trackRemoveFromCart = (args: {
  lineId: string;
  variantId?: string;
  quantity?: number;
  value?: number;
  currency?: string;
}) => {
  trackCustom('RemoveFromCart', {
    content_ids: args.variantId ? [args.variantId] : undefined,
    contents: args.variantId
      ? [{ id: args.variantId, quantity: args.quantity ?? 1 }]
      : undefined,
    value: args.value ?? 0,
    currency: args.currency || 'INR',
  });
};

export const trackViewContent = (product: any) => {
  if (!product) return;
  const firstVariant = product.variants?.[0];
  const price = toMajor(
    firstVariant?.priceWithTax?.value ?? firstVariant?.priceWithTax,
  );
  trackStandard('ViewContent', {
    content_ids: [product.id],
    content_type: 'product',
    content_name: product.name,
    content_category: product.collections?.[0]?.name,
    value: price,
    currency: 'INR',
  });
};

export const trackSearch = (term: string, resultsCount?: number) => {
  if (!term) return;
  trackStandard('Search', {
    search_string: term,
    content_type: 'product',
    num_items: resultsCount,
  });
};

export const trackInitiateCheckout = (activeOrder: any) => {
  if (!activeOrder) return;
  const lines = activeOrder.lines ?? [];
  trackStandard('InitiateCheckout', {
    content_ids: lines.map((l: any) => l.productVariant?.id).filter(Boolean),
    content_type: 'product',
    contents: lines.map((l: any) => ({
      id: l.productVariant?.id,
      quantity: l.quantity,
      item_price: variantPrice(l) / Math.max(l.quantity ?? 1, 1),
    })),
    num_items: lines.reduce(
      (n: number, l: any) => n + (l.quantity ?? 0),
      0,
    ),
    value: toMajor(activeOrder.totalWithTax ?? activeOrder.total),
    currency: orderCurrency(activeOrder),
  });
};

export const trackAddPaymentInfo = (activeOrder: any) => {
  if (!activeOrder) return;
  trackStandard('AddPaymentInfo', {
    content_ids: (activeOrder.lines ?? [])
      .map((l: any) => l.productVariant?.id)
      .filter(Boolean),
    content_type: 'product',
    value: toMajor(activeOrder.totalWithTax ?? activeOrder.total),
    currency: orderCurrency(activeOrder),
  });
};

export const trackPurchase = (order: any) => {
  if (!order) return;
  const lines = order.lines ?? [];
  trackStandard('Purchase', {
    content_ids: lines.map((l: any) => l.productVariant?.id).filter(Boolean),
    content_type: 'product',
    contents: lines.map((l: any) => ({
      id: l.productVariant?.id,
      quantity: l.quantity,
      item_price: variantPrice(l) / Math.max(l.quantity ?? 1, 1),
    })),
    num_items: lines.reduce(
      (n: number, l: any) => n + (l.quantity ?? 0),
      0,
    ),
    value: toMajor(order.totalWithTax ?? order.total),
    currency: orderCurrency(order),
    order_id: order.code,
  });
};

export const trackAddToFavourites = (args: {
  productId: string;
  productName?: string;
  value?: number;
  currency?: string;
}) => {
  trackCustom('AddToFavourites', {
    content_ids: [args.productId],
    content_type: 'product',
    content_name: args.productName,
    value: args.value ?? 0,
    currency: args.currency || 'INR',
  });
};

export const trackRemoveFromFavourites = (args: {
  productId: string;
  productName?: string;
}) => {
  trackCustom('RemoveFromFavourites', {
    content_ids: [args.productId],
    content_type: 'product',
    content_name: args.productName,
  });
};

// ---- Generic CTA / button click helpers --------------------------------------
export const trackClick = (name: string, params?: Record<string, any>) =>
  trackCustom('ButtonClick', { button: name, ...(params || {}) });

export const trackApplyCoupon = (code: string) =>
  trackCustom('ApplyCoupon', { coupon_code: code });

export const trackRemoveCoupon = (code: string) =>
  trackCustom('RemoveCoupon', { coupon_code: code });

export const trackApplyLoyaltyPoints = (points: number) =>
  trackCustom('ApplyLoyaltyPoints', { points });

export const trackSelectShippingMethod = (id: string, name?: string) =>
  trackCustom('SelectShippingMethod', { shipping_method_id: id, name });

export const trackSelectPaymentMethod = (code: string) =>
  trackCustom('SelectPaymentMethod', { payment_method_code: code });

export const trackPlaceOrder = (
  code: 'cash-on-delivery' | 'razorpay-payment' | string,
  activeOrder?: any,
) =>
  trackCustom('PlaceOrder', {
    payment_method_code: code,
    value:
      typeof activeOrder?.totalWithTax === 'number'
        ? activeOrder.totalWithTax / 100
        : undefined,
    currency: activeOrder?.currencyCode || 'INR',
    order_code: activeOrder?.code,
  });

export const trackUpdateQuantity = (args: {
  lineId: string;
  variantId?: string;
  quantity: number;
  delta?: number;
}) => trackCustom('UpdateCartQuantity', args);

export const trackAddress = (
  action: 'add' | 'edit' | 'delete' | 'setDefaultShipping' | 'setDefaultBilling',
) => trackCustom('AddressAction', { action });

export const trackUpdateProfile = (intent: string) =>
  trackCustom('UpdateProfile', { intent });

export const trackFilter = (action: 'apply' | 'clear', facets?: string[]) =>
  trackCustom('ApplyFilter', { action, facets });

export const trackDownloadInvoice = (orderCode: string) =>
  trackCustom('DownloadInvoice', { order_code: orderCode });

export const trackContinueShopping = (source: string) =>
  trackCustom('ContinueShopping', { source });

export const trackSelectCollection = (slug: string, name?: string) =>
  trackCustom('SelectCollection', { slug, name });
