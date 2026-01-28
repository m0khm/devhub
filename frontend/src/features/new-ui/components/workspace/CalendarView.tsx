import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';
import type { WorkspaceOutletContext } from '../../pages/WorkspaceLayout';

const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const formatMonth = (date: Date) =>
  date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

export function CalendarView() {
  const { notifications, notificationsLoading } =
    useOutletContext<WorkspaceOutletContext>();
  const [monthOffset, setMonthOffset] = useState(0);

  const currentMonthDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthOffset, 1);
    return date;
  }, [monthOffset]);

  const monthEnd = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0);
  const dates = Array.from({ length: monthEnd.getDate() }, (_, i) => i + 1);

  const events = useMemo(() => {
    return notifications.map((item) => {
      const date = new Date(item.created_at);
      return {
        id: item.id,
        title: item.title,
        time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        date: date.getDate(),
        month: date.getMonth(),
        color: 'from-blue-500 to-cyan-500',
      };
    });
  }, [notifications]);

  const eventsThisMonth = events.filter(
    (event) => event.month === currentMonthDate.getMonth()
  );

  return (
    <div className="h-full overflow-y-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Календарь событий</h2>
            <p className="text-slate-400">Уведомления распределены по датам</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toast.success('Создание нового события')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Новое событие
          </motion.button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">
                  {formatMonth(currentMonthDate)}
                </h3>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setMonthOffset((prev) => prev - 1)}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setMonthOffset((prev) => prev + 1)}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Days header */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {days.map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-slate-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-7 gap-2">
                {dates.map((date) => {
                  const hasEvent = eventsThisMonth.some((event) => event.date === date);
                  const isToday =
                    date === new Date().getDate() &&
                    currentMonthDate.getMonth() === new Date().getMonth();
                  return (
                    <motion.button
                      key={date}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toast.info(`События на ${date} ${formatMonth(currentMonthDate)}`)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all ${
                        isToday
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold shadow-lg'
                          : hasEvent
                          ? 'bg-white/10 text-white hover:bg-white/15'
                          : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-sm">{date}</span>
                      {hasEvent && !isToday && (
                        <div className="absolute bottom-1 w-1 h-1 bg-blue-400 rounded-full"></div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-4">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Предстоящие события</h3>
              {notificationsLoading ? (
                <div className="text-slate-500">Загрузка уведомлений...</div>
              ) : eventsThisMonth.length === 0 ? (
                <div className="text-slate-500">Нет событий на этот месяц</div>
              ) : (
                <div className="space-y-3">
                  {eventsThisMonth.slice(0, 5).map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                      className="p-4 bg-slate-800/50 border border-white/10 rounded-xl cursor-pointer hover:border-white/20 transition-all"
                    >
                      <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${event.color} absolute left-2`}></div>
                      <div className="ml-4">
                        <h4 className="font-medium text-white text-sm mb-1">{event.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{event.time}</span>
                          <span>•</span>
                          <span>{event.date} {formatMonth(currentMonthDate).split(' ')[0]}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
              <h4 className="font-semibold text-white mb-4">Статистика недели</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Уведомления</span>
                  <span className="text-white font-semibold">{notifications.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">События месяца</span>
                  <span className="text-white font-semibold">{eventsThisMonth.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Дней в месяце</span>
                  <span className="text-white font-semibold">{monthEnd.getDate()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
