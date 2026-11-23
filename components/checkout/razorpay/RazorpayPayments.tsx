'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCardIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import { classNames } from '@/lib/utils';
import type { CurrencyCode } from '@/generated/graphql';
import { revalidateActiveOrder, useActiveOrder } from '@/hooks/use-active-order';
import { trackAddPaymentInfo, trackPlaceOrder } from '@/lib/fbpixel';

interface RazorpayPaymentsProps {
  orderCode: string;
  amount: number;
  currencyCode: string | CurrencyCode;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
}

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function doesPaymentAmountMatch(
  amountPaidViaRazorpay: number,
  orderAmount: number,
): boolean {
  console.log(
    `Comparing amounts: Razorpay = ${amountPaidViaRazorpay}, Order = ${orderAmount}`,
  );
  return orderAmount === amountPaidViaRazorpay;
}

export function RazorpayPayments({
  orderCode,
  amount,
  currencyCode,
  customerEmail = '',
  customerName = '',
  customerPhone = '',
}: RazorpayPaymentsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetcherState, setFetcherState] = useState<'idle' | 'submitting'>('idle');
  const [fetcherData, setFetcherData] = useState<any>(null);
  const [verifyState, setVerifyState] = useState<'idle' | 'submitting'>('idle');
  const [verifyData, setVerifyData] = useState<any>(null);
  const router = useRouter();
  const { t } = useTranslation();
  const { activeOrder } = useActiveOrder();

  const loadRazorpayScript = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }, []);

  useEffect(() => {
    loadRazorpayScript().then((loaded) => {
      setScriptLoaded(loaded);
      if (!loaded) {
        setError('Failed to load Razorpay script');
      }
    });
  }, [loadRazorpayScript]);

  const generateRazorpayOrderId = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setFetcherState('submitting');

    const orderForTracking = activeOrder ?? {
      code: orderCode,
      totalWithTax: amount,
      currencyCode,
      lines: [],
    };
    trackAddPaymentInfo(orderForTracking);
    trackPlaceOrder('razorpay-payment', orderForTracking);

    const formData = new FormData();
    formData.append('orderCode', orderCode);

    try {
      const response = await fetch('/api/razorpay-generate-order', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setFetcherData(data);
    } catch (err) {
      setError('Failed to generate order');
      setIsLoading(false);
    } finally {
      setFetcherState('idle');
    }
  }, [orderCode]);

  const openRazorpayPopup = useCallback(
    (razorpayOrderId: string, keyId: string) => {
      try {
        const options = {
          key: keyId,
          order_id: razorpayOrderId,
          amount: Math.round(Number(amount)) || 0,
          currency: currencyCode || 'INR',
          name: "Praba's Aari",
          description: `Payment for order ${orderCode}`,
          prefill: {
            email: customerEmail,
            contact: customerPhone,
            name: customerName,
          },
          config: {
            display: {
              blocks: {
                card: {
                  instruments: [
                    {
                      method: 'card',
                      networks: ['MasterCard', 'Visa', 'RuPay'],
                    },
                  ],
                },
                upi: {
                  name: 'Pay using UPI',
                  instruments: [
                    {
                      method: 'upi',
                      flows: ['collect', 'intent', 'qr'],
                      apps: ['google_pay', 'bhim', 'paytm', 'phonepe'],
                    },
                  ],
                },
                netbanking: {
                  name: 'Pay using netbanking',
                  instruments: [{ method: 'netbanking' }],
                },
                wallet: {
                  name: 'Pay using wallets',
                  instruments: [
                    {
                      method: 'wallet',
                      wallets: ['phonepe', 'freecharge', 'airtelmoney'],
                    },
                  ],
                },
              },
              sequence: [
                'block.card',
                'block.upi',
                'block.netbanking',
                'block.wallet',
              ],
              preferences: { show_default_blocks: false },
            },
          },
          handler: (response: RazorpayPaymentResponse) => {
            console.log('Payment successful:', response);
            onRazorpayPaymentSuccess(response);
          },
          modal: {
            ondismiss: () => {
              console.log('Payment modal dismissed');
              setIsLoading(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
          console.error('Razorpay payment failed:', response);
          setError(
            `Payment failed: ${response.error?.description || 'Unknown error'}`,
          );
          setIsLoading(false);
        });
        rzp.open();
      } catch (error) {
        console.error('Error opening Razorpay:', error);
        setError('Failed to open payment gateway');
        setIsLoading(false);
      }
    },
    [
      amount,
      currencyCode,
      orderCode,
      customerEmail,
      customerPhone,
      customerName,
    ],
  );

  const onRazorpayPaymentSuccess = useCallback(
    async (response: RazorpayPaymentResponse) => {
      console.log('Processing payment success:', response);

      const formData = new FormData();
      formData.append('razorpay_payment_id', response.razorpay_payment_id);
      formData.append('razorpay_order_id', response.razorpay_order_id);
      formData.append('razorpay_signature', response.razorpay_signature);
      formData.append('orderCode', orderCode);
      formData.append('amount', amount.toString()); // Amount is already in paise from Vendure
      formData.append('currencyCode', currencyCode.toString());

      setVerifyState('submitting');
      try {
        const res = await fetch('/api/razorpay-verify-payment', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        setVerifyData(data);
      } catch (err) {
        setError('Failed to verify payment');
        setIsLoading(false);
      } finally {
        setVerifyState('idle');
      }
    },
    [orderCode, amount, currencyCode],
  );

  // Handle order generation response
  useEffect(() => {
    const data = fetcherData as {
      success?: boolean;
      razorpayOrderId?: string;
      keyId?: string;
      error?: string;
    };

    if (fetcherState === 'idle' && data) {
      if (data.success && data.razorpayOrderId && data.keyId) {
        openRazorpayPopup(data.razorpayOrderId, data.keyId);
      } else if (data.error) {
        setError(data.error);
        setIsLoading(false);
      }
    }
  }, [fetcherState, fetcherData, openRazorpayPopup]);

  // Handle payment verification response
  useEffect(() => {
    const data = verifyData as {
      success?: boolean;
      redirectUrl?: string;
      error?: string;
    };

    if (verifyState === 'idle' && data) {
      if (data.success && data.redirectUrl) {
        console.log(
          'Payment verified successfully, redirecting to:',
          data.redirectUrl,
        );
        setIsLoading(false);
        revalidateActiveOrder();
        router.replace(data.redirectUrl);
      } else if (data.error) {
        console.error('Payment verification failed:', data.error);
        setError(data.error);
        setIsLoading(false);
      }
    }
  }, [verifyState, verifyData, router]);

  const isProcessing =
    isLoading || fetcherState !== 'idle' || verifyState !== 'idle';

  return (
    <div className="flex flex-col items-center w-full">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-300 rounded-md w-full">
          <p className="text-sm font-medium">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-600 dark:text-red-400 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={generateRazorpayOrderId}
        disabled={!scriptLoaded || isProcessing}
        className={classNames(
          scriptLoaded && !isProcessing
            ? 'bg-spice border-2 border-spice-700 text-white hover:bg-spice-600 shadow-sm hover:shadow'
            : 'bg-surface-hover border-2 border-border-theme text-text-muted cursor-not-allowed',
          'rounded-md py-3 px-4 text-base font-semibold w-full transition-all duration-200 flex items-center justify-center gap-2.5',
        )}
      >
        {isProcessing && (
          <span
            aria-hidden="true"
            className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin"
          />
        )}
        {!isProcessing && !scriptLoaded && (
          <span
            aria-hidden="true"
            className="w-5 h-5 rounded-full border-2 border-current border-t-transparent animate-spin"
          />
        )}
        <span>
          {isProcessing
            ? 'Processing payment…'
            : !scriptLoaded
            ? 'Loading payment…'
            : 'Place Order'}
        </span>
      </button>
    </div>
  );
}
