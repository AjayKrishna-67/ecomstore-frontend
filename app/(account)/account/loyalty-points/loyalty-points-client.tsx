'use client';

import { Pagination } from '@/components/Pagination';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Award } from 'lucide-react';

const paginationLimitMinimumDefault = 10;
const allowedPaginationLimits = new Set<number>([10, 20, 30]);

interface LoyaltyPointsClientProps {
  loyaltyPoints: number;
  transactions: any[];
  totalItems: number;
  currentPage: number;
  limit: number;
}

export function LoyaltyPointsClient({
  loyaltyPoints,
  transactions,
  totalItems,
  currentPage,
  limit,
}: LoyaltyPointsClientProps) {
  const showingFrom = (currentPage - 1) * limit + 1;
  const showingTo = Math.min(currentPage * limit, totalItems);

  return (
    <Card className="bg-white rounded-xl shadow-md border border-gray-100">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-full">
            <Award className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Loyalty Points
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Your available points: {loyaltyPoints}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {totalItems === 0 ? (
          <div className="py-16 text-center text-gray-600 italic">
            No loyalty points available
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Order Code
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((tx: any) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-gray-50 transition-all duration-200"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tx.note}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm font-medium ${
                          tx.value > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {tx.value}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-600">
                        {tx.order ? tx.order.code : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
              <span className="text-sm text-gray-600">
                Showing {showingFrom} to {showingTo} of {totalItems}{' '}
                transactions
              </span>
              <Pagination
                appliedPaginationLimit={limit}
                allowedPaginationLimits={allowedPaginationLimits}
                totalItems={totalItems}
                appliedPaginationPage={currentPage}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
