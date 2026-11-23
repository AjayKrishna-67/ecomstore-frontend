'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

type Chart = {
  title: string;
  description: string;
  src: string;
};

export function SizeChartGrid({ charts }: { charts: Chart[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenIndex(null);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = 'unset';
    };
  }, [openIndex]);

  const active = openIndex !== null ? charts[openIndex] : null;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {charts.map(({ title, description, src }, i) => (
          <figure
            key={title}
            className="bg-surface rounded-2xl shadow-lg border border-header-accent/20 overflow-hidden hover:shadow-xl transition-shadow"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="block w-full bg-background p-4 cursor-zoom-in group"
              aria-label={`View ${title} full screen`}
            >
              <img
                src={src}
                alt={title}
                className="w-full h-auto rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
                loading="lazy"
              />
            </button>
            <figcaption className="px-6 py-5 border-t border-header-accent/20">
              <h2 className="text-lg font-bold text-text-primary mb-1">
                {title}
              </h2>
              <p className="text-sm text-text-secondary">{description}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Lightbox */}
      {active && (
        <div
          onClick={() => setOpenIndex(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-8 animate-[fadeIn_.15s_ease-out]"
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenIndex(null);
            }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-7xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={active.src}
              alt={active.title}
              className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
            />
            <p className="mt-3 text-center text-sm text-white/80 font-medium">
              {active.title}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
