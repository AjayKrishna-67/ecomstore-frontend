import { NextResponse } from 'next/server';
import {
  transitionOrderToState,
  getNextOrderStates,
} from '@/providers/checkout';
import { getActiveOrder } from '@/providers/orders';
import { getRazorpayOrderId } from '@/providers/custom-plugins';

interface RazorpayOrderResponse {
  success: boolean;
  razorpayOrderId?: string;
  keyId?: string;
  error?: string;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const orderCode = formData.get('orderCode') as string;

    if (!orderCode) {
      console.error('[Razorpay] Missing orderCode');
      return NextResponse.json<RazorpayOrderResponse>(
        { success: false, error: 'Order code is required' },
        { status: 400 },
      );
    }

    console.log('[Razorpay] orderCode:', orderCode);

    const activeOrder = await getActiveOrder();
    console.log('[Razorpay] activeOrder:', activeOrder ? { id: activeOrder.id, code: activeOrder.code, state: activeOrder.state } : null);

    if (!activeOrder || activeOrder.code !== orderCode) {
      console.error('[Razorpay] Order mismatch — active:', activeOrder?.code, 'requested:', orderCode);
      return NextResponse.json<RazorpayOrderResponse>(
        { success: false, error: `Invalid order. Active: ${activeOrder?.code || 'none'}, Requested: ${orderCode}` },
        { status: 400 },
      );
    }

    const { nextOrderStates } = await getNextOrderStates();
    console.log('[Razorpay] nextOrderStates:', nextOrderStates);

    if (nextOrderStates.includes('ArrangingPayment')) {
      const transitionResult = await transitionOrderToState(
        'ArrangingPayment',
      );
      console.log('[Razorpay] transitionResult:', JSON.stringify(transitionResult.transitionOrderToState));

      const transitionData = transitionResult.transitionOrderToState as any;
      // If it has errorCode, it's an error. If it has id/state, it's a successful Order.
      if (transitionData?.errorCode) {
        console.error('[Razorpay] Transition failed:', transitionData);
        return NextResponse.json<RazorpayOrderResponse>(
          {
            success: false,
            error: transitionData.message || 'Failed to transition order state',
          },
          { status: 400 },
        );
      }
      console.log('[Razorpay] Transition success:', transitionData?.state);
    }

    // Dynamically get Razorpay order from backend (channel-specific)
    const razorpayOrderResult = await getRazorpayOrderId(
      activeOrder.id,
    );
    console.log('[Razorpay] razorpayOrderResult:', razorpayOrderResult);

    if (!razorpayOrderResult || 'message' in razorpayOrderResult) {
      console.error('[Razorpay] getRazorpayOrderId failed:', razorpayOrderResult);
      return NextResponse.json<RazorpayOrderResponse>(
        {
          success: false,
          error:
            (razorpayOrderResult as any)?.message ||
            (razorpayOrderResult as any)?.errorMessage ||
            'Failed to generate Razorpay order',
        },
        { status: 500 },
      );
    }

    return NextResponse.json<RazorpayOrderResponse>({
      success: true,
      razorpayOrderId: razorpayOrderResult.razorpayOrderId,
      keyId: razorpayOrderResult.keyId,
    });
  } catch (error: any) {
    console.error('Razorpay order generation failed:', error);
    return NextResponse.json<RazorpayOrderResponse>(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
