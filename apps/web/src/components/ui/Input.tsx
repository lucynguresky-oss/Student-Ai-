'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, type, id, ...props }, ref) => {
    const [showPw, setShowPw] = useState(false);
    const inputType = type === 'password' ? (showPw ? 'text' : 'password') : type;
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-muted)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={cn(
              'lx-input',
              leftIcon && 'pl-10',
              type === 'password' && 'pr-10',
              error && 'error',
              className,
            )}
            {...props}
          />
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
              tabIndex={-1}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--text-dim)]">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
