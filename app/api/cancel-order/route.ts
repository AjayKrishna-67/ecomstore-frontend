import { NextResponse } from 'next/server';
import { requestOrderCancellation } from '@/providers/custom-plugins';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const orderId = formData.get('orderId') as string;
    const reason = formData.get('reason') as string;

    if (!orderId || !reason) {
      return NextResponse.json(
        { error: 'Order ID and reason are required' },
        { status: 400 },
      );
    }

    const result = await requestOrderCancellation(orderId, reason);

    if (result?.id) {
      return NextResponse.json({ success: true, order: result });
    }

    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error('Cancel order API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
