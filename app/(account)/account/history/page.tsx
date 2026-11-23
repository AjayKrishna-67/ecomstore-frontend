import { getActiveCustomerOrderList } from '@/providers/customer';
import { OrderHistoryClient } from './order-history-client';

interface HistoryPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OrderHistoryPage({
  searchParams,
}: HistoryPageProps) {
  const resolvedParams = await searchParams;
  const page = parseInt((resolvedParams.page as string) || '1', 10);
  const limit = parseInt((resolvedParams.limit as string) || '10', 10);
  const skip = (page - 1) * limit;

  const result = await getActiveCustomerOrderList({
    take: limit,
    skip,
    sort: { orderPlacedAt: 'DESC' as any },
  });

  const orders = result?.activeCustomer?.orders ?? { totalItems: 0, items: [] };

  return (
    <OrderHistoryClient
      orders={orders.items}
      totalItems={orders.totalItems}
      currentPage={page}
      limit={limit}
    />
  );
}
