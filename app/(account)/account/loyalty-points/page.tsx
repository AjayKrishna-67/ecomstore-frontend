import { getActiveCustomer } from '@/providers/customer';
import { LoyaltyPointsClient } from './loyalty-points-client';

interface LoyaltyPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoyaltyPointsPage({
  searchParams,
}: LoyaltyPageProps) {
  const resolvedParams = await searchParams;
  const page = parseInt((resolvedParams.page as string) || '1', 10);
  const limit = parseInt((resolvedParams.limit as string) || '10', 10);
  const skip = (page - 1) * limit;

  const result = await getActiveCustomer();
  const customer = result?.activeCustomer;
  const loyaltyPoints = customer?.customFields?.loyaltyPointsAvailable ?? 0;
  const transactions = customer?.loyaltyPointsTransactions ?? {
    items: [],
    totalItems: 0,
  };

  return (
    <LoyaltyPointsClient
      loyaltyPoints={loyaltyPoints}
      transactions={transactions.items}
      totalItems={transactions.totalItems}
      currentPage={page}
      limit={limit}
    />
  );
}
