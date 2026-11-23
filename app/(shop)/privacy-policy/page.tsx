import { Shield, Mail, Phone } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-header-accent/15 border border-header-accent/40 rounded-full mb-6 shadow-[0_0_24px_rgba(238,126,26,0.25)]">
            <Shield className="w-8 h-8 text-header-accent" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4">
            Privacy &amp; Refund Policy
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            At Prabha&apos;s Aari Designs, we are committed to protecting your
            privacy and handling your information with care.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-surface rounded-2xl shadow-xl border border-header-accent/20 overflow-hidden">
          <div className="p-8 sm:p-12">
            <div className="space-y-10 text-text-primary">
              {/* Section 1 - Privacy Commitment */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-header-accent/15 border border-header-accent/40 rounded-full flex items-center justify-center">
                    <span className="text-header-accent font-bold text-sm">1</span>
                  </div>
                  <h2 className="text-2xl font-bold">Our Privacy Commitment</h2>
                </div>
                <ul className="ml-12 space-y-2 list-disc marker:text-header-accent text-base leading-relaxed text-text-secondary">
                  <li>Customer data is used only for order processing and communication.</li>
                  <li>We do not sell or share personal information with third parties.</li>
                  <li>Data is handled securely and responsibly.</li>
                </ul>
              </section>

              {/* Section 2 - Refund Policy */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-header-accent/15 border border-header-accent/40 rounded-full flex items-center justify-center">
                    <span className="text-header-accent font-bold text-sm">2</span>
                  </div>
                  <h2 className="text-2xl font-bold">Refund Policy</h2>
                </div>
                <ul className="ml-12 space-y-2 list-disc marker:text-header-accent text-base leading-relaxed text-text-secondary">
                  <li>No refunds except for valid damage or incorrect product claims.</li>
                  <li>Approved refunds will be processed within <strong className="text-text-primary">5–7 working days</strong>.</li>
                </ul>
              </section>

              {/* Contact Section */}
              <section className="bg-header-accent/5 p-6 rounded-xl border border-header-accent/30">
                <h3 className="text-xl font-bold text-text-primary mb-3">
                  Contact Us
                </h3>
                <p className="text-base leading-relaxed text-text-secondary mb-4">
                  For queries or questions about this privacy policy, please
                  contact us via:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-header-accent flex-shrink-0" />
                    <span>
                      <strong className="text-text-primary">WhatsApp:</strong>{' '}
                      <a
                        href="https://wa.me/918098267826"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-header-accent hover:underline"
                      >
                        +91 80982 67826
                      </a>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-header-accent flex-shrink-0" />
                    <span>
                      <strong className="text-text-primary">Phone:</strong>{' '}
                      <a
                        href="tel:+918098267826"
                        className="text-header-accent hover:underline"
                      >
                        +91 80982 67826
                      </a>
                    </span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
