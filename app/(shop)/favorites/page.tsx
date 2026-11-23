import { getActiveCustomer } from '@/providers/customer';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FavoritesClient } from './favorites-client';

export default async function FavoritesPage() {
  const customerResult = await getActiveCustomer().catch(() => null);
  const customer = customerResult?.activeCustomer;

  if (!customer?.id) {
    redirect('/');
  }

  const favorites = customer?.favorites?.items ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">
        My Favorites
      </h1>

      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-tertiary mb-4">
            You haven&apos;t added any favorites yet.
          </p>
          <Link
            href="/"
            className="text-spice hover:text-spice-gold font-semibold"
          >
            Start browsing products
          </Link>
        </div>
      ) : (
        <FavoritesClient favorites={favorites} activeCustomer={customerResult} />
      )}
    </div>
  );
}
