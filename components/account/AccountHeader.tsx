'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MapPin,
  ShoppingBag,
  User,
  LogOut,
  Award,
  Gift,
} from 'lucide-react';
import { trackLogout } from '@/lib/fbpixel';

interface AccountHeaderProps {
  activeCustomer: {
    firstName: string;
    lastName: string;
    emailAddress?: string;
    phoneNumber?: string | null | undefined;
  };
}

export default function AccountHeader({ activeCustomer }: AccountHeaderProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    trackLogout();
    await fetch('/api/logout', { method: 'POST' });
    try {
      sessionStorage.removeItem('nextOfferState');
      // legacy keys from earlier versions
      sessionStorage.removeItem('shownOfferIds');
      sessionStorage.removeItem('hasShownOfferThisSession');
    } catch {
      /* ignore */
    }
    window.location.href = '/';
  };

  const navigation = [
    { name: 'Profile', href: '/account', icon: User },
    { name: 'Addresses', href: '/account/addresses', icon: MapPin },
    { name: 'Orders', href: '/account/history', icon: ShoppingBag },
    // { name: 'Loyalty', href: '/account/loyalty-points', icon: Award },
    // { name: 'Referrals', href: '/account/referrals', icon: Gift },
  ];

  const isActive = (href: string) => {
    if (href === '/account') return pathname === '/account';
    return pathname.startsWith(href);
  };

  return (
    <div className="mb-6">
      {/* User greeting */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            My Account
          </h1>
          <p className="text-sm text-text-tertiary mt-0.5">
            Welcome back, {activeCustomer.firstName}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border-theme">
        <nav className="flex gap-1 overflow-x-auto scrollbar-none -mb-px">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? 'border-btn-primary text-btn-primary'
                    : 'border-transparent text-text-tertiary hover:text-text-primary hover:border-border-strong'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
