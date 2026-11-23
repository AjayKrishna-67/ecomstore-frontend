'use client';

import clsx from 'clsx';
import React from 'react';

type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'placeholder'
> & {
  label?: string;
  name: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ name, label, required, error, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={name} className="block text-sm font-medium text-text-secondary">
            {label}
            {required && <span className="text-red-500"> *</span>}
          </label>
        )}
        <input
          ref={ref}
          id={name}
          name={name}
          {...props}
          className={clsx(
            'block w-full py-2 px-4 shadow-sm border bg-input-bg rounded-md text-base sm:text-sm text-text-primary border-input-border placeholder:text-text-muted',
            'focus:ring-gold focus:border-navy focus:outline-none focus:ring-2',
            {
              'border-rose-500 focus:border-rose-500': error,
            },
            props.className,
          )}
        >
          {props.children}
        </input>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  },
);
