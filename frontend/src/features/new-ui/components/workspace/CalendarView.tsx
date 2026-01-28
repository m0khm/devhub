import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../../../api/client';
import { useProjectStore } from '../../../../store/projectStore';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  starts_at: string;
  ends_at?: string | null;
}

const eventColors = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-orange-500 to-red-500',
  'from-green-500 to-emerald-500',
];

export function CalendarView() {
  const { currentProject } = useProjectStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const dates = Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }, (_, i) => i + 1);

  useEffect(() => {
    const loadEvents = async () => {
      if (!currentProject) return;
      try {
        const response = await apiClient.get<CalendarEvent[]>(
          `/projects/${currentProject.id}/calendar/events`
        );
        const list = Array.isArray(response.data) ? response.data : [];
        setEvents(list);
      } catch (error) {
        toast.error('Не удалось загрузить события');
      }
    };

    loadEvents();
  }, [currentProject]);

  const monthLabel = useMemo(
    () =>
      currentMonth.toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric',
      }),
    [currentMonth]
  );

  const eventsByDay = useMemo(() => {
    return events.reduce<Record<number, CalendarEvent[]>>((acc, event) => {
      const date = new Date(event.starts_at);
      if (date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear()) {
        const day = date.getDate();
        acc[day] = acc[day] ? [...acc[day], event] : [event];
      }
      return acc;
    }, {});
  }, [currentMonth, events]);

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
            <p className="text-slate-400">Планируйте встречи и дедлайны</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              if (!currentProject) return;
              const title = window.prompt('Название события');
              if (!title) return;
              const date = window.prompt('Дата (YYYY-MM-DD)');
              if (!date) return;
              const time = window.prompt('Время (HH:MM)', '10:00');
              if (!time) return;
              const startsAt = new Date(`${date}T${time}:00`).toISOString();
              try {
                const response = await apiClient.post<CalendarEvent>(
                  `/projects/${currentProject.id}/calendar/events`,
                  { title, starts_at: startsAt }
                );
                setEvents((prev) => [...prev, response.data]);
                toast.success('Событие создано');
              } catch (error) {
                toast.error('Не удалось создать событие');
              }
            }}
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
                <h3 className="text-xl font-semibold text-white">{monthLabel}</h3>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setCurrentMonth(
                        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                      );
                    }}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setCurrentMonth(
                        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                      );
                    }}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Days header */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {days.map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-slate-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-7 gap-2">
                {dates.map((date) => {
                  const hasEvent = Boolean(eventsByDay[date]);
                  const today = new Date();
                  const isToday =
                    date === today.getDate() &&
                    currentMonth.getMonth() === today.getMonth() &&
                    currentMonth.getFullYear() === today.getFullYear();
                  return (
                    <motion.button
                      key={date}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const count = eventsByDay[date]?.length ?? 0;
                        toast.info(`События на ${date}: ${count}`);
                      }}
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
              <div className="space-y-3">
                {events.length === 0 && (
                  <div className="text-sm text-slate-500">Событий пока нет</div>
                )}
                {events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 5 }}
                    className="p-4 bg-slate-800/50 border border-white/10 rounded-xl cursor-pointer hover:border-white/20 transition-all"
                  >
                    <div
                      className={`w-1 h-8 rounded-full bg-gradient-to-b ${
                        eventColors[index % eventColors.length]
                      } absolute left-2`}
                    ></div>
                    <div className="ml-4">
                      <h4 className="font-medium text-white text-sm mb-1">{event.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(event.starts_at).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(event.starts_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <button
                          className="ml-auto text-slate-500 hover:text-red-400"
                          onClick={async () => {
                            if (!currentProject) return;
                            const confirmed = window.confirm('Удалить событие?');
                            if (!confirmed) return;
                            try {
                              await apiClient.delete(
                                `/projects/${currentProject.id}/calendar/events/${event.id}`
                              );
                              setEvents((prev) => prev.filter((item) => item.id !== event.id));
                            } catch (error) {
                              toast.error('Не удалось удалить событие');
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
              <h4 className="font-semibold text-white mb-4">Статистика недели</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Встречи</span>
                  <span className="text-white font-semibold">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Завершено задач</span>
                  <span className="text-white font-semibold">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Часов в работе</span>
                  <span className="text-white font-semibold">38</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
