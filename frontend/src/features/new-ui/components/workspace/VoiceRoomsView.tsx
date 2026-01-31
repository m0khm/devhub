import { motion, AnimatePresence } from 'motion/react';
import { Mic, Users, Radio, Plus, Phone, PhoneOff, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '../../../../api/client';
import { useAuthStore } from '../../../../store/authStore';
import { JitsiMeet } from '../../../video/components/JitsiMeet';
import type { WorkspaceOutletContext } from '../../pages/WorkspaceLayout';

interface VoiceRoom {
  id: string;
  name: string;
  jitsiRoomName: string;
  jitsiDomain: string;
  maxParticipants: number;
  color: string;
}

const ROOM_COLORS = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-green-500 to-emerald-500',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-blue-500',
  'from-pink-500 to-rose-500',
];

export function VoiceRoomsView() {
  const { currentProject, topics } = useOutletContext<WorkspaceOutletContext>();
  const user = useAuthStore((state) => state.user);
  const userName = user?.name || user?.email || 'User';

  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomMaxParticipants, setNewRoomMaxParticipants] = useState(10);
  const [loading, setLoading] = useState(false);

  // Create deterministic room name based on project + custom name
  const buildJitsiRoomName = useCallback(
    (name: string) => {
      const projectSlug = currentProject?.id?.slice(0, 8) || 'devhub';
      const sanitized = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
      return `devhub-${projectSlug}-${sanitized}`;
    },
    [currentProject?.id]
  );

  // Initialize default rooms for the project
  useEffect(() => {
    if (!currentProject?.id) {
      setRooms([]);
      return;
    }

    // Generate rooms from existing topics that make sense for voice
    const defaultRooms: VoiceRoom[] = [
      {
        id: 'standup',
        name: 'Стендап команды',
        jitsiRoomName: buildJitsiRoomName('standup'),
        jitsiDomain: 'meet.jit.si',
        maxParticipants: 10,
        color: ROOM_COLORS[0],
      },
      {
        id: 'code-review',
        name: 'Code Review',
        jitsiRoomName: buildJitsiRoomName('code-review'),
        jitsiDomain: 'meet.jit.si',
        maxParticipants: 5,
        color: ROOM_COLORS[1],
      },
      {
        id: 'sprint-planning',
        name: 'Планирование спринта',
        jitsiRoomName: buildJitsiRoomName('sprint-planning'),
        jitsiDomain: 'meet.jit.si',
        maxParticipants: 15,
        color: ROOM_COLORS[2],
      },
    ];

    setRooms(defaultRooms);
  }, [currentProject?.id, buildJitsiRoomName]);

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) {
      toast.error('Введите название комнаты');
      return;
    }

    const newRoom: VoiceRoom = {
      id: `custom-${Date.now()}`,
      name: newRoomName.trim(),
      jitsiRoomName: buildJitsiRoomName(newRoomName.trim()),
      jitsiDomain: 'meet.jit.si',
      maxParticipants: newRoomMaxParticipants,
      color: ROOM_COLORS[rooms.length % ROOM_COLORS.length],
    };

    setRooms((prev) => [...prev, newRoom]);
    setNewRoomName('');
    setNewRoomMaxParticipants(10);
    setShowCreateModal(false);
    toast.success('Комната создана!');
  };

  const handleJoinRoom = (room: VoiceRoom) => {
    setActiveRoomId(room.id);
    toast.success(`Подключение к "${room.name}"...`);
  };

  const handleLeaveRoom = () => {
    setActiveRoomId(null);
  };

  const activeRoom = rooms.find((r) => r.id === activeRoomId);

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Jitsi Meet Portal */}
      {activeRoom && (
        <JitsiMeet
          roomName={activeRoom.jitsiRoomName}
          userName={userName}
          domain={activeRoom.jitsiDomain}
          onClose={handleLeaveRoom}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Voice Rooms</h2>
          <p className="text-slate-400 mt-1">Голосовые комнаты для командного общения</p>
        </div>

        {/* Room Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {rooms.map((room, index) => {
            const isActive = activeRoomId === room.id;
            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`rounded-2xl border p-6 transition-all ${
                  isActive
                    ? 'border-green-500/50 bg-green-500/10'
                    : 'border-white/10 bg-slate-900/60 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                  {isActive && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-400 font-semibold">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      LIVE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
                  <Users className="w-4 h-4" />
                  <span>0 / {room.maxParticipants} участников</span>
                </div>

                {isActive ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLeaveRoom}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-semibold hover:bg-red-500/30 transition-all"
                  >
                    <PhoneOff className="w-5 h-5" />
                    Отключиться
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleJoinRoom(room)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r ${room.color} text-white rounded-xl font-semibold shadow-lg transition-all`}
                  >
                    <Mic className="w-5 h-5" />
                    Присоединиться
                  </motion.button>
                )}
              </motion.div>
            );
          })}

          {/* Create Room Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rooms.length * 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={() => setShowCreateModal(true)}
            className="rounded-2xl border border-dashed border-white/20 bg-slate-900/30 p-6 flex flex-col items-center justify-center cursor-pointer hover:border-white/40 transition-all min-h-[200px]"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Создать комнату</h3>
            <p className="text-sm text-slate-400 text-center">Начните новый звонок с командой</p>
          </motion.div>
        </div>

        {/* Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-start gap-4 p-5 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20 rounded-2xl"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white mb-1">Совет</h4>
            <p className="text-sm text-slate-300">
              Используйте голосовые комнаты для быстрых синхронизаций и мозговых штурмов.
              Это эффективнее чем планировать встречи!
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Создать комнату</h3>
              <input
                type="text"
                placeholder="Название комнаты"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4"
              />
              <div className="mb-4">
                <label className="block text-sm text-slate-400 mb-2">Макс. участников</label>
                <select
                  value={newRoomMaxParticipants}
                  onChange={(e) => setNewRoomMaxParticipants(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value={5}>5 участников</option>
                  <option value={10}>10 участников</option>
                  <option value={15}>15 участников</option>
                  <option value={25}>25 участников</option>
                </select>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateRoom}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Создать
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-lg font-semibold hover:bg-white/10 transition-all"
                >
                  Отмена
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
