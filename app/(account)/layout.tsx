import { getActiveCustomer } from '@/providers/customer';
import { getCollections } from '@/providers/collections';
import { redirect } from 'next/navigation';
import { ShopLayoutClient } from '../(shop)/shop-layout-client';
import AccountHeader from '@/components/account/AccountHeader';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [customerResult, collections] = await Promise.all([
    getActiveCustomer().catch(() => null),
    getCollections({ topLevelOnly: true }),
  ]);

  const customer = customerResult?.activeCustomer;
  if (!customer?.id) {
    redirect('/');
  }

  const topLevelCollections = (collections ?? []).filter(
    (c: any) => c.parent?.name === '__root_collection__',
  );
  const loyaltyPoints = customer?.customFields?.loyaltyPointsAvailable ?? null;

  return (
    <ShopLayoutClient
      collections={topLevelCollections}
      loyaltyPoints={loyaltyPoints}
      isSignedIn={true}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AccountHeader activeCustomer={customer} />
        <div className="mt-6">{children}</div>
      </div>
    </ShopLayoutClient>
  );
}
