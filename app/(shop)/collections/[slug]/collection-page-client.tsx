'use client';

import { useState } from 'react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FiltersButton } from '@/components/FiltersButton';
import { FilterableProductGrid } from '@/components/products/FilterableProductGrid';
import { CollectionCard } from '@/components/collections/CollectionCard';
import { useActiveOrder } from '@/hooks/use-active-order';

interface CollectionPageClientProps {
  collection: any;
  searchResult: any;
  resultWithoutFacetValueFilters: any;
  currentPage: number;
  limit: number;
  term: string;
  activeFacetValueIds: string[];
  activeCustomer?: any;
  isSignedIn: boolean;
}

export function CollectionPageClient({
  collection,
  searchResult,
  resultWithoutFacetValueFilters,
  currentPage,
  limit,
  term,
  activeFacetValueIds,
  activeCustomer,
  isSignedIn,
}: CollectionPageClientProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { activeOrder } = useActiveOrder();

  const breadcrumbs = collection.breadcrumbs?.map((b: any) => ({
    name: b.name,
    slug: b.slug,
  })) ?? [];

  const hasChildren = (collection.children?.length ?? 0) > 0;
  const hasProducts = (searchResult?.items?.length ?? 0) > 0;
  const showProductGrid = hasProducts || !hasChildren;

  return (
    <div className="max-w-5xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs items={breadcrumbs} />

      <div className="flex justify-between items-center mb-3 mt-3">
        <h1 className="text-3xl font-bold text-foreground">
          {collection.name}
        </h1>
        <FiltersButton
          filterCount={activeFacetValueIds.length}
          onClick={() => setMobileFiltersOpen(true)}
        />
      </div>

      {hasChildren && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-amber-300/60 to-transparent" />
            <h2 className="text-lg font-semibold text-secondary uppercase tracking-widest">
              Explore Categories
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-amber-300/60 to-transparent" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {collection.children.map((child: any) => (
              <CollectionCard key={child.id} collection={child} />
            ))}
          </div>
        </div>
      )}

      {showProductGrid && (
        <FilterableProductGrid
          result={searchResult}
          resultWithoutFacetValueFilters={resultWithoutFacetValueFilters}
          facetValueIds={activeFacetValueIds}
          appliedPaginationPage={currentPage}
          appliedPaginationLimit={limit}
          allowedPaginationLimits={new Set([20, 40, 60])}
          mobileFiltersOpen={mobileFiltersOpen}
          setMobileFiltersOpen={setMobileFiltersOpen}
          activeCustomer={activeCustomer}
          activeOrder={activeOrder}
          isSignedIn={isSignedIn}
        />
      )}
    </div>
  );
}
