import {
  LifebuoyIcon,
  NewspaperIcon,
  PhoneIcon,
  StarIcon,
  CheckCircleIcon,
} from '@heroicons/react/20/solid';
import Link from 'next/link';

const cards = [
  {
    name: 'Sales',
    description:
      'Premium spices at unbeatable prices. Bulk orders made simple and affordable.',
    icon: PhoneIcon,
    color: 'from-navy to-spice',
    bgColor: 'bg-background-cream/80',
    borderColor: 'border-navy/30',
  },
  {
    name: 'Technical Support',
    description:
      "We're here to help anytime. Quick support for all your spice needs.",
    icon: LifebuoyIcon,
    color: 'from-brand-orange to-brand-gold',
    bgColor: 'bg-background-cream/80',
    borderColor: 'border-brand-orange/30',
  },
  {
    name: 'Orders',
    description:
      'Order fresh, authentic spices in just a click. Fast delivery right to your door',
    icon: NewspaperIcon,
    color: 'from-brand-yellow to-brand-gold',
    bgColor: 'bg-background-cream/80',
    borderColor: 'border-brand-yellow/30',
  },
];

const features = [
  '24/7 Customer Support',
  'Fast & Reliable Delivery',
  'Premium Quality Spices',
];

export default function ContentSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img
          alt="background image"
          src="https://cdn.kaaikani.co.in/wmremove-transformed.jpeg"
          loading="lazy"
          className="h-full w-full object-cover object-center blur-[1px] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/65 to-white/70" />
      </div>

      {/* Subtle Pattern Overlay */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f3f4f6' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left: Header + Features + CTA */}
          <div>
            <div className="text-center lg:text-left mb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-navy/20 bg-background-cream/80 px-3 py-1 text-xs font-medium text-navy shadow-sm">
                Handpicked Spices
              </div>
              <h1 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
                Your Spice Journey
                <span className="block text-transparent bg-clip-text bg-black">
                  Starts Here
                </span>
              </h1>
              <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-navy/80 to-spice/80 mx-auto lg:mx-0" />
              <p className="mt-6 text-lg sm:text-xl text-brand-purple/80 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                Experience the perfect blend of quality, convenience, and exceptional service. From premium spices to lightning-fast delivery, we've got your pantry covered.
              </p>
            </div>

            <div className="mb-10 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-background-cream/90 backdrop-blur-sm border border-navy/20 shadow-sm transition-colors hover:border-navy/40"
                >
                  <CheckCircleIcon className="h-5 w-5 text-navy flex-shrink-0" />
                  <span className="text-sm font-medium text-brand-purple">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center lg:justify-start">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-white shadow-lg transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gold/50"
              >
                Explore Spices
                <StarIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Right: Cards */}
          <div className="relative">
            {/* Decorative gradient blob */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-tr from-gold/30 to-spice/40 opacity-40 blur-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {cards.map((card) => (
                <div
                  key={card.name}
                  className={`group relative overflow-hidden rounded-2xl ${card.bgColor} border-2 ${card.borderColor} p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl`}
                >
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-black rounded-2xl" />
                  </div>
                  <div className="relative mb-4">
                    <div className={`inline-flex p-3 rounded-2xl bg-black ${card.color} shadow-lg ring-1 ring-white/20`}>
                      <card.icon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  <div className="relative">
                    <h3 className="text-xl font-bold text-brand-purple mb-2">{card.name}</h3>
                    <p className="text-brand-purple/80 leading-relaxed">{card.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
