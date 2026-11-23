import { useTranslation } from 'react-i18next';

// Copied from https://www.vendure.io/docs/typescript-api/orders/order-state/
type OrderState =
  | 'Created'
  | 'Draft'
  | 'AddingItems'
  | 'ArrangingPayment'
  | 'PaymentAuthorized'
  | 'PaymentSettled'
  | 'PartiallyShipped'
  | 'Shipped'
  | 'PartiallyDelivered'
  | 'Delivered'
  | 'Modifying'
  | 'ArrangingAdditionalPayment'
  | 'CancellationRequested'
  | 'Cancelled';

export function OrderStateBadge({ state }: { state?: string }) {
  const { t } = useTranslation();

  let colorClasses = '';
  switch (state as OrderState) {
    default:
    case 'Draft':
    case 'AddingItems':
      colorClasses =
        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      break;
    case 'PaymentAuthorized':
    case 'PaymentSettled':
    case 'Shipped':
      colorClasses =
        'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';
      break;
    case 'Delivered':
      colorClasses =
        'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300';
      break;
    case 'PartiallyShipped':
    case 'PartiallyDelivered':
    case 'Modifying':
    case 'ArrangingPayment':
    case 'ArrangingAdditionalPayment':
      colorClasses =
        'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
      break;
    case 'CancellationRequested':
      colorClasses =
        'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300';
      break;
    case 'Cancelled':
      colorClasses =
        'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300';
      break;
  }

  return (
    <span
      className={`text-xs font-medium px-2.5 py-0.5 rounded uppercase whitespace-nowrap ${colorClasses}`}
    >
      {t(`order.states.${state}`) ?? t(`order.states.Unknown`)}
    </span>
  );
}
