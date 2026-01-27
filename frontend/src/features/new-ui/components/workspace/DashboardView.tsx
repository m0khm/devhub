import { motion } from 'motion/react';
import { TrendingUp, Users, CheckCircle, Clock, Target, Zap, Award, BarChart3 } from 'lucide-react';

const stats = [
  { label: 'Активных задач', value: '24', change: '+12%', icon: CheckCircle, color: 'from-blue-500 to-cyan-500' },
  { label: 'Участников', value: '8', change: '+2', icon: Users, color: 'from-purple-500 to-pink-500' },
  { label: 'Завершено', value: '156', change: '+23%', icon: Target, color: 'from-green-500 to-emerald-500' },
  { label: 'Продуктивность', value: '94%', change: '+8%', icon: Zap, color: 'from-orange-500 to-red-500' },
];

const teamMembers = [
  { name: 'Алексей К.', role: 'Frontend Dev', tasks: 12, avatar: 'AK', status: 'online' },
  { name: 'Мария С.', role: 'Designer', tasks: 8, avatar: 'MC', status: 'online' },
  { name: 'Дмитрий В.', role: 'Backend Dev', tasks: 15, avatar: 'ДВ', status: 'away' },
  { name: 'Максим', role: 'Project Manager', tasks: 6, avatar: 'М', status: 'online' },
];

const recentActivity = [
  { user: 'Алексей К.', action: 'завершил задачу', item: 'Redesign homepage', time: '5 мин назад' },
  { user: 'Мария С.', action: 'добавила файл', item: 'Design_Mockup.fig', time: '12 мин назад' },
  { user: 'Дмитрий В.', action: 'создал PR', item: '#234 API Integration', time: '1 час назад' },
  { user: 'Максим', action: 'назначил задачу', item: 'Code Review', time: '2 часа назад' },
];

export function DashboardView() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Дашборд команды</h2>
          <p className="text-slate-400">Обзор активности и метрик проекта</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="relative p-6 bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden group cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                  >
                    <stat.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs text-green-400 font-semibold">
                    {stat.change}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Team Members */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Команда</h3>
                <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  Все участники
                </button>
              </div>

              <div className="space-y-3">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 5 }}
                    className="flex items-center justify-between p-4 bg-slate-800/50 border border-white/10 rounded-xl hover:border-white/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-semibold">
                          {member.avatar}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 ${member.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'} border-2 border-slate-900 rounded-full`}></div>
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{member.name}</h4>
                        <p className="text-sm text-slate-400">{member.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{member.tasks}</p>
                      <p className="text-xs text-slate-400">задач</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Активность</h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative pl-6 border-l-2 border-white/10 pb-4 last:pb-0"
                  >
                    <div className="absolute left-[-5px] top-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-sm text-white mb-1">
                      <span className="font-semibold">{activity.user}</span>{' '}
                      <span className="text-slate-400">{activity.action}</span>
                    </p>
                    <p className="text-sm text-blue-400 mb-1">{activity.item}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Achievement */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6 cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg"
                >
                  <Award className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h4 className="font-semibold text-white">Достижение!</h4>
                  <p className="text-sm text-yellow-400">Новый уровень</p>
                </div>
              </div>
              <p className="text-sm text-slate-300">
                Ваша команда завершила 150+ задач! Продолжайте в том же духе! 🎉
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
