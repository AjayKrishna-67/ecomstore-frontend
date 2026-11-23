import { ArrowPathIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

type HighlightedButtonProps = React.PropsWithChildren<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> & {
  isSubmitting?: boolean;
};

export function HighlightedButton({
  isSubmitting = false,
  ...props
}: HighlightedButtonProps) {
  return (
    <button
      disabled={isSubmitting}
      {...props}
      className={clsx(
        'border border-transparent rounded-md py-2 px-4 text-base font-medium text-btn-primary-text',
        'bg-btn-primary hover:bg-btn-primary-hover',
        'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-gold',
        'disabled:opacity-50 disabled:hover:opacity-30',
        'flex items-center justify-around gap-2',
        props.className,
      )}
      style={{
        ...props.style,
      }}
    >
      {props.children}
      {isSubmitting && (
        <ArrowPathIcon className="w-4 h-4 animate-spin"></ArrowPathIcon>
      )}
    </button>
  );
}
