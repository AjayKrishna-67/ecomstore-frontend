import { NextResponse } from 'next/server';
import { getEligibleShippingMethods } from '@/providers/checkout';

// Shipping method prices are computed against the current active order (e.g.
// value-based rates / free-shipping thresholds), so they change as the cart
// changes. The checkout page seeds this list from the server once, then hits
// this endpoint to refresh prices whenever the order is edited.
export async function GET() {
  try {
    const { eligibleShippingMethods } = await getEligibleShippingMethods();
    return NextResponse.json({ eligibleShippingMethods });
  } catch (e) {
    console.error('Failed to fetch eligible shipping methods:', e);
    return NextResponse.json({ eligibleShippingMethods: [] });
  }
}
