import { NextResponse } from 'next/server';
import {
  getActiveOrder,
  applyCouponCode,
  removeCouponCode,
  getCouponCodeList,
  addCouponProductToCart,
  removeCouponProductFromCart,
  adjustOrderLine,
  removeOrderLine,
} from '@/providers/orders';
import {
  otherInstructions,
  applyLoyaltyPoints,
  removeLoyaltyPoints,
} from '@/providers/custom-plugins';
import { getActiveCustomer } from '@/providers/customer';

/** Parse a coupon arg value that may be a JSON array string or a bare scalar. */
function parseIdList(value: string | undefined | null): string[] {
  if (!value) return [];
  try {
    const parsed = value.startsWith('[') ? JSON.parse(value) : [value];
    return (Array.isArray(parsed) ? parsed : [parsed]).map(String);
  } catch {
    return [value];
  }
}

/** Facet value ids on a cart line, from both the variant and its product. */
function lineFacetIds(line: any): string[] {
  const variantFacets = (line?.productVariant?.facetValues ?? []).map(
    (f: any) => String(f.id),
  );
  const productFacets = (line?.productVariant?.product?.facetValues ?? []).map(
    (f: any) => String(f.id),
  );
  return [...variantFacets, ...productFacets];
}

export async function POST(request: Request) {
  const body = await request.json();
  const action = body.action;

  if (action === 'applyLoyaltyPoints') {
    const amount = Number(body.amount);
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid points amount.' },
        { status: 400 },
      );
    }
    try {
      const result = await applyLoyaltyPoints(amount);
      if (result && (result as any).id) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to apply loyalty points.' },
        { status: 400 },
      );
    } catch (e: any) {
      return NextResponse.json(
        { success: false, error: e?.message || 'Error applying loyalty points.' },
        { status: 400 },
      );
    }
  }

  if (action === 'removeLoyaltyPoints') {
    try {
      const result = await removeLoyaltyPoints();
      if (result && (result as any).__typename === 'Order' && (result as any).id) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json(
        { success: false, error: (result as any)?.message || 'Failed to remove loyalty points.' },
        { status: 400 },
      );
    } catch (e: any) {
      return NextResponse.json(
        { success: false, error: e?.message || 'Error removing loyalty points.' },
        { status: 400 },
      );
    }
  }

  if (action === 'updateOrderInstructions') {
    const { orderId, instructions } = body;
    if (typeof orderId === 'string' && typeof instructions === 'string') {
      try {
        await otherInstructions(orderId, instructions);
        return NextResponse.json({ success: true });
      } catch {
        return NextResponse.json({ success: false, error: 'Failed to save instructions' });
      }
    }
    return NextResponse.json({ success: false, error: 'Invalid data' });
  }

  if (action === 'applyCoupon') {
    const couponCode = body.couponCode as string;
    if (!couponCode) {
      return NextResponse.json({ success: false, error: 'Coupon code is required.' }, { status: 400 });
    }

    const couponCodes = await getCouponCodeList();
    const coupon = couponCodes.find((c: any) => c.couponCode === couponCode);
    if (!coupon || !coupon.couponCode) {
      return NextResponse.json({ success: false, error: 'Coupon not found.' }, { status: 400 });
    }

    if (!coupon.enabled) {
      return NextResponse.json({ success: false, error: 'Coupon not available.' }, { status: 400 });
    }

    if (coupon.startsAt && new Date() < new Date(coupon.startsAt)) {
      return NextResponse.json({ success: false, error: 'Coupon not started yet.' }, { status: 400 });
    }

    if (coupon.endsAt && new Date() > new Date(coupon.endsAt)) {
      return NextResponse.json({ success: false, error: 'Coupon expired.' }, { status: 400 });
    }

    const activeOrder = await getActiveOrder();

    if (activeOrder?.couponCodes?.includes(couponCode)) {
      return NextResponse.json({ success: false, error: 'Already applied.' }, { status: 400 });
    }

    if (activeOrder?.couponCodes && activeOrder.couponCodes.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Only 1 coupon per order. Please remove the existing coupon first.',
      }, { status: 400 });
    }

    const cartLines = activeOrder?.lines ?? [];

    // Collect free product variant IDs
    const couponFreeVariantIds = new Set<string>();
    for (const cond of coupon.conditions) {
      if (cond.code === 'contains_products') {
        const vArg = cond.args.find((a: any) => a.name === 'productVariantIds');
        if (vArg?.value) {
          try {
            const parsed = vArg.value.startsWith('[') ? JSON.parse(vArg.value) : [vArg.value];
            (Array.isArray(parsed) ? parsed : [parsed]).forEach((id: any) => couponFreeVariantIds.add(String(id)));
          } catch {}
        }
      }
      if (cond.code === 'buy_x_get_y_free') {
        const yArg = cond.args.find((a: any) => a.name === 'variantIdsY');
        if (yArg?.value) {
          try {
            const parsed = yArg.value.startsWith('[') ? JSON.parse(yArg.value) : [yArg.value];
            (Array.isArray(parsed) ? parsed : [parsed]).forEach((id: any) => couponFreeVariantIds.add(String(id)));
          } catch {}
        }
      }
    }

    // Validate conditions
    for (const condition of coupon.conditions) {
      switch (condition.code) {
        case 'minimum_order_amount':
        case 'minimumOrderAmount':
        case 'minimumAmount': {
          const amountArg = condition.args.find((a: any) => a.name === 'amount') ?? condition.args[0];
          const taxInclusiveArg = condition.args.find((a: any) => a.name === 'taxInclusive');
          const isTaxInclusive = taxInclusiveArg?.value === 'true';
          const minPaise = parseInt(amountArg?.value ?? '0', 10) || 0;
          const freeProductTotal = cartLines
            .filter((l) => couponFreeVariantIds.has(l.productVariant.id))
            .reduce((sum, l) => sum + (l as any).linePriceWithTax * 1, 0);
          const baseSubTotal = isTaxInclusive
            ? (activeOrder?.subTotalWithTax ?? 0)
            : (activeOrder?.subTotal ?? 0);
          const effectiveSubTotal = baseSubTotal - freeProductTotal;
          if (effectiveSubTotal < minPaise) {
            const diffRupees = ((minPaise - effectiveSubTotal) / 100).toFixed(2);
            return NextResponse.json({
              success: false,
              error: `Add Rs.${diffRupees} more to apply this coupon.`,
            }, { status: 400 });
          }
          break;
        }
        case 'contains_products': {
          const cpVarArg = condition.args.find((a: any) => a.name === 'productVariantIds');
          const cpMinQtyArg = condition.args.find((a: any) => a.name === 'minimum');
          const cpMinQty = parseInt(cpMinQtyArg?.value ?? '1', 10) || 1;
          if (cpVarArg?.value) {
            let cpIds: string[] = [];
            try {
              const parsed = cpVarArg.value.startsWith('[') ? JSON.parse(cpVarArg.value) : [cpVarArg.value];
              cpIds = (Array.isArray(parsed) ? parsed : [parsed]).map(String);
            } catch {}
            const totalMatchingQty = cartLines
              .filter((l) => cpIds.includes(l.productVariant.id))
              .reduce((sum, l) => sum + l.quantity, 0);
            if (totalMatchingQty < cpMinQty) {
              return NextResponse.json({
                success: false,
                error: `Please add required products to your cart to use this coupon.`,
              }, { status: 400 });
            }
          }
          break;
        }
        case 'buy_x_get_y_free': {
          const amountXArg = condition.args.find((a: any) => a.name === 'amountX');
          const variantIdsXArg = condition.args.find((a: any) => a.name === 'variantIdsX');
          if (amountXArg && variantIdsXArg) {
            const requiredQty = parseInt(amountXArg.value, 10) || 0;
            let xIds: string[] = [];
            try {
              const parsed = JSON.parse(variantIdsXArg.value);
              xIds = Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
            } catch { xIds = [variantIdsXArg.value]; }
            const currentQty = cartLines
              .filter((l) => xIds.includes(l.productVariant.id))
              .reduce((sum, l) => sum + l.quantity, 0);
            if (currentQty < requiredQty) {
              return NextResponse.json({
                success: false,
                error: `Add ${requiredQty - currentQty} more qualifying item(s) to use this coupon.`,
              }, { status: 400 });
            }
          }
          break;
        }
        case 'customer_group': {
          const groupIdArg = condition.args.find((a: any) => a.name === 'customerGroupId');
          if (groupIdArg) {
            const requiredGroupId = groupIdArg.value;
            let customerGroupIds: string[] = [];
            try {
              const customerResp = await getActiveCustomer();
              customerGroupIds = ((customerResp?.activeCustomer as any)?.groups ?? []).map((g: any) => String(g.id));
            } catch {}
            if (!customerGroupIds.includes(requiredGroupId)) {
              return NextResponse.json({
                success: false,
                error: `This coupon is only available for specific group members.`,
              }, { status: 400 });
            }
          }
          break;
        }
        case 'at_least_n_with_facets': {
          const requiredMin =
            parseInt(condition.args.find((a: any) => a.name === 'minimum')?.value ?? '0', 10) || 0;
          const facetIds = parseIdList(
            condition.args.find((a: any) => a.name === 'facets')?.value,
          );
          if (requiredMin && facetIds.length) {
            const matchingQty = cartLines
              .filter((l) => facetIds.some((fid) => lineFacetIds(l).includes(fid)))
              .reduce((sum, l) => sum + l.quantity, 0);
            if (matchingQty < requiredMin) {
              const facetNames =
                (coupon.facetValues ?? [])
                  .filter((fv: any) => facetIds.includes(String(fv.id)))
                  .map((fv: any) => fv.name)
                  .join(', ') || 'qualifying categories';
              return NextResponse.json({
                success: false,
                error: `Add ${requiredMin - matchingQty} more item(s) from ${facetNames} to use this coupon.`,
              }, { status: 400 });
            }
          }
          break;
        }
      }
    }

    // Action-level checks: the cart must already contain the items/categories
    // the discount targets, otherwise applying the coupon would do nothing.
    for (const action of coupon.actions ?? []) {
      if (action.code === 'facet_based_discount') {
        const facetIds = parseIdList(
          action.args.find((a: any) => a.name === 'facets')?.value,
        );
        if (facetIds.length) {
          const hasMatch = cartLines.some((l) =>
            facetIds.some((fid) => lineFacetIds(l).includes(fid)),
          );
          if (!hasMatch) {
            const facetNames =
              (coupon.facetValues ?? [])
                .filter((fv: any) => facetIds.includes(String(fv.id)))
                .map((fv: any) => fv.name)
                .join(', ') || 'qualifying categories';
            return NextResponse.json({
              success: false,
              error: `This coupon gives a discount only on ${facetNames}. Add ${facetNames} products to your cart first.`,
            }, { status: 400 });
          }
        }
      }

      if (action.code === 'products_percentage_discount') {
        const variantIds = parseIdList(
          action.args.find((a: any) => a.name === 'productVariantIds')?.value,
        );
        // Variants the conditions auto-add aren't in the cart yet at apply
        // time (couponFreeVariantIds), so don't require them here.
        const required = variantIds.filter((id) => !couponFreeVariantIds.has(id));
        if (required.length) {
          const hasMatch = cartLines.some((l) =>
            required.includes(String(l.productVariant.id)),
          );
          if (!hasMatch) {
            const productNames =
              (coupon.productVariants ?? [])
                .filter((pv: any) => required.includes(String(pv.id)))
                .map((pv: any) => pv.name)
                .join(', ') || 'specific products';
            return NextResponse.json({
              success: false,
              error: `This coupon gives a discount only on ${productNames}. Add them to your cart first.`,
            }, { status: 400 });
          }
        }
      }
    }

    // Auto-add products for buy_x_get_y_free
    const autoAddVariantIds = new Set<string>();
    const productVariantIds: string[] = [];
    let hasProductsToAdd = false;

    for (const cond of coupon.conditions) {
      if (cond.code === 'buy_x_get_y_free') {
        const yArg = cond.args.find((a: any) => a.name === 'variantIdsY');
        if (yArg?.value) {
          hasProductsToAdd = true;
          try {
            const parsed = yArg.value.startsWith('[') ? JSON.parse(yArg.value) : [yArg.value];
            const ids = Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
            productVariantIds.push(...ids);
            ids.forEach((id: string) => autoAddVariantIds.add(id));
          } catch {}
        }
      }
    }

    const existingVariantIds = new Set(cartLines.map((l) => String(l.productVariant.id)));
    const autoAddedVariantIds = productVariantIds.filter((id) => !existingVariantIds.has(id));

    if (hasProductsToAdd && productVariantIds.length > 0) {
      try {
        await addCouponProductToCart(couponCode);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, error: `Failed to add free products: ${msg}` }, { status: 400 });
      }
    }

    // Apply coupon
    const couponResult = await applyCouponCode(couponCode);
    if ((couponResult as any)?.__typename !== 'Order') {
      if (hasProductsToAdd && productVariantIds.length > 0) {
        try { await removeCouponProductFromCart(couponCode); } catch {}
      }
      const message = (couponResult as any)?.message ?? 'Unexpected response from server.';
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const order = couponResult as any;
    let successMessage = `Coupon "${couponCode}" applied to your order!`;
    if (hasProductsToAdd) {
      successMessage = `Coupon "${couponCode}" applied and free product(s) added to your order!`;
    }

    return NextResponse.json({
      success: true,
      message: successMessage,
      orderTotal: order.totalWithTax,
      appliedCoupon: couponCode,
      autoAddedVariantIds,
    });
  }

  if (action === 'removeCoupon') {
    const couponCode = body.couponCode as string;
    if (!couponCode) {
      return NextResponse.json({ success: false, error: 'Coupon code is required.' }, { status: 400 });
    }

    const activeOrder = await getActiveOrder();
    if (!activeOrder?.couponCodes?.includes(couponCode)) {
      return NextResponse.json({ success: false, error: 'Coupon code is not applied to the order.' }, { status: 400 });
    }

    const autoAddedVariantIds: string[] = body.autoAddedVariantIds ?? [];

    // Remove auto-added products
    if (autoAddedVariantIds.length > 0 && activeOrder?.lines) {
      for (const variantId of autoAddedVariantIds) {
        const line = activeOrder.lines.find((l) => String(l.productVariant.id) === String(variantId));
        if (!line) continue;
        try {
          if (line.quantity > 1) {
            await adjustOrderLine(line.id, line.quantity - 1);
          } else {
            await removeOrderLine(line.id);
          }
        } catch (error) {
          console.error('Failed to remove auto-added product:', variantId, error);
        }
      }
    }

    const result = await removeCouponCode(couponCode);
    if ((result as any)?.__typename === 'Order') {
      return NextResponse.json({
        success: true,
        message: 'Coupon removed from your order.',
        orderTotal: (result as any).totalWithTax,
        appliedCoupon: null,
      });
    }
    return NextResponse.json({ success: false, error: 'Failed to remove coupon.' }, { status: 400 });
  }

  if (action === 'validateCoupons') {
    const refreshedOrder = await getActiveOrder();
    if (!refreshedOrder?.couponCodes?.length) {
      return NextResponse.json({ success: true, couponValid: true });
    }

    const appliedCode = refreshedOrder.couponCodes[0];
    const allCoupons = await getCouponCodeList();
    const couponDetail = allCoupons.find((c: any) => c.couponCode === appliedCode);

    if (!couponDetail) {
      return NextResponse.json({ success: true, couponValid: true });
    }

    let shouldRemove = false;
    const cartLines = refreshedOrder.lines ?? [];

    const freeVarIds = new Set<string>();
    for (const cond of couponDetail.conditions) {
      if (cond.code === 'contains_products') {
        const vArg = cond.args.find((a: any) => a.name === 'productVariantIds');
        if (vArg?.value) {
          try {
            const p = vArg.value.startsWith('[') ? JSON.parse(vArg.value) : [vArg.value];
            (Array.isArray(p) ? p : [p]).forEach((id: any) => freeVarIds.add(String(id)));
          } catch {}
        }
      }
    }

    for (const condition of couponDetail.conditions) {
      switch (condition.code) {
        case 'minimum_order_amount':
        case 'minimumOrderAmount':
        case 'minimumAmount': {
          const amountArg = condition.args.find((a: any) => a.name === 'amount') ?? condition.args[0];
          const taxInclusiveArg = condition.args.find((a: any) => a.name === 'taxInclusive');
          const isTaxInclusive = taxInclusiveArg?.value === 'true';
          const minPaise = parseInt(amountArg?.value ?? '0', 10) || 0;
          const freeProductTotal = cartLines
            .filter((line) => freeVarIds.has(line.productVariant.id))
            .reduce((sum, line) => sum + ((line as any).linePriceWithTax ?? 0), 0);
          const baseSubTotal = isTaxInclusive
            ? (refreshedOrder.subTotalWithTax ?? 0)
            : (refreshedOrder.subTotal ?? 0);
          if (baseSubTotal - freeProductTotal < minPaise) shouldRemove = true;
          break;
        }
      }
      if (shouldRemove) break;
    }

    if (!shouldRemove && !couponDetail.enabled) shouldRemove = true;
    if (!shouldRemove && couponDetail.endsAt && new Date() > new Date(couponDetail.endsAt)) shouldRemove = true;

    if (shouldRemove) {
      try {
        await removeCouponProductFromCart(appliedCode).catch(() => {});
        await removeCouponCode(appliedCode);
        return NextResponse.json({
          success: true,
          couponValid: false,
          removedCoupon: appliedCode,
          message: `Coupon "${appliedCode}" was removed because conditions are no longer met.`,
        });
      } catch {
        return NextResponse.json({ success: false, error: 'Failed to auto-remove coupon.' });
      }
    }

    return NextResponse.json({ success: true, couponValid: true });
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
}
