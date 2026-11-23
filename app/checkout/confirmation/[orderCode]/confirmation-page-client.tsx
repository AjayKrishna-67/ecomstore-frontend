'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  ShoppingBag,
  FileText,
  CheckCircle2,
  MapPin,
  User,
  CreditCard,
  Package,
} from 'lucide-react';
import { revalidateActiveOrder } from '@/hooks/use-active-order';
import {
  trackPurchase,
  trackDownloadInvoice,
  trackContinueShopping,
} from '@/lib/fbpixel';

interface ConfirmationPageClientProps {
  order: any;
}

function formatMoney(value: number | undefined | null, currency: string) {
  const n = (value ?? 0) / 100;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatPaymentMethod(code: string | undefined | null): string {
  if (!code) return '—';
  const map: Record<string, string> = {
    'razorpay-payment': 'Online Payment',
    razorpay: 'Online Payment',
    offline: 'Cash on Delivery',
    cod: 'Cash on Delivery',
  };
  return (
    map[code] ||
    code.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function paymentStatusStyle(state: string | undefined | null) {
  const s = (state || '').toLowerCase();
  if (s === 'settled' || s === 'paid' || s === 'authorized') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (s === 'declined' || s === 'cancelled' || s === 'error') {
    return 'bg-red-50 text-red-700 border-red-200';
  }
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function buildAddressLines(shipping: any): string[] {
  if (!shipping) return [];
  const countryLine =
    typeof shipping.country === 'string'
      ? shipping.country
      : shipping.country?.name || shipping.countryCode || '';
  const rawLines: (string | null | undefined)[] = [
    shipping.fullName,
    shipping.company,
    [shipping.streetLine1, shipping.streetLine2].filter(Boolean).join(', '),
    [shipping.city, shipping.province, shipping.postalCode]
      .filter(Boolean)
      .join(', '),
    countryLine,
    shipping.phoneNumber,
  ];
  return rawLines
    .map((s) => (s == null ? '' : String(s).trim()))
    .filter((s) => s.length > 0);
}

export function ConfirmationPageClient({ order }: ConfirmationPageClientProps) {
  const router = useRouter();

  useEffect(() => {
    trackPurchase(order);
    revalidateActiveOrder();
    const onLeave = () => {
      revalidateActiveOrder();
    };
    window.addEventListener('popstate', onLeave);
    window.addEventListener('pagehide', onLeave);
    return () => {
      window.removeEventListener('popstate', onLeave);
      window.removeEventListener('pagehide', onLeave);
    };
    // Purchase should fire once per confirmation (order code is stable).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.code]);

  const handleNavigate = async (href: string) => {
    trackContinueShopping('confirmation');
    await revalidateActiveOrder();
    router.push(href);
  };

  const handleDownload = () => {
    trackDownloadInvoice(order?.code || '');
    window.print();
  };

  const currency = order.currencyCode || 'INR';
  const shipping = order.shippingAddress;
  const customer = order.customer;
  const items = order.lines ?? [];
  const shippingLine = order.shippingLines?.[0];
  const payment = order.payments?.[0];
  const invoiceNo = order.customFields?.invoiceNo ?? order.code;
  const placedAt = order.orderPlacedAt || order.createdAt;
  const shippingLines = buildAddressLines(shipping);
  const totalQty = items.reduce(
    (acc: number, l: any) => acc + (l.quantity ?? 0),
    0,
  );

  return (
    <div className="bg-background min-h-screen py-10 print:py-0 print:bg-white">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          .invoice-paper {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            border-radius: 0 !important;
          }
          .invoice-paper * {
            color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .accent-bar {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          header,
          nav,
          footer {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-4">
        {/* Success banner */}
        <div className="no-print mb-6 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/40 dark:from-emerald-950/30 dark:to-emerald-900/10 dark:border-emerald-900/40 p-5 sm:p-6 flex items-start sm:items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
            <CheckCircle2 className="w-7 h-7" strokeWidth={2.25} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-emerald-900 dark:text-emerald-200">
              Order placed successfully!
            </h1>
            <p className="text-sm text-emerald-800/80 dark:text-emerald-200/80 mt-0.5">
              We&apos;ve received your order{' '}
              <span className="font-semibold">#{order.code}</span>. A receipt is
              below — feel free to download or print it.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="no-print flex flex-wrap gap-2 mb-6 justify-end">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-spice text-white rounded-lg font-semibold hover:bg-spice-600 transition-colors text-sm shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download Invoice
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('/account/history')}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-border-theme bg-surface text-text-primary rounded-lg font-semibold hover:bg-surface-hover transition-colors text-sm"
          >
            <FileText className="w-4 h-4" />
            View Orders
          </button>
          <button
            type="button"
            onClick={() => handleNavigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-border-theme bg-surface text-text-primary rounded-lg font-semibold hover:bg-surface-hover transition-colors text-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </button>
        </div>

        {/* Invoice paper — always light/printed look, theme-agnostic */}
        <div className="invoice-paper bg-white text-gray-900 border border-gray-200 rounded-2xl shadow-md overflow-hidden">
          {/* Accent bar */}
          <div className="accent-bar h-2 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500" />

          <div className="p-8 sm:p-10">
            {/* Top header */}
            <div className="flex items-start justify-between flex-wrap gap-6 pb-6">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-amber-700" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                    Praba&apos;s Aari
                  </h2>
                </div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">
                  Tax Invoice / Receipt
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                  Invoice
                </p>
                <p className="text-2xl font-bold text-gray-900 leading-tight">
                  #{invoiceNo}
                </p>
                <div className="mt-2 inline-flex flex-col items-end gap-0.5">
                  <p className="text-xs text-gray-500">
                    <span className="text-gray-400">Order&nbsp;</span>
                    <span className="font-medium text-gray-700">
                      {order.code}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="text-gray-400">Date&nbsp;</span>
                    <span className="font-medium text-gray-700">
                      {formatDate(placedAt)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200" />

            {/* Bill To / Ship To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                    Bill To
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {[customer?.firstName, customer?.lastName]
                    .filter(Boolean)
                    .join(' ') || shipping?.fullName || '—'}
                </p>
                {customer?.emailAddress && (
                  <p className="text-sm text-gray-600 mt-0.5">
                    {customer.emailAddress}
                  </p>
                )}
                {shipping?.phoneNumber && (
                  <p className="text-sm text-gray-600">
                    {shipping.phoneNumber}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-500" />
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                    Ship To
                  </p>
                </div>
                {shippingLines.length > 0 ? (
                  <div className="text-sm text-gray-600 leading-relaxed">
                    <p className="font-semibold text-gray-900">
                      {shippingLines[0]}
                    </p>
                    {shippingLines.slice(1).map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">—</p>
                )}
              </div>
            </div>

            {/* Line items */}
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                    <th className="py-3 px-4 w-10">#</th>
                    <th className="py-3 px-2">Item</th>
                    <th className="py-3 px-2 text-center w-16">Qty</th>
                    <th className="py-3 px-2 text-right w-28">Unit Price</th>
                    <th className="py-3 px-4 text-right w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((line: any, idx: number) => (
                    <tr
                      key={line.id}
                      className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-gray-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-2 text-gray-900 font-medium">
                        {line.productVariant?.name}
                      </td>
                      <td className="py-3.5 px-2 text-center text-gray-700">
                        {line.quantity}
                      </td>
                      <td className="py-3.5 px-2 text-right text-gray-700 tabular-nums">
                        {formatMoney(
                          line.discountedUnitPriceWithTax,
                          currency,
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-gray-900 tabular-nums">
                        {formatMoney(line.linePriceWithTax, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-6">
              <div className="w-full sm:w-80 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>
                      Subtotal{' '}
                      <span className="text-gray-400">
                        ({totalQty} item{totalQty === 1 ? '' : 's'})
                      </span>
                    </span>
                    <span className="tabular-nums text-gray-900">
                      {formatMoney(order.subTotalWithTax, currency)}
                    </span>
                  </div>
                  {shippingLine && (
                    <div className="flex justify-between text-gray-600">
                      <span>
                        Shipping
                        {shippingLine.shippingMethod?.name
                          ? ` (${shippingLine.shippingMethod.name})`
                          : ''}
                      </span>
                      <span className="tabular-nums text-gray-900">
                        {(order.shippingWithTax ?? 0) === 0
                          ? 'Free'
                          : formatMoney(order.shippingWithTax, currency)}
                      </span>
                    </div>
                  )}
                  {Array.isArray(order.taxSummary) &&
                    order.taxSummary
                      .filter((t: any) => t.taxTotal > 0)
                      .map((t: any, i: number) => (
                        <div
                          key={i}
                          className="flex justify-between text-gray-600"
                        >
                          <span>
                            {t.description || `Tax (${t.taxRate}%)`}
                          </span>
                          <span className="tabular-nums text-gray-900">
                            {formatMoney(t.taxTotal, currency)}
                          </span>
                        </div>
                      ))}
                  {Array.isArray(order.surcharges) &&
                    order.surcharges.map((s: any) => (
                      <div
                        key={s.id}
                        className={`flex justify-between ${
                          s.priceWithTax < 0
                            ? 'text-emerald-700'
                            : 'text-gray-600'
                        }`}
                      >
                        <span>{s.description}</span>
                        <span className="tabular-nums">
                          {formatMoney(s.priceWithTax, currency)}
                        </span>
                      </div>
                    ))}
                </div>

                <div className="mt-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-900 uppercase tracking-wide">
                    Grand Total
                  </span>
                  <span className="text-xl font-bold text-amber-900 tabular-nums">
                    {formatMoney(order.totalWithTax, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment + notes */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                    Payment
                  </p>
                </div>
                {payment ? (
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatPaymentMethod(payment.method)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">—</p>
                )}
              </div>
              {order.customFields?.otherInstructions ? (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2">
                    Notes
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {order.customFields.otherInstructions}
                  </p>
                </div>
              ) : (
                <div className="hidden sm:block" />
              )}
            </div>

            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-dashed border-gray-200 text-center">
              <p className="text-base font-semibold text-gray-900">
                Thank you for shopping with Praba&apos;s Aari!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
