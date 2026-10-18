'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@/i18n/client';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { User, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

// Cookie write lives at module scope: the React compiler's immutability rule
// forbids assigning document.cookie inside the component body.
function setAuthCookie(token: string) {
  const secure = window.location.protocol === 'https:';
  document.cookie = `user_token=${token}; max-age=86400; path=/; samesite=lax${secure ? '; secure' : ''}`;
}

interface LoginPageProps {
  params: Promise<{ lng: string }>;
}

function LoginForm({ params }: LoginPageProps) {
  const { lng } = React.use(params);
  const { t } = useTranslation(lng, 'common');
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // IP Lockout countdown state (remaining seconds)
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      website: '',
    },
    mode: 'onBlur',
  });

  // Handle URL errors like session expiration
  useEffect(() => {
    const errorType = searchParams.get('auth_error');
    if (errorType === 'expired') {
      toast.error(t('auth.error_session_expired'), { id: 'session-expired' });
      // Clean up search params without reloading
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('auth_error');
        window.history.replaceState({}, '', url.toString());
      } catch {
        // Non-critical cleanup: a malformed URL only skips the param cleanup.
      }
    }
  }, [searchParams, t]);

  // Redirect authenticated users to inventory
  useEffect(() => {
    const getCookie = (name: string): string | undefined => {
      const match = document.cookie.split('; ').find((c) => c.trim().startsWith(`${name}=`));
      return match ? decodeURIComponent(match.split('=')[1]) : undefined;
    };

    let token = getCookie('user_token');
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('user_token') || undefined;
    }

    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const exp = payload.exp * 1000;
          if (Date.now() < exp) {
            router.replace(`/${lng}/inventory`);
          }
        }
      } catch {
        // Invalid token format
      }
    }
  }, [router, lng]);

  // Lockout countdown timer ticking
  useEffect(() => {
    if (lockoutSeconds <= 0) return;

    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setAuthError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const getLockoutMessage = () => {
    const minutes = Math.floor(lockoutSeconds / 60);
    const seconds = lockoutSeconds % 60;
    return t('auth.error_ip_blocked', { minutes, seconds });
  };

  const onSubmit = async (data: LoginFormData) => {
    if (lockoutSeconds > 0) return;
    setAuthError(null);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.email,
          password: data.password,
          website: data.website, // Honeypot field
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          // Lockout response
          const remaining = result.remainingSeconds || 3600;
          setLockoutSeconds(remaining);
          setAuthError(t('auth.error_ip_blocked', { 
            minutes: Math.floor(remaining / 60), 
            seconds: remaining % 60 
          }));
          toast.error(t('auth.error_title'));
          return;
        }

        // Invalid credentials or bad request
        setAuthError(t('auth.error_invalid_credentials'));
        toast.error(t('auth.error_title'));
        return;
      }

      // Successful Auth: Save Token to Cookie (lifetime: 24h) and localStorage
      setAuthCookie(result.token);
      localStorage.setItem('user_token', result.token);
      toast.success(t('auth.submit_button') + ' ' + t('inventory.success_edit').replace(/.*success.*/i, ''));
      
      // Redirect to Inventory dashboard
      router.push(`/${lng}/inventory`);
      router.refresh();
    } catch {
      setAuthError(t('inventory.error_generic'));
      toast.error(t('inventory.error_generic'));
    }
  };

  const isFormDisabled = isSubmitting || lockoutSeconds > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 font-body">
      <div className="w-full max-w-[420px] glass rounded-xl p-8 shadow-ambient border border-solid border-outline-variant/10 flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-sm">
            <Icon icon={User} size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            {t('auth.login_title')}
          </h1>
        </div>

        {/* Global Error Banner */}
        {authError && (
          <div className="bg-red-50 border border-solid border-red-200 text-red-700 text-sm rounded-xl p-4 flex items-start gap-3">
            <Icon icon={ShieldAlert} size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div className="font-medium">
              {lockoutSeconds > 0 ? getLockoutMessage() : authError}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* Honeypot Field (hidden) */}
          <input
            type="text"
            id="website"
            tabIndex={-1}
            autoComplete="off"
            style={{
              position: 'absolute',
              left: '-9999px',
              width: '1px',
              height: '1px',
              opacity: 0,
            }}
            {...register('website')}
          />

          {/* Email Address */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              {t('auth.email_label')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Icon icon={User} size={18} className="text-on-surface-variant/40 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                id="email"
                type="text"
                disabled={isFormDisabled}
                placeholder={t('auth.email_placeholder')}
                className="w-full h-12 rounded-xl bg-surface-container-lowest border border-solid border-outline-variant/30 pl-11 pr-4 text-sm outline-none focus:border-primary-container focus:ring-2 focus:ring-primary/5 transition-all text-on-surface placeholder:text-on-surface-variant/30 disabled:opacity-50"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs font-medium text-red-500 mt-1">
                {t(errors.email.message || '')}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              {t('auth.password_label')}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Icon icon={Lock} size={18} className="text-on-surface-variant/40 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                disabled={isFormDisabled}
                placeholder={t('auth.password_placeholder')}
                className="w-full h-12 rounded-xl bg-surface-container-lowest border border-solid border-outline-variant/30 pl-11 pr-12 text-sm outline-none focus:border-primary-container focus:ring-2 focus:ring-primary/5 transition-all text-on-surface placeholder:text-on-surface-variant/30 disabled:opacity-50"
                {...register('password')}
              />
              <button
                type="button"
                disabled={isFormDisabled}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-4 flex items-center text-on-surface-variant/40 hover:text-on-surface-variant transition-colors disabled:opacity-50"
              >
                <Icon icon={showPassword ? EyeOff : Eye} size={18} />
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-red-500 mt-1">
                {t(errors.password.message || '')}
              </p>
            )}
          </div>

          {/* Show Password Toggle Checkbox */}
          <div className="flex items-center gap-2.5 select-none mt-1">
            <input
              id="show-password-checkbox"
              type="checkbox"
              disabled={isFormDisabled}
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              className="rounded-sm border-outline-variant/30 text-primary focus:ring-primary h-4.5 w-4.5 transition-all disabled:opacity-50 cursor-pointer"
            />
            <label
              htmlFor="show-password-checkbox"
              className="text-sm font-medium text-on-surface-variant cursor-pointer disabled:opacity-50"
            >
              {t('auth.show_password')}
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isFormDisabled}
            className="w-full bg-talavera hover:shadow-ambient active:scale-[0.98] transition-all font-bold tracking-tight text-white mt-2 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{t('auth.signing_in')}</span>
              </>
            ) : (
              <span>{t('auth.submit_button')}</span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage({ params }: LoginPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface-variant font-body">
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    }>
      <LoginForm params={params} />
    </Suspense>
  );
}
