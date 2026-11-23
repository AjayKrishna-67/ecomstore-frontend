import { NextResponse } from 'next/server';
import { toggleFavorite } from '@/providers/custom-plugins';
import { getActiveCustomer } from '@/providers/customer';

interface ToggleFavoriteBody {
  productId: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as ToggleFavoriteBody;

  if (!body.productId || typeof body.productId !== 'string') {
    return NextResponse.json({ error: 'Invalid productId' }, { status: 400 });
  }

  const customer = await getActiveCustomer();

  if (!customer?.activeCustomer?.id) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  try {
    const result = await toggleFavorite(body.productId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Toggle favorite error:', error);
    return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
  }
}
