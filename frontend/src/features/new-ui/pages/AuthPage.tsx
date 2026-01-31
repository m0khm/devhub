import { motion } from 'motion/react';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, Github, Chrome, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../../api/client';
import { useAuthStore } from '../../../store/authStore';
import type { AuthResponse } from '../../../shared/types';
import { isKeycloakEnabled, keycloakLogin, keycloakRegister, getKeycloak, exchangeKeycloakToken } from '../../../lib/keycloak';

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [keycloakLoading, setKeycloakLoading] = useState(false);
  const keycloakEnabled = isKeycloakEnabled();

  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(
    (searchParams.get('mode') as 'login' | 'register' | 'reset') || 'login'
  );
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const setAuth = useAuthStore((state) => state.setAuth);
  const refreshMe = useAuthStore((state) => state.refreshMe);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [resetData, setResetData] = useState({
    email: '',
    code: '',
    password: '',
  });

  useEffect(() => {
    if (resendCountdown <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setResendCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  useEffect(() => {
    setRegisterStep(1);
    setResetStep(1);
    setCode('');
    setConfirm(false);
    setLoading(false);
    setResendCountdown(0);

    if (mode === 'reset') {
      setResetData((prev) => ({ ...prev, email: formData.email || prev.email }));
    }
  }, [mode]);

  // Handle Keycloak callback - exchange KC token for DevHub token
  const handleKeycloakCallback = useCallback(async () => {
    if (!keycloakEnabled) return;
    const callbackMode = searchParams.get('mode');
    if (callbackMode !== 'keycloak-callback') return;

    setKeycloakLoading(true);
    try {
      const kc = getKeycloak();
      const authenticated = await kc.init({
        onLoad: 'check-sso',
        checkLoginIframe: false,
      });

      if (authenticated && kc.token) {
        const result = await exchangeKeycloakToken(apiClient);
        if (result) {
          setAuth(result.user, result.token);
          await refreshMe();
          toast.success('Вход через SSO выполнен!');
          navigate('/workspace');
          return;
        }
      }
      toast.error('Не удалось выполнить вход через SSO');
      setMode('login');
    } catch (error: any) {
      console.error('[keycloak] Callback error:', error);
      toast.error('Ошибка SSO авторизации');
      setMode('login');
    } finally {
      setKeycloakLoading(false);
    }
  }, [keycloakEnabled, searchParams, navigate, setAuth, refreshMe]);

  useEffect(() => {
    void handleKeycloakCallback();
  }, [handleKeycloakCallback]);

  const handleKeycloakLogin = async () => {
    setKeycloakLoading(true);
    try {
      await keycloakLogin();
    } catch (error: any) {
      toast.error('Не удалось подключиться к SSO');
      setKeycloakLoading(false);
    }
  };

  const handleKeycloakRegister = async () => {
    setKeycloakLoading(true);
    try {
      await keycloakRegister();
    } catch (error: any) {
      toast.error('Не удалось подключиться к SSO');
      setKeycloakLoading(false);
    }
  };

  const validateRegisterStep = (step: 1 | 2) => {
    if (step === 1) {
      if (!formData.name.trim()) {
        toast.error('Введите имя');
        return false;
      }

      if (!formData.email.trim()) {
        toast.error('Введите email');
        return false;
      }

      if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
        toast.error('Введите корректный email');
        return false;
      }

      if (formData.password.length < 8) {
        toast.error('Пароль должен быть не менее 8 символов');
        return false;
      }
    }

    if (step === 2) {
      if (!code.trim()) {
        toast.error('Введите код подтверждения');
        return false;
      }

      if (!confirm) {
        toast.error('Подтвердите согласие с условиями');
        return false;
      }
    }

    return true;
  };

  const handleSendCode = async () => {
    if (!validateRegisterStep(1)) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post<{ expires_at?: string }>('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      setRegisterStep(2);
      setResendCountdown(60);
      toast.success('Код подтверждения отправлен');
      if (response.data.expires_at) {
        const expiresAt = new Date(response.data.expires_at);
        const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
        if (remaining > 0) {
          setResendCountdown(Math.min(remaining, 60));
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Не удалось отправить код';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRegister = async () => {
    if (!validateRegisterStep(2)) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register/confirm', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        code,
      });
      setAuth(response.data.user, response.data.token);
      await refreshMe();
      toast.success('Аккаунт создан!');
      navigate('/workspace');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Не удалось подтвердить регистрацию';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!formData.email.trim()) {
      toast.error('Введите email');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/register/resend', { email: formData.email });
      setResendCountdown(60);
      toast.success('Код отправлен повторно');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Не удалось отправить код повторно';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const validateResetStep = (step: 1 | 2) => {
    if (!resetData.email.trim()) {
      toast.error('Введите email');
      return false;
    }

    if (!/^\S+@\S+\.\S+$/.test(resetData.email)) {
      toast.error('Введите корректный email');
      return false;
    }

    if (step === 2) {
      if (!resetData.code.trim()) {
        toast.error('Введите код');
        return false;
      }

      if (resetData.password.length < 8) {
        toast.error('Пароль должен быть не менее 8 символов');
        return false;
      }
    }

    return true;
  };

  const handleRequestReset = async () => {
    if (!validateResetStep(1)) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: resetData.email });
      setResetStep(2);
      toast.success('Если аккаунт существует, код отправлен на почту');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Не удалось отправить код';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateResetStep(2)) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        email: resetData.email,
        code: resetData.code,
        password: resetData.password,
      });
      toast.success('Пароль обновлен. Войдите снова.');
      setMode('login');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Не удалось сбросить пароль';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (mode === 'login') {
      setLoading(true);
      try {
        const response = await apiClient.post<AuthResponse>('/auth/login', {
          email: formData.email,
          password: formData.password,
        });
        setAuth(response.data.user, response.data.token);
        await refreshMe();
        toast.success('Успешный вход!');
        navigate('/workspace');
      } catch (error: any) {
        const message = error.response?.data?.error || 'Не удалось войти';
        toast.error(message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'reset') {
      if (resetStep === 1) {
        await handleRequestReset();
        return;
      }

      await handleResetPassword();
      return;
    }

    if (registerStep === 1) {
      await handleSendCode();
      return;
    }

    await handleConfirmRegister();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 flex items-center justify-center p-6 overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -5 }}
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-300 hover:text-white transition-colors z-20"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">На главную</span>
      </motion.button>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:block"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl blur-xl opacity-70"></div>
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-2xl shadow-2xl">
                D
              </div>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DevHub
            </span>
          </div>

          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Добро пожаловать в будущее командной работы
          </h1>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Объединяем обсуждения, задачи и аналитику в одном пространстве для максимальной продуктивности.
          </p>

          <div className="space-y-4">
            {[
              'Неограниченные workspace для команд',
              'Синхронизация в реальном времени',
              'Интеграция с популярными инструментами',
              'Защита корпоративного уровня',
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-slate-300">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right side - Auth form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl"></div>

            {/* Form container */}
            <div className="relative bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-2xl">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {mode === 'login'
                    ? 'Вход в аккаунт'
                    : mode === 'reset'
                    ? 'Восстановление пароля'
                    : 'Создание аккаунта'}
                </h2>
                <p className="text-slate-400">
                  {mode === 'login'
                    ? 'Рады видеть вас снова!'
                    : mode === 'reset'
                    ? 'Получите код и установите новый пароль'
                    : 'Начните работу с DevHub за минуту'}
                </p>
              </div>

              {/* Social auth buttons */}
              <div className={`grid ${keycloakEnabled ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mb-8`}>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
                >
                  <Github className="w-5 h-5" />
                  <span className="font-medium">GitHub</span>
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
                >
                  <Chrome className="w-5 h-5" />
                  <span className="font-medium">Google</span>
                </motion.button>
                {keycloakEnabled && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => mode === 'register' ? handleKeycloakRegister() : handleKeycloakLogin()}
                    disabled={keycloakLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl text-white hover:from-blue-500/20 hover:to-cyan-500/20 transition-all"
                  >
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span className="font-medium">{keycloakLoading ? 'SSO...' : 'SSO'}</span>
                  </motion.button>
                )}
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-900/50 text-slate-400">или используйте email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'register' && registerStep === 1 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Имя
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Введите ваше имя"
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={mode === 'reset' ? resetData.email : formData.email}
                      onChange={(e) =>
                        mode === 'reset'
                          ? setResetData({ ...resetData, email: e.target.value })
                          : setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="your@email.com"
                      disabled={(mode === 'register' && registerStep === 2) || (mode === 'reset' && resetStep === 2)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {(mode === 'login' || mode === 'register' || (mode === 'reset' && resetStep === 2)) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Пароль
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={mode === 'reset' ? resetData.password : formData.password}
                        onChange={(e) =>
                          mode === 'reset'
                            ? setResetData({ ...resetData, password: e.target.value })
                            : setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="••••••••"
                        disabled={mode === 'register' && registerStep === 2}
                        className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'register' && registerStep === 2 && (
                  <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm text-slate-300">
                      Мы отправили 6-значный код на {formData.email || 'вашу почту'}.
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Код подтверждения
                      </label>
                      <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Введите код"
                        inputMode="numeric"
                        maxLength={6}
                        className="w-full px-4 py-3.5 bg-white/10 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <span>
                        {resendCountdown > 0
                          ? `Повторная отправка через ${resendCountdown}с`
                          : 'Не получили код?'}
                      </span>
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendCountdown > 0 || loading}
                        className="text-blue-400 hover:text-blue-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                      >
                        Отправить снова
                      </button>
                    </div>

                    <label className="flex items-start gap-3 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={confirm}
                        onChange={(e) => setConfirm(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/50"
                      />
                      <span>
                        Я принимаю условия пользовательского соглашения.
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setRegisterStep(1)}
                      className="text-left text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      Назад к данным
                    </button>
                  </div>
                )}

                {mode === 'reset' && resetStep === 2 && (
                  <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm text-slate-300">
                      Мы отправили 6-значный код на {resetData.email || 'вашу почту'}.
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Код подтверждения
                      </label>
                      <input
                        type="text"
                        value={resetData.code}
                        onChange={(e) => setResetData({ ...resetData, code: e.target.value })}
                        placeholder="Введите код"
                        inputMode="numeric"
                        maxLength={6}
                        className="w-full px-4 py-3.5 bg-white/10 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setResetStep(1)}
                      className="text-left text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      Изменить email
                    </button>
                  </div>
                )}

                {mode === 'login' && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500/50" />
                      <span>Запомнить меня</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Забыли пароль?
                    </button>
                  </div>
                )}

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)' }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/50"
                  disabled={loading}
                >
                  {mode === 'login'
                    ? loading
                      ? 'Входим...'
                      : 'Войти'
                    : mode === 'reset'
                    ? resetStep === 1
                      ? loading
                        ? 'Отправляем код...'
                        : 'Отправить код'
                      : loading
                      ? 'Сохраняем...'
                      : 'Сбросить пароль'
                    : registerStep === 1
                    ? loading
                      ? 'Отправляем код...'
                      : 'Отправить код'
                    : loading
                    ? 'Подтверждаем...'
                    : 'Подтвердить и войти'}
                </motion.button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-slate-400">
                  {mode === 'login'
                    ? 'Нет аккаунта?'
                    : mode === 'reset'
                    ? 'Вспомнили пароль?'
                    : 'Уже есть аккаунт?'}{' '}
                  <button
                    onClick={() =>
                      setMode(mode === 'login' ? 'register' : 'login')
                    }
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
