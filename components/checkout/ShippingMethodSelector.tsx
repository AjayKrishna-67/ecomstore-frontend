'use client';

import { useState, useEffect } from 'react';
import { RadioGroup } from '@headlessui/react';
import { Price } from '@/components/products/Price';
import { CheckCircleIcon, TruckIcon } from '@heroicons/react/24/solid';
import {
  CurrencyCode,
  EligibleShippingMethodsQuery,
} from '@/generated/graphql';
import { trackSelectShippingMethod } from '@/lib/fbpixel';

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function ShippingMethodSelector({
  eligibleShippingMethods,
  currencyCode,
  shippingMethodId,
  onChange,
}: {
  eligibleShippingMethods: EligibleShippingMethodsQuery['eligibleShippingMethods'];
  shippingMethodId: string | undefined;
  onChange: (value?: string) => void;
  currencyCode?: CurrencyCode;
}) {
  const [selectedId, setSelectedId] = useState(shippingMethodId || '');

  // Sync with prop when it changes (e.g. after page refresh)
  useEffect(() => {
    if (shippingMethodId) {
      setSelectedId(shippingMethodId);
    }
  }, [shippingMethodId]);

  const handleChange = (value: string) => {
    const method = eligibleShippingMethods.find((m) => m.id === value);
    trackSelectShippingMethod(value, method?.name);
    setSelectedId(value);
    onChange(value);
  };

  return (
    <RadioGroup value={selectedId} onChange={handleChange}>
      <div className="space-y-3">
        {eligibleShippingMethods.map((shippingMethod) => (
          <RadioGroup.Option
            key={shippingMethod.id}
            value={shippingMethod.id}
            className={({ checked }) =>
              classNames(
                'relative flex cursor-pointer rounded-xl p-4 border-2 transition-all duration-200 ease-in-out',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500',
                checked
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-600 shadow-sm'
                  : 'bg-surface border-border-theme hover:border-amber-400',
              )
            }
          >
            {({ checked }) => (
              <div className="flex w-full items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <TruckIcon
                    className={classNames(
                      'h-6 w-6',
                      checked ? 'text-amber-600' : 'text-text-muted',
                    )}
                  />
                  <RadioGroup.Label
                    as="span"
                    className={classNames(
                      'block text-sm font-semibold',
                      checked ? 'text-amber-700 dark:text-amber-400' : 'text-text-primary',
                    )}
                  >
                    {shippingMethod.name}
                  </RadioGroup.Label>
                </div>

                <div className="flex items-center gap-3">
                  <RadioGroup.Description
                    as="span"
                    className={classNames(
                      'text-sm font-semibold',
                      checked ? 'text-amber-700 dark:text-amber-400' : 'text-text-primary',
                    )}
                  >
                    {shippingMethod.priceWithTax === 0 ? (
                      <span className="text-green-600 dark:text-green-400">Free</span>
                    ) : (
                      <Price
                        priceWithTax={shippingMethod.priceWithTax}
                        currencyCode={currencyCode}
                      />
                    )}
                  </RadioGroup.Description>
                  {checked && (
                    <CheckCircleIcon className="h-5 w-5 text-amber-500" />
                  )}
                </div>
              </div>
            )}
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  );
}
