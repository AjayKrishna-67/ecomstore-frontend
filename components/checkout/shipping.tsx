'use client';

import { FormEvent, useState } from 'react';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';

import { shippingFormDataIsValid } from '@/lib/validation';
import { classNames } from '@/lib/utils';
import { AddressForm } from '@/components/account/AddressForm';
import { ShippingMethodSelector } from '@/components/checkout/ShippingMethodSelector';
import { ShippingAddressSelector } from '@/components/checkout/ShippingAddressSelector';
import { useTranslation } from 'react-i18next';
import AddAddressCard from '@/components/account/AddAddressCard';

// Note: The loader function has been removed. Data fetching should be done
// in a server component or via API routes in Next.js.

interface CheckoutShippingProps {
  availableCountries: any;
  eligibleShippingMethods: any;
  activeCustomer: any;
  error: any;
  activeOrderFetcher: any;
  activeOrder: any;
}

export default function CheckoutShipping({
  availableCountries,
  eligibleShippingMethods,
  activeCustomer,
  error,
  activeOrderFetcher,
  activeOrder,
}: CheckoutShippingProps) {
  const [customerFormChanged, setCustomerFormChanged] = useState(false);
  const [addressFormChanged, setAddressFormChanged] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const router = useRouter();
  const { t } = useTranslation();

  console.log('Rendering CheckoutShipping:', {
    activeOrder,
    availableCountries,
    error,
  }); // Debug log

  if (!activeOrder || !availableCountries || !eligibleShippingMethods) {
    return <div>Loading CheckoutShipping...</div>; // Fallback UI
  }

  const { customer, shippingAddress } = activeOrder ?? {};
  const isSignedIn = !!activeCustomer?.id;
  const addresses = activeCustomer?.addresses ?? [];
  const defaultFullName =
    shippingAddress?.fullName ??
    (customer ? `${customer.firstName} ${customer.lastName}` : '');
  const canProceedToPayment =
    customer &&
    ((shippingAddress?.streetLine1 && shippingAddress?.postalCode) ||
      selectedAddressIndex != null) &&
    activeOrder?.shippingLines?.length &&
    activeOrder?.lines?.length;

  const submitCustomerForm = (event: FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const { emailAddress, firstName, lastName } = Object.fromEntries<any>(
      formData.entries(),
    );
    const isValid = event.currentTarget.checkValidity();
    if (
      customerFormChanged &&
      isValid &&
      emailAddress &&
      firstName &&
      lastName
    ) {
      fetch('/api/active-order', {
        method: 'POST',
        body: formData,
      });
      setCustomerFormChanged(false);
    }
  };

  const submitAddressForm = (event: FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const isValid = event.currentTarget.checkValidity();
    if (addressFormChanged && isValid) {
      setShippingAddress(formData);
    }
  };

  const submitSelectedAddress = (index: number) => {
    const selectedAddress = activeCustomer?.addresses?.[index];
    if (selectedAddress) {
      setSelectedAddressIndex(index);
      const formData = new FormData();
      Object.keys(selectedAddress).forEach((key) =>
        formData.append(key, (selectedAddress as any)[key]),
      );
      formData.append('countryCode', selectedAddress.country.code);
      formData.append('action', 'setCheckoutShipping');
      setShippingAddress(formData);
    }
  };

  function setShippingAddress(formData: FormData) {
    if (shippingFormDataIsValid(formData)) {
      fetch('/api/active-order', {
        method: 'POST',
        body: formData,
      });
      setAddressFormChanged(false);
    }
  }

  const submitSelectedShippingMethod = (value?: string) => {
    if (value) {
      const formData = new FormData();
      formData.append('action', 'setShippingMethod');
      formData.append('shippingMethodId', value);
      fetch('/api/active-order', {
        method: 'POST',
        body: formData,
      });
    }
  };

  function navigateToPayment() {
    router.push('./payment');
  }

  return (
    <div>
      <div>
        <h2 className="text-lg font-medium text-gray-900">
          {t('checkout.detailsTitle')}
        </h2>

        {isSignedIn ? (
          <div>
            <p className="mt-2 text-gray-600">
              {customer?.firstName} {customer?.lastName}
            </p>
            <p>{customer?.emailAddress}</p>
          </div>
        ) : (
          <form
            method="post"
            action="/api/active-order"
            onBlur={submitCustomerForm}
            onChange={() => setCustomerFormChanged(true)}
            hidden={isSignedIn}
          >
            <input type="hidden" name="action" value="setOrderCustomer" />
            <div className="mt-4">
              <label
                htmlFor="emailAddress"
                className="block text-sm font-medium text-gray-700"
              >
                {t('account.emailAddress')}
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  id="emailAddress"
                  name="emailAddress"
                  autoComplete="email"
                  defaultValue={customer?.emailAddress}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-gold focus:border-navy sm:text-sm"
                  required
                />
              </div>
              {error?.errorCode === 'EMAIL_ADDRESS_CONFLICT_ERROR' && (
                <p className="mt-2 text-sm text-red-600" id="email-error">
                  {error.message}
                </p>
              )}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('account.firstName')}
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    autoComplete="given-name"
                    defaultValue={customer?.firstName}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-gold focus:border-navy sm:text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t('account.lastName')}
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    autoComplete="family-name"
                    defaultValue={customer?.lastName}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-gold focus:border-navy sm:text-sm"
                    required
                  />
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      <form
        method="post"
        action="/api/active-order"
        onBlur={submitAddressForm}
        onChange={() => setAddressFormChanged(true)}
      >
        <input type="hidden" name="action" value="setCheckoutShipping" />
        <div className="mt-10 border-t border-gray-200 pt-10">
          <h2 className="text-lg font-medium text-gray-900">
            {t('checkout.shippingTitle')}
          </h2>
        </div>
        {isSignedIn && activeCustomer.addresses?.length ? (
          <div>
            <ShippingAddressSelector
              addresses={activeCustomer.addresses}
              selectedAddressIndex={selectedAddressIndex}
              onChange={submitSelectedAddress}
            />
          </div>
        ) : (
          <AddressForm
            availableCountries={availableCountries}
            address={shippingAddress}
            defaultFullName={defaultFullName}
          />
        )}
      </form>
      <AddAddressCard />
      <div className="mt-10 border-t border-gray-200 pt-10">
        <ShippingMethodSelector
          eligibleShippingMethods={eligibleShippingMethods}
          currencyCode={activeOrder?.currencyCode}
          shippingMethodId={
            activeOrder?.shippingLines[0]?.shippingMethod.id ?? ''
          }
          onChange={submitSelectedShippingMethod}
        />
      </div>

      <button
        type="button"
        disabled={!canProceedToPayment}
        onClick={navigateToPayment}
        className={classNames(
          canProceedToPayment
            ? 'bg-spice hover:bg-spice-600'
            : 'bg-gray-400',
          'flex w-full items-center justify-center space-x-2 mt-24 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold',
        )}
      >
        <LockClosedIcon className="w-5 h-5" />
        <span>{t('checkout.goToPayment')}</span>
      </button>
    </div>
  );
}
