import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';
import type { WorkspaceOutletContext } from '../../pages/WorkspaceLayout';
import { safeStorage } from '../../../../shared/utils/storage';

const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const formatMonth = (date: Date) =>
  date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

type CalendarEvent = {
  id: number;
  title: string;
  date: string;
  time: string;
  description: string;
};

const buildDefaultDraft = (date: string): Omit<CalendarEvent, 'id'> => ({
  title: '',
  date,
  time: '10:00',
  description: '',
});

export function CalendarView() {
  const { currentProject } = useOutletContext<WorkspaceOutletContext>();
  const [monthOffset, setMonthOffset] = useState(0);
  const [eventList, setEventList] = useState<CalendarEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const [eventDraft, setEventDraft] = useState(buildDefaultDraft(new Date().toISOString().slice(0, 10)));
  const [isModalOpen, setIsModalOpen] = useState(false);

  const storageProjectId = currentProject?.id ?? 'default';
  const storageKey = `calendar_events_${storageProjectId}`;

  useEffect(() => {
    const stored = safeStorage.get(storageKey);
    if (!stored) {
      setEventList([]);
      return;
    }
    try {
      const parsed = JSON.parse(stored) as CalendarEvent[];
      setEventList(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.warn('Failed to parse stored events, resetting.', error);
      setEventList([]);
    }
  }, [storageKey]);

  useEffect(() => {
    safeStorage.set(storageKey, JSON.stringify(eventList));
  }, [eventList, storageKey]);

  const currentMonthDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthOffset, 1);
    return date;
  }, [monthOffset]);

  const monthEnd = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0);
  const dates = Array.from({ length: monthEnd.getDate() }, (_, i) => i + 1);

  const eventsThisMonth = useMemo(() => {
    return eventList
      .filter((event) => {
        const eventDate = new Date(`${event.date}T00:00:00`);
        return (
          eventDate.getMonth() === currentMonthDate.getMonth() &&
          eventDate.getFullYear() === currentMonthDate.getFullYear()
        );
      })
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [eventList, currentMonthDate]);

  const hasEventOnDate = (date: number) =>
    eventsThisMonth.some((event) => new Date(`${event.date}T00:00:00`).getDate() === date);

  const openNewEvent = (date: string) => {
    setActiveEvent(null);
    setEventDraft(buildDefaultDraft(date));
    setIsModalOpen(true);
  };

  const openEditEvent = (event: CalendarEvent) => {
    setActiveEvent(event);
    setEventDraft({
      title: event.title,
      date: event.date,
      time: event.time,
      description: event.description,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setActiveEvent(null);
    setIsModalOpen(false);
  };

  const handleSaveEvent = () => {
    if (!eventDraft.title.trim()) {
      toast.error('Введите название события');
      return;
    }

    if (activeEvent) {
      setEventList((prev) =>
        prev.map((event) => (event.id === activeEvent.id ? { ...event, ...eventDraft } : event))
      );
      toast.success('Событие обновлено');
    } else {
      setEventList((prev) => [
        ...prev,
        {
          id: Date.now(),
          title: eventDraft.title.trim(),
          date: eventDraft.date,
          time: eventDraft.time,
          description: eventDraft.description.trim(),
        },
      ]);
      toast.success('Событие создано');
    }
    closeModal();
  };

  const handleDeleteEvent = () => {
    if (!activeEvent) return;
    setEventList((prev) => prev.filter((event) => event.id !== activeEvent.id));
    toast.success('Событие удалено');
    closeModal();
  };

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
            <p className="text-slate-400">Создавайте события и отслеживайте планы команды</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => openNewEvent(new Date().toISOString().slice(0, 10))}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg"
            type="button"
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
                    type="button"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setMonthOffset((prev) => prev + 1)}
                    className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                    type="button"
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
                  const hasEvent = hasEventOnDate(date);
                  const isToday =
                    date === new Date().getDate() &&
                    currentMonthDate.getMonth() === new Date().getMonth();
                  const isoDate = new Date(
                    currentMonthDate.getFullYear(),
                    currentMonthDate.getMonth(),
                    date
                  )
                    .toISOString()
                    .slice(0, 10);
                  return (
                    <motion.button
                      key={date}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openNewEvent(isoDate)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all ${
                        isToday
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold shadow-lg'
                          : hasEvent
                          ? 'bg-white/10 text-white hover:bg-white/15'
                          : 'text-slate-400 hover:bg-white/5'
                      }`}
                      type="button"
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
              <h3 className="font-semibold text-white mb-4">События месяца</h3>
              {eventsThisMonth.length === 0 ? (
                <div className="text-slate-500">Нет событий на этот месяц</div>
              ) : (
                <div className="space-y-3">
                  {eventsThisMonth.map((event, index) => (
                    <motion.button
                      key={event.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 5 }}
                      onClick={() => openEditEvent(event)}
                      className="relative w-full text-left p-4 bg-slate-800/50 border border-white/10 rounded-xl cursor-pointer hover:border-white/20 transition-all"
                      type="button"
                    >
                      <div className="w-1 h-8 rounded-full bg-gradient-to-b from-blue-500 to-cyan-500 absolute left-2 top-4" />
                      <div className="ml-4">
                        <h4 className="font-medium text-white text-sm mb-1">{event.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{event.time}</span>
                          <span>•</span>
                          <span>{new Date(`${event.date}T00:00:00`).getDate()} {formatMonth(currentMonthDate).split(' ')[0]}</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
              <h4 className="font-semibold text-white mb-4">Статистика месяца</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Всего событий</span>
                  <span className="text-white font-semibold">{eventList.length}</span>
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

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Детали события</h3>
                {activeEvent && (
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </button>
                )}
              </div>
              <div className="space-y-4 mt-4">
                <label className="block text-sm text-slate-300">
                  Название
                  <input
                    type="text"
                    value={eventDraft.title}
                    onChange={(event) =>
                      setEventDraft((prev) => ({ ...prev, title: event.target.value }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Дата
                  <input
                    type="date"
                    value={eventDraft.date}
                    onChange={(event) =>
                      setEventDraft((prev) => ({ ...prev, date: event.target.value }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Время
                  <input
                    type="time"
                    value={eventDraft.time}
                    onChange={(event) =>
                      setEventDraft((prev) => ({ ...prev, time: event.target.value }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Описание
                  <textarea
                    value={eventDraft.description}
                    onChange={(event) =>
                      setEventDraft((prev) => ({ ...prev, description: event.target.value }))
                    }
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleSaveEvent}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-2.5 font-semibold text-white hover:from-blue-600 hover:to-purple-700 transition"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 font-semibold text-white hover:bg-white/10 transition"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
