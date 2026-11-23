'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-text-tertiary leading-relaxed">
          We ran into an unexpected issue while processing your request. Please try again or head back to the home page.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-btn-primary-text bg-btn-primary hover:bg-btn-primary-hover rounded-xl transition-colors shadow-sm"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-text-primary bg-surface hover:bg-surface-hover border border-border-theme rounded-xl transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}
