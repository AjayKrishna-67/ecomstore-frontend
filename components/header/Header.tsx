'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBagIcon,
  UserIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  Bars3Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState, useEffect } from 'react';
import { SignInPromptModal } from '@/components/modal/SignInPromptModal';
import { GoogleLoginButton } from '../Google/GoogleLoginButton';

interface Collection {
  id: string;
  name: string;
  slug: string;
  featuredAsset?: {
    id: string;
    preview: string;
  } | null;
}

const CoinIcon = ({ points }: { points: number | null }) => (
  <div className="relative flex items-center gap-1">
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5 text-header-text"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8zm0-12c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
    </svg>
    <span className="text-xs font-medium text-header-text hidden sm:inline">
      {points ?? '0'} Points
    </span>
    <span className="text-sm font-medium text-header-text sm:hidden">
      {points ?? '0'}
    </span>
  </div>
);

export function Header({
  onCartIconClick,
  cartQuantity,
  collections,
  isCartOpen,
  loyaltyPoints,
  isSignedIn,
  alwaysVisible = false,
  hideCart = false,
}: {
  onCartIconClick: () => void;
  cartQuantity: number;
  collections: Collection[];
  isCartOpen: boolean;
  loyaltyPoints: number | null;
  isSignedIn: boolean;
  alwaysVisible?: boolean;
  hideCart?: boolean;
}) {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileProductsOpen, setIsMobileProductsOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);

  const isAccountPage = pathname.startsWith('/account');

  useEffect(() => {
    const handleScroll = () => {
      if (isCartOpen || isAccountPage || alwaysVisible) {
        setIsHeaderVisible(true);
        return;
      }
      const currentScrollY = window.scrollY;
      if (currentScrollY < 50) setIsHeaderVisible(true);
      else if (currentScrollY > lastScrollY) setIsHeaderVisible(false);
      else setIsHeaderVisible(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isCartOpen, isAccountPage, alwaysVisible]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMobileProductsOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-20 bg-header-bg shadow-md transition-transform duration-300 ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{
          borderBottom: '1px solid rgba(238, 126, 26, 0.4)',
          boxShadow: '0 4px 20px rgba(10,37,64,0.08), inset 0 -1px 0 rgba(238,126,26,0.18)',
        }}
      >
        {/* Top Bar */}
        <div className="bg-gradient-to-r from-[#0A2540] via-[#13355E] to-[#0A2540]">
          <div className="mx-auto max-w-5xl xl:max-w-7xl 2xl:max-w-[1400px] px-6 sm:px-8 lg:px-12">
            <p className="text-center py-2 text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] uppercase text-header-accent">
              Hand Crafted by Prabha &nbsp;&middot;&nbsp; Exquisite Aari Designs
            </p>
          </div>
        </div>

        {/* Main Header */}
        <div className="relative mx-auto max-w-5xl xl:max-w-7xl 2xl:max-w-[1400px] px-6 sm:px-8 lg:px-12">
          <div className="flex h-20 items-center gap-2 sm:gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-header-text hover:text-header-accent transition-colors flex-shrink-0"
              aria-label="Toggle menu"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            {/* LEFT: Logo */}
            <a
              href="/"
              className="relative flex-shrink-0 group"
              aria-label="Prabha's Aari Designs — Home"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -m-4 rounded-full blur-2xl opacity-50 group-hover:opacity-80 transition-opacity"
                style={{
                  background:
                    'radial-gradient(closest-side, rgba(238,126,26,0.32), rgba(238,126,26,0) 70%)',
                }}
              />
              <img
                src="https://cdn.prabhasaaridesigns.com/assets/casual_images/logo.png"
                alt="Prabha's Aari Designs"
                width={240}
                height={240}
                className="relative h-10 sm:h-11 lg:h-12 w-auto drop-shadow-[0_2px_12px_rgba(238,126,26,0.25)] transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </a>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center space-x-8 ml-6">
                <Link
                  href="/"
                  className="text-header-text hover:text-header-accent text-sm font-medium transition-colors"
                >
                  Home
                </Link>

                {/* Products dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => {
                    clearTimeout((window as any).dropdownTimeout);
                    setIsCollectionsOpen(true);
                  }}
                  onMouseLeave={() => {
                    (window as any).dropdownTimeout = setTimeout(() => {
                      setIsCollectionsOpen(false);
                    }, 200);
                  }}
                >
                  <button
                    onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
                    className="text-header-text hover:text-header-accent flex items-center text-sm font-medium transition-colors"
                  >
                    Collections
                    <ChevronDownIcon
                      className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                        isCollectionsOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Desktop dropdown — names only */}
                  <div
                    className={`absolute top-full left-0 mt-3 w-64 py-2 rounded-xl shadow-2xl bg-header-bg backdrop-blur-lg border border-header-accent/30 transition-all duration-300 ease-out z-50 ${
                      isCollectionsOpen
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 -translate-y-3 pointer-events-none'
                    }`}
                  >
                    <ul className="flex flex-col">
                      {collections?.map((collection) => (
                        <li key={collection.id}>
                          <Link
                            href={`/collections/${collection.slug}`}
                            onClick={() => setIsCollectionsOpen(false)}
                            className="block px-4 py-2.5 text-sm font-medium text-header-text hover:bg-header-accent/10 hover:text-header-accent transition-colors"
                          >
                            {collection.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link
                  href="/size-chart"
                  className="text-header-text hover:text-header-accent text-sm font-medium transition-colors"
                >
                  Size Chart
                </Link>

                <Link
                  href="/about"
                  className="text-header-text hover:text-header-accent text-sm font-medium transition-colors"
                >
                  About Us
                </Link>
              </nav>

            {/* RIGHT: Icons */}
            <div className="flex items-center ml-auto space-x-1 sm:space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Open search"
                className="p-2 text-header-text hover:text-header-accent transition-colors"
              >
                <MagnifyingGlassIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* {isSignedIn && (
                <div className="hidden sm:block p-1 sm:p-1.5 bg-white/20 rounded-full border border-white/30">
                  <CoinIcon points={loyaltyPoints} />
                </div>
              )} */}

              {!hideCart && (
                <button
                  onClick={onCartIconClick}
                  aria-label="Open cart"
                  className="p-2 flex items-center relative text-header-text hover:text-header-accent transition-colors"
                >
                  <ShoppingBagIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  {cartQuantity > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] min-h-[18px] flex items-center justify-center ring-2 ring-header-bg">
                      {cartQuantity}
                    </span>
                  )}
                </button>
              )}

              {isSignedIn && (
                <Link
                  href="/favorites"
                  aria-label="Favorites"
                  className="hidden sm:block p-2 text-header-text hover:text-header-accent transition-colors"
                >
                  <HeartIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
              )}

              {!isSignedIn ? (
                <GoogleLoginButton />
              ) : (
                <Link
                  href="/account"
                  aria-label="My Account"
                  className="p-2 text-header-text hover:text-header-accent transition-colors"
                >
                  <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Menu Overlay */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Slide-in panel */}
        <div
          className={`absolute top-0 left-0 h-full w-80 max-w-[85vw] bg-header-bg shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Menu header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <img
              src="https://cdn.prabhasaaridesigns.com/assets/casual_images/logo.png"
              alt="Prabha's Aari Designs"
              className="h-10 w-auto"
            />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-header-text hover:text-header-accent transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <Link
              href="/"
              className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                pathname === '/'
                  ? 'text-header-accent bg-white/10'
                  : 'text-header-text hover:text-header-accent hover:bg-white/5'
              }`}
            >
              Home
            </Link>

            {/* Products accordion */}
            <div>
              <button
                onClick={() => setIsMobileProductsOpen(!isMobileProductsOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  pathname.startsWith('/collections')
                    ? 'text-header-accent bg-white/10'
                    : 'text-header-text hover:text-header-accent hover:bg-white/5'
                }`}
              >
                Products
                <ChevronDownIcon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isMobileProductsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  isMobileProductsOpen
                    ? 'max-h-[600px] opacity-100'
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="pl-3 pr-2 py-2 space-y-1">
                  {collections?.map((collection) => (
                    <Link
                      key={collection.id}
                      href={`/collections/${collection.slug}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-header-text hover:text-header-accent hover:bg-white/5 transition-colors"
                    >
                      {collection.featuredAsset?.preview && (
                        <img
                          src={`${collection.featuredAsset.preview}?w=40&h=40&format=webp`}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover border border-white/10"
                        />
                      )}
                      <span className="flex-1 truncate">{collection.name}</span>
                      <ChevronRightIcon className="w-4 h-4 text-header-text/30" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/size-chart"
              className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                pathname === '/size-chart'
                  ? 'text-header-accent bg-white/10'
                  : 'text-header-text hover:text-header-accent hover:bg-white/5'
              }`}
            >
              Size Chart
            </Link>

            <Link
              href="/about"
              className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                pathname === '/about'
                  ? 'text-header-accent bg-white/10'
                  : 'text-header-text hover:text-header-accent hover:bg-white/5'
              }`}
            >
              About Us
            </Link>

            {isSignedIn && (
              <Link
                href="/favorites"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-header-text hover:text-header-accent hover:bg-white/5 transition-colors sm:hidden"
              >
                Favorites
              </Link>
            )}
          </nav>

          {/* Mobile loyalty points */}
          {/* {isSignedIn && (
            <div className="px-4 py-3 border-t border-white/10 sm:hidden">
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <CoinIcon points={loyaltyPoints} />
              </div>
            </div>
          )} */}
        </div>
      </div>

      <SearchBar isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <SignInPromptModal
        isOpen={showSignInModal}
        close={() => setShowSignInModal(false)}
      />
    </>
  );
}
