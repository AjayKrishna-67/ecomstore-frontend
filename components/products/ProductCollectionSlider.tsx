'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CurrencyCode } from '@/generated/graphql';
import { ProductCard } from './ProductCard';

interface ProductCollectionSliderProps {
  collection?: {
    id: string;
    name: string;
    slug: string;
    featuredAsset?: { preview: string } | null;
    products: {
      id: string;
      name: string;
      slug: string;
      featuredAsset?: { preview: string } | null;
      variants: {
        id: string;
        name: string;
        priceWithTax: number;
        currencyCode: CurrencyCode;
        stockLevel: string;
        sku: string;
      }[];
    }[];
  };
  activeOrder: any;
  isSignedIn: boolean;
  collectionSlug?: string;
  backgroundColor?: string;
  bannerUrl?: string;
}

export function ProductCollectionSlider({
  collection,
  activeOrder,
  backgroundColor,
  bannerUrl,
}: ProductCollectionSliderProps) {
  const [currentCollection, setCurrentCollection] = useState<
    ProductCollectionSliderProps['collection']
  >(collection);

  useEffect(() => {
    setCurrentCollection(collection);
  }, [collection]);

  if (!currentCollection || currentCollection.products.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      {bannerUrl && (
        <img
          src={bannerUrl}
          alt="Banner"
          className="rounded-xl object-cover w-full h-64 sm:h-80 md:h-96"
        />
      )}
<div
  className={`-top-8 relative z-10 ${backgroundColor} p-2 rounded-xl flex flex-col`}
>
  <div className="overflow-x-auto shadow-inner scrollbar-none snap-x snap-mandatory px-3 sm:px-4 pb-12">
    <div className="inline-flex gap-3 sm:gap-4 md:gap-6">
      {currentCollection.products.flatMap((product) =>
        product.variants.map((variant) => (
          <div
            key={variant.id}
            className="w-36 sm:w-[180px] md:w-[200px] flex-shrink-0 snap-center"
          >
            <ProductCard
              productId={product.id}
              productName={variant.name} // only variant name
              slug={product.slug}
              currencyCode={variant.currencyCode}
              priceWithTax={variant.priceWithTax}
              productAsset={product.featuredAsset || null}
              variants={[variant]}
              activeOrder={activeOrder}
            />
          </div>
        )),
      )}
    </div>
  </div>

  {/* Fixed View More button */}
  <div className="absolute bottom-3 right-3">
    <Link href={`/collections/${currentCollection.slug}`}>
      <button className="p-[3px] relative">
        <div className="absolute inset-0 bg-brand-red rounded-xl" />
        <div className="px-4 py-1 bg-black rounded-[10px] relative group transition duration-200 text-white hover:bg-transparent">
          View More Products{' '}
          <span aria-hidden="true" className="text-lg">
            →
          </span>
        </div>
      </button>
    </Link>
  </div>
</div>


    </div>
  );
}
