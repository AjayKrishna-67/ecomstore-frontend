import gql from 'graphql-tag';
import { sdk } from '@/lib/graphql-client';
import { CollectionListOptions } from '@/generated/graphql';
import { listedProductFragment } from './products';

export function getCollections(options?: CollectionListOptions) {
  return sdk
    .collections({ options })
    .then((result) => result.collections?.items);
}

export function getCollectionBySlug(slug: string) {
  return sdk.collection({ slug }).then((result) => result.collection);
}

gql`
  query collections($options: CollectionListOptions) {
    collections(options: $options) {
      items {
        id
        name
        slug
        parent {
          name
        }
        featuredAsset {
          id
          preview
        }
      }
    }
  }
`;

gql`
  query collection($slug: String, $id: ID) {
    collection(slug: $slug, id: $id) {
      id
      name
      slug
      breadcrumbs {
        id
        name
        slug
      }
      children {
        id
        name
        slug
        featuredAsset {
          id
          preview
        }
        children {
          id
          name
          slug
          featuredAsset {
            id
            preview
          }
        }
      }
    }
  }
`;
