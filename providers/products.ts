import gql from 'graphql-tag';
import { sdk } from '@/lib/graphql-client';
import { SearchQueryVariables } from '@/generated/graphql';

export function search(variables: SearchQueryVariables) {
  return sdk.search(variables);
}

export function searchFacetValues(variables: SearchQueryVariables) {
  return sdk.searchFacetValues(variables);
}

// Number at the end of a slug (e.g. "dhoti-model-2" -> 2); slugs without one sort last
export function slugNumber(slug: string | undefined | null): number {
  const match = slug?.match(/(\d+)\s*$/);
  return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
}

// Fetches every matching search result (batched) and sorts by trailing slug number
export async function searchAllSortedBySlug(
  input: Omit<SearchQueryVariables['input'], 'take' | 'skip'>,
) {
  const batchSize = 100;
  const items: any[] = [];
  let totalItems = 0;
  let facetValues: any[] = [];
  do {
    const res = await search({
      input: { ...input, take: batchSize, skip: items.length },
    });
    totalItems = res.search.totalItems;
    if (!facetValues.length) {
      facetValues = (res.search as any).facetValues ?? [];
    }
    if (!res.search.items.length) break;
    items.push(...res.search.items);
  } while (items.length < totalItems);

  items.sort((a, b) => slugNumber(a.slug) - slugNumber(b.slug));
  return { items, totalItems, facetValues };
}

export function getProductBySlug(slug: string) {
  return sdk.product({ slug });
}

// Lightweight fetch of just a product's gallery assets (used for hover images)
export function getProductAssets(slug: string) {
  return sdk.productAssets({ slug }).then((r) => r.product);
}

export async function getProductById(id: string) {
  return sdk.product({ id });
}

export function getAddonGroupsForVariant(productVariantId: string) {
  return sdk
    .addonGroupsForVariant({ productVariantId })
    .then((r) => r.addonGroupsForVariant ?? []);
}

export const detailedProductFragment = gql`
  fragment DetailedProduct on Product {
    id
    name
    description
    slug
    collections {
      id
      slug
      name
      breadcrumbs {
        id
        name
        slug
      }
    }
    facetValues {
      facet {
        id
        code
        name
      }
      id
      code
      name
    }
    featuredAsset {
      id
      preview
    }
    assets {
      id
      preview
    }
    optionGroups {
      id
      code
      name
      options {
        id
        code
        name
      }
    }
    variants {
      id
      name
      priceWithTax
      currencyCode
      sku
      stockLevel
      customFields {
        shadowPrice
      }
      options {
        id
        name
        code
        group {
          id
          name
          code
        }
      }
      featuredAsset {
        id
        preview
      }
    }
  }
`;

gql`
  query product($slug: String, $id: ID) {
    product(slug: $slug, id: $id) {
      ...DetailedProduct
    }
  }
`;

export const addonGroupFragment = gql`
  fragment AddonGroupFields on AddonGroup {
    id
    name
    description
    sortOrder
    enabled
    items {
      id
      name
      price
      sku
      isDefault
      sortOrder
      enabled
      image {
        id
        preview
      }
    }
  }
`;

gql`
  query addonGroupsForVariant($productVariantId: ID!) {
    addonGroupsForVariant(productVariantId: $productVariantId) {
      ...AddonGroupFields
    }
  }
  ${addonGroupFragment}
`;

export const listedProductFragment = gql`
  fragment ListedProduct on SearchResult {
    productId
    productName
    description
    slug
    productAsset {
      id
      preview
    }
    productVariantAsset {
      id
      preview
    }
    currencyCode
    priceWithTax {
      ... on PriceRange {
        min
        max
      }
      ... on SinglePrice {
        value
      }
    }
  }
`;

gql`
  query search($input: SearchInput!) {
    search(input: $input) {
      totalItems
      items {
        ...ListedProduct
      }
      facetValues {
        count
        facetValue {
          id
          name
          facet {
            id
            name
          }
        }
      }
    }
  }
  ${listedProductFragment}
`;

gql`
  query productAssets($slug: String) {
    product(slug: $slug) {
      id
      featuredAsset {
        id
        preview
      }
      assets {
        id
        preview
      }
    }
  }
`;

gql`
  query searchFacetValues($input: SearchInput!) {
    search(input: $input) {
      totalItems
      facetValues {
        count
        facetValue {
          id
          name
          facet {
            id
            name
          }
        }
      }
    }
  }
  ${listedProductFragment}
`;
