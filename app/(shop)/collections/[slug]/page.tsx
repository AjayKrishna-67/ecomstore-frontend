import { sdk } from '@/lib/graphql-client';
import {
  searchAllSortedBySlug,
  searchFacetValues,
  getProductBySlug,
} from '@/providers/products';
import { getActiveCustomer } from '@/providers/customer';
import { getAuthToken } from '@/lib/session';
import { CollectionPageClient } from './collection-page-client';

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CollectionPage({
  params,
  searchParams,
}: CollectionPageProps) {
  const { slug } = await params;
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

  // Fetch collection data
  const collectionResult = await sdk.collection({ slug });
  const collection = collectionResult.collection;

  if (!collection) {
    return <div className="text-center py-16">Collection not found</div>;
  }

  // Fetch all products in the collection sorted by the number at the
  // end of the slug (e.g. name-1, name-2, name-3), then paginate
  const {
    items: allItems,
    totalItems,
    facetValues: searchFacetValuesForResult,
  } = await searchAllSortedBySlug({
    collectionSlug: slug,
    term,
    facetValueFilters: facetValueIds.length
      ? [{ or: facetValueIds }]
      : undefined,
    groupByProduct: true,
  });

  const pageItems = allItems.slice(skip, skip + limit);

  // Get facet values without filters for the sidebar
  const facetValuesResult = await searchFacetValues({
    input: {
      collectionSlug: slug,
      groupByProduct: true,
    },
  });

  // Fetch full product details (variants + assets) for each search result
  const productDetails = await Promise.all(
    pageItems.map(async (item: any) => {
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
    totalItems,
    facetValues: searchFacetValuesForResult,
    items: productDetails,
  };

  // Get auth state
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
    <CollectionPageClient
      collection={collection}
      searchResult={enrichedSearchResult}
      resultWithoutFacetValueFilters={facetValuesResult.search}
      currentPage={page}
      limit={limit}
      term={term}
      activeFacetValueIds={facetValueIds}
      activeCustomer={activeCustomer}
      isSignedIn={isSignedIn}
    />
  );
}
