import { NextResponse } from 'next/server';
import {
  registerReferral,
  scratchReferralCard,
} from '@/providers/referral';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const actionType = formData.get('actionType')?.toString();

    if (actionType === 'register-referral') {
      const referrerId = formData.get('referrerId')?.toString();
      if (!referrerId) {
        return NextResponse.json({ error: 'Referrer ID is required' }, { status: 400 });
      }

      const result = await registerReferral(referrerId);
      return NextResponse.json({ success: true, data: result });
    }

    // Default: scratch a referral card
    const referralNumber = Number(formData.get('referralNumber'));
    if (!referralNumber || isNaN(referralNumber)) {
      return NextResponse.json(
        { error: 'Valid referral number is required' },
        { status: 400 },
      );
    }

    const result = await scratchReferralCard(referralNumber);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Referral API error:', error);
    const message =
      error?.message || 'An error occurred processing the referral';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
