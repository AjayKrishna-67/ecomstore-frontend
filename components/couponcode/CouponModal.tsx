'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import ToastNotification from '../ToastNotification';
import { Clock, Users, Tag, X, ChevronDown, ChevronUp, ShoppingCart, Gift, Truck } from 'lucide-react';
import { revalidateActiveOrder } from '@/hooks/use-active-order';

// Interfaces
interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  priceWithTax: number;
  currencyCode?: string;
  featuredAsset?: { id: string; preview: string } | null;
  product?: { id: string; name: string; slug: string } | null;
}

interface FacetValue {
  id: string;
  name: string;
  code: string;
  facet?: { id: string; name: string } | null;
}

interface Coupon {
  id: string;
  name: string;
  couponCode?: string | null;
  description: string;
  enabled: boolean;
  endsAt?: string | null;
  startsAt?: any;
  usageLimit?: number | null;
  perCustomerUsageLimit?: number | null;
  updatedAt?: string;
  conditions: Array<{
    code: string;
    args: Array<{ name: string; value: string }>;
  }>;
  actions: Array<{
    code: string;
    args: Array<{ name: string; value: string }>;
  }>;
  productVariants?: ProductVariant[];
  facetValues?: FacetValue[];
  customerGroup?: { id: string; name: string } | null;
}

interface OrderLine {
  id: string;
  productVariant: {
    id: string;
    name?: string;
    facetValues?: Array<{
      id: string;
      name: string;
      code: string;
      facet?: { id: string; name: string; code: string } | null;
    }>;
    product?: {
      id: string;
      slug: string;
      facetValues?: Array<{
        id: string;
        name: string;
        code: string;
        facet?: { id: string; name: string; code: string } | null;
      }>;
    } | null;
  };
  quantity: number;
  linePriceWithTax?: number;
  unitPriceWithTax?: number;
  discountedLinePriceWithTax?: number;
}

interface Order {
  id: string;
  code: string;
  active: boolean;
  createdAt?: any;
  state: string;
  currencyCode: string;
  totalQuantity: number;
  subTotal: number;
  subTotalWithTax: number;
  total?: number;
  totalWithTax: number;
  couponCodes?: string[] | null;
  lines?: OrderLine[] | null;
  payments?: Array<{ id: string }> | null;
}

interface CouponFetcherData {
  success?: boolean;
  message?: string;
  error?: string;
  orderTotal?: number;
  appliedCoupon?: string | null;
  autoAddedVariantIds?: string[];
}

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupons: Coupon[];
  activeOrder: Order | null;
  appliedCoupon: string | null;
  customerGroups?: Array<{ id: string; name: string }>;
  onApplied?: (autoAddedVariantIds: string[]) => void;
}

const formatErrorMessage = (errorMsg: string) => {
  const minimumAmountMatch = errorMsg.match(
    /Add ₹([\d.]+) more to apply this coupon/,
  );
  if (minimumAmountMatch) {
    return {
      title: 'Minimum Amount Required',
      message: `Add ₹${minimumAmountMatch[1]} more to unlock this coupon`,
    };
  }
  if (
    /(usage limit|limit reached|Coupon usage limit reached|exceed|exceeded)/i.test(
      errorMsg,
    )
  ) {
    return {
      title: 'Usage Limit Reached',
      message: 'This coupon is no longer available. Try another one!',
    };
  }
  if (/expired|expir/i.test(errorMsg)) {
    return {
      title: 'Coupon Expired',
      message: 'This coupon has expired. Check out our other offers!',
    };
  }
  if (/invalid|not found/i.test(errorMsg)) {
    return {
      title: 'Invalid Coupon',
      message: 'This coupon code is not valid. Please check and try again!',
    };
  }
  if (/Failed to add.*products|ENTITY_NOT_FOUND|ProductVariant.*could not be found/i.test(errorMsg)) {
    return {
      title: 'Product Unavailable',
      message: 'A required product for this coupon is currently unavailable. Please try another coupon.',
    };
  }
  if (/could not be found|ENTITY_NOT_FOUND/i.test(errorMsg)) {
    return {
      title: 'Item Not Found',
      message: 'Something went wrong. Please try again or contact support.',
    };
  }
  return {
    title: 'Oops!',
    message: errorMsg || 'Something went wrong. Please try again.',
  };
};

const formatPrice = (amount: number) => {
  return `₹${(amount / 100).toFixed(0)}`;
};

// Get the discount label info from coupon actions
function getDiscountInfo(
  coupon: Coupon,
  activeOrder?: Order | null,
): { label: string; gradient: string; description: string } | null {
  for (const action of coupon.actions ?? []) {
    const discountArg = action.args.find(
      (a) => a.name === 'discount' || a.name === 'discountAmount',
    );
    const discount = discountArg ? Number(discountArg.value) : 0;

    switch (action.code) {
      case 'order_percentage_discount':
        if (discount > 0) {
          const orderTotal = activeOrder?.subTotalWithTax ?? 0;
          const savings = Math.round((orderTotal * discount) / 100);
          return {
            label: savings > 0 ? `${formatPrice(savings)} OFF (${discount}%)` : `${discount}% OFF`,
            gradient: 'from-orange-500 to-red-500',
            description: savings > 0
              ? `${discount}% off on your entire order — You save ${formatPrice(savings)}`
              : `${discount}% off on your entire order`,
          };
        }
        break;
      case 'products_percentage_discount': {
        if (discount > 0) {
          const variantsArg = action.args.find((a) => a.name === 'productVariantIds');
          let savings = 0;
          if (variantsArg?.value && activeOrder?.lines) {
            try {
              const ids = variantsArg.value.startsWith('[')
                ? JSON.parse(variantsArg.value).map(String)
                : [variantsArg.value];
              for (const line of activeOrder.lines) {
                if (ids.includes(line.productVariant.id)) {
                  savings += Math.round(((line.linePriceWithTax ?? 0) * discount) / 100);
                }
              }
            } catch {}
          }
          return {
            label: savings > 0 ? `${formatPrice(savings)} OFF (${discount}%)` : `${discount}% OFF`,
            gradient: 'from-orange-500 to-red-500',
            description: savings > 0
              ? `${discount}% off on selected products — You save ${formatPrice(savings)}`
              : `${discount}% off on selected products`,
          };
        }
        break;
      }
      case 'facet_based_discount':
        if (discount > 0) {
          const facetsArg = action.args.find((a) => a.name === 'facets');
          let savings = 0;
          if (facetsArg?.value && activeOrder?.lines) {
            try {
              const facetIds = new Set(
                (facetsArg.value.startsWith('[')
                  ? JSON.parse(facetsArg.value)
                  : [facetsArg.value]
                ).map(String),
              );
              for (const line of activeOrder.lines) {
                const allFacetValues = [
                  ...(line.productVariant.facetValues ?? []),
                  ...(line.productVariant.product?.facetValues ?? []),
                ];
                const hasMatchingFacet = allFacetValues.some(
                  (fv) => facetIds.has(fv.id) || (fv.facet && facetIds.has(fv.facet.id)),
                );
                if (hasMatchingFacet) {
                  savings += Math.round(((line.linePriceWithTax ?? 0) * discount) / 100);
                }
              }
            } catch {}
          }
          return {
            label: savings > 0 ? `${formatPrice(savings)} OFF (${discount}%)` : `${discount}% OFF`,
            gradient: 'from-orange-500 to-red-500',
            description: savings > 0
              ? `${discount}% off on selected categories — You save ${formatPrice(savings)}`
              : `${discount}% off on selected categories`,
          };
        }
        break;
      case 'order_fixed_discount':
        if (discount > 0) {
          return {
            label: `${formatPrice(discount)} OFF`,
            gradient: 'from-green-500 to-emerald-600',
            description: `Flat ${formatPrice(discount)} off on your order`,
          };
        }
        break;
      case 'order_line_fixed_discount':
        if (discount > 0) {
          return {
            label: `${formatPrice(discount)} OFF`,
            gradient: 'from-green-500 to-emerald-600',
            description: `${formatPrice(discount)} off on each qualifying item`,
          };
        }
        break;
      case 'free_shipping':
        return {
          label: 'Free Delivery',
          gradient: 'from-blue-500 to-cyan-500',
          description: 'Free delivery on this order',
        };
    }
  }
  return null;
}

// Parse buy_x_get_y_free condition details
function getBxgyInfo(coupon: Coupon): {
  xVariantIds: string[];
  yVariantIds: string[];
  amountX: number;
  amountY: number;
  discountPercent: number;
} | null {
  for (const condition of coupon.conditions) {
    if (condition.code === 'buy_x_get_y_free') {
      const variantIdsXArg = condition.args.find((a) => a.name === 'variantIdsX');
      const variantIdsYArg = condition.args.find((a) => a.name === 'variantIdsY');
      const amountXArg = condition.args.find((a) => a.name === 'amountX');
      const amountYArg = condition.args.find((a) => a.name === 'amountY');
      const discountArg = condition.args.find((a) => a.name === 'discount');

      const parseIds = (val?: string) => {
        if (!val) return [];
        try {
          const parsed = val.startsWith('[') ? JSON.parse(val) : [val];
          return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
        } catch {
          return [val];
        }
      };

      return {
        xVariantIds: parseIds(variantIdsXArg?.value),
        yVariantIds: parseIds(variantIdsYArg?.value),
        amountX: Number(amountXArg?.value ?? 1),
        amountY: Number(amountYArg?.value ?? 1),
        discountPercent: Number(discountArg?.value ?? 100),
      };
    }
  }
  return null;
}

// Parse contains_products condition details
function getRequiredProducts(coupon: Coupon): { variantIds: string[]; minimum: number } | null {
  for (const condition of coupon.conditions) {
    if (condition.code === 'contains_products') {
      const variantArg = condition.args.find((a) => a.name === 'productVariantIds');
      const minArg = condition.args.find((a) => a.name === 'minimum');
      if (variantArg?.value) {
        try {
          const parsed = variantArg.value.startsWith('[')
            ? JSON.parse(variantArg.value)
            : [variantArg.value];
          return {
            variantIds: Array.isArray(parsed) ? parsed.map(String) : [String(parsed)],
            minimum: Number(minArg?.value ?? 1),
          };
        } catch {
          return { variantIds: [variantArg.value], minimum: Number(minArg?.value ?? 1) };
        }
      }
    }
  }
  return null;
}

// Parse at_least_n_with_facets condition details
function getAtLeastNWithFacets(coupon: Coupon): { minimum: number; facetIds: string[] } | null {
  for (const condition of coupon.conditions) {
    if (condition.code === 'at_least_n_with_facets') {
      const minArg = condition.args.find((a) => a.name === 'minimum');
      const facetsArg = condition.args.find((a) => a.name === 'facets');
      if (facetsArg?.value) {
        try {
          const parsed = facetsArg.value.startsWith('[')
            ? JSON.parse(facetsArg.value)
            : [facetsArg.value];
          return {
            minimum: Number(minArg?.value ?? 1),
            facetIds: Array.isArray(parsed) ? parsed.map(String) : [String(parsed)],
          };
        } catch {
          return { minimum: Number(minArg?.value ?? 1), facetIds: [facetsArg.value] };
        }
      }
    }
  }
  return null;
}

// Parse customer_group condition
function getCustomerGroupCondition(coupon: Coupon): { groupId: string } | null {
  for (const condition of coupon.conditions) {
    if (condition.code === 'customer_group') {
      const groupArg = condition.args.find((a) => a.name === 'customerGroupId');
      if (groupArg?.value) {
        return { groupId: groupArg.value };
      }
    }
  }
  return null;
}

// Parse facet_based_discount action (which facets get discount)
function getFacetBasedDiscountInfo(coupon: Coupon): { facetIds: string[] } | null {
  for (const action of coupon.actions ?? []) {
    if (action.code === 'facet_based_discount') {
      const facetsArg = action.args.find((a) => a.name === 'facets');
      if (facetsArg?.value) {
        try {
          const parsed = facetsArg.value.startsWith('[')
            ? JSON.parse(facetsArg.value)
            : [facetsArg.value];
          return { facetIds: Array.isArray(parsed) ? parsed.map(String) : [String(parsed)] };
        } catch {
          return { facetIds: [facetsArg.value] };
        }
      }
    }
  }
  return null;
}

// Parse products_percentage_discount action (which products get discount)
function getProductsDiscountInfo(coupon: Coupon): { variantIds: string[] } | null {
  for (const action of coupon.actions ?? []) {
    if (action.code === 'products_percentage_discount') {
      const variantsArg = action.args.find((a) => a.name === 'productVariantIds');
      if (variantsArg?.value) {
        try {
          const parsed = variantsArg.value.startsWith('[')
            ? JSON.parse(variantsArg.value)
            : [variantsArg.value];
          return { variantIds: Array.isArray(parsed) ? parsed.map(String) : [String(parsed)] };
        } catch {
          return { variantIds: [variantsArg.value] };
        }
      }
    }
  }
  return null;
}

// Get minimum_order_amount from conditions
function getMinOrderAmount(coupon: Coupon): { amount: number; taxInclusive: boolean } | null {
  for (const condition of coupon.conditions) {
    if (condition.code === 'minimum_order_amount') {
      const amountArg = condition.args.find((a) => a.name === 'amount');
      const taxArg = condition.args.find((a) => a.name === 'taxInclusive');
      if (amountArg?.value) {
        return {
          amount: Number(amountArg.value),
          taxInclusive: taxArg?.value === 'true',
        };
      }
    }
  }
  return null;
}

// Calculate effective subtotal (excluding auto-added Y products)
function getEffectiveSubtotal(activeOrder: Order | null, coupons: Coupon[]): number {
  if (!activeOrder?.lines) return activeOrder?.subTotalWithTax ?? 0;

  // Collect all Y variant IDs from buy_x_get_y_free coupons that are applied
  const autoAddedIds = new Set<string>();
  for (const coupon of coupons) {
    const bxgy = getBxgyInfo(coupon);
    if (bxgy && activeOrder.couponCodes?.includes(coupon.couponCode ?? '')) {
      bxgy.yVariantIds.forEach((id) => autoAddedIds.add(id));
    }
  }

  if (autoAddedIds.size === 0) return activeOrder.subTotalWithTax;

  let total = 0;
  for (const line of activeOrder.lines) {
    if (!autoAddedIds.has(line.productVariant.id)) {
      total += line.discountedLinePriceWithTax ?? line.linePriceWithTax ?? (line.unitPriceWithTax ?? 0) * line.quantity;
    }
  }
  return total;
}

// Find variant name from productVariants array or order lines
function findVariantName(
  id: string,
  productVariants?: ProductVariant[],
  orderLines?: OrderLine[] | null,
): string {
  const pv = productVariants?.find((v) => v.id === id);
  if (pv) return pv.name;
  const line = orderLines?.find((l) => l.productVariant.id === id);
  return line?.productVariant.name ?? `Variant #${id}`;
}

export function CouponModal({
  isOpen,
  onClose,
  coupons,
  activeOrder,
  appliedCoupon,
  customerGroups = [],
  onApplied,
}: CouponModalProps) {
  const [couponFetcherState, setCouponFetcherState] = useState<'idle' | 'submitting'>('idle');
  const [couponFetcherData, setCouponFetcherData] = useState<CouponFetcherData | null>(null);
  const [errorState, setErrorState] = useState({
    show: false,
    title: '',
    message: '',
    key: 0,
  });
  const [expandedCoupons, setExpandedCoupons] = useState<Set<string>>(
    new Set(),
  );
  const [hasProcessedResponse, setHasProcessedResponse] = useState(false);

  const customerGroupIds = useMemo(
    () => customerGroups.map((g) => String(g.id)),
    [customerGroups],
  );

  // Filter: enabled, has couponCode, user belongs to customer group (if restricted)
  const enabledCoupons = useMemo(() => {
    return [...coupons]
      .filter((coupon) => {
        if (!coupon.enabled || !coupon.couponCode) return false;
        // Customer group filtering
        if (coupon.customerGroup) {
          return customerGroupIds.includes(String(coupon.customerGroup.id));
        }
        return true;
      })
      .sort((a, b) => {
        const aTime = a.updatedAt
          ? new Date(a.updatedAt).getTime()
          : Number.NEGATIVE_INFINITY;
        const bTime = b.updatedAt
          ? new Date(b.updatedAt).getTime()
          : Number.NEGATIVE_INFINITY;
        return bTime - aTime;
      });
  }, [coupons, customerGroupIds]);

  // Eligible coupons: within 400 of qualifying (min order amount gap)
  const effectiveSubtotal = useMemo(
    () => getEffectiveSubtotal(activeOrder, coupons),
    [activeOrder, coupons],
  );

  const { qualifiedCoupons, eligibleCoupons } = useMemo(() => {
    const qualified: Coupon[] = [];
    const eligible: Coupon[] = [];

    for (const coupon of enabledCoupons) {
      const minOrder = getMinOrderAmount(coupon);
      if (minOrder) {
        const compareAmount = minOrder.taxInclusive
          ? effectiveSubtotal
          : (activeOrder?.subTotal ?? 0);
        const gap = minOrder.amount - compareAmount;
        if (gap > 0 && gap <= 40000) {
          // within 400 (amount is in cents)
          eligible.push(coupon);
          continue;
        }
      }
      qualified.push(coupon);
    }
    return { qualifiedCoupons: qualified, eligibleCoupons: eligible };
  }, [enabledCoupons, effectiveSubtotal, activeOrder?.subTotal]);

  const isCouponApplied = !!activeOrder?.couponCodes?.length;

  useEffect(() => {
    if (!couponFetcherData || hasProcessedResponse) return;

    if (couponFetcherData.error) {
      const { title, message } = formatErrorMessage(couponFetcherData.error);
      setErrorState((prev) => ({
        show: true,
        title,
        message,
        key: prev.key + 1,
      }));
    } else if (couponFetcherData.success) {
      const appliedCode = couponFetcherData.appliedCoupon;
      if (appliedCode) {
        onApplied?.(couponFetcherData.autoAddedVariantIds ?? []);
      }
      onClose();
    }

    setHasProcessedResponse(true);
  }, [couponFetcherData, hasProcessedResponse, onClose]);

  // Reset error state when modal opens; mark stale fetcher data as already processed
  useEffect(() => {
    if (isOpen) {
      setErrorState((prev) => ({ ...prev, show: false }));
      if (couponFetcherData) {
        setHasProcessedResponse(true);
      } else {
        setHasProcessedResponse(false);
      }
    }
  }, [isOpen]);

  // Reset hasProcessedResponse only when a new submission starts
  useEffect(() => {
    if (couponFetcherState === 'submitting') {
      setHasProcessedResponse(false);
    }
  }, [couponFetcherState]);

  const closeErrorToast = useCallback(() => {
    setErrorState((prev) => ({ ...prev, show: false }));
  }, []);

  const toggleCouponExpansion = useCallback((couponId: string) => {
    setExpandedCoupons((prev) => {
      const newSet = new Set(prev);
      newSet.has(couponId) ? newSet.delete(couponId) : newSet.add(couponId);
      return newSet;
    });
  }, []);

  const handleCouponSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: Record<string, any> = {};
    formData.forEach((value, key) => { payload[key] = value; });
    setCouponFetcherState('submitting');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setCouponFetcherData(data);
      // Apply/remove changed the order server-side. Revalidate the active-order
      // SWR cache so the applied/removed coupon reflects immediately instead of
      // only after a manual page refresh.
      if (res.ok) {
        await revalidateActiveOrder();
      }
    } catch {
      setCouponFetcherData({ error: 'Network error. Please try again.' });
    } finally {
      setCouponFetcherState('idle');
    }
  };

  if (!isOpen) return null;

  const renderCouponCard = (coupon: Coupon, index: number) => {
    const isApplied =
      appliedCoupon === coupon.couponCode &&
      activeOrder?.couponCodes?.includes(coupon.couponCode!);
    const isExpanded = expandedCoupons.has(coupon.id);
    const isSubmitting = couponFetcherState === 'submitting';
    const discountInfo = getDiscountInfo(coupon, activeOrder);
    const bxgyInfo = getBxgyInfo(coupon);
    const requiredProducts = getRequiredProducts(coupon);
    const minOrder = getMinOrderAmount(coupon);
    const atLeastNFacets = getAtLeastNWithFacets(coupon);
    const customerGroupCond = getCustomerGroupCondition(coupon);
    const facetDiscount = getFacetBasedDiscountInfo(coupon);
    const productsDiscount = getProductsDiscountInfo(coupon);

    // Free products: productVariants from CouponCodeItem that are NOT in conditions (not BXGY, not required)
    const conditionVariantIds = new Set<string>();
    if (bxgyInfo) {
      bxgyInfo.xVariantIds.forEach((id) => conditionVariantIds.add(id));
      bxgyInfo.yVariantIds.forEach((id) => conditionVariantIds.add(id));
    }
    if (requiredProducts) {
      requiredProducts.variantIds.forEach((id) => conditionVariantIds.add(id));
    }
    const freeProducts = (coupon.productVariants ?? []).filter(
      (v) => !conditionVariantIds.has(v.id) && !bxgyInfo,
    );

    return (
      <div
        key={coupon.id}
        className={`relative border rounded-xl transition-all duration-200 overflow-hidden ${
          isApplied
            ? 'border-green-400 bg-green-50 dark:bg-green-950/30 dark:border-green-700/60 shadow-lg'
            : 'border-border-theme bg-surface hover:shadow-md hover:border-border-strong'
        }`}
      >
        {/* Discount Label Banner */}
        {discountInfo && (
          <div
            className={`bg-gradient-to-r ${discountInfo.gradient} text-white text-xs font-bold px-4 py-1.5 flex items-center gap-1.5`}
          >
            {discountInfo.label}
          </div>
        )}
        {bxgyInfo && !discountInfo && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1.5">
            Buy {bxgyInfo.amountX} Get {bxgyInfo.amountY}
            {bxgyInfo.discountPercent === 100
              ? ' FREE'
              : ` at ${bxgyInfo.discountPercent}% OFF`}
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-text-primary">
                  {coupon.couponCode}
                </span>
                {isApplied && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 text-xs font-medium rounded-full">
                    Applied
                  </span>
                )}
                {coupon.customerGroup && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 text-xs font-medium rounded-full">
                    {coupon.customerGroup.name}
                  </span>
                )}
              </div>
              <p className="text-sm text-text-tertiary mt-0.5">{coupon.name}</p>
            </div>
            <form method="post" className="ml-3 flex-shrink-0" onSubmit={handleCouponSubmit}>
              <input
                type="hidden"
                name="action"
                value={isApplied ? 'removeCoupon' : 'applyCoupon'}
              />
              <input
                type="hidden"
                name="couponCode"
                value={coupon.couponCode ?? ''}
              />
              <button
                type="submit"
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                  isCouponApplied && !isApplied
                    ? 'bg-surface-hover text-text-muted cursor-not-allowed border border-border-theme'
                    : isApplied
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg'
                    : 'bg-pink-500 hover:bg-pink-600 text-white shadow-md hover:shadow-lg'
                }`}
                disabled={
                  typeof coupon.couponCode !== 'string' ||
                  (isCouponApplied && !isApplied) ||
                  isSubmitting
                }
              >
                {isSubmitting
                  ? isApplied
                    ? 'REMOVING...'
                    : 'APPLYING...'
                  : isApplied
                  ? 'REMOVE'
                  : 'APPLY'}
              </button>
            </form>
          </div>

          {/* Description & toggle */}
          <div className="mb-3">
            <div
              className="text-sm text-text-secondary leading-relaxed min-h-[1.25rem]"
              dangerouslySetInnerHTML={{
                __html: coupon.description
                  ? isExpanded
                    ? coupon.description
                    : coupon.description.substring(0, 100) +
                      (coupon.description.length > 100 ? '...' : '')
                  : '&nbsp;',
              }}
            />
            {coupon.description && coupon.description.length > 100 && (
              <button
                onClick={() => toggleCouponExpansion(coupon.id)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium mt-1 flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" /> LESS
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" /> MORE
                  </>
                )}
              </button>
            )}
          </div>

          {/* Action description */}
          {discountInfo?.description && (
            <div className="mb-3 px-3 py-2 bg-surface-hover rounded-lg border border-border-theme">
              <p className="text-xs font-medium text-text-secondary">
                {discountInfo.description}
              </p>
            </div>
          )}

          {/* Buy X Get Y Info */}
          {bxgyInfo && (
            <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-100 dark:border-purple-900/50">
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-200 dark:bg-purple-900/60 px-2 py-0.5 rounded">
                    BUY
                  </span>
                  <div className="text-xs text-text-secondary">
                    {bxgyInfo.xVariantIds
                      .map((id) =>
                        findVariantName(id, coupon.productVariants, activeOrder?.lines),
                      )
                      .join(', ')}{' '}
                    <span className="text-text-tertiary">(qty: {bxgyInfo.amountX})</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-green-700 dark:text-green-300 bg-green-200 dark:bg-green-900/60 px-2 py-0.5 rounded">
                    GET
                  </span>
                  <div className="text-xs text-text-secondary">
                    {bxgyInfo.yVariantIds
                      .map((id) =>
                        findVariantName(id, coupon.productVariants, activeOrder?.lines),
                      )
                      .join(', ')}{' '}
                    <span className="text-text-tertiary">
                      (qty: {bxgyInfo.amountY}) -{' '}
                      {bxgyInfo.discountPercent === 100
                        ? 'FREE'
                        : `${bxgyInfo.discountPercent}% OFF`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Required Products (contains_products) */}
          {requiredProducts && (
            <div className="mb-3 p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-100 dark:border-amber-900/50">
              <div className="flex items-start gap-2">
                <ShoppingCart className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-text-secondary">
                  <span className="font-semibold text-amber-700 dark:text-amber-300">Required in cart: </span>
                  {requiredProducts.variantIds
                    .map((id) =>
                      findVariantName(id, coupon.productVariants, activeOrder?.lines),
                    )
                    .join(', ')}
                  {requiredProducts.minimum > 1 && (
                    <span className="text-text-tertiary">
                      {' '}
                      (min qty: {requiredProducts.minimum})
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* At least N with facets condition */}
          {atLeastNFacets && (
            <div className="mb-3 p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900/50">
              <div className="flex items-start gap-2">
                <ShoppingCart className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-text-secondary">
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    Add at least {atLeastNFacets.minimum} item{atLeastNFacets.minimum > 1 ? 's' : ''} from:{' '}
                  </span>
                  {(() => {
                    const facetNames = atLeastNFacets.facetIds
                      .map((fid) => {
                        const fv = coupon.facetValues?.find((f) => f.id === fid);
                        return fv ? fv.name : `#${fid}`;
                      })
                      .join(', ');
                    return <span className="font-medium">{facetNames}</span>;
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Customer group condition */}
          {customerGroupCond && coupon.customerGroup && (
            <div className="mb-3 p-2.5 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-100 dark:border-purple-900/50">
              <div className="flex items-start gap-2">
                <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-text-secondary">
                  <span className="font-semibold text-purple-700 dark:text-purple-300">
                    Exclusive for {coupon.customerGroup.name} members
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Facet-based discount - shows which categories get discount */}
          {facetDiscount && (
            <div className="mb-3 p-2.5 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-100 dark:border-orange-900/50">
              <div className="flex items-start gap-2">
                <Tag className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-text-secondary">
                  <span className="font-semibold text-orange-700 dark:text-orange-300">Discount on: </span>
                  {(() => {
                    const facetNames = facetDiscount.facetIds
                      .map((fid) => {
                        const fv = coupon.facetValues?.find((f) => f.id === fid);
                        return fv ? fv.name : `#${fid}`;
                      })
                      .join(', ');
                    return <span className="font-medium">{facetNames}</span>;
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Products percentage discount - shows which products get discount */}
          {productsDiscount && (
            <div className="mb-3 p-2.5 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-100 dark:border-teal-900/50">
              <div className="flex items-start gap-2">
                <Tag className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-text-secondary">
                  <span className="font-semibold text-teal-700 dark:text-teal-300">Discount on: </span>
                  {productsDiscount.variantIds
                    .map((id) =>
                      findVariantName(id, coupon.productVariants, activeOrder?.lines),
                    )
                    .join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* Free Products (non-condition, non-BXGY) */}
          {freeProducts.length > 0 && (
            <div className="mb-3 p-2.5 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-100 dark:border-green-900/50">
              <div className="flex items-start gap-2">
                <Gift className="w-3.5 h-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-text-secondary">
                  <span className="font-semibold text-green-700 dark:text-green-300">Free products: </span>
                  {freeProducts.map((v) => v.name).join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* Meta info: expiry, usage limit, per-customer usage, min order */}
          <div className="space-y-2 pt-3 border-t border-border-theme">
            {minOrder && (
              <div className="text-xs text-text-tertiary flex items-center gap-1.5">
                <ShoppingCart className="w-3 h-3" />
                <span>
                  Min order: {formatPrice(minOrder.amount)}
                  {(() => {
                    const compareAmount = minOrder.taxInclusive
                      ? effectiveSubtotal
                      : (activeOrder?.subTotal ?? 0);
                    const gap = minOrder.amount - compareAmount;
                    if (gap > 0) {
                      return (
                        <span className="text-amber-600 dark:text-amber-400 font-medium ml-1">
                          (Add {formatPrice(gap)} more)
                        </span>
                      );
                    }
                    return null;
                  })()}
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-tertiary">
              {coupon.endsAt && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    Expires: {new Date(coupon.endsAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {coupon.perCustomerUsageLimit != null && coupon.perCustomerUsageLimit > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>
                    {coupon.perCustomerUsageLimit === 1
                      ? 'One-time use'
                      : `${coupon.perCustomerUsageLimit} uses per customer`}
                  </span>
                </div>
              )}
              {coupon.usageLimit != null && coupon.usageLimit > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Total limit: {coupon.usageLimit} uses</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-surface border border-border-theme rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-theme bg-surface sticky top-0 z-10">
            <h2 className="text-2xl font-bold text-text-primary">Apply Coupons</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-hover rounded-full transition-colors duration-200"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-text-tertiary" />
            </button>
          </div>

          {/* Coupon List */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
            {qualifiedCoupons.length > 0 || eligibleCoupons.length > 0 ? (
              <div className="space-y-4">
                {/* Qualified coupons */}
                {qualifiedCoupons.map((coupon, index) =>
                  renderCouponCard(coupon, index),
                )}

                {/* Eligible coupons section */}
                {eligibleCoupons.length > 0 && (
                  <>
                    <div className="relative py-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-dashed border-border-theme" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-surface px-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                          Almost Eligible
                        </span>
                      </div>
                    </div>
                    {eligibleCoupons.map((coupon, index) =>
                      renderCouponCard(coupon, qualifiedCoupons.length + index),
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-surface-hover rounded-full flex items-center justify-center">
                  <Tag className="w-8 h-8 text-text-tertiary" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  No Coupons Available
                </h3>
                <p className="text-text-tertiary">
                  Check back later for exclusive offers and discounts!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastNotification
        key={errorState.key}
        show={errorState.show}
        type="error"
        title={errorState.title}
        message={errorState.message}
        onClose={closeErrorToast}
        autoDismiss={true}
        dismissDuration={4000}
      />
    </>
  );
}

export default CouponModal;
