'use client';

import OrderHistoryItem from '@/components/account/OrderHistoryItem';
import { Pagination } from '@/components/Pagination';
import { ShoppingBag } from 'lucide-react';

interface OrderHistoryClientProps {
  orders: any[];
  totalItems: number;
  currentPage: number;
  limit: number;
}

export function OrderHistoryClient({
  orders,
  totalItems,
  currentPage,
  limit,
}: OrderHistoryClientProps) {
  const showingFrom = (currentPage - 1) * limit + 1;
  const showingTo = Math.min(currentPage * limit, totalItems);

  return (
    <div>
      {/* Section heading */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-surface-hover">
            <ShoppingBag className="h-5 w-5 text-btn-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              Your Orders
            </h2>
            <p className="text-sm text-text-tertiary">
              {totalItems === 0
                ? 'No orders yet'
                : `${totalItems} ${totalItems === 1 ? 'order' : 'orders'} placed`}
            </p>
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-theme bg-surface py-16 text-center">
          <div className="w-14 h-14 bg-surface-hover rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-7 w-7 text-text-tertiary" />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">
            {totalItems === 0 ? 'No orders yet' : 'No more orders to show'}
          </h3>
          <p className="text-sm text-text-tertiary">
            {totalItems === 0
              ? 'Your purchases will appear here once you place an order.'
              : 'Try a different page.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order: any) => (
              <OrderHistoryItem key={order.code} order={order} />
            ))}
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
            <span className="text-sm text-text-tertiary">
              Showing {showingFrom}–{showingTo} of {totalItems}
            </span>
            <Pagination
              totalItems={totalItems}
              appliedPaginationPage={currentPage}
              appliedPaginationLimit={limit}
              allowedPaginationLimits={new Set([limit])}
            />
          </div>
        </>
      )}
    </div>
  );
}
