'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { Price } from './Price';
import { CurrencyCode } from '@/generated/graphql';
import GlareHover from '@/components/ui/GlareHover';
import { SignInPromptModal } from '@/components/modal/SignInPromptModal';
import {
  trackAddToFavourites,
  trackRemoveFromFavourites,
} from '@/lib/fbpixel';

export interface ActiveCustomer {
  activeCustomer?: {
    id: string;
    favorites?: {
      items: Array<{ product: { id: string } }>;
    };
  } | null;
}

type VariantOption = {
  name: string;
  group?: {
    name: string;
  } | null;
};

export interface ProductCardProps {
  productAsset: any;
  hoverAsset?: { preview: string } | null;
  productName: string;
  description?: string;
  slug: string;
  priceWithTax: any;
  currencyCode: CurrencyCode;
  shadowPrice?: number | null;
  variants?: Array<{
    id: string;
    name: string;
    featuredAsset?: { preview: string };
    priceWithTax: any;
    currencyCode: CurrencyCode;
    stockLevel?: string;
    sku?: string;
    options?: VariantOption[];
    customFields?: {
      shadowPrice?: number | null;
    };
  }>;
  productId: string;
  activeCustomer?: ActiveCustomer;
  activeOrderFetcher?: any;
  activeOrder?: any;
  onFavoriteToggle?: (productId: string, isFavorited: boolean) => void;
  orderCount?: number;
  onShowSignInModal?: () => void;
}

const extractPriceValue = (price?: any): number | null => {
  if (price == null) return null;
  if (typeof price === 'number') return price;
  if (typeof price === 'object') {
    if ('value' in price && typeof price.value === 'number') return price.value;
    if ('min' in price && typeof price.min === 'number') return price.min;
  }
  return null;
};

export function ProductCard({
  productAsset,
  hoverAsset,
  productName,
  description,
  slug,
  priceWithTax,
  currencyCode,
  variants = [],
  productId,
  activeCustomer,
  onFavoriteToggle,
  onShowSignInModal,
}: ProductCardProps) {
  const isSignedIn = !!activeCustomer?.activeCustomer?.id;
  const initiallyFavorited = !!activeCustomer?.activeCustomer?.favorites?.items?.some(
    (f) => f.product.id === productId,
  );
  const [isFavorited, setIsFavorited] = useState(initiallyFavorited);
  const [isToggling, setIsToggling] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToggling) return;
    if (!isSignedIn) {
      // Let the parent handle it if it wants to; otherwise show our own prompt.
      if (onShowSignInModal) {
        onShowSignInModal();
      } else {
        setShowSignInPrompt(true);
      }
      return;
    }
    const next = !isFavorited;
    setIsFavorited(next);
    setIsToggling(true);
    try {
      const res = await fetch('/api/toggle-favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error('toggle failed');
      const data = await res.json();
      const stillFav = !!data?.items?.some(
        (item: { product: { id: string } }) => item.product.id === productId,
      );
      if (stillFav && !isFavorited) {
        trackAddToFavourites({ productId, productName });
      } else if (!stillFav && isFavorited) {
        trackRemoveFromFavourites({ productId, productName });
      }
      setIsFavorited(stillFav);
      onFavoriteToggle?.(productId, stillFav);
    } catch {
      setIsFavorited(!next);
    } finally {
      setIsToggling(false);
    }
  };

  // Strip any HTML tags from description (search API returns plain text, but just in case)
  const descriptionText = description
    ? description.replace(/<[^>]*>/g, '').trim()
    : '';
  // Starting-from price: prefer first variant, else product's priceWithTax
  const firstVariant = variants?.[0];
  const startingPrice = firstVariant?.priceWithTax ?? priceWithTax;
  const startingCurrency = firstVariant?.currencyCode ?? currencyCode;

  // Show "From" when there are multiple variants OR when the product price
  // is a PriceRange whose min differs from max (Vendure returns this for
  // products that have variant price differences — even without the variants
  // array being populated in the card).
  const priceMin =
    priceWithTax && typeof priceWithTax === 'object' && 'min' in priceWithTax
      ? (priceWithTax as any).min
      : null;
  const priceMax =
    priceWithTax && typeof priceWithTax === 'object' && 'max' in priceWithTax
      ? (priceWithTax as any).max
      : null;
  const isPriceRange =
    priceMin != null && priceMax != null && priceMin !== priceMax;
  const hasMultipleVariants = (variants?.length ?? 0) > 1 || isPriceRange;

  // Optional shadow/strike-through price from the first variant
  const currentPriceValue = extractPriceValue(startingPrice);
  const shadowPriceRaw = firstVariant?.customFields?.shadowPrice;
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

  return (
    <>
    <Link
      prefetch={false}
      href={`/products/${slug}`}
      className="group flex flex-col bg-surface rounded-xl overflow-hidden border border-header-accent/20 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
    >
      {/* Image — shown at its natural aspect ratio */}
      <GlareHover
        width="100%"
        height="auto"
        background="transparent"
        borderRadius="0"
        borderColor="transparent"
        borderWidth="0"
        glareColor="#ffffff"
        glareOpacity={0.35}
        glareAngle={-30}
        glareSize={250}
        transitionDuration={700}
        className="relative bg-background !block"
      >
        <img
          className={`w-full h-auto object-contain transition-all duration-500 ease-out group-hover:scale-[1.04] ${
            hoverAsset?.preview ? 'group-hover:opacity-0' : ''
          }`}
          alt={productName}
          src={
            productAsset?.preview ||
            firstVariant?.featuredAsset?.preview ||
            '/placeholder.svg'
          }
        />
        {hoverAsset?.preview ? (
          <img
            className="absolute inset-0 w-full h-full object-contain opacity-0 scale-[1.04] group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 ease-out"
            alt=""
            aria-hidden
            src={hoverAsset.preview}
          />
        ) : null}
        {discountPercent && discountPercent > 0 ? (
          <div className="absolute top-2 left-2 bg-red-500 text-white rounded-md px-2 py-1 text-xs font-bold shadow z-10">
            {discountPercent}% OFF
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleToggleFavorite}
          aria-pressed={isFavorited}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          disabled={isToggling}
          className={`absolute top-2 right-2 z-10 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center shadow-md ring-1 transition-all duration-200
            ${
              isFavorited
                ? 'bg-rose-500/95 ring-rose-300/50 hover:bg-rose-600'
                : 'bg-white/85 ring-black/5 hover:bg-white hover:scale-110'
            }
            ${isToggling ? 'opacity-70 cursor-wait' : 'active:scale-95'}
          `}
        >
          <Heart
            className={`w-[18px] h-[18px] transition-all duration-200 ${
              isFavorited
                ? 'fill-white text-white scale-110'
                : 'text-rose-500 group-hover:scale-110'
            }`}
            strokeWidth={2.25}
          />
        </button>
      </GlareHover>

      {/* Details */}
      <div className="flex flex-col gap-1 p-3 sm:p-4">
        <h3 className="text-sm text-text-primary font-semibold leading-snug line-clamp-2">
          {productName}
        </h3>
        {descriptionText ? (
          <p className="text-xs text-text-tertiary leading-snug line-clamp-2 mt-0.5">
            {descriptionText}
          </p>
        ) : null}

        <div className="mt-2 flex items-baseline gap-1.5">
          {hasMultipleVariants ? (
            <span className="text-xs text-text-tertiary font-medium">
              From
            </span>
          ) : null}
          <span className="text-base sm:text-lg font-bold text-header-accent">
            <Price
              priceWithTax={
                startingPrice && typeof startingPrice === 'object' && 'min' in startingPrice
                  ? startingPrice.min
                  : startingPrice
              }
              currencyCode={startingCurrency}
            />
          </span>
          {shouldShowShadowPrice ? (
            <span className="text-xs text-text-tertiary line-through ml-1">
              <Price
                priceWithTax={shadowPriceValue ?? 0}
                currencyCode={startingCurrency}
              />
            </span>
          ) : null}
        </div>
      </div>
    </Link>

    <SignInPromptModal
      isOpen={showSignInPrompt}
      close={() => setShowSignInPrompt(false)}
      title="Sign In Required"
      message="Please sign in to add items to your favorites."
    />
    </>
  );
}
