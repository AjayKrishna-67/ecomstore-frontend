'use client';

import { useState } from 'react';
import { ProductCard } from '@/components/products/ProductCard';
import { useActiveOrder } from '@/hooks/use-active-order';

interface FavoritesClientProps {
  favorites: any[];
  activeCustomer: any;
}

export function FavoritesClient({ favorites: initialFavorites, activeCustomer }: FavoritesClientProps) {
  const { activeOrder } = useActiveOrder();
  const [favorites, setFavorites] = useState(initialFavorites);

  const handleFavoriteToggle = (productId: string, isFavorited: boolean) => {
    if (!isFavorited) {
      setFavorites((prev) => prev.filter((fav) => fav.product?.id !== productId));
    }
  };

  if (favorites.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-text-tertiary mb-4">
          You haven&apos;t added any favorites yet.
        </p>
        <a href="/" className="text-spice hover:text-spice-gold font-semibold">
          Start browsing products
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 mob:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-y-6 gap-x-3 sm:gap-x-4 md:gap-x-5 md:gap-y-8">
      {favorites.map((fav: any) => {
        const product = fav.product;
        if (!product) return null;

        return (
          <ProductCard
            key={fav.id}
            productId={product.id}
            productName={product.name}
            slug={product.slug}
            priceWithTax={product.variants?.[0]?.priceWithTax}
            currencyCode={product.variants?.[0]?.currencyCode}
            productAsset={product.featuredAsset || null}
            variants={product.variants || []}
            activeCustomer={activeCustomer}
            activeOrder={activeOrder}
            onFavoriteToggle={handleFavoriteToggle}
          />
        );
      })}
    </div>
  );
}
