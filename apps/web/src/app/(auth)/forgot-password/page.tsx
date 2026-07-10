'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    // Always succeeds (enumeration-safe — server returns 200 regardless)
    await authApi.forgotPassword(data.email);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="w-14 h-14 rounded-full bg-lx-teal/10 flex items-center justify-center">
          <CheckCircle size={28} className="text-lx-teal" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text)] mb-1">Check your inbox</h1>
          <p className="text-sm text-[var(--text-muted)]">
            If an account with that email exists, we&apos;ve sent a reset link. Check your spam too.
          </p>
        </div>
        <Link href="/login" className="text-sm text-lx-blue hover:text-lx-purple transition-colors flex items-center gap-1">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--text)]">Reset your password</h1>
        <p className="text-sm text-[var(--text-muted)]">
          We&apos;ll send a reset link to your email
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input
          id="reset-email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          autoComplete="email"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button id="reset-btn" type="submit" size="lg" loading={isSubmitting} className="w-full">
          Send reset link
        </Button>
      </form>

      <Link href="/login" className="text-sm text-center text-lx-blue hover:text-lx-purple transition-colors flex items-center justify-center gap-1">
        <ArrowLeft size={14} /> Back to sign in
      </Link>
    </div>
  );
}
