import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'subtle' };

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors',
        'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-rs-gold disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' ? 'bg-rs-forest text-white hover:bg-rs-forest-hover' : 'bg-rs-button-soft text-rs-ink hover:bg-rs-button-soft-hover',
        className,
      ].join(' ')}
      {...props}
    />
  );
}
