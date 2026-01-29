import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';
import type { AuthResponse } from '../../../shared/types';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const refreshMe = useAuthStore((state) => state.refreshMe);
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const normalizeHandle = (value: string) => {
    let normalized = value.trim();
    normalized = normalized.replace(/^@+/, '');
    normalized = normalized.replace(/\s+/g, '');
    return normalized;
  };

  useEffect(() => {
    if (resendCountdown <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setResendCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  const validateStep = () => {
    if (step === 1 && !name.trim()) {
      toast.error('Please enter your full name');
      return false;
    }

    if (step === 1) {
      const normalizedHandle = normalizeHandle(handle);
      if (!normalizedHandle) {
        toast.error('Please enter a handle');
        return false;
      }

      if (!/^[a-zA-Z0-9]+$/.test(normalizedHandle)) {
        toast.error('Handle can only contain letters and numbers');
        return false;
      }

      if (normalizedHandle.length < 3 || normalizedHandle.length > 20) {
        toast.error('Handle must be between 3 and 20 characters');
        return false;
      }
    }

    if (step === 2) {
      if (!email.trim()) {
        toast.error('Please enter your email');
        return false;
      }

      if (!/^\S+@\S+\.\S+$/.test(email)) {
        toast.error('Please enter a valid email');
        return false;
      }

      if (password.length < 8) {
        toast.error('Password must be at least 8 characters');
        return false;
      }
    }

    if (step === 3) {
      if (!code.trim()) {
        toast.error('Please enter the verification code');
        return false;
      }

      if (!confirm) {
        toast.error('Please accept the user agreement');
        return false;
      }
    }

    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) {
      return;
    }

    if (step === 2) {
      setLoading(true);
      try {
        const normalizedHandle = normalizeHandle(handle);
        const response = await apiClient.post<{ expires_at: string }>('/auth/register', {
          name,
          handle: normalizedHandle,
          email,
          password,
        });
        setResendCountdown(60);
        toast.success('Verification code sent to your email');
        setStep(3);
        if (response.data.expires_at) {
          const expiresAt = new Date(response.data.expires_at);
          const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
          if (remaining > 0) {
            setResendCountdown(Math.min(remaining, 60));
          }
        }
      } catch (error: any) {
        const message = error.response?.data?.error || 'Failed to send verification code';
        toast.error(message);
      } finally {
        setLoading(false);
      }
      return;
    }

    setStep((prevStep) => Math.min(prevStep + 1, 3));
  };

  const handleBack = () => {
    setStep((prevStep) => Math.max(prevStep - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step !== 3 || !validateStep()) {
      return;
    }

    setLoading(true);

    try {
      const normalizedHandle = normalizeHandle(handle);
      const response = await apiClient.post<AuthResponse>('/auth/register/confirm', {
        name,
        handle: normalizedHandle,
        email,
        password,
        code,
      });

      setAuth(response.data.user, response.data.token);
      await refreshMe();
      toast.success('Account created successfully!');
      navigate('/app');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email first');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/register/resend', { email });
      setResendCountdown(60);
      toast.success('Verification code resent');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to resend code';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl shadow-blue-900/30 w-full max-w-md p-8 border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Create Account
          </h1>
          <p className="text-slate-600">Join DevHub today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-sm text-slate-500">
            Step {step} of 3
          </div>

          {step === 1 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="John Doe"
                autoComplete="name"
              />
              <label className="mt-4 block text-sm font-medium text-slate-700 mb-2">
                Handle
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(normalizeHandle(e.target.value))}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="johndoe"
                autoComplete="username"
              />
              <p className="mt-1 text-sm text-slate-500">
                3-20 characters, letters and numbers only
              </p>
            </div>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                  minLength={8}
                  autoComplete="new-password"
                />
                <p className="mt-1 text-sm text-slate-500">
                  Must be at least 8 characters
                </p>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-medium text-slate-700">Check your inbox</p>
                <p className="mt-1">We sent a 6-digit code to {email || 'your email'}.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Verification code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Enter the code"
                  inputMode="numeric"
                  maxLength={6}
                />
              </div>

              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>
                  {resendCountdown > 0
                    ? `Resend available in ${resendCountdown}s`
                    : 'Didn’t receive a code?'}
                </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCountdown > 0 || loading}
                  className="font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  Resend
                </button>
              </div>

              <label className="flex items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={confirm}
                  onChange={(e) => setConfirm(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  Я принимаю{' '}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
                    Пользовательское соглашение
                  </Link>
                  .
                </span>
              </label>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="w-full rounded-lg border border-slate-200 bg-white py-3 font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-500 focus:ring-4 focus:ring-blue-200 transition"
              >
                {loading && step === 2 ? 'Sending code...' : 'Next'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-500 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
