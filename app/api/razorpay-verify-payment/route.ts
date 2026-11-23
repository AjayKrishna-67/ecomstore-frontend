import { NextResponse } from 'next/server';
import {
  transitionOrderToState,
  getNextOrderStates,
  getEligiblePaymentMethods,
} from '@/providers/checkout';
import { addPaymentToOrder, getActiveOrder } from '@/providers/orders';

interface RazorpayPaymentResponse {
  success: boolean;
  orderCode?: string;
  error?: string;
  redirectUrl?: string;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const paymentId = formData.get('razorpay_payment_id') as string;
  const orderId = formData.get('razorpay_order_id') as string;
  const signature = formData.get('razorpay_signature') as string;
  const orderCode = formData.get('orderCode') as string;
  const amount = formData.get('amount') as string;
  const currencyCode = formData.get('currencyCode') as string;

  if (!paymentId || !orderId || !signature) {
    return NextResponse.json<RazorpayPaymentResponse>(
      { success: false, error: 'Missing payment information' },
      { status: 400 },
    );
  }

  // Default to the configured Razorpay method code. The backend
  // `addPaymentToOrder` mutation is the real validator for this code, so we
  // never hard-fail here just because the eligible-methods list is empty
  // (which happens when the order isn't yet in ArrangingPayment).
  let paymentMethodCode = 'razorpay-payment';

  try {
    // Transition order state if needed — must happen BEFORE querying
    // eligiblePaymentMethods, which Vendure only returns for an order in
    // the ArrangingPayment state.
    const { nextOrderStates } = await getNextOrderStates();
    if (nextOrderStates.includes('ArrangingPayment')) {
      const transitionResult = await transitionOrderToState(
        'ArrangingPayment',
      );
      const transitionData = transitionResult.transitionOrderToState as any;
      if (transitionData?.errorCode) {
        console.error('Failed to transition order state:', transitionData);
        return NextResponse.json<RazorpayPaymentResponse>(
          {
            success: false,
            error: transitionData.message || 'Failed to transition order state',
          },
          { status: 400 },
        );
      }
    }

    // Now that the order is in ArrangingPayment, resolve the actual Razorpay
    // method code. If the list is empty (timing / channel quirk) we keep the
    // default 'razorpay-payment' rather than failing a paid order.
    try {
      const paymentMethods = await getEligiblePaymentMethods();
      const razorpayPaymentMethod =
        paymentMethods?.eligiblePaymentMethods?.find((method) =>
          method.code.toLowerCase().includes('razorpay'),
        );
      if (razorpayPaymentMethod) {
        paymentMethodCode = razorpayPaymentMethod.code;
      } else {
        console.warn(
          'Razorpay method not in eligible list, falling back to "razorpay-payment". Available:',
          paymentMethods?.eligiblePaymentMethods?.map((m) => m.code) ?? [],
        );
      }
    } catch (e) {
      console.warn(
        'getEligiblePaymentMethods failed, using default "razorpay-payment"',
        e,
      );
    }

    console.log('Using payment method:', paymentMethodCode);

    // Get the active order to get the amount and currency
    const activeOrder = await getActiveOrder();
    if (!activeOrder) {
      return NextResponse.json<RazorpayPaymentResponse>(
        { success: false, error: 'No active order found' },
        { status: 400 },
      );
    }

    // Verify order code matches
    if (activeOrder.code !== orderCode) {
      console.error('Order code mismatch:', {
        expected: activeOrder.code,
        received: orderCode,
      });
      return NextResponse.json<RazorpayPaymentResponse>(
        { success: false, error: 'Order code mismatch' },
        { status: 400 },
      );
    }

    // Calculate amounts for verification
    const orderAmountInPaise = activeOrder.totalWithTax || 0;
    const orderAmountInRupees = (orderAmountInPaise / 100).toFixed(2);
    const razorpayAmountInPaise = amount ? Number.parseInt(amount, 10) : null;

    // Log amount verification
    console.log('Amount Verification:', {
      orderAmountPaise: orderAmountInPaise,
      orderAmountRupees: orderAmountInRupees,
      razorpayAmountPaise: razorpayAmountInPaise,
      razorpayAmountRupees: razorpayAmountInPaise
        ? (razorpayAmountInPaise / 100).toFixed(2)
        : null,
      amountsMatch:
        razorpayAmountInPaise !== null &&
        razorpayAmountInPaise === orderAmountInPaise,
    });

    // Verify amount matches (optional check - backend will also verify)
    if (
      razorpayAmountInPaise !== null &&
      razorpayAmountInPaise !== orderAmountInPaise
    ) {
      console.warn('Amount mismatch detected:', {
        orderAmount: orderAmountInPaise,
        razorpayAmount: razorpayAmountInPaise,
        difference: Math.abs(orderAmountInPaise - razorpayAmountInPaise),
      });
    }

    // Create metadata for the payment
    const metadata = {
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      razorpaySignature: signature,
    };

    const orderCurrency = activeOrder.currencyCode || currencyCode || 'INR';

    console.log('Payment Details Summary:', {
      orderCode: orderCode,
      paymentMethod: paymentMethodCode,
      amount: orderAmountInRupees,
      currency: orderCurrency,
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      hasSignature: !!signature,
      orderState: activeOrder.state,
    });

    console.log(
      'Metadata being sent to backend (camelCase format):',
      metadata,
    );

    // Add payment to the order
    const result = await addPaymentToOrder(
      { method: paymentMethodCode, metadata },
    );

    console.log('Result of addPaymentToOrder:', result);

    const paymentResult = result.addPaymentToOrder;

    // Check for success: if the result has an order code, it's a successful Order response
    // We check for 'code' and 'state' since __typename may not be included in the response
    if ('code' in paymentResult && 'state' in paymentResult && (paymentResult as any).code) {
      const successOrderCode = (paymentResult as any).code;
      const redirectUrl = `/checkout/confirmation/${successOrderCode}`;
      console.log('Payment added successfully, redirecting to:', redirectUrl);
      return NextResponse.json<RazorpayPaymentResponse>({
        success: true,
        orderCode: successOrderCode,
        redirectUrl,
      });
    } else {
      // Handle all error types with proper typing
      const errorResult = paymentResult;

      console.error('Failed to add payment to order:', {
        errorType: errorResult.__typename,
        errorCode: (errorResult as any).errorCode,
        message: (errorResult as any).message,
      });

      // Provide user-friendly error messages based on error type
      const errMsg = (errorResult as any).message || 'Failed to add payment to order';
      let errorMessage = errMsg;

      switch (errorResult.__typename) {
        case 'OrderPaymentStateError':
          errorMessage = `Order payment state error: ${errMsg}`;
          break;
        case 'IneligiblePaymentMethodError':
          errorMessage = `Payment method not eligible: ${errMsg}`;
          break;
        case 'PaymentFailedError':
          errorMessage = `Payment failed: ${errMsg}`;
          break;
        case 'PaymentDeclinedError':
          errorMessage = `Payment declined: ${errMsg}`;
          break;
        case 'OrderStateTransitionError':
          errorMessage = `Order state error: ${errMsg}`;
          break;
        case 'NoActiveOrderError':
          errorMessage = `No active order found: ${errMsg}`;
          break;
      }

      return NextResponse.json<RazorpayPaymentResponse>(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error('Razorpay payment processing error:', error);
    return NextResponse.json<RazorpayPaymentResponse>(
      {
        success: false,
        error: error.message || 'An error occurred processing the payment',
      },
      { status: 500 },
    );
  }
}
