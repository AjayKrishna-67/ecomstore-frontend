'use client';

import Link from 'next/link';
import { MapPin, Phone, Instagram } from 'lucide-react';

const WHATSAPP_NUMBER = '918098267826';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
const PHONE_NUMBER = '+91 80982 67826';
const PHONE_TEL = 'tel:+918098267826';
const INSTAGRAM_URL = 'https://www.instagram.com/prabhasaaridesigns/';
const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61591930924939';
const ADDRESS =
  'Madakulam Main Rd, near Madurai - Bodinayakanur Railway, V K P Nagar, line, Madurai, Tamil Nadu 625003';
const ADDRESS_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  ADDRESS,
)}`;

/** Inline WhatsApp glyph — lucide doesn't ship one. */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.52 3.48A11.77 11.77 0 0 0 12.06 0C5.51 0 .21 5.3.21 11.85c0 2.09.55 4.13 1.6 5.94L0 24l6.37-1.67a11.82 11.82 0 0 0 5.69 1.45h.01c6.55 0 11.85-5.3 11.85-11.85 0-3.17-1.23-6.15-3.4-8.45zM12.06 21.8h-.01a9.93 9.93 0 0 1-5.06-1.39l-.36-.22-3.78.99 1.01-3.68-.24-.38a9.9 9.9 0 0 1-1.52-5.26c0-5.47 4.45-9.93 9.95-9.93 2.66 0 5.15 1.04 7.03 2.91a9.9 9.9 0 0 1 2.91 7.03c0 5.5-4.45 9.93-9.93 9.93zm5.45-7.44c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.5 1.69.64.71.23 1.35.2 1.86.12.57-.08 1.76-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35z" />
    </svg>
  );
}

/** Inline Facebook "f" glyph. */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.84c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.57v1.88h2.77l-.44 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer
      className="text-footer-text border-t border-header-accent/30"
      style={{
        background:
          'linear-gradient(to bottom, var(--bg-footer-from), var(--bg-footer-to))',
      }}
    >
      <div className="max-w-5xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1 flex flex-col items-center text-center lg:items-start lg:text-left">
            <Link href="/" aria-label="Prabha's Aari Designs — Home">
              <img
                src="https://cdn.prabhasaaridesigns.com/assets/casual_images/logo.png"
                alt="Prabha's Aari Designs"
                className="h-16 w-auto drop-shadow-[0_2px_12px_rgba(238,126,26,0.25)]"
              />
            </Link>
            <p className="mt-6 text-sm text-footer-text/85 leading-relaxed max-w-xs">
              Prabha&apos;s Aari Designs brings you exquisite hand-crafted aari
              work, made with love, tradition, and attention to every stitch.
              Each piece is an original design — thoughtfully created and
              personally finished by Prabha.
            </p>

            {/* Social */}
            <div className="mt-7 flex items-center gap-4">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                className="group relative inline-flex items-center justify-center w-12 h-12 rounded-xl bg-footer-text/5 border border-footer-text/15 text-footer-accent hover:text-white hover:bg-[#25D366] hover:border-[#25D366] hover:shadow-[0_6px_20px_-6px_rgba(37,211,102,0.55)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <WhatsAppIcon className="w-[22px] h-[22px]" />
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="group relative inline-flex items-center justify-center w-12 h-12 rounded-xl bg-footer-text/5 border border-footer-text/15 text-footer-accent hover:text-white hover:bg-gradient-to-br hover:from-[#f58529] hover:via-[#dd2a7b] hover:to-[#8134af] hover:border-transparent hover:shadow-[0_6px_20px_-6px_rgba(221,42,123,0.55)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <Instagram className="w-[22px] h-[22px]" />
              </a>
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="group relative inline-flex items-center justify-center w-12 h-12 rounded-xl bg-footer-text/5 border border-footer-text/15 text-footer-accent hover:text-white hover:bg-[#1877F2] hover:border-[#1877F2] hover:shadow-[0_6px_20px_-6px_rgba(24,119,242,0.55)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <FacebookIcon className="w-[22px] h-[22px]" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
              {/* Quick Links */}
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-[0.15em] text-footer-accent mb-4">
                  Quick Links
                </h4>
                <nav className="space-y-3">
                  <Link
                    href="/"
                    className="block text-sm text-footer-text/85 hover:text-footer-accent transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    href="/size-chart"
                    className="block text-sm text-footer-text/85 hover:text-footer-accent transition-colors"
                  >
                    Size Chart
                  </Link>
                  <Link
                    href="/about"
                    className="block text-sm text-footer-text/85 hover:text-footer-accent transition-colors"
                  >
                    About Us
                  </Link>
                </nav>
              </div>

              {/* Support */}
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-[0.15em] text-footer-accent mb-4">
                  Support
                </h4>
                <nav className="space-y-3">
                  <Link
                    href="/privacy-policy"
                    className="block text-sm text-footer-text/85 hover:text-footer-accent transition-colors"
                  >
                    Privacy &amp; Refund Policy
                  </Link>
                  <Link
                    href="/terms-and-conditions"
                    className="block text-sm text-footer-text/85 hover:text-footer-accent transition-colors"
                  >
                    Terms &amp; Conditions
                  </Link>
                </nav>
              </div>

              {/* Contact */}
              <div id="contact">
                <h4 className="font-semibold text-sm uppercase tracking-[0.15em] text-footer-accent mb-4">
                  Get in Touch
                </h4>
                <address className="not-italic space-y-4 text-sm text-footer-text/85">
                  <a
                    href={ADDRESS_MAP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 hover:text-footer-accent transition-colors group"
                  >
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-footer-accent" />
                    <span className="leading-relaxed">{ADDRESS}</span>
                  </a>

                  <a
                    href={PHONE_TEL}
                    className="flex items-center gap-2 hover:text-footer-accent transition-colors"
                  >
                    <Phone className="w-4 h-4 flex-shrink-0 text-footer-accent" />
                    <span>{PHONE_NUMBER}</span>
                  </a>
{/* 
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-footer-accent transition-colors"
                  >
                    <WhatsAppIcon className="w-4 h-4 flex-shrink-0 text-footer-accent" />
                    <span>Chat on WhatsApp</span>
                  </a>

                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-footer-accent transition-colors"
                  >
                    <Instagram className="w-4 h-4 flex-shrink-0 text-footer-accent" />
                    <span>@prabhasaaridesigns</span>
                  </a> */}
                </address>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-12 border-t border-header-accent/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-footer-text/70">
            <p className="text-center sm:text-left">
              © {new Date().getFullYear()} Prabha&apos;s Aari Designs. All
              rights reserved. &nbsp;·&nbsp; Hand crafted with love.
            </p>
            <p className="text-center sm:text-right">
              Developed by{' '}
              <a
                href="https://avsecomhub.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-footer-accent hover:underline"
              >
                AVS Ecom Hub
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
