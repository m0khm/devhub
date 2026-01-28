import { motion } from 'motion/react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, Github, Chrome } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../../api/client';
import { useAuthStore } from '../../../store/authStore';
import { useProjectStore } from '../../../store/projectStore';
import type { AuthResponse, Project } from '../../../shared/types';

const normalizeHandle = (value: string) => {
  let normalized = value.trim();
  normalized = normalized.replace(/^@+/, '');
  normalized = normalized.replace(/\s+/g, '');
  return normalized;
};

export function AuthPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setProjects = useProjectStore((state) => state.setProjects);
  const setCurrentProject = useProjectStore((state) => state.setCurrentProject);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [registerStep, setRegisterStep] = useState(1);
  const [registerName, setRegisterName] = useState('');
  const [registerHandle, setRegisterHandle] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerCode, setRegisterCode] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    const paramMode = searchParams.get('mode');
    if (paramMode === 'login' || paramMode === 'register') {
      setMode(paramMode);
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCountdown <= 0) {
      return undefined;
    }

    const timer = setInterval(() => {
      setResendCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleModeChange = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setSearchParams({ mode: nextMode });
  };

  const loadProjectsAndRoute = async () => {
    try {
      const response = await apiClient.get<Project[]>('/projects');
      const projects = Array.isArray(response.data) ? response.data : [];
      setProjects(projects);
      if (projects.length === 0) {
        navigate('/onboarding');
        return;
      }
      setCurrentProject(projects[0]);
      navigate('/workspace');
    } catch (error) {
      toast.error('Не удалось загрузить проекты');
      navigate('/workspace');
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    if (!loginEmail.trim() || !loginPassword) {
      toast.error('Введите email и пароль');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });
      setAuth(response.data.user, response.data.token);
      toast.success('С возвращением!');
      await loadProjectsAndRoute();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Не удалось войти';
      toast.error(message);
    } finally {
      setLoginLoading(false);
    }
  };

  const validateRegisterStep = () => {
    if (registerStep === 1 && !registerName.trim()) {
      toast.error('Введите имя');
      return false;
    }

    if (registerStep === 1) {
      const normalizedHandle = normalizeHandle(registerHandle);
      if (!normalizedHandle) {
        toast.error('Введите никнейм');
        return false;
      }

      if (!/^[a-zA-Z0-9]+$/.test(normalizedHandle)) {
        toast.error('Никнейм может содержать только буквы и цифры');
        return false;
      }

      if (normalizedHandle.length < 3 || normalizedHandle.length > 20) {
        toast.error('Никнейм должен быть от 3 до 20 символов');
        return false;
      }
    }

    if (registerStep === 2) {
      if (!registerEmail.trim()) {
        toast.error('Введите email');
        return false;
      }

      if (!/^\S+@\S+\.\S+$/.test(registerEmail)) {
        toast.error('Введите корректный email');
        return false;
      }

      if (registerPassword.length < 8) {
        toast.error('Пароль должен быть не менее 8 символов');
        return false;
      }
    }

    if (registerStep === 3) {
      if (!registerCode.trim()) {
        toast.error('Введите код подтверждения');
        return false;
      }

      if (!registerConfirm) {
        toast.error('Подтвердите согласие с условиями');
        return false;
      }
    }

    return true;
  };

  const handleRegisterNext = async () => {
    if (!validateRegisterStep()) {
      return;
    }

    if (registerStep === 2) {
      setRegisterLoading(true);
      try {
        const normalizedHandle = normalizeHandle(registerHandle);
        const response = await apiClient.post<{ expires_at: string }>(
          '/auth/register',
          {
            name: registerName,
            handle: normalizedHandle,
            email: registerEmail,
            password: registerPassword,
          }
        );
        setResendCountdown(60);
        toast.success('Код подтверждения отправлен');
        setRegisterStep(3);
        if (response.data.expires_at) {
          const expiresAt = new Date(response.data.expires_at);
          const remaining = Math.max(
            0,
            Math.floor((expiresAt.getTime() - Date.now()) / 1000)
          );
          if (remaining > 0) {
            setResendCountdown(Math.min(remaining, 60));
          }
        }
      } catch (error: any) {
        const message =
          error.response?.data?.error || 'Не удалось отправить код';
        toast.error(message);
      } finally {
        setRegisterLoading(false);
      }
      return;
    }

    setRegisterStep((prevStep) => Math.min(prevStep + 1, 3));
  };

  const handleRegisterBack = () => {
    setRegisterStep((prevStep) => Math.max(prevStep - 1, 1));
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (registerStep !== 3 || !validateRegisterStep()) {
      return;
    }

    setRegisterLoading(true);
    try {
      const normalizedHandle = normalizeHandle(registerHandle);
      const response = await apiClient.post<AuthResponse>(
        '/auth/register/confirm',
        {
          name: registerName,
          handle: normalizedHandle,
          email: registerEmail,
          password: registerPassword,
          code: registerCode,
        }
      );
      setAuth(response.data.user, response.data.token);
      toast.success('Аккаунт создан!');
      await loadProjectsAndRoute();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Регистрация не удалась';
      toast.error(message);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registerEmail.trim()) {
      toast.error('Сначала укажите email');
      return;
    }

    setRegisterLoading(true);
    try {
      await apiClient.post('/auth/register/resend', { email: registerEmail });
      setResendCountdown(60);
      toast.success('Код отправлен повторно');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Не удалось отправить код';
      toast.error(message);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 flex items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[150px] animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[150px] animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>

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
            Объединяем обсуждения, задачи и аналитику в одном пространстве для
            максимальной продуктивности.
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
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-slate-300">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl"></div>

            <div className="relative bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {mode === 'login' ? 'Вход в аккаунт' : 'Создание аккаунта'}
                  </h2>
                  <p className="text-slate-400">
                    {mode === 'login'
                      ? 'Рады видеть вас снова!'
                      : 'Начните работу с DevHub за минуту'}
                  </p>
                </div>
                <div className="inline-flex bg-white/5 rounded-full p-1 text-sm">
                  <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className={`px-4 py-2 rounded-full transition-all ${
                      mode === 'login'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Войти
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('register')}
                    className={`px-4 py-2 rounded-full transition-all ${
                      mode === 'register'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Регистрация
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
                >
                  <Github className="w-5 h-5" />
                  <span className="font-medium">GitHub</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
                >
                  <Chrome className="w-5 h-5" />
                  <span className="font-medium">Google</span>
                </motion.button>
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-900/50 text-slate-400">
                    или используйте email
                  </span>
                </div>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Пароль
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-60"
                  >
                    {loginLoading ? 'Входим...' : 'Войти'}
                  </motion.button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-5">
                  <div className="text-sm text-slate-400">
                    Шаг {registerStep} из 3
                  </div>
                  {registerStep === 1 && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Имя
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="text"
                            value={registerName}
                            onChange={(e) => setRegisterName(e.target.value)}
                            placeholder="Введите имя"
                            className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Никнейм
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="text"
                            value={registerHandle}
                            onChange={(e) =>
                              setRegisterHandle(e.target.value)
                            }
                            placeholder="devhub"
                            className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {registerStep === 2 && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="email"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            placeholder="you@email.com"
                            className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Пароль
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={registerPassword}
                            onChange={(e) =>
                              setRegisterPassword(e.target.value)
                            }
                            placeholder="••••••••"
                            className="w-full pl-12 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {registerStep === 3 && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Код подтверждения
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input
                            type="text"
                            value={registerCode}
                            onChange={(e) => setRegisterCode(e.target.value)}
                            placeholder="123456"
                            className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                            required
                          />
                        </div>
                      </div>
                      <label className="flex items-start gap-3 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={registerConfirm}
                          onChange={(e) => setRegisterConfirm(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10"
                        />
                        <span>Я принимаю условия использования DevHub.</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendCountdown > 0 || registerLoading}
                        className="text-sm text-blue-300 hover:text-blue-200 transition disabled:opacity-50"
                      >
                        {resendCountdown > 0
                          ? `Отправить снова через ${resendCountdown}s`
                          : 'Отправить код ещё раз'}
                      </button>
                    </>
                  )}

                  <div className="flex flex-col gap-3">
                    {registerStep > 1 && (
                      <button
                        type="button"
                        onClick={handleRegisterBack}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-3 font-medium text-white hover:bg-white/10 transition"
                      >
                        Назад
                      </button>
                    )}

                    {registerStep < 3 ? (
                      <button
                        type="button"
                        onClick={handleRegisterNext}
                        disabled={registerLoading}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-60"
                      >
                        {registerLoading ? 'Отправляем...' : 'Продолжить'}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={registerLoading}
                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-60"
                      >
                        {registerLoading ? 'Создаем...' : 'Создать аккаунт'}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
