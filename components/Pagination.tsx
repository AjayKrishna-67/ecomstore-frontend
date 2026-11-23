'use client';

import { ArrowPathIcon } from '@heroicons/react/24/solid';
import { Select } from '@/components/Select';
import { Button } from '@/components/Button';
import { ComponentProps } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export type PaginationProps = {
  appliedPaginationLimit: number;
  allowedPaginationLimits: Set<number>;
  totalItems: number;
  appliedPaginationPage: number;
  isLoading?: boolean;
};

export function Pagination({
  appliedPaginationLimit,
  allowedPaginationLimits,
  totalItems,
  appliedPaginationPage,
  isLoading = false,
  ...props
}: PaginationProps & ComponentProps<'div'>) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Pagination is driven by the URL query string (`?page=&limit=`), which the
  // server page reads to fetch the right slice. Update those params (preserving
  // existing ones like q/fvid) and let the route re-render.
  const navigate = (
    updates: Record<string, string>,
    opts?: { scroll?: boolean },
  ) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    for (const [key, value] of Object.entries(updates)) {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`, {
      scroll: opts?.scroll ?? true,
    });
  };

  const isLastPage =
    appliedPaginationPage * appliedPaginationLimit >= totalItems;

  return (
    <div
      {...props}
      className={clsx(
        'flex flex-col md:flex-row justify-center items-end md:items-center gap-4 lg:gap-6',
        props.className,
      )}
    >
      <span className="flex gap-4 items-center">
        {isLoading && (
          <ArrowPathIcon className="animate-spin h-6 w-6 text-text-tertiary" />
        )}
        <Select
          name="limit"
          required
          noPlaceholder
          value={appliedPaginationLimit}
          disabled={isLoading}
          onChange={(e) =>
            // Changing page size can shift the item past the last page, so
            // reset back to page 1. Keep the scroll position — the shopper is
            // expanding the list they're already looking at.
            navigate({ limit: e.target.value, page: '1' }, { scroll: false })
          }
        >
          {Array.from(allowedPaginationLimits).map((x) => (
            <option key={x} value={x}>
              {x} {t('common.perPage')}
            </option>
          ))}
        </Select>
      </span>

      <div className="flex" role="group">
        <Button
          type="button"
          onClick={() =>
            navigate({ page: String(appliedPaginationPage - 1) })
          }
          disabled={appliedPaginationPage <= 1 || isLoading}
          className="!text-sm rounded-r-none border-r-0"
        >
          {t('common.prev')}
        </Button>
        <Button
          type="button"
          onClick={() =>
            navigate({ page: String(appliedPaginationPage + 1) })
          }
          disabled={isLastPage || isLoading}
          className="!text-sm rounded-l-none"
        >
          {t('common.next')}
        </Button>
      </div>
    </div>
  );
}
