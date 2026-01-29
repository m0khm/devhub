import { motion } from 'motion/react';
import { Mic, Users, Radio } from 'lucide-react';

export function VoiceRoomsView() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl"
      >
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
            <Mic className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Voice Rooms</h2>
            <p className="text-slate-400">Организуйте голосовые комнаты для быстрых синков.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <div className="mb-3 flex items-center gap-3 text-white">
              <Radio className="h-5 w-5 text-blue-400" />
              <span className="text-lg font-semibold">Комнаты появятся здесь</span>
            </div>
            <p className="text-sm text-slate-400">
              Подготовьте комнату для демо или ретро. Мы уже готовим интеграцию
              с живыми статусами участников.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6">
            <div className="mb-3 flex items-center gap-3 text-white">
              <Users className="h-5 w-5 text-purple-300" />
              <span className="text-lg font-semibold">Добавьте участников</span>
            </div>
            <p className="text-sm text-slate-400">
              Пригласите команду в голосовой room, чтобы обсудить задачи
              или провести быстрый митинг.
            </p>
            <button
              type="button"
              className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Создать комнату (скоро)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
