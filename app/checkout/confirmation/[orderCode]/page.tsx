import { getOrderByCode } from '@/providers/orders';
import { ConfirmationPageClient } from './confirmation-page-client';

interface ConfirmationPageProps {
  params: Promise<{ orderCode: string }>;
}

export default async function ConfirmationPage({
  params,
}: ConfirmationPageProps) {
  const { orderCode } = await params;
  const order = await getOrderByCode(orderCode);

  if (!order) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">Order not found</h1>
      </div>
    );
  }

  return <ConfirmationPageClient order={order} />;
}
