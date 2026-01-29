import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';
import type  { AuthResponse } from '../../../shared/types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const refreshMe = useAuthStore((state) => state.refreshMe);
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateStep = () => {
    if (step === 1) {
      if (!email.trim()) {
        toast.error('Please enter your email');
        return false;
      }

      if (!/^\S+@\S+\.\S+$/.test(email)) {
        toast.error('Please enter a valid email');
        return false;
      }
    }

    if (step === 2 && !password) {
      toast.error('Please enter your password');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep()) {
      return;
    }

    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step !== 2 || !validateStep()) {
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      setAuth(response.data.user, response.data.token);
      await refreshMe();
      toast.success('Welcome back!');
      navigate('/app');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
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
            Welcome to DevHub
          </h1>
          <p className="text-slate-600">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-sm text-slate-500">
            Step {step} of 2
          </div>

          {step === 1 && (
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
          )}

          {step === 2 && (
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
                autoComplete="current-password"
              />
            </div>
          )}

          <div className="flex flex-col gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={handleBack}
                className="w-full rounded-lg border border-slate-200 bg-white py-3 font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Back
              </button>
            )}

            {step === 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-500 focus:ring-4 focus:ring-blue-200 transition"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-500 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-slate-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};
