'use client';

import { passwordScore, STRENGTH_LABELS, STRENGTH_COLORS } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;
  const score = passwordScore(password);
  const label = STRENGTH_LABELS[score];
  const color = STRENGTH_COLORS[score];

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex gap-1">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-500"
            style={{
              background: i < score ? color : 'var(--bg-surface)',
            }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color }}>
        {label}
      </p>
    </div>
  );
}
