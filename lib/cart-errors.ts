import { ErrorCode, type ErrorResult } from '@/generated/graphql';

// Maps Vendure ErrorResult codes raised by addItemToOrder / adjustOrderLine
// to user-visible messages.
//
// - OrderInterceptorError carries the real reason in `interceptorError`
//   (custom plugins use this for per-customer caps, customer-group gating,
//   region availability, etc.). Return that field, not the generic message.
// - The other four codes use Vendure's built-in message verbatim.
// - Anything else falls through to undefined — the UI silently ignores it
//   (e.g. NO_ACTIVE_ORDER_ERROR, transient internal codes).
export function getAddItemToOrderError(
  error?: ErrorResult | null,
): string | undefined {
  if (!error || !error.errorCode) return undefined;

  if (
    error.errorCode === ErrorCode.OrderInterceptorError &&
    'interceptorError' in error &&
    (error as any).interceptorError
  ) {
    return (error as any).interceptorError;
  }

  switch (error.errorCode) {
    case ErrorCode.OrderModificationError:
    case ErrorCode.OrderLimitError:
    case ErrorCode.NegativeQuantityError:
    case ErrorCode.InsufficientStockError:
      return error.message;
  }

  return undefined;
}

// The backend's stock `unavailableReason` is very verbose and repeats the full
// product + variant name, e.g.:
//   Only 5 of "Pavadai sattai ... 107 (Pavadai sattai ... 107 0 to 6 months)"
//   available, kindly decrease quantity
// The UI already shows the item name as a heading, so collapse this to a short,
// non-redundant line. Non-matching messages are returned unchanged.
export function shortenStockReason(reason?: string | null): string {
  if (!reason) return '';
  const match = reason.match(/only\s+(\d+)\b.*available/i);
  if (match) return `Only ${match[1]} available — please reduce the quantity.`;
  return reason;
}
