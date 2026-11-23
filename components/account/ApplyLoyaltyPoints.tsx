'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackApplyLoyaltyPoints } from '@/lib/fbpixel';

interface ApplyLoyaltyPointsProps {
  availablePoints: number;
  orderId: string;
  pointsPerRupee: number;
  appliedPointsAmount?: number;
}

type LoyaltyPointsFetcherData = {
  success?: boolean;
  error?: string;
};

export function ApplyLoyaltyPoints({
  availablePoints,
  orderId,
  pointsPerRupee,
  appliedPointsAmount = 0,
}: ApplyLoyaltyPointsProps) {
  const [points, setPoints] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fetcherState, setFetcherState] = useState<'idle' | 'submitting'>('idle');
  const [fetcherData, setFetcherData] = useState<LoyaltyPointsFetcherData | null>(null);
  const router = useRouter();

  const isApplied = appliedPointsAmount > 0;

  const handleApply = async () => {
    const amount = parseInt(points, 10);
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid number of points.');
      return;
    }
    if (amount < pointsPerRupee) {
      setError(`Minimum ${pointsPerRupee} points needed to apply.`);
      return;
    }
    if (amount > availablePoints) {
      setError('You do not have enough points.');
      return;
    }
    setError(null);
    setFetcherState('submitting');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'applyLoyaltyPoints', amount, orderId }),
      });
      const data = await res.json();
      setFetcherData(data);
      if (data?.success !== false) trackApplyLoyaltyPoints(amount);
    } finally {
      setFetcherState('idle');
    }
    setTimeout(() => router.refresh(), 500);
  };

  const handleRemove = async () => {
    setError(null);
    setFetcherState('submitting');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'removeLoyaltyPoints' }),
      });
      const data = await res.json();
      setFetcherData(data);
    } finally {
      setFetcherState('idle');
    }
    setTimeout(() => router.refresh(), 500);
  };

  return (
    <div className="mb-4 p-4 bg-surface border border-border-theme rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-text-primary">Loyalty Points</span>
        <span className="text-sm text-text-secondary">
          Available: {availablePoints}
        </span>
      </div>

      {isApplied ? (
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {appliedPointsAmount} points applied
            </span>
            <button
              type="button"
              className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold text-xs hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors duration-200"
              onClick={handleRemove}
              disabled={fetcherState === 'submitting'}
            >
              {fetcherState === 'submitting' ? 'Removing...' : 'Remove'}
            </button>
          </div>
          <p className="text-xs text-text-muted mt-1">Remove points to modify the amount</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min={pointsPerRupee}
              max={availablePoints}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="border border-border-theme rounded px-2 py-1 w-24 bg-input-bg text-text-primary placeholder:text-text-muted"
              placeholder="Points"
            />
            <button
              type="button"
              className="bg-surface text-text-primary border border-border-theme px-3 py-1 rounded hover:bg-surface-hover transition-colors"
              onClick={handleApply}
              disabled={fetcherState === 'submitting'}
            >
              Apply
            </button>
            <span className="flex-1"></span>
            <p className="text-sm text-text-secondary ml-auto">{pointsPerRupee} Points = 1 Rupee</p>
          </div>
        </div>
      )}

      {error && <div className="text-red-600 dark:text-red-400 text-xs mt-1">{error}</div>}
      {fetcherData?.success && !isApplied && (
        <div className="text-green-600 dark:text-green-400 text-xs mt-1">Points applied!</div>
      )}
      {fetcherData?.error && (
        <div className="text-red-600 dark:text-red-400 text-xs mt-1">{fetcherData.error}</div>
      )}
    </div>
  );
}
