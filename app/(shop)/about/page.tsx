import React from 'react';
import { Heart, Sparkles, Gem, Scissors, Star } from 'lucide-react';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A2540] via-[#13355E] to-[#0A2540] py-20 md:py-28">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(238,126,26,0.35) 0%, transparent 60%)',
            }}
          />
        </div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <span className="inline-block px-4 py-1 rounded-full text-xs font-semibold tracking-[0.25em] uppercase text-header-accent border border-header-accent/40 mb-6">
            Our Story
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            A Dream Woven with Love
          </h1>
          <p className="text-lg md:text-xl text-white/85 max-w-3xl mx-auto leading-relaxed">
            In 2022, in a small room on a quiet terrace, a dream gently came to
            life… Not just a business, but a journey born from pure love and
            passion for the timeless art of Aari tailoring.
          </p>
        </div>
      </section>

      {/* The Moment That Changed Everything */}
      <section className="py-16 sm:py-20 bg-surface">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center max-w-6xl mx-auto">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1 bg-header-accent/10 text-header-accent rounded-full text-xs font-semibold tracking-[0.2em] uppercase mb-5">
                <Heart className="w-4 h-4" />
                The Moment That Changed Everything
              </div>
              <div className="space-y-5 text-text-secondary leading-relaxed text-base">
                <p>
                  A lovingly handcrafted dress for a dear friend&apos;s little
                  child… Every stitch filled with care, every detail
                  thoughtfully designed — from the delicate bird motif to the
                  intricate finishing.
                </p>
                <p>The joy it brought was unforgettable.</p>
                <p>
                  They loved it so much that they asked for something even more
                  special — a matching outfit for both mother and daughter.
                </p>
                <p className="text-text-primary font-semibold">
                  That moment wasn&apos;t just special… It was the beginning of
                  this beautiful journey.
                </p>
              </div>
            </div>

            {/* Image */}
            <figure className="relative">
              <div className="w-full rounded-2xl bg-background border border-header-accent/30 shadow-lg overflow-hidden">
                <img
                  src="https://cdn.prabhasaaridesigns.com/assets/casual_images/edited%20first%20design.png"
                  alt="Our first design work"
                  className="w-full h-auto object-contain"
                  loading="lazy"
                />
              </div>
              <figcaption className="mt-3 text-center text-sm italic text-text-tertiary">
                Our first design work
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* From One Step to Many */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center max-w-6xl mx-auto">
            {/* Image (left on desktop) */}
            <figure className="relative md:order-1 order-2">
              <div className="w-full rounded-2xl bg-surface border border-header-accent/30 shadow-lg overflow-hidden">
                <img
                  src="https://cdn.prabhasaaridesigns.com/assets/casual_images/first%20design.png"
                  alt="Mother and daughter wearing matching Pattu pavadai"
                  className="w-full h-auto object-contain"
                  loading="lazy"
                />
              </div>
            </figure>

            {/* Text */}
            <div className="md:order-2 order-1">
              <div className="inline-flex items-center gap-2 px-4 py-1 bg-header-accent/10 text-header-accent rounded-full text-xs font-semibold tracking-[0.2em] uppercase mb-5">
                <Sparkles className="w-4 h-4" />
                From One Step to Many
              </div>
              <div className="space-y-5 text-text-secondary leading-relaxed text-base">
                <p>
                  That very first design, shared with the world, became the
                  foundation. Slowly and organically, orders began to flow in —
                  especially for little girls.
                </p>
                <p className="text-text-primary font-semibold italic">
                  With every order, trust grew. With every design, passion
                  deepened.
                </p>
                <p>
                  Today, our collection is filled with elegant, handcrafted{' '}
                  <strong className="text-text-primary">
                    Pattu pavadai designs
                  </strong>
                  , each one created with:
                </p>
                <ul className="space-y-3 pl-0">
                  {[
                    { icon: Scissors, text: 'Fine Aari craftsmanship' },
                    { icon: Gem, text: 'Premium fabrics and finishing' },
                    { icon: Sparkles, text: 'Unique and thoughtful designs' },
                  ].map(({ icon: Icon, text }, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-header-accent/15 border border-header-accent/40 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-header-accent" />
                      </div>
                      <span className="text-text-secondary">{text}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-text-primary font-semibold italic pt-2">
                  Every piece is not just stitched — it is carefully brought to
                  life.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Promise */}
      <section className="py-16 sm:py-20 bg-surface">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-header-accent/15 border border-header-accent/40 rounded-full mb-6 shadow-[0_0_24px_rgba(238,126,26,0.25)]">
              <Star className="w-8 h-8 text-header-accent" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
              Our Promise
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed mb-4">
              We believe that every child deserves to wear something truly
              special. That&apos;s why we don&apos;t just make outfits —{' '}
              <strong className="text-text-primary">
                we create memories, emotions, and moments that last forever.
              </strong>
            </p>
            <p className="text-text-secondary mb-10">Each dress you see is:</p>

            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  title: 'Handcrafted',
                  text: 'with attention to every detail',
                },
                {
                  title: 'Designed',
                  text: 'to reflect tradition with elegance',
                },
                {
                  title: 'Committed',
                  text: 'to quality and trust',
                },
              ].map(({ title, text }, i) => (
                <div
                  key={i}
                  className="bg-background p-6 rounded-xl border border-header-accent/20 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all"
                >
                  <h3 className="text-lg font-bold text-header-accent mb-2">
                    {title}
                  </h3>
                  <p className="text-sm text-text-secondary">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* More Than a Brand */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-[#0A2540] via-[#13355E] to-[#0A2540] rounded-3xl p-10 sm:p-14 shadow-xl relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(238,126,26,0.4) 0%, transparent 60%)',
              }}
            />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                More Than a Brand
              </h2>
              <p className="text-lg text-white/85 leading-relaxed max-w-2xl mx-auto">
                From a small terrace room to becoming a part of your special
                moments… This journey is built on{' '}
                <span className="text-header-accent font-semibold">love</span>,{' '}
                <span className="text-header-accent font-semibold">trust</span>
                , and the happiness of every little smile we create.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
