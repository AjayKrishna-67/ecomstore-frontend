'use client';

import clsx from 'clsx';

export function Button(
  props: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>,
) {
  return (
    <button
      {...props}
      className={clsx(
        'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-gold',
        'border rounded-md py-2 px-4 text-base font-medium text-btn-primary-text',
        'bg-btn-primary hover:bg-btn-primary-hover',
        'flex items-center justify-around gap-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        props.className,
      )}
      style={{
        ...props.style,
      }}
    >
      {props.children}
    </button>
  );
}
