'use client';

import { useState, useRef, useEffect } from 'react';
import { CollectionCard } from '@/components/collections/CollectionCard';
import { SingleBanner } from '@/components/SingleBanner';
import { PhoneNumberModal } from '@/components/modal/PhoneNumberModal';
import { NextOfferPoster } from '@/components/NextOfferPoster';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import BounceCards from '@/components/ui/BounceCards';
import { ProductCard } from '@/components/products/ProductCard';
import { SignInPromptModal } from '@/components/modal/SignInPromptModal';

// Hero images served from S3
const HERO_IMAGES = [
  'https://cdn.prabhasaaridesigns.com/assets/casual_images/1.jpg.jpeg',
  'https://cdn.prabhasaaridesigns.com/assets/casual_images/2.jpg.jpeg',
  'https://cdn.prabhasaaridesigns.com/assets/casual_images/3.jpg.jpeg',
  'https://cdn.prabhasaaridesigns.com/assets/casual_images/4.jpg.jpeg',
  'https://cdn.prabhasaaridesigns.com/assets/casual_images/5.jpg.jpeg',
];

const BOUNCE_TRANSFORMS = [
  'rotate(5deg) translate(-150px)',
  'rotate(0deg) translate(-70px)',
  'rotate(-5deg)',
  'rotate(5deg) translate(70px)',
  'rotate(-5deg) translate(150px)',
];

const BOUNCE_TRANSFORMS_MOBILE = [
  'rotate(5deg) translate(-90px)',
  'rotate(0deg) translate(-42px)',
  'rotate(-5deg)',
  'rotate(5deg) translate(42px)',
  'rotate(-5deg) translate(90px)',
];

interface CollectionWithProducts {
  collectionId: string;
  collectionName: string;
  collectionSlug: string;
  products: any[];
}

interface HomePageClientProps {
  collections: any[];
  banners: any[];
  collectionProducts: CollectionWithProducts[];
  activeCustomer?: any;
}

export function HomePageClient({
  collections,
  banners,
  collectionProducts,
  activeCustomer,
}: HomePageClientProps) {
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const activeCustomerForCard = { activeCustomer: activeCustomer ?? null };
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [fewCollections, setFewCollections] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    // If all items fit without scrolling, center them
    setFewCollections(el.scrollWidth <= el.clientWidth + 4);
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => {
      checkScroll();
      setIsMobile(window.innerWidth < 640);
    };
    setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collections]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="min-h-screen">
      {/* ─── Banner Section ─── */}
      {banners && banners.length > 0 && <SingleBanner banners={banners} />}

            {/* ─── Collections — Horizontal Scroll ─── */}
      <section id="collections" className="py-8 sm:py-12">
        <div className="max-w-5xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-accent mb-1">
                Explore
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Shop by Category
              </h2>
            </div>
            {/* Desktop scroll arrows */}
            {!fewCollections && (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  className="p-2 rounded-full border border-border-theme text-foreground hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  className="p-2 rounded-full border border-border-theme text-foreground hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scroll container */}
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className={`flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-4 sm:px-6 lg:px-8 pb-2 max-w-5xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto ${
              fewCollections ? 'justify-center' : ''
            }`}
          >
            {collections.map((collection: any) => (
              <div
                key={collection.id}
                className="flex-shrink-0 w-[140px] mob:w-[160px] sm:w-[200px] md:w-[220px] lg:w-[240px]"
              >
                <CollectionCard collection={collection} />
              </div>
            ))}
          </div>

          {/* Left/right fade edges (only when scrollable) */}
          {!fewCollections && canScrollLeft && (
            <div className="hidden sm:block absolute left-0 top-0 bottom-2 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
          )}
          {!fewCollections && canScrollRight && (
            <div className="hidden sm:block absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
          )}
        </div>
      </section>


      {/* ─── Hero Welcome Section ─── */}
      <section className="max-w-5xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 items-center">
          {/* Text Content */}
          <div className="order-2 md:order-1">
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-accent mb-3">
              Hand Crafted With Love
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
              Exquisite Aari Designs
              <br />
              <span className="text-accent">by Prabha</span>
            </h1>
            <p className="mt-4 text-sm sm:text-base text-text-secondary leading-relaxed max-w-md">
              Every stitch tells a story. Discover our handcrafted collection of
              traditional aari work — lovingly designed and personally finished
              to bring timeless elegance to your wardrobe.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#collections"
                className="inline-flex items-center px-5 py-2.5 bg-btn-primary hover:bg-btn-primary-hover text-btn-primary-text text-sm font-semibold rounded-full transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Shop Now
                <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
              <Link
                href="/about"
                className="inline-flex items-center px-5 py-2.5 border border-border-strong text-foreground text-sm font-semibold rounded-full hover:bg-surface-hover transition-colors duration-200"
              >
                Our Story
              </Link>
            </div>
          </div>

          {/* Bounce Cards */}
          <div className="order-1 md:order-2 flex items-center justify-center">
            <BounceCards
              className="custom-bounceCards"
              images={HERO_IMAGES}
              containerWidth={isMobile ? 300 : 500}
              containerHeight={isMobile ? 200 : 300}
              animationDelay={0.6}
              animationStagger={0.08}
              easeType="elastic.out(1, 0.5)"
              transformStyles={isMobile ? BOUNCE_TRANSFORMS_MOBILE : BOUNCE_TRANSFORMS}
              enableHover={!isMobile}
            />
          </div>
        </div>
      </section>

      {/* ─── Collection Products ─── */}
      {collectionProducts.length > 0 && (
        <section className="max-w-5xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Main heading for all collections */}
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-accent mb-1">
              Our Products
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Handpicked From Our Collections
            </h2>
          </div>

          <div className="space-y-12 sm:space-y-16">
          {collectionProducts.map((col) => (
            <div key={col.collectionId}>
              {/* Collection heading */}
              <div className="flex items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 sm:h-7 rounded-full bg-accent" />
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                    {col.collectionName}
                  </h3>
                </div>
              </div>

              {/* Product grid — 2 cols mobile, 4 cols desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {col.products.map((product: any) => (
                  <ProductCard
                    key={product.productId}
                    productId={product.productId}
                    productAsset={product.productAsset}
                    hoverAsset={product.hoverAsset ?? null}
                    productName={product.productName}
                    description={product.description}
                    slug={product.slug}
                    priceWithTax={product.priceWithTax}
                    currencyCode={product.currencyCode}
                    activeCustomer={activeCustomerForCard}
                    onShowSignInModal={() => setShowSignInModal(true)}
                  />
                ))}
              </div>

              {/* View More button */}
              <div className="mt-5 flex justify-center">
                <Link
                  href={`/collections/${col.collectionSlug}`}
                  className="inline-flex items-center px-6 py-2.5 border border-border-strong text-foreground text-sm font-semibold rounded-full hover:bg-surface-hover hover:border-accent/40 transition-colors duration-200"
                >
                  View More
                  <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
          </div>
        </section>
      )}

      {/* ─── Features / Why Choose Us ─── */}
      <section className="max-w-5xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-8">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-accent mb-1">
            Why Prabha&apos;s Aari
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Crafted with Care, Delivered with Love
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              ),
              title: 'Handcrafted Excellence',
              desc: 'Every piece is meticulously hand-stitched using traditional aari techniques.',
            },
            {
              icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              ),
              title: 'Made with Love',
              desc: 'Each design is personally finished by Prabha with care and attention to detail.',
            },
            {
              icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
              ),
              title: 'Original Designs',
              desc: 'Unique patterns you won\'t find anywhere else — each one an original creation.',
            },
            {
              icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              ),
              title: 'Safe Delivery',
              desc: 'Carefully packaged and shipped with tracking to your doorstep across India.',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="group p-5 sm:p-6 rounded-xl bg-surface border border-border-theme hover:border-accent/40 hover:shadow-md transition-all duration-300 text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Custom Order CTA ─── */}
      <section className="max-w-5xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0A2540] via-[#13355E] to-[#0A2540] shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center">
            {/* Text */}
            <div className="p-6 sm:p-8 lg:p-12">
              <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-amber-300 mb-2">
                Custom Orders
              </p>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                Have a Design in Mind?
              </h2>
              <p className="mt-3 text-sm sm:text-base text-white/75 leading-relaxed max-w-md">
                We love bringing your vision to life. Share your ideas with us
                and get a custom aari piece crafted just for you.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="https://wa.me/918098267826"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-5 py-2.5 bg-white text-[#0A2540] text-sm font-semibold rounded-full hover:bg-white/90 transition-colors shadow-md"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp Us
                </a>
                {/* <Link
                  href="/about"
                  className="inline-flex items-center px-5 py-2.5 border border-white/30 text-white text-sm font-semibold rounded-full hover:bg-white/10 transition-colors"
                >
                  Learn More
                </Link> */} 
              </div>
            </div>

            <div className="hidden md:block p-6 sm:p-8 lg:p-12">
              <div className="aspect-[4/3] rounded-xl overflow-hidden">
                <img
                  src="https://cdn.prabhasaaridesigns.com/assets/casual_images/customdesign.jpeg"
                  alt="Custom aari designs"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next Custom Offer Poster */}
      <NextOfferPoster />

      {/* Phone Number Modal */}
      <PhoneNumberModal
        open={showPhoneModal}
        onOpenChange={setShowPhoneModal}
        isSubmitting={false}
        fetcher={null}
      />

      {/* Sign-in prompt (e.g. when adding to favorites while signed out) */}
      <SignInPromptModal
        isOpen={showSignInModal}
        close={() => setShowSignInModal(false)}
        message="Sign in to save your favorite items."
        title="Sign In Required"
      />
    </div>
  );
}
