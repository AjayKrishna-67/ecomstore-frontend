'use client';
import { Fragment, useCallback, useMemo } from 'react';
import { Dialog, Disclosure, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/solid';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { FacetFilterTracker } from '@/components/facet-filter/facet-filter-tracker';
import { useTranslation } from 'react-i18next';
import { trackFilter } from '@/lib/fbpixel';

const FACET_PARAM = 'fvid';

export default function FacetFilterControls({
  facetFilterTracker,
  mobileFiltersOpen,
  setMobileFiltersOpen,
}: {
  facetFilterTracker: FacetFilterTracker;
  mobileFiltersOpen: boolean;
  setMobileFiltersOpen: (value: boolean) => void;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  const selectedIds = useMemo(
    () => new Set(searchParams.getAll(FACET_PARAM)),
    [searchParams],
  );

  const totalSelected = selectedIds.size;

  const updateFacet = useCallback(
    (valueId: string, checked: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.getAll(FACET_PARAM);
      params.delete(FACET_PARAM);
      const next = new Set(current);
      if (checked) next.add(valueId);
      else next.delete(valueId);
      next.forEach((id) => params.append(FACET_PARAM, id));
      // Reset to page 1 whenever filters change
      params.delete('page');
      const qs = params.toString();
      trackFilter('apply', Array.from(next));
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const clearAll = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(FACET_PARAM);
    params.delete('page');
    const qs = params.toString();
    trackFilter('clear');
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  const renderCheckboxList = (idPrefix: string) => (
    <>
      {facetFilterTracker.facetsWithValues.map((facet) => (
        <Disclosure
          as="div"
          key={facet.id}
          defaultOpen={true}
          className="border-b border-border-theme py-5"
        >
          {({ open }) => (
            <>
              <h3 className="-my-3 flow-root">
                <Disclosure.Button className="py-3 w-full flex items-center justify-between text-sm text-text-secondary hover:text-text-primary transition-colors">
                  <span className="font-semibold text-text-primary uppercase tracking-wide text-xs">
                    {facet.name}
                  </span>
                  <span className="ml-6 flex items-center text-text-muted">
                    {open ? (
                      <MinusSmallIcon className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <PlusSmallIcon className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>
                </Disclosure.Button>
              </h3>
              <Disclosure.Panel className="pt-5">
                <div className="space-y-2.5">
                  {facet.values.map((value, optionIdx) => {
                    const inputId = `${idPrefix}-${facet.id}-${optionIdx}`;
                    const isChecked = selectedIds.has(value.id);
                    return (
                      <label
                        key={value.id}
                        htmlFor={inputId}
                        className={`group flex items-center gap-3 cursor-pointer rounded-md px-2 py-1.5 -mx-2 transition-colors ${
                          isChecked
                            ? 'bg-spice/10'
                            : 'hover:bg-surface-hover'
                        }`}
                      >
                        <input
                          id={inputId}
                          name={FACET_PARAM}
                          type="checkbox"
                          value={value.id}
                          checked={isChecked}
                          onChange={(e) =>
                            updateFacet(value.id, e.target.checked)
                          }
                          className="h-4 w-4 rounded border-input-border bg-input-bg text-spice focus:ring-2 focus:ring-spice/40 focus:ring-offset-0 cursor-pointer"
                        />
                        <span
                          className={`flex-1 min-w-0 text-sm transition-colors ${
                            isChecked
                              ? 'text-text-primary font-medium'
                              : 'text-text-secondary group-hover:text-text-primary'
                          }`}
                        >
                          {value.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      ))}
    </>
  );

  return (
    <>
      {/* Mobile filter dialog */}
      <Transition.Root show={mobileFiltersOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-40 lg:hidden"
          onClose={setMobileFiltersOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="ml-auto relative max-w-xs w-full h-full bg-surface text-text-primary shadow-xl flex flex-col overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between border-b border-border-theme">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-text-primary">
                      {t('common.filters')}
                    </h2>
                    {totalSelected > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-spice text-white text-[11px] font-semibold">
                        {totalSelected}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="-mr-2 w-10 h-10 p-2 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                    onClick={() => setMobileFiltersOpen(false)}
                  >
                    <span className="sr-only">{t('common.closeMenu')}</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5">
                  {renderCheckboxList('filter-mobile')}
                </div>

                <div className="border-t border-border-theme p-4 flex gap-2 bg-surface">
                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={totalSelected === 0}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border-theme text-sm font-semibold text-text-primary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Clear all
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileFiltersOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-spice hover:bg-spice-600 text-white text-sm font-semibold transition-colors"
                  >
                    Show results
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between pb-4 border-b border-border-theme">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-text-primary">
              {t('common.filters')}
            </h3>
            {totalSelected > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-spice text-white text-[11px] font-semibold">
                {totalSelected}
              </span>
            )}
          </div>
          {totalSelected > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-spice hover:text-spice-600 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
        {renderCheckboxList('filter')}
      </div>
    </>
  );
}
