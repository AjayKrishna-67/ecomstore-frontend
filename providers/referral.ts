import { API_URL, CHANNEL_TOKEN } from '@/lib/constants';
import { getAuthToken } from '@/lib/session';

export interface ReferralItem {
  id: string;
  referralNumber: number;
  createdAt: string;
  referredCustomer?: {
    id: string;
    firstName: string;
    lastName: string;
    emailAddress?: string;
  };
  order?: {
    id: string;
    code: string;
    state: string;
  };
  status: 'REGISTERED' | 'ELIGIBLE' | 'CLAIMED' | 'EXPIRED';
  points: number | null;
  isScratched: boolean;
  note: string | null;
}

export interface ReferralList {
  totalItems: number;
  items: ReferralItem[];
}

export interface ReferralChannelPoints {
  id: string;
  points: number;
}

export interface ReferredBy {
  id: string;
  referrer: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  status: string;
  points: number | null;
  createdAt: string;
}

async function graphqlFetch<T>(
  query: string,
  variables: Record<string, any> | undefined,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'vendure-token': CHANNEL_TOKEN,
  };

  const authToken = await getAuthToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  const json = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message);
  }

  if (!json.data) {
    throw new Error('No data returned from GraphQL query');
  }

  return json.data;
}

export async function getMyReferrals(
  take: number | undefined,
  skip: number | undefined,
  status: string | undefined,
): Promise<ReferralList> {
  const data = await graphqlFetch<{ myReferrals: ReferralList }>(
    `query MyReferrals($take: Int, $skip: Int, $status: ReferralStatus) {
      myReferrals(take: $take, skip: $skip, status: $status) {
        totalItems
        items {
          id
          referralNumber
          createdAt
          referredCustomer {
            id
            firstName
            lastName
            emailAddress
          }
          order {
            id
            code
            state
          }
          status
          points
          isScratched
          note
        }
      }
    }`,
    { take, skip, status },
  );
  return data.myReferrals;
}

export async function getEarnedScratchCards(
  take: number | undefined,
  skip: number | undefined,
): Promise<ReferralList> {
  const data = await graphqlFetch<{ earnedScratchCards: ReferralList }>(
    `query EarnedScratchCards($take: Int, $skip: Int) {
      earnedScratchCards(take: $take, skip: $skip) {
        totalItems
        items {
          id
          referralNumber
          createdAt
          referredCustomer {
            id
            firstName
            lastName
          }
          status
          points
          isScratched
          note
        }
      }
    }`,
    { take, skip },
  );
  return data.earnedScratchCards;
}

export async function getScratchedCards(
  take: number | undefined,
  skip: number | undefined,
): Promise<ReferralList> {
  const data = await graphqlFetch<{ scratchedCards: ReferralList }>(
    `query ScratchedCards($take: Int, $skip: Int) {
      scratchedCards(take: $take, skip: $skip) {
        totalItems
        items {
          id
          referralNumber
          createdAt
          referredCustomer {
            id
            firstName
            lastName
          }
          status
          points
          isScratched
          note
        }
      }
    }`,
    { take, skip },
  );
  return data.scratchedCards;
}

export async function getReferralChannelPoints(): Promise<ReferralChannelPoints | null> {
  const data = await graphqlFetch<{
    referralChannelPoints: ReferralChannelPoints | null;
  }>(
    `query ReferralChannelPoints {
      referralChannelPoints {
        id
        points
      }
    }`,
    undefined,
  );
  return data.referralChannelPoints;
}

export async function registerReferral(
  referrerId: string,
): Promise<ReferralItem> {
  const data = await graphqlFetch<{ registerReferral: ReferralItem }>(
    `mutation RegisterReferral($referrerId: ID!) {
      registerReferral(referrerId: $referrerId) {
        id
        referralNumber
        status
        note
      }
    }`,
    { referrerId },
  );
  return data.registerReferral;
}

export async function scratchReferralCard(
  referralNumber: number,
): Promise<ReferralItem> {
  const data = await graphqlFetch<{ scratchReferralCard: ReferralItem }>(
    `mutation ScratchReferralCard($referralNumber: Int!) {
      scratchReferralCard(referralNumber: $referralNumber) {
        id
        referralNumber
        status
        points
        isScratched
        note
      }
    }`,
    { referralNumber },
  );
  return data.scratchReferralCard;
}

export async function getActiveCustomerReferredBy(): Promise<ReferredBy | null> {
  try {
    const data = await graphqlFetch<{
      activeCustomer: { referredBy: ReferredBy | null } | null;
    }>(
      `query ActiveCustomerReferredBy {
        activeCustomer {
          referredBy {
            id
            referrer {
              id
              firstName
              lastName
            }
            status
            points
            createdAt
          }
        }
      }`,
      undefined,
    );
    return data.activeCustomer?.referredBy ?? null;
  } catch {
    return null;
  }
}
