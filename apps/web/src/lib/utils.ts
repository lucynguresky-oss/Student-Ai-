import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as compact (e.g. 1200 → 1.2K) */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Derive initials from a display name */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Sleep helper for loading states */
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Password strength score 0-4 (rough client-side estimate) */
export function passwordScore(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (pw.length < 8) return 0;
  let score = 0;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
}

export const STRENGTH_LABELS = ['Too weak', 'Fair', 'Good', 'Strong', 'Very strong'] as const;
export const STRENGTH_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'] as const;
