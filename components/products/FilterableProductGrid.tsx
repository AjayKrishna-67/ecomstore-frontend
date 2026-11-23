'use client';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FacetFilterControls from '@/components/facet-filter/FacetFilterControls';
import { ProductCard, ActiveCustomer } from '@/components/products/ProductCard';
import {
  translatePaginationFrom,
  translatePaginationTo,
} from '@/lib/pagination';
import { Pagination } from '@/components/Pagination';
import { NoResultsHint } from '@/components/products/NoResultsHint';
import { FacetFilterTracker } from '@/components/facet-filter/facet-filter-tracker';

export interface FilterableProductGridProps {
  result: any;
  resultWithoutFacetValueFilters: any;
  facetValueIds: string[];
  appliedPaginationPage: number;
  appliedPaginationLimit: number;
  allowedPaginationLimits: Set<number>;
  mobileFiltersOpen: boolean;
  setMobileFiltersOpen: (arg0: boolean) => void;
  activeCustomer?: ActiveCustomer;
  activeOrder?: any;
  isSignedIn: boolean;
}

export function FilterableProductGrid({
  result,
  resultWithoutFacetValueFilters,
  facetValueIds,
  appliedPaginationPage,
  appliedPaginationLimit,
  allowedPaginationLimits,
  mobileFiltersOpen,
  setMobileFiltersOpen,
  activeCustomer,
  activeOrder,
  isSignedIn,
}: FilterableProductGridProps) {
  const { t } = useTranslation();
  const facetValuesTracker = useRef(new FacetFilterTracker());
  facetValuesTracker.current.update(
    result,
    resultWithoutFacetValueFilters,
    facetValueIds,
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
      <div className="md:col-span-1">
        <FacetFilterControls
          facetFilterTracker={facetValuesTracker.current}
          mobileFiltersOpen={mobileFiltersOpen}
          setMobileFiltersOpen={setMobileFiltersOpen}
        />
      </div>
      {result.items.length > 0 ? (
        <div className="md:col-span-3 lg:col-span-4 space-y-6">
          <div className="grid grid-cols-2 mob:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-y-6 gap-x-3 sm:gap-x-4 md:gap-x-5 md:gap-y-8">
            {result.items.map((item: any) => (
              <ProductCard
                key={item.productId}
                productName={item.productName}
                description={(item as any).description}
                slug={item.slug}
                currencyCode={item.currencyCode}
                priceWithTax={item.priceWithTax}
                productAsset={
                  item.productAsset?.preview
                    ? { preview: item.productAsset.preview }
                    : null
                }
                hoverAsset={(() => {
                  const assets = (item as any).assets as
                    | Array<{ id: string; preview: string }>
                    | undefined;
                  if (!assets || assets.length < 2) return null;
                  // Pick the first asset that isn't the main product asset
                  const second =
                    assets.find((a) => a.id !== item.productAsset?.id) ||
                    assets[1];
                  return second ? { preview: second.preview } : null;
                })()}
                variants={(item.variants ?? []).map((variant: any) => ({
                  ...variant,
                  featuredAsset: variant.featuredAsset?.preview
                    ? { preview: variant.featuredAsset.preview }
                    : undefined,
                }))}
                productId={item.productId}
                activeCustomer={activeCustomer}
                activeOrder={activeOrder}
              />
            ))}
          </div>
          <div className="flex flex-row justify-between items-center gap-4">
            <span className="self-start text-gray-500 text-sm mt-2">
              {t('product.showing')}{' '}
              {translatePaginationFrom(
                appliedPaginationPage,
                appliedPaginationLimit,
                result.totalItems,
              )}{' '}
              {t('product.to')}{' '}
              {translatePaginationTo(
                appliedPaginationPage,
                appliedPaginationLimit,
                result.totalItems,
              )}
            </span>
            <Pagination
              appliedPaginationLimit={appliedPaginationLimit}
              allowedPaginationLimits={allowedPaginationLimits}
              totalItems={result.totalItems}
              appliedPaginationPage={appliedPaginationPage}
            />
          </div>
        </div>
      ) : (
        <div className="md:col-span-3 lg:col-span-4">
          <NoResultsHint
            facetFilterTracker={facetValuesTracker.current}
            className={'p-4'}
          />
        </div>
      )}
    </div>
  );
}
