'use client';

import { HomeIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export function Breadcrumbs({
  items,
}: {
  items: { name: string; slug: string; id: string }[];
}) {
  const { t } = useTranslation();

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-1 md:space-x-4">
        <li>
          <div>
            <Link href="/" className="text-text-muted hover:text-text-tertiary">
              <HomeIcon className="flex-shrink-0 h-5 w-5" aria-hidden="true" />
              <span className="sr-only">{t('home')}</span>
            </Link>
          </div>
        </li>
        {items
          .filter((item) => item.name !== '__root_collection__')
          .map((item, index) => (
            <li key={item.name}>
              <div className="flex items-center">
                <svg
                  className="flex-shrink-0 h-5 w-5 text-border-strong"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                </svg>
                <Link
                  href={'/collections/' + item.slug}
                  className="ml-2 md:ml-4 text-xs md:text-sm font-medium text-text-tertiary hover:text-text-secondary"
                >
                  {item.name}
                </Link>
              </div>
            </li>
          ))}
      </ol>
    </nav>
  );
}
