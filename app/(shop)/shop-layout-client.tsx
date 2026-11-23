'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header/Header';
import { CartTray } from '@/components/cart/CartTray';
import Footer from '@/components/footer/Footer';
import { useActiveOrder } from '@/hooks/use-active-order';

interface ShopLayoutClientProps {
  children: React.ReactNode;
  collections: any[];
  loyaltyPoints: number | null;
  isSignedIn: boolean;
  hideCart?: boolean;
}

export function ShopLayoutClient({
  children,
  collections,
  loyaltyPoints,
  isSignedIn,
  hideCart = false,
}: ShopLayoutClientProps) {
  const [open, setOpen] = useState(false);
  const { activeOrder, adjustOrderLine, removeItem, removeAllItems, error } =
    useActiveOrder();

  // Capture referrer ID from URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const referrerId =
      url.searchParams.get('ref') || url.searchParams.get('referrerId');
    if (referrerId) {
      localStorage.setItem('referrerId', referrerId);
      url.searchParams.delete('ref');
      url.searchParams.delete('referrerId');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Auto-register referral after successful login
  useEffect(() => {
    if (typeof window === 'undefined' || !isSignedIn) return;

    const url = new URL(window.location.href);
    const pendingReferral = url.searchParams.get('pendingReferral');
    const loginSuccess = url.searchParams.get('loginSuccess');
    const storedReferrerId = localStorage.getItem('referrerId');

    // Reset shown-offer dedupe so the poster can re-appear after re-login
    if (loginSuccess) {
      try {
        sessionStorage.removeItem('nextOfferState');
        // legacy keys from earlier versions
        sessionStorage.removeItem('shownOfferIds');
        sessionStorage.removeItem('hasShownOfferThisSession');
      } catch {
        /* ignore */
      }
    }

    const referrerId =
      pendingReferral || (loginSuccess ? storedReferrerId : null);
    if (referrerId) {
      fetch('/api/referral', {
        method: 'POST',
        body: JSON.stringify({
          actionType: 'register-referral',
          referrerId,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      localStorage.removeItem('referrerId');
      url.searchParams.delete('pendingReferral');
      window.history.replaceState({}, '', url.toString());
    }
  }, [isSignedIn]);

  return (
    <>
      <Header
        onCartIconClick={() => setOpen(!open)}
        cartQuantity={activeOrder?.totalQuantity ?? 0}
        collections={collections}
        isCartOpen={open}
        loyaltyPoints={loyaltyPoints}
        isSignedIn={isSignedIn}
        alwaysVisible={true}
        hideCart={hideCart}
      />
      <main className="relative pt-28">{children}</main>
      <CartTray
        open={open}
        onClose={setOpen}
        activeOrder={activeOrder ?? null}
        adjustOrderLine={adjustOrderLine}
        removeItem={removeItem}
        removeAllItems={removeAllItems}
        activeOrderError={error?.errorCode ? error : null}
      />
      <Footer />
    </>
  );
}
