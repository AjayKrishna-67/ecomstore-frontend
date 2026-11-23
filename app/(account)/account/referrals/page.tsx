import { getMyReferrals, getEarnedScratchCards, getScratchedCards, getReferralChannelPoints } from '@/providers/referral';
import { getActiveCustomerDetails } from '@/providers/customer';
import { ReferralsPageClient } from './referrals-page-client';

export default async function ReferralsPage() {
  const [referrals, earnedScratchCards, scratchedCards, channelPoints, customerResult] = await Promise.all([
    getMyReferrals(50, 0, undefined).catch(() => ({ totalItems: 0, items: [] })),
    getEarnedScratchCards(50, 0).catch(() => ({ totalItems: 0, items: [] })),
    getScratchedCards(50, 0).catch(() => ({ totalItems: 0, items: [] })),
    getReferralChannelPoints().catch(() => ({ points: 0 })),
    getActiveCustomerDetails().catch(() => null),
  ]);

  const customer = customerResult?.activeCustomer;

  return (
    <ReferralsPageClient
      referrals={referrals}
      earnedScratchCards={earnedScratchCards}
      scratchedCards={scratchedCards}
      channelPoints={channelPoints}
      customerId={customer?.id}
    />
  );
}
