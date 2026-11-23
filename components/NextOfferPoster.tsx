'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { Fragment } from 'react';

const SESSION_KEY = 'nextOffer_session';
const LOCAL_KEY = 'nextOffer_shownIds';

interface NextOffer {
  id: string;
  asset?: {
    id: string;
    source: string;
    preview: string;
  } | null;
  product?: { id: string; name: string; slug: string } | null;
  collection?: { id: string; name: string; slug: string } | null;
  productVariant?: {
    id: string;
    name: string;
    sku: string;
    product?: { id: string; name: string; slug: string } | null;
  } | null;
}

/** Read the list of shown offer IDs from localStorage */
function getLocalShownIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** Write shown offer IDs to localStorage */
function setLocalShownIds(ids: string[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

/** Check if we already showed a banner this browser session (tab lifetime) */
function hasShownThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Mark that we showed a banner this session */
function markShownThisSession() {
  try {
    sessionStorage.setItem(SESSION_KEY, 'true');
  } catch {
    /* ignore */
  }
}

export function NextOfferPoster() {
  const router = useRouter();
  const [offer, setOffer] = useState<NextOffer | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Wait 1.5s after mount before fetching/showing, so the banner doesn't
        // flash instantly on page load. The `cancelled` flag aborts if the
        // component unmounts during the wait.
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (cancelled) return;

        // 1. If already shown this browser session (tab), skip entirely
        if (hasShownThisSession()) return;

        // 2. Fetch the next offer from the API
        const res = await fetch('/api/next-offer', { cache: 'no-store' });
        if (!res.ok) return;

        const data = (await res.json()) as {
          offer: NextOffer | null;
          sessionKey: string;
        };
        if (cancelled || !data.offer) return;

        // 3. Check localStorage for previously shown IDs
        let shownIds = getLocalShownIds();
        const fetchedId = data.offer.id;

        // If this ID is already in localStorage (seen in a prior session)...
        if (shownIds.includes(fetchedId)) {
          // All offers have been shown — cycle resets
          // Clear localStorage and show this banner as banner 1 of new cycle
          shownIds = [];
          setLocalShownIds(shownIds);
        }

        // 4. Show the banner
        if (cancelled) return;
        setOffer(data.offer);
        setOpen(true);

        // 5. Mark in both storages
        markShownThisSession();
        setLocalShownIds([...shownIds, fetchedId]);
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!offer || !offer.asset) return null;

  const targetHref = (() => {
    if (offer.product?.slug) return `/products/${offer.product.slug}`;
    // A variant has no page of its own — link to its parent product's slug.
    if (offer.productVariant?.product?.slug)
      return `/products/${offer.productVariant.product.slug}`;
    if (offer.collection?.slug) return `/collections/${offer.collection.slug}`;
    return null;
  })();

  const handleClick = () => {
    if (!targetHref) return;
    setOpen(false);
    router.push(targetHref);
  };

  const close = () => setOpen(false);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[80]" onClose={close}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-lg">
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close offer"
                  className="absolute -top-3 -right-3 z-10 rounded-full bg-white p-1.5 shadow-lg hover:bg-gray-100"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-700" />
                </button>

                <button
                  type="button"
                  onClick={handleClick}
                  disabled={!targetHref}
                  className={`block w-full overflow-hidden rounded-2xl shadow-2xl ${
                    targetHref ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={offer.asset.source}
                    alt={
                      offer.product?.name ||
                      offer.collection?.name ||
                      'Special offer'
                    }
                    className="w-full h-auto object-cover"
                  />
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
