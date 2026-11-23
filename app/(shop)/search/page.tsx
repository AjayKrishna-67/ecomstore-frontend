import { search, searchFacetValues, getProductBySlug } from '@/providers/products';
import { getActiveCustomer } from '@/providers/customer';
import { getAuthToken } from '@/lib/session';
import { SearchPageClient } from './search-page-client';

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const term = (resolvedSearchParams.q as string) || '';
  const facetValueIds = resolvedSearchParams.fvid
    ? Array.isArray(resolvedSearchParams.fvid)
      ? resolvedSearchParams.fvid
      : [resolvedSearchParams.fvid]
    : [];
  const page = parseInt((resolvedSearchParams.page as string) || '1', 10);
  const limit = parseInt((resolvedSearchParams.limit as string) || '20', 10);
  const skip = (page - 1) * limit;

  const searchResult = await search({
    input: {
      term,
      facetValueFilters: facetValueIds.length
        ? [{ or: facetValueIds }]
        : undefined,
      take: limit,
      skip,
      groupByProduct: true,
    },
  });

  const facetValuesResult = await searchFacetValues({
    input: { term, groupByProduct: true },
  });

  // Enrich items with variants + assets so the product card can show
  // a hover image (mirrors what the collection slug page does).
  const productDetails = await Promise.all(
    searchResult.search.items.map(async (item: any) => {
      try {
        const { product } = await getProductBySlug(item.slug);
        return {
          ...item,
          variants: product?.variants || [],
          assets: product?.assets || [],
        };
      } catch {
        return { ...item, variants: [], assets: [] };
      }
    }),
  );

  const enrichedSearchResult = {
    ...searchResult.search,
    items: productDetails,
  };

  const authToken = await getAuthToken();
  const isSignedIn = !!authToken;
  let activeCustomer = null;
  if (isSignedIn) {
    try {
      const result = await getActiveCustomer();
      activeCustomer = result ?? null;
    } catch {
      // not logged in
    }
  }

  return (
    <SearchPageClient
      term={term}
      searchResult={enrichedSearchResult}
      resultWithoutFacetValueFilters={facetValuesResult.search}
      currentPage={page}
      limit={limit}
      activeFacetValueIds={facetValueIds}
      activeCustomer={activeCustomer}
      isSignedIn={isSignedIn}
    />
  );
}
