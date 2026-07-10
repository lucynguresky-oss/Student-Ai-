'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Camera, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { usersApi, LearnixApiError } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getInitials } from '@/lib/utils';

interface ProfileFormData {
  displayName: string;
  username: string;
  bio: string;
}

export default function ProfileSettingsPage() {
  const { user, refresh } = useAuth();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<ProfileFormData>();

  useEffect(() => {
    if (user) {
      reset({
        displayName: user.profile?.displayName ?? '',
        username: user.username ?? '',
        bio: (user.profile as Record<string, string> | undefined)?.bio ?? '',
      });
    }
  }, [user, reset]);

  async function onSubmit(data: ProfileFormData) {
    setError('');
    try {
      await usersApi.updateProfile(data as unknown as Record<string, unknown>);
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      if (e instanceof LearnixApiError) setError(e.message);
      else setError('Failed to save. Please try again.');
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const { uploadUrl, key } = await usersApi.avatarUploadUrl();
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      await usersApi.confirmAvatar(key);
      await refresh();
    } catch {
      setError('Avatar upload failed. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  }

  const initials = getInitials(user?.profile?.displayName ?? user?.username ?? '?');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text)]">Profile</h1>
        <p className="text-sm text-[var(--text-muted)]">Manage your public profile</p>
      </div>

      {/* Avatar */}
      <div className="lx-card p-6 flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full lx-gradient-bg flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
            {user?.profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : initials}
          </div>
          <button
            id="change-avatar-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--bg-card)] border-2 border-[var(--bg)] flex items-center justify-center hover:bg-lx-blue/10 transition-colors"
          >
            {avatarUploading ? (
              <svg className="animate-spin h-3 w-3 text-lx-blue" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <Camera size={13} className="text-[var(--text-muted)]" />
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <p className="text-xs text-[var(--text-dim)]">JPG, PNG or WebP — max 5 MB</p>
      </div>

      {/* Form */}
      <div className="lx-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <Input id="displayName" label="Display name" placeholder="Alex Johnson"
            error={errors.displayName?.message} {...register('displayName', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })} />

          <Input id="username" label="Username" placeholder="alexj"
            hint="Can only be changed once every 30 days"
            error={errors.username?.message}
            {...register('username', { pattern: { value: /^[a-z0-9_]{3,24}$/, message: 'Lowercase letters, numbers, underscores only (3–24 chars)' } })} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bio" className="text-sm font-medium text-[var(--text-muted)]">Bio</label>
            <textarea id="bio" rows={3} placeholder="Tell Lumi a bit about yourself…"
              className="lx-input resize-none" {...register('bio', { maxLength: { value: 200, message: 'Max 200 characters' } })} />
            {errors.bio && <p className="text-xs text-red-400">{errors.bio.message}</p>}
          </div>

          {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">{error}</div>}

          <Button id="save-profile-btn" type="submit" loading={isSubmitting} disabled={!isDirty} className="self-start"
            icon={saved ? <Check size={15} className="text-lx-teal" /> : undefined}>
            {saved ? 'Saved!' : 'Save changes'}
          </Button>
        </form>
      </div>
    </div>
  );
}
