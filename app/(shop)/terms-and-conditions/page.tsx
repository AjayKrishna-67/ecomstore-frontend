import {
  Shield,
  Scissors,
  Ruler,
  Truck,
  RefreshCcw,
  XCircle,
  Copyright,
  Briefcase,
  AlertTriangle,
  MessageCircle,
  Phone,
} from 'lucide-react';

const sections = [
  {
    num: 1,
    title: 'General',
    icon: Shield,
    items: [
      'These Terms govern your use of our website and services.',
      'We reserve the right to update or modify these Terms at any time without prior notice.',
    ],
  },
  {
    num: 2,
    title: 'Products & Services',
    icon: Scissors,
    items: [
      'All products displayed are original designs owned by our brand.',
      'Product images are for representation purposes; slight variations in color, texture, or finish may occur due to lighting and display differences.',
      'Certain products may be handmade or made-to-order and may have minor variations.',
    ],
  },
  {
    num: 3,
    title: 'Customization Process',
    icon: MessageCircle,
    items: [
      'Products listed on the website are standard designs only and are not directly customizable through the website.',
      'Customers who require customization (design changes, design addition) must initiate a request via our WhatsApp contact option available on the website.',
      'Clicking the WhatsApp button will redirect users to initiate a direct call or chat for customization discussion.',
      'Customization requests are subject to design feasibility, material availability, and additional charges.',
      'Custom orders, once confirmed, cannot be cancelled or modified.',
    ],
  },
  {
    num: 4,
    title: 'Size & Measurements',
    icon: Ruler,
    items: [
      'Customers must refer to the size chart provided on the website before placing an order.',
      'We are not responsible for incorrect size selection by the customer.',
      'Minor stitching margin may be provided for adjustments.',
      'Height or major alterations are not supported after delivery.',
    ],
  },
  {
    num: 5,
    title: 'Shipping & Delivery',
    icon: Truck,
    items: [
      'Standard dispatch time is 5–6 working days, subject to variation based on workload or order type.',
      'Delivery timelines depend on location and third-party courier services.',
      'We are not responsible for delays caused by logistics providers.',
      'Urgent orders may be processed with additional charges (subject to availability).',
    ],
  },
  {
    num: 6,
    title: 'Returns & Exchanges',
    icon: RefreshCcw,
    items: [
      'No return or exchange is allowed except when a damaged product is received or an incorrect item is delivered.',
      'To raise a claim, a continuous unboxing video (without cuts or pauses) is mandatory, and the claim must be submitted within 24 hours of delivery.',
      'Products must be unused and in original condition.',
      'Claims without proper proof will not be accepted.',
    ],
  },
  {
    num: 7,
    title: 'Cancellation Policy',
    icon: XCircle,
    items: [
      'Orders once placed cannot be cancelled.',
      'This applies to all orders, including standard and customized items.',
    ],
  },
  {
    num: 8,
    title: 'Intellectual Property',
    icon: Copyright,
    items: [
      'All designs, images, content, and branding are the exclusive property of the business.',
      'Unauthorized use, reproduction, or copying is strictly prohibited and may result in legal action.',
    ],
  },
  {
    num: 9,
    title: 'Business Policy',
    icon: Briefcase,
    items: [
      'No reselling or collaboration is permitted without prior written approval.',
      'Any misuse of brand materials or designs is strictly prohibited.',
    ],
  },
  {
    num: 10,
    title: 'Limitation of Liability',
    icon: AlertTriangle,
    items: [
      'We shall not be held liable for minor variations in handmade or stitched products.',
      'We shall not be held liable for delivery delays caused by third-party services.',
      'We shall not be held liable for incorrect information provided by the customer.',
    ],
  },
];

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-header-accent/15 border border-header-accent/40 rounded-full mb-6 shadow-[0_0_24px_rgba(238,126,26,0.25)]">
            <Shield className="w-8 h-8 text-header-accent" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4">
            Terms &amp; Conditions
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Welcome to Prabha&apos;s Aari Designs — hand crafted with love and
            tradition. Please read these terms carefully before using our website
            and services.
          </p>
        </div>

        {/* Content */}
        <div className="bg-surface rounded-2xl shadow-xl border border-header-accent/20 overflow-hidden">
          <div className="p-8 sm:p-12">
            <div className="space-y-10 text-text-primary">
              {sections.map(({ num, title, icon: Icon, items }) => (
                <section key={num}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-header-accent/15 border border-header-accent/40 rounded-full flex items-center justify-center">
                      <span className="text-header-accent font-bold text-sm">
                        {num}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <Icon className="w-5 h-5 text-header-accent" />
                      {title}
                    </h2>
                  </div>
                  <ul className="ml-12 space-y-2 list-disc marker:text-header-accent text-base leading-relaxed text-text-secondary">
                    {items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </section>
              ))}

              {/* Customer Support */}
              <section className="bg-header-accent/5 p-6 rounded-xl border border-header-accent/30">
                <h3 className="text-xl font-bold text-text-primary mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-header-accent" />
                  Customer Support
                </h3>
                <p className="text-base leading-relaxed text-text-secondary mb-3">
                  For queries or customization requests, please contact us via:
                </p>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-header-accent flex-shrink-0" />
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
                  </li>
                  <li className="flex items-center gap-2">
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
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
