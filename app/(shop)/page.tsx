import { getCollections, getCollectionBySlug } from '@/providers/collections';
import { getCustomBanners } from '@/providers/custom-plugins';
import { searchAllSortedBySlug, getProductAssets } from '@/providers/products';
import { getActiveCustomer } from '@/providers/customer';
import { HomePageClient } from './home-page-client';

// Fetches per-session data (active customer / collections via cookies),
// so render dynamically and skip the static-prerender attempt.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [collections, bannersResult, activeCustomerData] = await Promise.all([
    getCollections({ topLevelOnly: true }).catch((e) => {
      console.error('HomePage: getCollections failed', e);
      return null;
    }),
    getCustomBanners().catch((e) => {
      console.error('HomePage: getCustomBanners failed', e);
      return null;
    }),
    getActiveCustomer().catch(() => null),
  ]);
  const activeCustomer = activeCustomerData?.activeCustomer ?? null;

  const topLevelCollections = (collections ?? []).filter(
    (collection: any) => collection.parent?.name === '__root_collection__',
  );

  const banners = bannersResult ? bannersResult.data : [];

  // Fetch children for each top-level collection (best effort)
  const parentDetails = await Promise.all(
    topLevelCollections.map((col: any) =>
      getCollectionBySlug(col.slug).catch((e) => {
        console.error('HomePage: getCollectionBySlug failed', col.slug, e);
        return null;
      }),
    ),
  );

  // Gather all children across all top-level collections
  const allChildren: { id: string; name: string; slug: string }[] = [];
  for (const parent of parentDetails) {
    if (parent?.children) {
      for (const child of parent.children) {
        allChildren.push({
          id: child.id,
          name: child.name,
          slug: child.slug,
        });
      }
    }
  }

  // Fetch products per child collection in parallel, sorted by trailing
  // slug number (name-1, name-2, ...), and show the first 4
  const collectionProducts = await Promise.all(
    allChildren.map(async (child) => {
      try {
        const result = await searchAllSortedBySlug({
          collectionSlug: child.slug,
          groupByProduct: true,
        });
        // Attach a second image (hoverAsset) to each shown product, best effort
        const products = await Promise.all(
          result.items.slice(0, 4).map(async (item: any) => {
            try {
              const product = await getProductAssets(item.slug);
              const assets = product?.assets ?? [];
              if (assets.length < 2) return item;
              const second =
                assets.find((a: any) => a.id !== item.productAsset?.id) ||
                assets[1];
              return second
                ? { ...item, hoverAsset: { preview: second.preview } }
                : item;
            } catch {
              return item;
            }
          }),
        );
        return {
          collectionId: child.id,
          collectionName: child.name,
          collectionSlug: child.slug,
          products,
        };
      } catch {
        return {
          collectionId: child.id,
          collectionName: child.name,
          collectionSlug: child.slug,
          products: [],
        };
      }
    }),
  );

  // Only include children that have products
  const collectionsWithProducts = collectionProducts.filter(
    (c) => c.products.length > 0,
  );

  return (
    <HomePageClient
      collections={topLevelCollections}
      banners={banners}
      collectionProducts={collectionsWithProducts}
      activeCustomer={activeCustomer}
    />
  );
}
