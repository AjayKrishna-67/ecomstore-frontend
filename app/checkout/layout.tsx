import { getCollections } from '@/providers/collections';
import { getActiveCustomer } from '@/providers/customer';
import { ShopLayoutClient } from '../(shop)/shop-layout-client';

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collections, activeCustomerData] = await Promise.all([
    getCollections({ topLevelOnly: true }),
    getActiveCustomer(),
  ]);

  const topLevelCollections = (collections ?? []).filter(
    (collection: any) => collection.parent?.name === '__root_collection__',
  );

  const activeCustomer = activeCustomerData?.activeCustomer ?? null;
  const loyaltyPoints =
    activeCustomer?.customFields?.loyaltyPointsAvailable ?? null;
  const isSignedIn = !!activeCustomer?.id;

  return (
    <ShopLayoutClient
      collections={topLevelCollections}
      loyaltyPoints={loyaltyPoints}
      isSignedIn={isSignedIn}
      hideCart={true}
    >
      {children}
    </ShopLayoutClient>
  );
}
