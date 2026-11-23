'use client';

import { useState } from 'react';
import { trackApplyCoupon, trackRemoveCoupon } from '@/lib/fbpixel';

interface CouponsComponentProps {
  couponCodes: string[];
  appliedCoupon?: string | null;
}

export default function CouponsComponent({
  couponCodes,
  appliedCoupon,
}: CouponsComponentProps) {
  const [couponError, setCouponError] = useState<string | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const actionType = formData.get('actionType')?.toString();
    const code = formData.get('couponCode')?.toString() || '';
    try {
      const res = await fetch('', { method: 'POST', body: formData });
      const data = await res.json();
      if (data?.couponError) {
        setCouponError(data.couponError);
      } else {
        setCouponError(undefined);
        if (actionType === 'apply') trackApplyCoupon(code);
        else if (actionType === 'remove') trackRemoveCoupon(code);
      }
    } catch {
      setCouponError('An error occurred');
    }
  };

  return (
    <div className="mt-4 bg-surface w-80 p-3 rounded-md shadow border border-border-theme text-sm">
      <h3 className="text-base font-semibold text-text-primary mb-3">
        Coupon Codes
      </h3>

      {couponError && (
        <div className="mb-3 px-2 py-1.5 rounded text-xs font-medium bg-red-50 text-red-800 border border-red-300 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50">
          {couponError}
        </div>
      )}

      {couponCodes?.length > 0 ? (
        <ul className="space-y-2">
          {couponCodes.map((code) => {
            const isApplied = appliedCoupon === code;

            return (
              <li
                key={code}
                className={`p-2 rounded border flex justify-between items-center ${
                  isApplied
                    ? 'bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-900/50'
                    : 'bg-surface-hover border-border-theme hover:bg-surface'
                }`}
              >
                <span className="text-xs font-medium text-text-primary">
                  {code}
                </span>
                <form method="post" className="ml-2" onSubmit={handleSubmit}>
                  <input
                    type="hidden"
                    name="actionType"
                    value={isApplied ? 'remove' : 'apply'}
                  />
                  <input type="hidden" name="couponCode" value={code} />
                  <button
                    type="submit"
                    className={`px-3 py-1 rounded text-xs font-medium transition ${
                      isApplied
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isApplied ? 'Remove' : 'Apply'}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-text-tertiary mt-3 text-center">
          No coupon codes available at the moment.
        </p>
      )}
    </div>
  );
}
