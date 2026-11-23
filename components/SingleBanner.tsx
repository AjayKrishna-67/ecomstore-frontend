'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Asset {
  id: string;
  name: string;
  source: string;
}

interface Banner {
  id: string;
  assets: Asset[];
  channels: {
    id: string;
    code: string;
  }[];
}

interface SingleBannerProps {
  banners: Banner[];
}

const AUTOPLAY_DURATION = 5000;

export function SingleBanner({ banners }: SingleBannerProps) {
  if (!banners || banners.length < 1) {
    return null;
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const totalPairs = Math.ceil(banners.length / 2);
  const currentPairIndex = Math.floor(currentIndex / 2) * 2;
  const secondBanner = banners[currentPairIndex + 1];

  // Swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isSwiping = useRef(false);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [banners.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [banners.length]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, []);

  // Progress bar animation + autoplay
  useEffect(() => {
    if (banners.length <= 1) return;

    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / AUTOPLAY_DURATION) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
        startTimeRef.current = Date.now();
        setProgress(0);
      }

      progressRef.current = requestAnimationFrame(animate);
    };

    progressRef.current = requestAnimationFrame(animate);

    return () => {
      if (progressRef.current) cancelAnimationFrame(progressRef.current);
    };
  }, [currentIndex, banners.length]);

  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;

    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  return (
    <section className="w-full mb-4 relative z-[10]">
      {/* Mobile: Single banner with swipe */}
      <div
        className="md:hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="w-full aspect-[1080/607] relative overflow-hidden rounded-md mx-auto">
          {banners.map((banner, index) => (
            <img
              key={banner.id}
              src={banner.assets[0]?.source || '/placeholder.svg'}
              alt={banner.assets[0]?.name || 'Banner'}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                index === currentIndex
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-105'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop/Tablet: Two banners side by side */}
      <div className="hidden md:block relative group">
        <div className="grid grid-cols-2 gap-1.5">
          {/* First banner */}
          <div className="aspect-[1080/607] relative overflow-hidden rounded-md">
            {banners.map((banner, index) => {
              const pairStart = Math.floor(index / 2) * 2;
              const isFirstInPair = index === pairStart;
              const isVisible = isFirstInPair && pairStart === currentPairIndex;
              return isFirstInPair ? (
                <img
                  key={banner.id}
                  src={banner.assets[0]?.source || '/placeholder.svg'}
                  alt={banner.assets[0]?.name || 'Banner'}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                    isVisible
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-105'
                  }`}
                />
              ) : null;
            })}
          </div>

          {/* Second banner */}
          <div className="aspect-[1080/607] relative overflow-hidden rounded-md">
            {banners.map((banner, index) => {
              const pairStart = Math.floor(index / 2) * 2;
              const isSecondInPair = index === pairStart + 1;
              const isVisible = isSecondInPair && pairStart === currentPairIndex;
              return isSecondInPair ? (
                <img
                  key={banner.id}
                  src={banner.assets[0]?.source || '/placeholder.svg'}
                  alt={banner.assets[0]?.name || 'Banner'}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                    isVisible
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-105'
                  }`}
                />
              ) : null;
            })}
            {!secondBanner && currentPairIndex === banners.length - 1 && (
              <div className="absolute inset-0 bg-surface-hover flex items-center justify-center rounded-md" />
            )}
          </div>
        </div>

        {/* Click zones with directional cursors */}
        {banners.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-0 top-0 w-1/2 h-full z-10 cursor-arrow-left"
              aria-label="Previous banner"
            />
            <button
              onClick={goNext}
              className="absolute right-0 top-0 w-1/2 h-full z-10 cursor-arrow-right"
              aria-label="Next banner"
            />
          </>
        )}
      </div>

      {/* Progress bar indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {/* Mobile: bar per banner */}
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className="relative h-1 rounded-full overflow-hidden touch-manipulation md:hidden"
              style={{ width: banners.length > 6 ? '20px' : '28px' }}
              aria-label={`Go to banner ${index + 1}`}
            >
              <div className="absolute inset-0 bg-white/30 rounded-full" />
              {index === currentIndex && (
                <div
                  className="absolute inset-y-0 left-0 bg-white rounded-full transition-none"
                  style={{ width: `${progress}%` }}
                />
              )}
              {index < currentIndex && (
                <div className="absolute inset-0 bg-white rounded-full" />
              )}
            </button>
          ))}
          {/* Desktop: bar per pair */}
          {Array.from({ length: totalPairs }).map((_, pairIdx) => (
            <button
              key={`pair-${pairIdx}`}
              onClick={() => goTo(pairIdx * 2)}
              className="relative h-1 rounded-full overflow-hidden touch-manipulation hidden md:block"
              style={{ width: totalPairs > 6 ? '24px' : '36px' }}
              aria-label={`Go to banner pair ${pairIdx + 1}`}
            >
              <div className="absolute inset-0 bg-white/30 rounded-full" />
              {pairIdx === Math.floor(currentIndex / 2) && (
                <div
                  className="absolute inset-y-0 left-0 bg-white rounded-full transition-none"
                  style={{ width: `${progress}%` }}
                />
              )}
              {pairIdx < Math.floor(currentIndex / 2) && (
                <div className="absolute inset-0 bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
