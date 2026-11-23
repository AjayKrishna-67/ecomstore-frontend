'use client';

import React, { SelectHTMLAttributes } from 'react';

export type SelectProps = {
  placeholder?: string;
  noPlaceholder?: boolean;
  label?: string;
  name: string;
  error?: string;
} & SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      name,
      label,
      required,
      defaultValue,
      placeholder = '',
      noPlaceholder = false,
      children,
      error,
      ...props
    },
    ref,
  ) => {
    return (
      <div>
        {label && (
          <label htmlFor={name} className="block text-sm font-medium text-text-secondary">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </label>
        )}
        <select
          ref={ref}
          id={name}
          name={name}
          {...props}
          defaultValue={defaultValue}
          className="block w-full bg-input-bg text-text-primary border-input-border rounded-md shadow-sm focus:ring-gold focus:border-navy sm:text-sm"
        >
          {!noPlaceholder && (
            <option value="">{placeholder || 'Select'}</option>
          )}
          {children}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  },
);
