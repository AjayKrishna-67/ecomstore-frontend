import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-col items-center px-4 py-16 sm:py-32 text-center">
      <span className="text-sm font-semibold text-text-tertiary uppercase tracking-wide">
        404 error
      </span>
      <h1 className="mt-2 font-bold text-text-primary tracking-tight text-4xl sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 text-base text-text-tertiary max-w-full break-words">
        Sorry, we couldn&apos;t find the page you&apos;re looking for.
      </p>
      <div className="mt-6">
        <Link
          href="/"
          className="text-base font-medium text-foreground hover:text-navy-light inline-flex gap-2"
        >
          Go back home
        </Link>
      </div>
    </main>
  );
}
