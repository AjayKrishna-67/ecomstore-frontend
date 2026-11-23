import { NextResponse } from 'next/server';
import {
  addItemToOrder,
  addAddonsToOrderLine,
  adjustOrderLine,
  getActiveOrder,
  getActiveOrderWithHeaders,
  removeOrderLine,
  setCustomerForOrder,
  setOrderShippingAddress,
  setOrderShippingMethod,
  getCouponCodeList,
  removeCouponCode,
  removeAllOrderLines,
} from '@/providers/orders';
import {
  CreateAddressInput,
  CreateCustomerInput,
  ErrorCode,
  ErrorResult,
  OrderDetailFragment,
} from '@/generated/graphql';
import { getSession, setAuthToken } from '@/lib/session';
import { shippingFormDataIsValid } from '@/lib/validation';

export async function GET(request: Request) {
  const { activeOrder, _headers } = await getActiveOrderWithHeaders();

  // Persist anonymous auth token if not already signed in
  const vendureAuthToken = _headers.get('vendure-auth-token');
  const session = await getSession();

  if (vendureAuthToken && !session.authToken) {
    await setAuthToken(vendureAuthToken);
  }

  return NextResponse.json({ activeOrder });
}

export async function POST(request: Request) {
  const body = await request.formData();
  const formAction = body.get('action');
  let activeOrder: OrderDetailFragment | undefined = undefined;
  let error: ErrorResult = {
    errorCode: ErrorCode.NoActiveOrderError,
    message: '',
  };
  let vendureAuthToken: string | undefined;

  switch (formAction) {
    case 'setCheckoutShipping':
      if (shippingFormDataIsValid(body)) {
        const get = (k: string) => {
          const v = body.get(k);
          if (v == null) return undefined;
          const s = String(v).trim();
          if (!s || s === 'null' || s === 'undefined' || s === '[object Object]') {
            return undefined;
          }
          return s;
        };
        const result = await setOrderShippingAddress({
          city: get('city') ?? '',
          company: get('company'),
          countryCode: get('countryCode') ?? 'IN',
          fullName: get('fullName') ?? '',
          phoneNumber: get('phoneNumber'),
          postalCode: get('postalCode') ?? '',
          province: get('province'),
          streetLine1: get('streetLine1') ?? '',
          streetLine2: get('streetLine2'),
        } as CreateAddressInput);
        if (result.setOrderShippingAddress.__typename === 'Order') {
          activeOrder = result.setOrderShippingAddress;
        } else {
          error = result.setOrderShippingAddress as ErrorResult;
          console.error(
            'setOrderShippingAddress failed:',
            error,
          );
        }
      } else {
        console.error(
          'setCheckoutShipping: invalid shipping form data',
          Object.fromEntries(body.entries()),
        );
      }
      break;
    case 'setOrderCustomer': {
      const customerData = Object.fromEntries<any>(
        body.entries(),
      ) as CreateCustomerInput;
      const result = await setCustomerForOrder(
        {
          emailAddress: customerData.emailAddress,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
        },
      );
      if (result.setCustomerForOrder.__typename === 'Order') {
        activeOrder = result.setCustomerForOrder;
      } else {
        error = result.setCustomerForOrder as ErrorResult;
      }
      break;
    }
    case 'setShippingMethod': {
      const shippingMethodId = body.get('shippingMethodId');
      if (typeof shippingMethodId === 'string') {
        const result = await setOrderShippingMethod(shippingMethodId);
        if (result.setOrderShippingMethod.__typename === 'Order') {
          activeOrder = result.setOrderShippingMethod;
        } else {
          error = result.setOrderShippingMethod as ErrorResult;
        }
      }
      break;
    }
    case 'removeItem': {
      const lineId = body.get('lineId');

      // Get current order to check if we're removing a coupon product
      const currentOrder = await getActiveOrder();
      const line = currentOrder?.lines.find((l) => l.id === lineId);
      const appliedCouponCode = currentOrder?.couponCodes?.[0];

      // Check if the item being removed is a coupon product
      if (line && appliedCouponCode) {
        try {
          const couponList = await getCouponCodeList();
          const coupon = couponList.find(
            (c) => c.couponCode === appliedCouponCode,
          );

          if (coupon) {
            const productVariantIds: string[] = [];
            for (const condition of coupon.conditions) {
              const variantArg = condition.args.find(
                (arg: any) => arg.name === 'productVariantIds',
              );
              if (variantArg && variantArg.value) {
                try {
                  let parsedIds: string[] | string = variantArg.value;
                  if (variantArg.value.startsWith('[')) {
                    parsedIds = JSON.parse(variantArg.value);
                  } else {
                    parsedIds = [variantArg.value];
                  }
                  if (Array.isArray(parsedIds)) {
                    productVariantIds.push(
                      ...parsedIds.map((id) => id.toString()),
                    );
                  } else if (typeof parsedIds === 'string') {
                    productVariantIds.push(parsedIds);
                  }
                } catch (e) {
                  console.error(
                    'Failed to parse productVariantIds:',
                    variantArg.value,
                    e,
                  );
                }
              }
            }

            const isCouponProduct = productVariantIds
              .map(String)
              .includes(String(line.productVariant.id));

            if (isCouponProduct) {
              // Remove the coupon first
              await removeCouponCode(appliedCouponCode);
            }
          }
        } catch (error) {
          console.error('Error checking/removing coupon:', error);
          // Continue with item removal even if coupon removal fails
        }
      }

      // Remove the item
      let result;
      try {
        result = await removeOrderLine(lineId?.toString() ?? '');
      } catch (e) {
        // Order line may not exist (stale session) -- return current order
        console.error('Error removing order line:', e);
        activeOrder = (await getActiveOrder()) ?? undefined;
        break;
      }
      vendureAuthToken = result._headers?.get('vendure-auth-token') ?? vendureAuthToken;
      if (result.removeOrderLine.__typename === 'Order') {
        activeOrder = result.removeOrderLine;

        // After removing the item, check if only coupon items remain
        const updatedOrder = await getActiveOrder();
        const appliedCouponCode = updatedOrder?.couponCodes?.[0];

        if (
          appliedCouponCode &&
          updatedOrder?.lines &&
          updatedOrder.lines.length > 0
        ) {
          try {
            const couponList = await getCouponCodeList();
            const coupon = couponList.find(
              (c) => c.couponCode === appliedCouponCode,
            );

            if (coupon) {
              const productVariantIds: string[] = [];
              for (const condition of coupon.conditions) {
                const variantArg = condition.args.find(
                  (arg: any) => arg.name === 'productVariantIds',
                );
                if (variantArg && variantArg.value) {
                  try {
                    let parsedIds: string[] | string = variantArg.value;
                    if (variantArg.value.startsWith('[')) {
                      parsedIds = JSON.parse(variantArg.value);
                    } else {
                      parsedIds = [variantArg.value];
                    }
                    if (Array.isArray(parsedIds)) {
                      productVariantIds.push(
                        ...parsedIds.map((id) => id.toString()),
                      );
                    } else if (typeof parsedIds === 'string') {
                      productVariantIds.push(parsedIds);
                    }
                  } catch (e) {
                    console.error(
                      'Failed to parse productVariantIds:',
                      variantArg.value,
                      e,
                    );
                  }
                }
              }

              // Check if all remaining items are coupon items
              const allItemsAreCouponItems = updatedOrder.lines.every((line) =>
                productVariantIds.includes(line.productVariant.id),
              );

              // If all items are coupon items, remove the coupon (but keep the products)
              if (allItemsAreCouponItems) {
                console.log(
                  'All remaining items are coupon items, removing coupon:',
                  appliedCouponCode,
                );
                try {
                  await removeCouponCode(appliedCouponCode);
                  console.log('Coupon removed successfully');

                  const finalOrder = await getActiveOrder();
                  activeOrder = finalOrder ? finalOrder : undefined;
                } catch (error) {
                  console.error('Failed to remove coupon:', error);
                }
              }
            }
          } catch (error) {
            console.error('Error checking coupon items:', error);
          }
        }
      } else {
        error = result.removeOrderLine as ErrorResult;
      }
      break;
    }
    case 'adjustItem': {
      const lineId = body.get('lineId');
      const quantity = body.get('quantity');
      if (lineId && quantity != null) {
        let result;
        try {
          result = await adjustOrderLine(lineId?.toString(), +quantity);
        } catch (e) {
          console.error('Error adjusting order line:', e);
          activeOrder = (await getActiveOrder()) ?? undefined;
          break;
        }
        vendureAuthToken = result._headers?.get('vendure-auth-token') ?? vendureAuthToken;
        if (result.adjustOrderLine.__typename === 'Order') {
          activeOrder = result.adjustOrderLine;

          const updatedOrder = await getActiveOrder();
          const appliedCouponCode = updatedOrder?.couponCodes?.[0];

          if (
            appliedCouponCode &&
            updatedOrder?.lines &&
            updatedOrder.lines.length > 0
          ) {
            try {
              const couponList = await getCouponCodeList();
              const coupon = couponList.find(
                (c) => c.couponCode === appliedCouponCode,
              );

              if (coupon) {
                const productVariantIds: string[] = [];
                for (const condition of coupon.conditions) {
                  const variantArg = condition.args.find(
                    (arg: any) => arg.name === 'productVariantIds',
                  );
                  if (variantArg && variantArg.value) {
                    try {
                      let parsedIds: string[] | string = variantArg.value;
                      if (variantArg.value.startsWith('[')) {
                        parsedIds = JSON.parse(variantArg.value);
                      } else {
                        parsedIds = [variantArg.value];
                      }
                      if (Array.isArray(parsedIds)) {
                        productVariantIds.push(
                          ...parsedIds.map((id) => id.toString()),
                        );
                      } else if (typeof parsedIds === 'string') {
                        productVariantIds.push(parsedIds);
                      }
                    } catch (e) {
                      console.error(
                        'Failed to parse productVariantIds:',
                        variantArg.value,
                        e,
                      );
                    }
                  }
                }

                const allItemsAreCouponItems = updatedOrder.lines.every(
                  (line) => productVariantIds.includes(line.productVariant.id),
                );

                const minAmountCondition = coupon.conditions.find(
                  (c: any) =>
                    c.code === 'minimum_order_amount' ||
                    c.code === 'minimumOrderAmount' ||
                    c.code === 'minimumAmount',
                );

                const subtotalPaise = updatedOrder?.lines.reduce(
                  (acc: number, line) => acc + (line.linePriceWithTax ?? 0),
                  0,
                ) ?? 0;
                let shouldRemoveCoupon = allItemsAreCouponItems;

                if (minAmountCondition && !shouldRemoveCoupon) {
                  const amountArg =
                    minAmountCondition.args.find(
                      (a: any) => a.name === 'amount',
                    ) ?? minAmountCondition.args[0];
                  const minAmountPaise =
                    Number.parseInt(amountArg.value, 10) || 0;

                  if (subtotalPaise < minAmountPaise) {
                    shouldRemoveCoupon = true;
                    console.log(
                      `Order subtotal ${subtotalPaise} is below minimum ${minAmountPaise}, removing coupon: ${appliedCouponCode}`,
                    );
                  }
                }

                if (shouldRemoveCoupon) {
                  console.log('Removing coupon:', appliedCouponCode);
                  try {
                    await removeCouponCode(appliedCouponCode);
                    console.log('Coupon removed successfully');

                    const finalOrder = await getActiveOrder();
                    activeOrder = finalOrder ? finalOrder : undefined;
                  } catch (error) {
                    console.error('Failed to remove coupon:', error);
                  }
                }
              }
            } catch (error) {
              console.error('Error checking coupon items:', error);
            }
          }
        } else {
          error = result.adjustOrderLine as ErrorResult;
        }
      }
      break;
    }
    case 'addItemToOrder': {
      const variantId = body.get('variantId')?.toString();
      const quantity = Number(body.get('quantity')?.toString() ?? 1);
      if (!variantId || !(quantity > 0)) {
        return NextResponse.json(
          { error: `Invalid input: variantId ${variantId}, quantity ${quantity}` },
          { status: 400 },
        );
      }
      let result;
      try {
        result = await addItemToOrder(variantId, quantity);
      } catch (e) {
        console.error('Error adding item to order:', e);
        activeOrder = (await getActiveOrder()) ?? undefined;
        break;
      }
      vendureAuthToken = result._headers?.get('vendure-auth-token') ?? undefined;

      // The mutation responses don't include `__typename` (none of our gql docs
      // request it), so we can't reliably discriminate the union here. Detect
      // success by shape — a successful Order result has an `id` and `lines`;
      // an ErrorResult has `errorCode` and `message`.
      const addItemPayload = result.addItemToOrder as any;
      const isErrorShape = addItemPayload && typeof addItemPayload === 'object' && 'errorCode' in addItemPayload;
      if (isErrorShape) {
        error = addItemPayload as ErrorResult;
        break;
      }
      activeOrder = addItemPayload as OrderDetailFragment;

      // Optional addons attached in the same request — avoids a race where the
      // client tries to look up the freshly-added line before SWR has refetched.
      const selectionsRaw = body.get('selections')?.toString();
      if (selectionsRaw) {
        let selections: Array<{
          addonGroupId: string;
          items: Array<{ addonItemId: string; quantity: number }>;
        }> | null = null;
        try {
          selections = JSON.parse(selectionsRaw);
        } catch {
          console.error('addItemToOrder: selections is not valid JSON');
        }
        if (selections && selections.length > 0) {
          // Pull lines from the addItem response if present, otherwise refetch.
          let lines: any[] = activeOrder?.lines ?? [];
          if (lines.length === 0) {
            const refreshed = await getActiveOrder();
            lines = (refreshed?.lines ?? []) as any[];
            if (refreshed) activeOrder = refreshed as OrderDetailFragment;
          }
          const targetLine = [...lines]
            .reverse()
            .find((l: any) => String(l?.productVariant?.id) === String(variantId));
          if (targetLine) {
            try {
              // When addItemToOrder created a fresh anonymous session, its new
              // auth token is in vendureAuthToken but hasn't been written to
              // our session cookie yet (we only save at the end of the route).
              // Pass it directly so this follow-up mutation hits the same
              // backend session — otherwise the backend rejects with
              // "error.no-active-session".
              const sessionForAddons = await getSession();
              const addonAuth = vendureAuthToken ?? sessionForAddons.authToken ?? undefined;
              const addonResult = await addAddonsToOrderLine(
                String((targetLine as any).id),
                selections,
                addonAuth,
              );
              activeOrder = addonResult.addAddonsToOrderLine as any;
            } catch (e: any) {
              const gqlMessage =
                e?.response?.errors?.[0]?.message ??
                e?.response?.error ??
                e?.message;
              console.error('addAddonsToOrderLine (inline) failed:', gqlMessage ?? e);
              error = {
                errorCode: ErrorCode.UnknownError ?? ErrorCode.NoActiveOrderError,
                message: gqlMessage ?? 'Failed to attach addons',
              } as any;
            }
          } else {
            console.warn(
              'addItemToOrder: no line found to attach addons to for variant',
              variantId,
            );
          }
        }
      }
      break;
    }
    case 'removeAllItems': {
      const result = await removeAllOrderLines();
      if (result.removeAllOrderLines.__typename !== 'Order') {
        error = result.removeAllOrderLines as any;
      }
      break;
    }
    case 'addAddonsToOrderLine': {
      const orderLineId = body.get('orderLineId')?.toString();
      const selectionsRaw = body.get('selections')?.toString();
      if (!orderLineId || !selectionsRaw) {
        return NextResponse.json(
          { error: 'Missing orderLineId or selections' },
          { status: 400 },
        );
      }
      let selections: Array<{
        addonGroupId: string;
        items: Array<{ addonItemId: string; quantity: number }>;
      }>;
      try {
        selections = JSON.parse(selectionsRaw);
      } catch {
        return NextResponse.json({ error: 'selections is not valid JSON' }, { status: 400 });
      }
      try {
        const result = await addAddonsToOrderLine(orderLineId, selections);
        activeOrder = result.addAddonsToOrderLine as any;
      } catch (e: any) {
        const gqlMessage =
          e?.response?.errors?.[0]?.message ??
          e?.response?.error ??
          e?.message;
        console.error('addAddonsToOrderLine failed:', gqlMessage ?? e);
        error = {
          errorCode: ErrorCode.UnknownError ?? ErrorCode.NoActiveOrderError,
          message: gqlMessage ?? 'Failed to attach addons',
        } as any;
      }
      break;
    }
    case 'addPaymentToOrder': {
      // Handle payment addition (not implemented in provided code)
      break;
    }
    default:
    // Don't do anything
  }

  const session = await getSession();

  // Persist anonymous auth token if user is not signed in
  if (vendureAuthToken && !session.authToken) {
    session.authToken = vendureAuthToken;
    await session.save();
  }

  // Always re-fetch the active order to get computed fields like quantityLimitStatus
  const finalActiveOrder = (await getActiveOrder()) || activeOrder;

  return NextResponse.json({
    activeOrder: finalActiveOrder || undefined,
    error: error?.errorCode !== ErrorCode.NoActiveOrderError ? error : undefined,
  });
}
