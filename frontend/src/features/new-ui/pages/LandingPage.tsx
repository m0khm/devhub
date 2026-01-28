import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Zap, Shield, Users, MessageSquare, BarChart3, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-slate-950/30 border-b border-white/5"
      >
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl blur-lg opacity-70"></div>
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-xl shadow-2xl">
                  D
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                DevHub
              </span>
            </motion.div>

            <nav className="hidden lg:flex items-center gap-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-all hover:scale-105">
                Возможности
              </a>
              <a href="#how" className="text-slate-300 hover:text-white transition-all hover:scale-105">
                Как работает
              </a>
              <a href="#cases" className="text-slate-300 hover:text-white transition-all hover:scale-105">
                Кейсы
              </a>
              <a href="#pricing" className="text-slate-300 hover:text-white transition-all hover:scale-105">
                Цены
              </a>
            </nav>

            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/auth?mode=login')}
                className="px-6 py-2.5 text-white hover:text-blue-400 transition-colors font-medium"
              >
                Войти
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/auth?mode=register')}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium shadow-lg shadow-blue-500/50"
              >
                Регистрация
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 text-sm mb-8 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">WORKSPACE НОВОГО ПОКОЛЕНИЯ</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight"
            >
              Превращаем обсуждения в{' '}
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  действия
                </span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="absolute bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-sm"
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-2xl text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto"
            >
              DevHub объединяет чаты, задачи и аналитику в одном пространстве. 
              Никаких переключений между инструментами — только фокус на результате.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/auth?mode=register')}
                className="group px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/50"
              >
                Начать бесплатно
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/workspace')}
                className="px-10 py-5 bg-white/5 backdrop-blur-sm border-2 border-white/20 text-white rounded-full font-semibold text-lg hover:bg-white/10 transition-all"
              >
                Посмотреть демо
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-3 gap-8 max-w-3xl mx-auto"
            >
              {[
                { value: '10k+', label: 'Активных команд' },
                { value: '99.9%', label: 'Uptime' },
                { value: '50%', label: 'Быстрее релизы' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 relative">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-white mb-6">
              Всё необходимое в одном месте
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Мощные инструменты для командной работы, объединенные в интуитивном интерфейсе
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: MessageSquare, title: 'Умные чаты', desc: 'Обсуждения, которые превращаются в задачи одним кликом', color: 'from-blue-500 to-cyan-500', path: '/workspace/chat' },
              { icon: BarChart3, title: 'Аналитика в реальном времени', desc: 'Видите прогресс команды без статус-митингов', color: 'from-purple-500 to-pink-500', path: '/workspace/dashboard' },
              { icon: Users, title: 'Командные пространства', desc: 'Создавайте неограниченное количество workspace', color: 'from-orange-500 to-red-500', path: '/workspace' },
              { icon: Zap, title: 'Мгновенная синхронизация', desc: 'Все изменения видны команде в реальном времени', color: 'from-green-500 to-emerald-500', path: '/workspace/chat' },
              { icon: Shield, title: 'Защита корпоративного уровня', desc: 'Шифрование данных и соответствие GDPR', color: 'from-indigo-500 to-blue-500', path: '/auth?mode=register' },
              { icon: Globe, title: 'Работа из любой точки', desc: 'Доступ с любого устройства, офлайн-режим', color: 'from-teal-500 to-cyan-500', path: '/workspace' },
            ].map((feature, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                onClick={() => navigate(feature.path)}
                type="button"
                className="group relative p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 hover:border-white/30 transition-all cursor-pointer overflow-hidden text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity" style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}></div>
                <div className="relative">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative rounded-[3rem] bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-16 overflow-hidden shadow-2xl"
          >
            {/* Animated background */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10 text-center">
              <h2 className="text-5xl font-bold text-white mb-6">
                Готовы работать эффективнее?
              </h2>
              <p className="text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
                Присоединяйтесь к тысячам команд, которые уже ускорили свою работу с DevHub
              </p>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 60px rgba(255, 255, 255, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/auth?mode=register')}
                className="group px-12 py-6 bg-white text-purple-700 rounded-full font-bold text-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-3 mx-auto shadow-2xl"
              >
                Создать workspace бесплатно
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
                D
              </div>
              <span className="text-xl font-bold text-white">DevHub</span>
            </div>
            <p className="text-slate-400">© 2026 DevHub. Все права защищены.</p>
            <div className="flex gap-8 text-slate-400">
              <Link to="/privacy" className="hover:text-white transition-colors">Конфиденциальность</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Условия</Link>
              <Link to="/contacts" className="hover:text-white transition-colors">Контакты</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
