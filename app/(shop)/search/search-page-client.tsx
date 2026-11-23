'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiltersButton } from '@/components/FiltersButton';
import { FilterableProductGrid } from '@/components/products/FilterableProductGrid';
import { useActiveOrder } from '@/hooks/use-active-order';
import { trackSearch } from '@/lib/fbpixel';

interface SearchPageClientProps {
  term: string;
  searchResult: any;
  resultWithoutFacetValueFilters: any;
  currentPage: number;
  limit: number;
  activeFacetValueIds: string[];
  activeCustomer?: any;
  isSignedIn: boolean;
}

export function SearchPageClient({
  term,
  searchResult,
  resultWithoutFacetValueFilters,
  currentPage,
  limit,
  activeFacetValueIds,
  activeCustomer,
  isSignedIn,
}: SearchPageClientProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { activeOrder } = useActiveOrder();

  const totalItems = searchResult?.totalItems ?? 0;

  useEffect(() => {
    if (term) trackSearch(term, totalItems);
  }, [term, totalItems]);

  return (
    <div className="max-w-5xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header band */}
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-text-tertiary hover:text-text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <span className="hidden sm:inline h-5 w-px bg-border-strong/40" aria-hidden />
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          {term ? (
            <>
              Search results for{' '}
              <span className="text-header-accent">&ldquo;{term}&rdquo;</span>
            </>
          ) : (
            'All Products'
          )}
        </h1>
        {totalItems > 0 ? (
          <span className="ml-auto inline-flex items-center rounded-full bg-header-accent/10 text-header-accent text-xs font-medium px-2.5 py-1">
            {totalItems} {totalItems === 1 ? 'product' : 'products'}
          </span>
        ) : null}
      </div>

      {/* Divider */}
      <div className="mb-6 h-px bg-gradient-to-r from-transparent via-header-accent/30 to-transparent" />

      {/* Mobile filters trigger */}
      <div className="flex items-center justify-between mb-4 lg:hidden">
        <span className="text-sm text-text-tertiary">
          {totalItems} {totalItems === 1 ? 'result' : 'results'}
        </span>
        <FiltersButton
          filterCount={activeFacetValueIds.length}
          onClick={() => setMobileFiltersOpen(true)}
        />
      </div>

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
    </div>
  );
}
