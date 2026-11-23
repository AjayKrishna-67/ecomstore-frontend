import { NextResponse } from 'next/server';
import { updateCustomer, requestUpdateCustomerEmailAddress } from '@/providers/account';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { intent } = body;

    if (intent === 'updatePhone') {
      const { phoneNumber } = body;
      if (!phoneNumber || !/^\d{10}$/.test(phoneNumber.replace(/\s+/g, ''))) {
        return NextResponse.json(
          { error: 'Phone number must be exactly 10 digits' },
          { status: 400 },
        );
      }
      await updateCustomer({ phoneNumber });
      return NextResponse.json({ success: true });
    }

    if (intent === 'updateDetails') {
      const { title, firstName, lastName } = body;
      if (!firstName || !lastName) {
        return NextResponse.json(
          { error: 'First name and last name are required' },
          { status: 400 },
        );
      }
      await updateCustomer({ title, firstName, lastName });
      return NextResponse.json({ success: true });
    }

    if (intent === 'updateEmail') {
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required' },
          { status: 400 },
        );
      }
      const result = await requestUpdateCustomerEmailAddress(password, email);
      if ((result as any).__typename !== 'Success') {
        return NextResponse.json(
          { error: 'Failed to update email' },
          { status: 401 },
        );
      }
      return NextResponse.json({ success: true, newEmailAddress: email });
    }

    return NextResponse.json(
      { error: 'Invalid intent' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error('Account API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
