'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveOrder } from '@/hooks/use-active-order';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Price } from '@/components/products/Price';
import { StockLevelLabel } from '@/components/products/StockLevelLabel';
import { ProductImageGallery } from '@/components/products/ProductImageGallery';
import { RecentOrders } from '@/components/products/RecentOrders';
import { AddonSelector, AddonGroupSelection } from '@/components/products/AddonSelector';
import { SignInPromptModal } from '@/components/modal/SignInPromptModal';
import { revalidateActiveOrder } from '@/hooks/use-active-order';
import Alert from '@/components/Alert';
import {
  CheckIcon,
  HeartIcon as HeartSolidIcon,
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import {
  trackViewContent,
  trackAddToFavourites,
  trackRemoveFromFavourites,
} from '@/lib/fbpixel';
import { getAddItemToOrderError, shortenStockReason } from '@/lib/cart-errors';

interface ProductPageClientProps {
  product: any;
  isSignedIn: boolean;
  isFavorite: boolean;
  activeCustomer: any;
  frequentlyOrdered: any[];
}

export function ProductPageClient({
  product,
  isSignedIn: initialIsSignedIn,
  isFavorite: initialIsFavorite,
  activeCustomer,
  frequentlyOrdered,
}: ProductPageClientProps) {
  const { activeOrder, addItemToOrder, adjustOrderLine, removeItem, error } =
    useActiveOrder();
  const { t } = useTranslation();
  const router = useRouter();

  const [isSignedIn] = useState(initialIsSignedIn);
  const [isFavorited, setIsFavorited] = useState(initialIsFavorite);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [visibleError, setVisibleError] = useState<string | null>(null);
  const [pendingAddons, setPendingAddons] = useState<AddonGroupSelection[]>([]);
  const [addonValidity, setAddonValidity] = useState<{ hasGroups: boolean }>({
    hasGroups: false,
  });
  // Bumped after every successful add-to-cart so the AddonSelector clears its
  // internal checkbox state. Without this, the previously-picked addons stay
  // checked and a follow-up "Add another to cart" silently re-sends the same
  // selections — the backend then merges into the existing line (qty++)
  // instead of creating the new line the user expects.
  const [addonResetToken, setAddonResetToken] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Product description: clamp to 3 lines by default; reveal the rest behind a
  // toggle. Only show the toggle when the rendered HTML actually overflows the
  // clamp. Measurement runs after layout (rAF) and again on resize, since
  // dangerouslySetInnerHTML can settle one frame later than the effect fires.
  const [descExpanded, setDescExpanded] = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    if (descExpanded) {
      setDescOverflows(false);
      return;
    }
    const measure = () => {
      if (!descRef.current) return;
      setDescOverflows(
        descRef.current.scrollHeight > descRef.current.clientHeight,
      );
    };
    const raf = requestAnimationFrame(measure);
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [product?.description, descExpanded]);

  // `product` (and its stockLevel) is server-rendered and static on the
  // client. When the cart changes, re-run the server component so the
  // stock level reflects the new state without a manual page refresh.
  useEffect(() => {
    trackViewContent(product);
  }, [product?.id]);

  const prevTotalQtyRef = useRef<number | null>(null);
  useEffect(() => {
    const totalQty = activeOrder?.totalQuantity ?? 0;
    if (prevTotalQtyRef.current === null) {
      prevTotalQtyRef.current = totalQty;
      return;
    }
    if (prevTotalQtyRef.current !== totalQty) {
      prevTotalQtyRef.current = totalQty;
      router.refresh();
    }
  }, [activeOrder?.totalQuantity, router]);

  // Surface cart business-logic errors raised by add-to-cart / quantity
  // changes. getAddItemToOrderError whitelists the codes worth showing
  // (OrderInterceptorError, OrderModificationError, OrderLimitError,
  // NegativeQuantityError, InsufficientStockError) and pulls the
  // interceptorError field for plugin messages.
  useEffect(() => {
    const errorMsg = getAddItemToOrderError(error);
    if (errorMsg) {
      setVisibleError(errorMsg);
      const timer = setTimeout(() => setVisibleError(null), 5000);
      return () => clearTimeout(timer);
    } else {
      setVisibleError(null);
    }
  }, [error]);

  // Extract option groups from product variants using group.name as key
  const optionGroups = (() => {
    const groupMap = new Map<string, { id: string; name: string; options: Map<string, { id: string; name: string }> }>();
    for (const variant of product.variants) {
      for (const opt of (variant.options ?? []) as any[]) {
        const groupName = opt.group?.name || '';
        if (!groupName) continue;
        if (!groupMap.has(groupName)) {
          groupMap.set(groupName, { id: groupName, name: groupName, options: new Map() });
        }
        const optKey = opt.name || '';
        if (!groupMap.get(groupName)!.options.has(optKey)) {
          groupMap.get(groupName)!.options.set(optKey, { id: optKey, name: opt.name });
        }
      }
    }
    return Array.from(groupMap.values()).map((g) => ({
      ...g,
      options: Array.from(g.options.values()),
    }));
  })();

  const hasMultipleOptions = optionGroups.length > 0 && (optionGroups.length > 1 || optionGroups[0].options.length > 1);

  // Pre-select the first variant's options
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    const firstVariant = product.variants[0];
    if (firstVariant?.options) {
      for (const opt of firstVariant.options) {
        const groupName = opt.group?.name || '';
        if (groupName) initial[groupName] = opt.name;
      }
    }
    return initial;
  });

  // Get variants matching partial selections
  const getFilteredVariants = (selections: Record<string, string>) => {
    return product.variants.filter((v: any) => {
      const vOpts = v.options ?? [];
      return Object.entries(selections).every(([groupName, optName]) => {
        return vOpts.some((o: any) => (o.group?.name || '') === groupName && o.name === optName);
      });
    });
  };

  // Get available options for a group given other group selections
  const getAvailableOptionsForGroup = (groupName: string) => {
    const otherSelections = { ...selectedOptions };
    delete otherSelections[groupName];
    const filtered = getFilteredVariants(otherSelections);
    const availableOpts = new Set<string>();
    for (const v of filtered) {
      for (const o of (v.options ?? []) as any[]) {
        if ((o.group?.name || '') === groupName) {
          availableOpts.add(o.name);
        }
      }
    }
    return availableOpts;
  };

  const findMatchingVariant = (selections: Record<string, string>) => {
    if (Object.keys(selections).length < optionGroups.length) return null;
    return getFilteredVariants(selections)[0] || null;
  };

  const selectedVariant = hasMultipleOptions
    ? findMatchingVariant(selectedOptions)
    : product.variants[0] || null;

  const selectedVariantId = selectedVariant?.id || null;

  const handleOptionSelect = (groupName: string, optionName: string) => {
    // Start with the new selection only; keep other-group selections only if
    // they're still compatible. Otherwise drop them so the user can re-pick
    // without having to refresh the page.
    const newSelections: Record<string, string> = { [groupName]: optionName };
    for (const [otherGroup, otherOption] of Object.entries(selectedOptions)) {
      if (otherGroup === groupName) continue;
      const probe = { ...newSelections, [otherGroup]: otherOption };
      if (getFilteredVariants(probe).length > 0) {
        newSelections[otherGroup] = otherOption;
      }
    }
    setSelectedOptions(newSelections);
    const match = findMatchingVariant(newSelections);
    if (match?.featuredAsset) {
      setFeaturedAsset(match.featuredAsset);
    }
  };

  const extractPriceValue = (price?: any): number | null => {
    if (price == null) return null;
    if (typeof price === 'number') return price;
    if (typeof price === 'object') {
      if ('value' in price && typeof price.value === 'number')
        return price.value;
      if ('min' in price && typeof price.min === 'number') return price.min;
    }
    return null;
  };

  const currentPriceValue = extractPriceValue(selectedVariant?.priceWithTax);
  const shadowPriceRaw = selectedVariant?.customFields?.shadowPrice;
  const shadowPriceValue =
    typeof shadowPriceRaw === 'number'
      ? shadowPriceRaw * 100
      : extractPriceValue(shadowPriceRaw);
  const shouldShowShadowPrice =
    shadowPriceValue != null &&
    currentPriceValue != null &&
    shadowPriceValue > currentPriceValue;

  const discountPercent =
    shouldShowShadowPrice && shadowPriceValue && currentPriceValue
      ? Math.round(
          ((shadowPriceValue - currentPriceValue) / shadowPriceValue) * 100,
        )
      : null;

  const qtyInCart =
    activeOrder?.lines.find(
      (l: any) => l.productVariant.id === selectedVariantId,
    )?.quantity ?? 0;

  const orderLine = activeOrder?.lines.find(
    (l: any) => l.productVariant.id === selectedVariantId,
  );

  // Backend-produced per-line quantity-limit reason for this variant's cart
  // line, if any. Mirrors the cart's per-line display (CartContents.tsx:179).
  const quantityViolation =
    (activeOrder?.quantityLimitStatus?.violations ?? []).find(
      (v: any) => v.orderLineId === orderLine?.id,
    ) ?? null;

  // Whether *this* variant's cart line is what blocks checkout, plus the
  // reason and item name to surface. Mirrors the cart drawer's per-line
  // validation (CartTray.tsx) so a shopper who taps the affected item in the
  // cart error sees the same "decrease/remove this item" guidance here.
  const variantBlock = (() => {
    if (!orderLine) return null;
    const validation = (activeOrder as any)?.validationStatus;
    const unavailableEntry = (validation?.unavailableItems ?? []).find(
      (i: any) => i?.orderLineId === orderLine.id,
    );
    const lineUnavailable = (orderLine as any).isAvailable === false;
    const lineUnavailableReason = (orderLine as any).unavailableReason as
      | string
      | null
      | undefined;
    const isOutOfStock = selectedVariant?.stockLevel === 'OUT_OF_STOCK';

    // Aggregate this variant's quantity across all cart lines and compare
    // against its effective limit (the lower of the maxOrderQuantity custom
    // field and a numeric stockLevel). Catches the same total-exceeds-limit
    // case the cart drawer does.
    const max = selectedVariant?.customFields?.maxOrderQuantity;
    const stockRaw = selectedVariant?.stockLevel;
    const stockNumeric =
      typeof stockRaw === 'string' && /^\d+$/.test(stockRaw)
        ? Number(stockRaw)
        : stockRaw === 'OUT_OF_STOCK'
          ? 0
          : null;
    const limitCandidates = [
      typeof max === 'number' ? max : null,
      stockNumeric,
    ].filter((n): n is number => typeof n === 'number');
    const effectiveLimit = limitCandidates.length
      ? Math.min(...limitCandidates)
      : null;
    const totalQtyForVariant = (activeOrder?.lines ?? [])
      .filter((l: any) => l.productVariant?.id === selectedVariantId)
      .reduce((sum: number, l: any) => sum + l.quantity, 0);
    const overflow =
      effectiveLimit !== null && totalQtyForVariant > effectiveLimit;

    if (
      !unavailableEntry &&
      !lineUnavailable &&
      !(isOutOfStock && qtyInCart > 0) &&
      !overflow &&
      !quantityViolation
    ) {
      return null;
    }

    const message =
      lineUnavailable && lineUnavailableReason
        ? shortenStockReason(lineUnavailableReason)
        : quantityViolation?.reason
          ? quantityViolation.reason
          : overflow && effectiveLimit !== null
            ? `Only ${effectiveLimit} allowed per order — ${totalQtyForVariant} in your cart. Please decrease the quantity to proceed to checkout.`
            : isOutOfStock
              ? 'This item is out of stock. Please remove it from your cart to proceed to checkout.'
              : 'Please decrease the quantity of this item or remove it from your cart to proceed to checkout.';
    const itemName =
      unavailableEntry?.variantName ||
      selectedVariant?.name ||
      product.name;
    return { message, itemName };
  })();

  const [featuredAsset, setFeaturedAsset] = useState(
    selectedVariant?.featuredAsset,
  );


  const handleToggleFavorite = async () => {
    if (!isSignedIn) {
      setModalMessage('SignIn To Add Favorite');
      setShowSignInModal(true);
      return;
    }
    try {
      const response = await fetch('/api/toggle-favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!response.ok) throw new Error('Failed to toggle favorite');
      const data = await response.json();
      const updatedFavorites = data.items;
      const isNowFavorite = updatedFavorites.some(
        (item: { product: { id: string } }) => item.product.id === product.id,
      );
      if (isNowFavorite && !isFavorited) {
        trackAddToFavourites({
          productId: product.id,
          productName: product.name,
          value:
            typeof product.variants?.[0]?.priceWithTax === 'number'
              ? product.variants[0].priceWithTax / 100
              : 0,
        });
      } else if (!isNowFavorite && isFavorited) {
        trackRemoveFromFavourites({
          productId: product.id,
          productName: product.name,
        });
      }
      setIsFavorited(isNowFavorite);
    } catch (error) {
      console.error('Favorite error:', error);
      alert(t('product.favoriteError'));
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariantId || isAddingToCart) return;
    setIsAddingToCart(true);
    try {
      if (pendingAddons.length === 0) {
        // No addons — let the existing hook handle tracking + SWR refresh.
        await addItemToOrder(selectedVariantId, 1);
        return;
      }
      // With addons: bypass the hook (its addItemToOrder is fire-and-forget,
      // which races with the follow-up addon mutation). Send add + addons in a
      // single round-trip so the server can attach them to the freshly-added
      // line atomically, then revalidate SWR.
      const fd = new FormData();
      fd.append('action', 'addItemToOrder');
      fd.append('variantId', selectedVariantId);
      fd.append('quantity', '1');
      fd.append('selections', JSON.stringify(pendingAddons));
      const res = await fetch('/api/active-order', { method: 'POST', body: fd });
      let serverError: string | null = null;
      if (!res.ok) {
        serverError = `Failed to add to cart (HTTP ${res.status})`;
        console.error('addItemToOrder + addons failed: HTTP', res.status);
      } else {
        const data = await res.json().catch(() => null);
        if (data?.error) {
          // Route through getAddItemToOrderError so OrderInterceptorError's
          // interceptorError (the real reason) is preferred over the generic
          // ErrorResult.message ("An error occurred when attempting to modify
          // the Order").
          serverError = getAddItemToOrderError(data.error) ?? data.error.message ?? null;
          console.error('addItemToOrder + addons returned error:', data.error);
        }
      }
      await revalidateActiveOrder();
      if (serverError) {
        setVisibleError(serverError);
        setTimeout(() => setVisibleError(null), 6000);
      } else {
        setPendingAddons([]);
        setAddonResetToken((t) => t + 1);
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAdjustQty = async (orderLineId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(orderLineId);
    } else {
      await adjustOrderLine(orderLineId, quantity);
    }
  };

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 py-2 min-h-screen sm:py-6">
        <Breadcrumbs
          items={
            product.collections[product.collections.length - 1]?.breadcrumbs ??
            []
          }
        />
        <div className="mt-6 sm:mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Image Gallery */}
            <div className="lg:col-span-7">
              <ProductImageGallery
                assets={product.assets}
                activeAssetId={featuredAsset?.id ?? null}
                onSelect={(a) => setFeaturedAsset(a)}
                productName={product.name}
              />
            </div>

            {/* Product Info Section */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 w-full bg-surface p-6 sm:p-7 rounded-2xl shadow-md border border-header-accent/20 flex flex-col">
              <div className="flex-1">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary leading-tight">
                    {product.name}
                  </h1>
                  <button
                    type="button"
                    className="flex-shrink-0 p-2.5 rounded-full border border-header-accent/30 hover:bg-header-accent/10 transition-colors"
                    onClick={handleToggleFavorite}
                    title={
                      isFavorited
                        ? t('product.removeFavorite')
                        : t('product.addFavorite')
                    }
                  >
                    {isFavorited ? (
                      <HeartSolidIcon className="w-5 h-5 text-red-500" />
                    ) : (
                      <HeartOutlineIcon className="w-5 h-5 text-text-tertiary" />
                    )}
                  </button>
                </div>
                {/* Description is rendered lower down, just above the
                    Add-to-Cart button, with a 3-line clamp + Show more
                    toggle. */}
              </div>

              <div className="mt-2 pt-5 border-t border-header-accent/20">
                <div className="mb-5">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-3xl sm:text-[2rem] font-bold text-header-accent leading-none">
                      <Price
                        priceWithTax={selectedVariant?.priceWithTax}
                        currencyCode={selectedVariant?.currencyCode}
                      />
                    </span>
                    {shouldShowShadowPrice ? (
                      <span className="text-base text-text-tertiary line-through">
                        <Price
                          priceWithTax={shadowPriceValue ?? 0}
                          currencyCode={selectedVariant?.currencyCode}
                        />
                      </span>
                    ) : null}
                    {discountPercent && discountPercent > 0 ? (
                      <span className="text-[11px] font-bold text-green-700 bg-green-100 dark:bg-green-950/40 dark:text-green-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {discountPercent}% OFF
                      </span>
                    ) : null}
                  </div>
                  {shouldShowShadowPrice ? (
                    <p className="text-xs text-text-tertiary mt-1.5">
                      Inclusive of all taxes
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-5 border-b border-header-accent/15 text-sm text-text-secondary">
                  <span className="font-medium">
                    SKU:{' '}
                    <span className="font-normal text-text-tertiary">
                      {selectedVariant?.sku}
                    </span>
                  </span>
                  <StockLevelLabel stockLevel={selectedVariant?.stockLevel} />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    {hasMultipleOptions ? (
                      <div className="mb-6 space-y-4">
                        {optionGroups.map((group, groupIdx) => {
                          const availableOpts = getAvailableOptionsForGroup(group.name);
                          const isParentGroup = groupIdx === 0;
                          return (
                            <div key={group.id}>
                              <label className="block text-sm font-semibold text-text-secondary mb-2 capitalize">
                                {group.name}
                                {selectedOptions[group.name] && (
                                  <span className="ml-2 text-xs font-normal text-text-tertiary capitalize">
                                    — {selectedOptions[group.name]}
                                  </span>
                                )}
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {group.options.map((option) => {
                                  const isSelected = selectedOptions[group.name] === option.name;
                                  const available = availableOpts.has(option.name);
                                  // Parent group: every option clickable and
                                  // looks normal — picking it will drop the
                                  // conflicting child selection.
                                  // Child group: unavailable options shown but
                                  // disabled + strikethrough.
                                  const disabled = !isParentGroup && !isSelected && !available;
                                  const looksDisabled = !isParentGroup && !available;
                                  return (
                                    <button
                                      key={option.id}
                                      type="button"
                                      onClick={() => handleOptionSelect(group.name, option.name)}
                                      disabled={disabled}
                                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 capitalize ${
                                        isSelected
                                          ? 'bg-btn-primary text-btn-primary-text border-btn-primary shadow-sm'
                                          : looksDisabled
                                            ? 'bg-surface-hover text-text-muted border-border-theme line-through opacity-50 cursor-not-allowed'
                                            : 'bg-surface text-text-primary border-border-theme hover:border-btn-primary'
                                      }`}
                                    >
                                      {option.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    <AddonSelector
                      productVariantId={selectedVariantId}
                      currencyCode={selectedVariant?.currencyCode}
                      resetKey={`${selectedVariantId}:${addonResetToken}`}
                      onChange={setPendingAddons}
                      onValidityChange={setAddonValidity}
                    />

                    {visibleError && (
                      <div className="mb-4">
                        <Alert message={visibleError} />
                      </div>
                    )}

                    {variantBlock && (
                      <div className="mt-1 mb-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3">
                        <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                          {variantBlock.itemName}
                        </p>
                        <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                          {variantBlock.message}
                        </p>
                      </div>
                    )}

                    {product.description ? (
                      (() => {
                        // Fallback heuristic: ~120 chars of plain text roughly
                        // exceeds 3 lines at the typical product-card width.
                        // Belt-and-braces with the DOM measurement so the
                        // toggle still appears if the rAF measurement misses.
                        const plainLen = product.description
                          .replace(/<[^>]*>/g, '')
                          .trim().length;
                        const showToggle =
                          descExpanded || descOverflows || plainLen > 120;
                        return (
                          <div className="mb-4">
                            <div
                              ref={descRef}
                              className={`text-sm text-text-secondary leading-relaxed prose prose-sm max-w-none ${
                                descExpanded ? '' : 'line-clamp-3'
                              }`}
                              dangerouslySetInnerHTML={{ __html: product.description }}
                            />
                            {showToggle && (
                              <button
                                type="button"
                                onClick={() => setDescExpanded((v) => !v)}
                                className="mt-1 text-xs font-medium text-header-accent hover:underline"
                              >
                                {descExpanded ? 'Show less' : 'Show more'}
                              </button>
                            )}
                          </div>
                        );
                      })()
                    ) : null}

                    {/* Add-to-Cart or Stepper UI.
                        Products with addon groups always show the Add-to-Cart
                        button so each click can create a fresh line with the
                        currently-selected addons. The +/- stepper would just
                        bump quantity on whichever existing line we picked,
                        silently throwing away the user's new addon picks. */}
                    {qtyInCart === 0 || addonValidity.hasGroups ? (
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isAddingToCart}
                        className="w-full bg-btn-primary hover:bg-btn-primary-hover text-btn-primary-text py-3.5 px-6 rounded-full text-base font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isAddingToCart
                          ? 'Adding…'
                          : qtyInCart > 0 && addonValidity.hasGroups
                            ? 'Add another to cart'
                            : t('product.addToCart')}
                      </button>
                    ) : (
                      <div className="flex items-center justify-between w-full gap-3 p-1.5 rounded-full border-2 border-header-accent/40 bg-header-accent/5">
                        <button
                          type="button"
                          onClick={() =>
                            orderLine &&
                            handleAdjustQty(
                              orderLine.id,
                              Math.max(0, qtyInCart - 1),
                            )
                          }
                          className="w-11 h-11 rounded-full bg-surface border border-header-accent/30 text-header-accent text-xl font-semibold hover:bg-header-accent hover:text-white transition-colors"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="flex-1 text-center text-base font-semibold text-text-primary">
                          {qtyInCart}{' '}
                          <span className="text-text-tertiary text-sm font-normal">
                            in cart
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            orderLine &&
                            handleAdjustQty(orderLine.id, qtyInCart + 1)
                          }
                          className="w-11 h-11 rounded-full bg-surface border border-header-accent/30 text-header-accent text-xl font-semibold hover:bg-header-accent hover:text-white transition-colors"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Ordered */}
      {/* <RecentOrders
        products={frequentlyOrdered}
        activeCustomer={activeCustomer}
        activeOrder={activeOrder}
      /> */}

      <SignInPromptModal
        isOpen={showSignInModal}
        close={() => setShowSignInModal(false)}
        message={modalMessage}
        title="Sign In Required"
      />
    </div>
  );
}
