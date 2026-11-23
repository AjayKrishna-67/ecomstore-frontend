import { NextResponse } from 'next/server';
import { API_URL, CHANNEL_TOKEN } from '@/lib/constants';
import { getSession } from '@/lib/session';

// Reads the session cookie, so it can never be statically prerendered.
export const dynamic = 'force-dynamic';

const NEXT_OFFER_QUERY = `
  query NextOffer {
    nextBannerPopup {
      id
      asset {
        id
        source
        preview
      }
      product {
        id
        name
        slug
      }
      collection {
        id
        name
        slug
      }
      productVariant {
        id
        name
        sku
        product {
          id
          name
          slug
        }
      }
    }
  }
`;

export async function GET() {
  try {
    const session = await getSession();
    const authToken = session.authToken;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'vendure-token': CHANNEL_TOKEN,
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const res = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: NEXT_OFFER_QUERY }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[next-offer] upstream HTTP error', res.status, text);
      return NextResponse.json(
        { error: `HTTP ${res.status}`, detail: text },
        { status: 502 },
      );
    }

    // Persist any new Vendure session token (anonymous or authenticated) so
    // a guest gets a stable session across requests — required for resolvers
    // like nextCustomOffer that key off the Vendure session.
    const newVendureToken = res.headers.get('vendure-auth-token');
    if (newVendureToken && newVendureToken !== authToken) {
      session.authToken = newVendureToken;
      await session.save();
    }

    const json = (await res.json()) as {
      data?: { nextBannerPopup: any };
      errors?: Array<{ message: string; extensions?: any }>;
    };

    if (json.errors && json.errors.length > 0) {
      console.error('[next-offer] graphql errors', JSON.stringify(json.errors));
      return NextResponse.json(
        { error: json.errors[0].message, errors: json.errors },
        { status: 400 },
      );
    }

    // Build a sessionKey the client can namespace its dedupe under.
    // Changes whenever the Vendure session changes (login, logout, new guest).
    const finalToken = session.authToken ?? null;
    const sessionKey = finalToken
      ? `auth:${finalToken.slice(0, 16)}`
      : 'guest:none';

    return NextResponse.json(
      { offer: json.data?.nextBannerPopup ?? null, sessionKey },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('[next-offer] exception', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
