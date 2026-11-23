'use client';

import React, { type RefObject, useState } from 'react';
import { z } from 'zod';
import type { Address } from '@/generated/graphql';
import { Input } from '@/components/Input';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

const addressSchema = z.object({
  fullName: z.string().min(1, { message: 'Name is required' }),
  city: z.string().min(1, { message: 'City is required' }),
  postalCode: z
    .string()
    .regex(/^\d{6}$/, { message: 'Pincode must be exactly 6 digits' }),
  streetLine1: z.string().min(1, { message: 'Address is required' }),
  streetLine2: z.string().min(1, { message: 'Address is required' }),
  phone: z
    .string()
    .regex(/^\d{10}$/, { message: 'Phone number must be exactly 10 digits' }),
  company: z.string().optional(),
  province: z.string().optional(),
  countryCode: z.string().optional(),
  defaultShippingAddress: z.string().optional(),
});

export { addressSchema as validator };

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('flex w-full flex-col space-y-1', className)}>
      {children}
    </div>
  );
};

const ModernInput = ({
  label,
  name,
  required = false,
  autoComplete,
  type = 'text',
  defaultValue,
  readOnly = false,
  error,
  ...rest
}: {
  label: string;
  name: string;
  required?: boolean;
  autoComplete?: string;
  type?: string;
  defaultValue?: string;
  readOnly?: boolean;
  error?: string;
  [key: string]: any;
}) => (
  <LabelInputContainer>
    <label htmlFor={name} className="text-sm font-medium text-text-secondary">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <Input
      id={name}
      name={name}
      type={type}
      required={required}
      autoComplete={autoComplete}
      defaultValue={defaultValue}
      readOnly={readOnly}
      {...rest}
      className="block w-full rounded-md border border-input-border bg-input-bg text-text-primary placeholder:text-text-muted px-3 py-2 text-sm shadow-sm transition-all duration-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
    />
    {error && <span className="text-sm text-red-500">{error}</span>}
  </LabelInputContainer>
);

export default function CustomerAddressForm({
  address,
  formRef,
  submit,
  isEditing = false,
  activeCustomer,
  availableCountries,
}: {
  address?: Address;
  formRef: RefObject<HTMLFormElement>;
  submit: () => void;
  isEditing?: boolean;
  activeCustomer?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  };
  availableCountries?: { id: string; name: string; code: string }[];
}) {
  const { t } = useTranslation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fullName =
    activeCustomer?.firstName && activeCustomer?.lastName
      ? `${activeCustomer.firstName} ${activeCustomer.lastName}`
      : activeCustomer?.firstName || activeCustomer?.lastName || '';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const result = addressSchema.safeParse(data);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    submit();
  };

  return (
    <div
      className="mx-auto w-full max-w-4xl bg-surface text-text-primary"
      style={{ maxHeight: '90vh' }}
    >
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-text-primary">
            {isEditing ? 'Edit Address Information' : 'New Address Information'}
          </h3>
          <p className="text-sm text-text-tertiary">
            Please provide your complete address details for delivery
          </p>
        </div>

        <form
          id="editAddressForm"
          ref={formRef}
          method="post"
          onSubmit={handleSubmit}
        >
          <input
            type="hidden"
            name="intent"
            value={isEditing ? 'updateAddress' : 'createAddress'}
          />
          {isEditing && (
            <input type="hidden" name="addressId" value={address?.id} />
          )}
          <input
            type="hidden"
            name="defaultShippingAddress"
            value={
              isEditing
                ? address?.defaultShippingAddress
                  ? 'true'
                  : 'false'
                : 'true'
            }
          />

          <div className="space-y-4">
            <ModernInput
              label="Full Name"
              name="fullName"
              required
              autoComplete="name"
              defaultValue={isEditing ? address?.fullName || '' : fullName}
              error={errors.fullName}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <ModernInput
                label="Door No"
                name="streetLine1"
                required
                autoComplete="address-line1"
                defaultValue={address?.streetLine1 || ''}
                error={errors.streetLine1}
              />
              <div className="md:col-span-2">
                <ModernInput
                  label="Address"
                  required
                  name="streetLine2"
                  autoComplete="address-line2"
                  defaultValue={address?.streetLine2 || ''}
                  error={errors.streetLine2}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ModernInput
                label="City"
                name="city"
                required
                autoComplete="address-level2"
                defaultValue={address?.city || ''}
                error={errors.city}
              />
              <ModernInput
                label="Pincode"
                name="postalCode"
                required
                type="text"
                pattern="[0-9]{6}"
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
                defaultValue={address?.postalCode || ''}
                error={errors.postalCode}
              />
            </div>
            <ModernInput
              label="Phone Number"
              name="phone"
              required
              type="tel"
              pattern="[0-9]{10}"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
              defaultValue={
                isEditing
                  ? address?.phoneNumber || ''
                  : activeCustomer?.phoneNumber || ''
              }
              error={errors.phone}
            />
          </div>

          <div className="mt-6 border-border-theme pt-4">
            <button
              type="submit"
              className="group/btn relative h-11 w-full rounded-md bg-spice hover:bg-spice-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] transition-all duration-200 hover:shadow-lg"
            >
              {isEditing ? 'Update Address' : 'Create Address'}
              <BottomGradient />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add CSS only in browser environment
if (typeof window !== 'undefined') {
  const styles = `
    .dropdown-down {
      position: relative;
    }
    .dropdown-down select {
      -webkit-appearance: menulist-button;
      appearance: menulist-button;
      position: relative;
      z-index: 10;
    }
    .dropdown-down select:focus + * {
      display: none;
    }
    .dropdown-down select::-ms-expand {
      display: none;
    }
    .dropdown-down select {
      padding-right: 1.5rem;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%23999' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.5rem center;
    }
  `;

  const styleSheet = new CSSStyleSheet();
  styleSheet.replaceSync(styles);
  document.adoptedStyleSheets = [styleSheet];
}
