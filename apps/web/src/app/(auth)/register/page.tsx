'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User } from 'lucide-react';
import { authApi, LearnixApiError } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PasswordStrength from '@/components/ui/PasswordStrength';
import PhoneInput from '@/components/PhoneInput';

const schema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const [watchedPw, setWatchedPw] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setServerError('');
    if (!data.email && !phoneValid) {
      setServerError('Please provide at least an email or a valid phone number.');
      return;
    }
    try {
      await authApi.register({
        displayName: data.displayName,
        ...(data.email ? { email: data.email } : {}),
        ...(phoneValid ? { phone } : {}),
        password: data.password,
      });
      router.push('/onboarding');
    } catch (e) {
      if (e instanceof LearnixApiError) setServerError(e.message);
      else setServerError('Something went wrong. Please try again.');
    }
  }

  const pw = watch('password', '');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[var(--text)]">Create your account</h1>
        <p className="text-sm text-[var(--text-muted)]">Start learning with Lumi today</p>
      </div>

      {/* Google OAuth */}
      <a href={authApi.oauthGoogle()} id="google-register-btn" className="lx-btn lx-btn-ghost w-full flex items-center gap-3">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </a>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-xs text-[var(--text-dim)]">or with email / phone</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input
          id="displayName"
          label="Full name"
          placeholder="Alex Johnson"
          autoComplete="name"
          leftIcon={<User size={15} />}
          error={errors.displayName?.message}
          {...register('displayName')}
        />

        <Input
          id="email"
          type="email"
          label="Email (optional if phone provided)"
          placeholder="you@example.com"
          autoComplete="email"
          leftIcon={<Mail size={15} />}
          error={errors.email?.message}
          {...register('email')}
        />

        <PhoneInput
          id="phone-input"
          value={phone}
          onChange={(e164, valid) => { setPhone(e164); setPhoneValid(valid); }}
        />

        <div className="flex flex-col gap-2">
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            leftIcon={<Lock size={15} />}
            error={errors.password?.message}
            {...register('password', { onChange: (e) => setWatchedPw(e.target.value) })}
          />
          <PasswordStrength password={pw || watchedPw} />
        </div>

        {serverError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
            {serverError}
          </div>
        )}

        <Button id="create-account-btn" type="submit" size="lg" loading={isSubmitting} className="w-full mt-1">
          Create account
        </Button>
      </form>

      <p className="text-sm text-center text-[var(--text-muted)]">
        Already have an account?{' '}
        <Link href="/login" className="text-lx-blue font-medium hover:text-lx-purple transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
