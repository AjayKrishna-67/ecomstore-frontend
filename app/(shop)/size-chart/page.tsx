import { Ruler, Info } from 'lucide-react';
import type { Metadata } from 'next';
import { SizeChartGrid } from './size-chart-grid';

export const metadata: Metadata = {
  title: "Size Chart — Prabha's Aari Designs",
  description:
    'Complete size guide for Full Skirts, Blouses, Gowns and Umbrella Kurtis. All measurements in inches.',
};

const charts = [
  {
    title: 'Full Skirt & Normal Blouse',
    description:
      'Traditional full-skirt with normal blouse sizes — infant to teen.',
    src: 'https://cdn.prabhasaaridesigns.com/assets/casual_images/full-skirt-blouse.jpg.jpeg',
  },
  {
    title: 'Blouse Measurements',
    description:
      'Exact reference points for shoulder, chest, waist, arm and neckline measurements.',
    src: 'https://cdn.prabhasaaridesigns.com/assets/casual_images/blouse-measurements.jpg.jpeg',
  },
  {
    title: 'Gown (Floor Length)',
    description:
      'Floor-length gowns with chest, waist and length by age group.',
    src: 'https://cdn.prabhasaaridesigns.com/assets/casual_images/gown.jpg.jpeg',
  },
  {
    title: "Women's / Girls' Umbrella Kurti",
    description:
      'Umbrella kurti sizes from Small through 5X-Large with bust, waist, length and shoulder.',
    src: 'https://cdn.prabhasaaridesigns.com/assets/casual_images/umbrella-kurti.jpg.jpeg',
  },
];

export default function SizeChartPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-header-accent/15 border border-header-accent/40 rounded-full mb-6 shadow-[0_0_24px_rgba(238,126,26,0.25)]">
            <Ruler className="w-8 h-8 text-header-accent" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4">
            Size Chart
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Please choose your size carefully using the reference charts below
            before placing an order. All measurements are in inches.
          </p>
        </div>

        {/* Note */}
        <div className="mb-10 flex items-start gap-3 p-4 rounded-xl bg-header-accent/5 border border-header-accent/30">
          <Info className="w-5 h-5 text-header-accent mt-0.5 flex-shrink-0" />
          <p className="text-sm text-text-secondary leading-relaxed">
            Customers must refer to the size chart before placing an order. We
            are not responsible for incorrect size selection. A small stitching
            margin may be provided, but major alterations are not supported
            after delivery. For custom measurements, please contact us via
            WhatsApp.
          </p>
        </div>

        {/* Charts Grid (click to open fullscreen) */}
        <SizeChartGrid charts={charts} />

        {/* CTA */}
        <div className="mt-14 text-center bg-header-accent/5 border border-header-accent/30 rounded-2xl p-8">
          <h3 className="text-xl font-bold text-text-primary mb-2">
            Need a custom size?
          </h3>
          <p className="text-text-secondary mb-5 max-w-xl mx-auto">
            If your measurements don&apos;t fit the standard sizes, reach out
            to us on WhatsApp and we&apos;ll craft something perfectly tailored
            for you.
          </p>
          <a
            href="https://wa.me/918098267826"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-btn-primary text-btn-primary-text font-semibold hover:bg-btn-primary-hover transition-colors shadow-md"
          >
            Chat on WhatsApp
          </a>
        </div>
      </main>
    </div>
  );
}
