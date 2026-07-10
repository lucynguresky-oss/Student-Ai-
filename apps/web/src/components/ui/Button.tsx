'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 select-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lx-blue focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

    const variants: Record<string, string> = {
      primary:
        'bg-gradient-to-r from-lx-teal via-lx-blue to-lx-purple text-white shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_28px_rgba(59,130,246,0.45)] hover:-translate-y-0.5 active:translate-y-0',
      ghost:
        'bg-transparent text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--bg-surface)] hover:text-[var(--text)]',
      outline:
        'bg-transparent text-[var(--text)] border border-[var(--border)] hover:border-lx-blue hover:text-lx-blue',
      danger:
        'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40',
    };

    const sizes: Record<string, string> = {
      sm: 'px-3 py-1.5 text-sm min-h-[36px]',
      md: 'px-5 py-2.5 text-[0.9375rem] min-h-[44px]',
      lg: 'px-7 py-3.5 text-base min-h-[52px]',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          icon
        )}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
