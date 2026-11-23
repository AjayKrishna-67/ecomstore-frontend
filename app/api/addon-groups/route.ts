import { NextResponse } from 'next/server';
import { getAddonGroupsForVariant } from '@/providers/products';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const productVariantId = url.searchParams.get('productVariantId');
  if (!productVariantId) {
    return NextResponse.json({ addonGroups: [] });
  }
  try {
    const addonGroups = await getAddonGroupsForVariant(productVariantId);
    return NextResponse.json({ addonGroups });
  } catch (e: any) {
    console.error('addonGroupsForVariant failed:', e?.message ?? e);
    return NextResponse.json({ addonGroups: [], error: e?.message ?? 'Failed to fetch addon groups' });
  }
}
