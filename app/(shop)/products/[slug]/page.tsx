import { getProductBySlug } from '@/providers/products';
import { getActiveCustomer } from '@/providers/customer';
import { getFrequentlyOrderedProducts } from '@/providers/custom-plugins';
import { getAuthToken } from '@/lib/session';
import { ProductPageClient } from './product-page-client';
import type { Metadata } from 'next';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductBySlug(slug);
  const product = result?.product;

  return {
    title: product?.name ?? 'Product',
    description: product?.description?.substring(0, 160) ?? '',
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const [productResult, customerResult, frequentlyOrdered] = await Promise.all([
    getProductBySlug(slug),
    getActiveCustomer().catch(() => null),
    getFrequentlyOrderedProducts().catch(() => []),
  ]);

  const product = productResult?.product;

  if (!product) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">Product not found</h1>
      </div>
    );
  }

  const isSignedIn = !!customerResult?.activeCustomer?.id;
  const favorites =
    customerResult?.activeCustomer?.favorites?.items?.map(
      (f: any) => f.product?.id,
    ) ?? [];
  const isFavorite = favorites.includes(product.id);

  return (
    <ProductPageClient
      product={product}
      isSignedIn={isSignedIn}
      isFavorite={isFavorite}
      activeCustomer={customerResult}
      frequentlyOrdered={frequentlyOrdered as any[]}
    />
  );
}
