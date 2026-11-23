import gql from 'graphql-tag';
import { sdk } from '@/lib/graphql-client';
import {
  CreateAddressInput,
  CreateCustomerInput,
  PaymentInput,
} from '@/generated/graphql';

export function getActiveOrder() {
  return sdk.activeOrder().then(({ activeOrder }) => activeOrder);
}

export function getActiveOrderWithHeaders() {
  return sdk.activeOrder().then((result) => ({
    activeOrder: result.activeOrder,
    _headers: result._headers,
  }));
}

export function getOrderByCode(code: string) {
  return sdk.orderByCode({ code }).then(({ orderByCode }) => orderByCode);
}

export function addItemToOrder(productVariantId: string, quantity: number) {
  return sdk.addItemToOrder({ productVariantId, quantity });
}

export function addAddonsToOrderLine(
  orderLineId: string,
  selections: Array<{ addonGroupId: string; items: Array<{ addonItemId: string; quantity: number }> }>,
  authToken?: string,
) {
  return sdk.addAddonsToOrderLine(
    { input: { orderLineId, selections } },
    authToken ? { authToken } : undefined,
  );
}

export function removeOrderLine(lineId: string) {
  return sdk.removeOrderLine({ orderLineId: lineId });
}

export function removeAllOrderLines() {
  return sdk.removeAllOrderLines({});
}

export function adjustOrderLine(lineId: string, quantity: number) {
  return sdk.adjustOrderLine({ orderLineId: lineId, quantity });
}

export function setCustomerForOrder(input: CreateCustomerInput) {
  return sdk.setCustomerForOrder({ input });
}

export function setOrderShippingAddress(input: CreateAddressInput) {
  return sdk.setOrderShippingAddress({ input });
}

export function setOrderShippingMethod(shippingMethodId: string) {
  return sdk.setOrderShippingMethod({ shippingMethodId });
}

export function addPaymentToOrder(input: PaymentInput) {
  return sdk.addPaymentToOrder({ input });
}

export function applyCouponCode(input: string) {
  return sdk
    .ApplyCouponCode({ input })
    .then((response) => response.applyCouponCode);
}

export function removeCouponCode(couponCode: string) {
  return sdk
    .RemoveCouponCode({ couponCode })
    .then((response) => response.removeCouponCode);
}

export function getCouponCodeList() {
  return sdk.GetCouponCodeList().then((response) =>
    response.getCouponCodeList.items.map((c) => ({
      id: c.promotion.id,
      name: c.promotion.name,
      couponCode: c.promotion.couponCode,
      description: c.promotion.description,
      enabled: c.promotion.enabled,
      endsAt: c.promotion.endsAt,
      startsAt: c.promotion.startsAt,
      usageLimit: c.promotion.usageLimit,
      updatedAt: c.promotion.updatedAt,
      perCustomerUsageLimit: c.promotion.perCustomerUsageLimit,
      conditions: c.promotion.conditions.map((condition) => ({
        code: condition.code,
        args: condition.args.map((arg) => ({
          name: arg.name,
          value: arg.value,
        })),
      })),
      actions: c.promotion.actions.map((action) => ({
        code: action.code,
        args: action.args.map((arg) => ({
          name: arg.name,
          value: arg.value,
        })),
      })),
      productVariants: c.productVariants,
      facetValues: c.facetValues,
      customerGroup: c.customerGroup,
    })),
  );
}

export async function addCouponProductToCart(couponCode: string) {
  const couponList = await getCouponCodeList();
  const coupon = couponList.find((c) => c.couponCode === couponCode);

  if (!coupon) {
    throw new Error(`Coupon code ${couponCode} not found`);
  }

  const productVariantIds: string[] = [];

  for (const condition of coupon.conditions) {
    if (condition.code === 'contains_products') {
      const variantArg = condition.args.find(
        (arg) => arg.name === 'productVariantIds',
      );
      if (variantArg?.value) {
        try {
          const parsed = variantArg.value.startsWith('[')
            ? JSON.parse(variantArg.value)
            : [variantArg.value];
          const ids = Array.isArray(parsed)
            ? parsed.map((id: any) => id.toString())
            : [String(parsed)];
          productVariantIds.push(...ids);
        } catch {
          throw new Error(
            `Invalid productVariantIds format for coupon ${couponCode}`,
          );
        }
      }
    }

    if (condition.code === 'buy_x_get_y_free') {
      const variantIdsYArg = condition.args.find(
        (arg) => arg.name === 'variantIdsY',
      );
      if (variantIdsYArg?.value) {
        try {
          const parsed = variantIdsYArg.value.startsWith('[')
            ? JSON.parse(variantIdsYArg.value)
            : [variantIdsYArg.value];
          const ids = Array.isArray(parsed)
            ? parsed.map((id: any) => id.toString())
            : [String(parsed)];
          productVariantIds.push(...ids);
        } catch {
          throw new Error(
            `Invalid variantIdsY format for coupon ${couponCode}`,
          );
        }
      }
    }
  }

  if (productVariantIds.length === 0) {
    throw new Error(`No product variant ID found for coupon code ${couponCode}`);
  }

  const initialOrder = await getActiveOrder();
  const cartVariantIds = new Set(
    initialOrder?.lines?.map((line) => line.productVariant.id) ?? [],
  );
  const missingVariantIds = productVariantIds.filter(
    (id) => !cartVariantIds.has(id),
  );

  if (missingVariantIds.length === 0) {
    return { addedProductVariantIds: [] };
  }

  const addedIds: string[] = [];
  for (const productVariantId of missingVariantIds) {
    try {
      const result = await addItemToOrder(productVariantId, 1);
      if (result.addItemToOrder.__typename === 'Order') {
        addedIds.push(productVariantId);
      }
    } catch {
      console.warn(`Skipping variant ${productVariantId}`);
    }
  }

  return { addedProductVariantIds: addedIds };
}

export async function removeCouponProductFromCart(couponCode: string) {
  const couponList = await getCouponCodeList();
  const coupon = couponList.find((c) => c.couponCode === couponCode);

  if (!coupon) {
    throw new Error(`Coupon code ${couponCode} not found`);
  }

  const productVariantIds: string[] = [];

  for (const condition of coupon.conditions) {
    if (condition.code === 'contains_products') {
      const variantArg = condition.args.find(
        (arg) => arg.name === 'productVariantIds',
      );
      if (variantArg?.value) {
        try {
          const parsed = variantArg.value.startsWith('[')
            ? JSON.parse(variantArg.value)
            : [variantArg.value];
          const ids = Array.isArray(parsed)
            ? parsed.map((id: any) => id.toString())
            : [String(parsed)];
          productVariantIds.push(...ids);
        } catch {}
      }
    }

    if (condition.code === 'buy_x_get_y_free') {
      const variantIdsYArg = condition.args.find(
        (arg) => arg.name === 'variantIdsY',
      );
      if (variantIdsYArg?.value) {
        try {
          const parsed = variantIdsYArg.value.startsWith('[')
            ? JSON.parse(variantIdsYArg.value)
            : [variantIdsYArg.value];
          const ids = Array.isArray(parsed)
            ? parsed.map((id: any) => id.toString())
            : [String(parsed)];
          productVariantIds.push(...ids);
        } catch {}
      }
    }
  }

  if (productVariantIds.length === 0) return null;

  const activeOrder = await getActiveOrder();
  if (!activeOrder?.lines) return activeOrder;

  for (const productVariantId of productVariantIds) {
    const lineToAdjust = activeOrder.lines.find(
      (line) => line.productVariant.id === productVariantId,
    );
    if (!lineToAdjust) continue;

    if (lineToAdjust.quantity > 1) {
      await adjustOrderLine(lineToAdjust.id, lineToAdjust.quantity - 1);
    } else {
      await removeOrderLine(lineToAdjust.id);
    }
  }

  return await getActiveOrder();
}

gql`
  fragment OrderDetail on Order {
    id
    code
    active
    state
    currencyCode
    createdAt
    updatedAt
    orderPlacedAt
    totalQuantity
    subTotal
    subTotalWithTax
    total
    totalWithTax
    shipping
    shippingWithTax
    couponCodes
    isAvailable
    unavailableReason
    lines {
      id
      quantity
      unitPrice
      unitPriceWithTax
      linePrice
      linePriceWithTax
      lineTax
      discountedLinePrice
      discountedLinePriceWithTax
      discountedUnitPrice
      discountedUnitPriceWithTax
      proratedLinePrice
      proratedLinePriceWithTax
      isAvailable
      unavailableReason
      featuredAsset {
        id
        preview
      }
      productVariant {
        id
        name
        stockLevel
        facetValues {
          id
        }
        customFields {
          maxOrderQuantity
        }
        product {
          slug
          facetValues {
            id
          }
        }
      }
      discounts {
        type
        amount
        amountWithTax
        description
        adjustmentSource
      }
      addonSelections {
        groupId
        groupName
        enabled
        items {
          itemId
          itemName
          quantity
          unitPrice
          imageUrl
          enabled
        }
      }
      addonsAvailable
    }
    shippingLines {
      id
      shippingMethod {
        id
        name
      }
      priceWithTax
    }
    discounts {
      type
      amount
      amountWithTax
      description
      adjustmentSource
    }
    surcharges {
      id
      description
      price
      priceWithTax
    }
    customer {
      emailAddress
      firstName
      lastName
    }
    shippingAddress {
      fullName
      company
      streetLine1
      streetLine2
      city
      province
      postalCode
      phoneNumber
      country
      countryCode
    }
    billingAddress {
      fullName
      company
      streetLine1
      streetLine2
      city
      province
      postalCode
      phoneNumber
      country
      countryCode
    }
    payments {
      id
      method
      amount
      state
      errorMessage
    }
    customFields {
      otherInstructions
      loyaltyPointsUsed
      loyaltyPointsEarned
      invoiceNo
    }
    validationStatus {
      isValid
      hasUnavailableItems
      message
      unavailableItems {
        orderLineId
        reason
        productName
        variantName
      }
    }
    quantityLimitStatus {
      hasViolations
      isValid
      totalViolations
      violations {
        orderLineId
        reason
        maxQuantity
        currentQuantity
        productName
        variantName
        maxAllowedInCart
      }
    }
    taxSummary {
      taxRate
      taxBase
      taxTotal
      description
    }
    promotions {
      id
      name
      couponCode
    }
  }
`;

gql`
  query activeOrder {
    activeOrder {
      ...OrderDetail
    }
  }
`;

gql`
  query orderByCode($code: String!) {
    orderByCode(code: $code) {
      ...OrderDetail
    }
  }
`;

gql`
  mutation addItemToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      ... on Order {
        ...OrderDetail
      }
      ... on ErrorResult {
        errorCode
        message
      }
      ... on OrderInterceptorError {
        interceptorError
      }
      ... on InsufficientStockError {
        errorCode
        message
        quantityAvailable
        order {
          ...OrderDetail
        }
      }
    }
  }
`;

gql`
  mutation removeOrderLine($orderLineId: ID!) {
    removeOrderLine(orderLineId: $orderLineId) {
      ... on Order {
        ...OrderDetail
      }
      ... on ErrorResult {
        errorCode
        message
      }
      ... on OrderInterceptorError {
        interceptorError
      }
    }
  }
`;

gql`
  mutation removeAllOrderLines {
    removeAllOrderLines {
      ... on Order {
        ...OrderDetail
      }
      ... on ErrorResult {
        errorCode
        message
      }
      ... on OrderInterceptorError {
        interceptorError
      }
    }
  }
`;

gql`
  mutation adjustOrderLine($orderLineId: ID!, $quantity: Int!) {
    adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
      ... on Order {
        ...OrderDetail
      }
      ... on ErrorResult {
        errorCode
        message
      }
      ... on OrderInterceptorError {
        interceptorError
      }
      ... on InsufficientStockError {
        errorCode
        message
        quantityAvailable
        order {
          ...OrderDetail
        }
      }
    }
  }
`;

gql`
  mutation addAddonsToOrderLine($input: AddAddonsToOrderLineInput!) {
    addAddonsToOrderLine(input: $input) {
      ...OrderDetail
    }
  }
`;

gql`
  mutation setCustomerForOrder($input: CreateCustomerInput!) {
    setCustomerForOrder(input: $input) {
      ... on Order {
        ...OrderDetail
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

gql`
  mutation setOrderShippingAddress($input: CreateAddressInput!) {
    setOrderShippingAddress(input: $input) {
      ... on Order {
        ...OrderDetail
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

gql`
  mutation setOrderShippingMethod($shippingMethodId: [ID!]!) {
    setOrderShippingMethod(shippingMethodId: $shippingMethodId) {
      ... on Order {
        ...OrderDetail
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

gql`
  mutation addPaymentToOrder($input: PaymentInput!) {
    addPaymentToOrder(input: $input) {
      ... on Order {
        ...OrderDetail
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

gql`
  mutation ApplyCouponCode($input: String!) {
    applyCouponCode(couponCode: $input) {
      ... on Order {
        ...OrderDetail
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

gql`
  mutation RemoveCouponCode($couponCode: String!) {
    removeCouponCode(couponCode: $couponCode) {
      ...OrderDetail
    }
  }
`;

gql`
  query GetCouponCodeList {
    getCouponCodeList {
      items {
        promotion {
          id
          name
          couponCode
          description
          enabled
          endsAt
          startsAt
          usageLimit
          updatedAt
          perCustomerUsageLimit
          conditions {
            code
            args {
              name
              value
            }
          }
          actions {
            code
            args {
              name
              value
            }
          }
        }
        productVariants {
          id
          name
        }
        facetValues {
          id
          name
        }
        customerGroup {
          id
          name
        }
      }
      totalItems
    }
  }
`;
