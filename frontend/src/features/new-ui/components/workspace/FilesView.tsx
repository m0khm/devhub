import { motion, AnimatePresence } from 'motion/react';
import { FileText, Image, Film, Music, Download, Share2, Trash2, MoreVertical, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient, API_URL } from '../../../../api/client';
import type { Message, FileMetadata } from '../../../../shared/types';
import type { WorkspaceOutletContext } from '../../pages/WorkspaceLayout';

const fileIconMap = {
  document: FileText,
  design: Image,
  video: Film,
  audio: Music,
  image: Image,
};

const getFileType = (mime?: string) => {
  if (!mime) return 'document';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'document';
};

const parseMetadata = (metadata?: Message['metadata']): FileMetadata => {
  if (!metadata) return {};
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata) as FileMetadata;
    } catch (error) {
      return {};
    }
  }
  return metadata as FileMetadata;
};

export function FilesView() {
  const { currentTopic } = useOutletContext<WorkspaceOutletContext>();
  const [files, setFiles] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentTopic) {
      setFiles([]);
      return;
    }

    const loadFiles = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<Message[]>(
          `/topics/${currentTopic.id}/messages`,
          { params: { limit: 100 } }
        );
        const data = Array.isArray(response.data) ? response.data : [];
        setFiles(data.filter((item) => item.type === 'file'));
      } catch (error) {
        toast.error('Не удалось загрузить файлы');
      } finally {
        setLoading(false);
      }
    };

    void loadFiles();
  }, [currentTopic?.id]);

  const stats = useMemo(() => {
    const totalSize = files.reduce((sum, item) => {
      const metadata = parseMetadata(item.metadata);
      return sum + (metadata.size ?? 0);
    }, 0);
    return {
      totalSize,
      count: files.length,
    };
  }, [files]);

  return (
    <div className="h-full overflow-y-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Файлы проекта</h2>
            <p className="text-slate-400">
              {currentTopic ? `Файлы из темы ${currentTopic.name}` : 'Выберите тему, чтобы увидеть файлы'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTopicId ?? ''}
              onChange={(event) => setSelectedTopicId(event.target.value)}
              className="bg-slate-900/60 border border-white/10 text-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              {currentTopics.map((topic: Topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg"
            >
              <Upload className="w-5 h-5" />
              Загрузить файл
            </motion.button>
          </div>
        </div>

        {/* Storage Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Использовано', value: `${(stats.totalSize / (1024 * 1024)).toFixed(1)} MB`, total: '', color: 'from-blue-500 to-cyan-500' },
            { label: 'Файлов', value: stats.count.toString(), color: 'from-purple-500 to-pink-500' },
            { label: 'Текущая тема', value: currentTopic?.name ?? '—', color: 'from-green-500 to-emerald-500' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">{stat.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </span>
                {stat.total && <span className="text-sm text-slate-500">{stat.total}</span>}
              </div>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="text-slate-400">Загрузка файлов...</div>
        ) : files.length === 0 ? (
          <div className="text-slate-500">Нет файлов для отображения</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file, index) => {
              const metadata = parseMetadata(file.metadata);
              const fileType = getFileType(metadata.mime_type);
              const Icon = fileIconMap[fileType as keyof typeof fileIconMap] ?? FileText;
              const downloadUrl = `${API_URL}/files/${file.id}/download`;

              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group p-5 bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg"
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded transition-all">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <h4 className="font-medium text-white mb-1 truncate">{metadata.filename ?? 'Файл'}</h4>
                  <p className="text-sm text-slate-400 mb-4">
                    {(metadata.size ? `${(metadata.size / (1024 * 1024)).toFixed(1)} MB` : '—')} • {new Date(file.created_at).toLocaleDateString('ru-RU')}
                  </p>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <motion.a
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      href={downloadUrl}
                      className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Скачать
                    </motion.a>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        void navigator.clipboard.writeText(downloadUrl);
                        toast.info('Ссылка скопирована');
                      }}
                      className="py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all"
                    >
                      <Share2 className="w-3 h-3" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toast.error('Удаление файла пока недоступно')}
                      className="py-2 px-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedFile(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Карточка файла</h3>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <selectedFile.icon className="w-5 h-5 text-white" />
                  <span>{selectedFile.type}</span>
                </div>
                <div className="text-slate-400">
                  Размер: {selectedFile.size} • Дата: {selectedFile.date}
                </div>
                <label className="block">
                  Название
                  <input
                    type="text"
                    value={fileNameDraft}
                    onChange={(event) => setFileNameDraft(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setFileList((prev) =>
                      prev.map((file) =>
                        file.id === selectedFile.id ? { ...file, name: fileNameDraft } : file
                      )
                    );
                    toast.success('Имя файла обновлено');
                    setSelectedFile(null);
                  }}
                  className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-2.5 font-semibold text-white hover:from-blue-600 hover:to-purple-700 transition"
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 font-semibold text-white hover:bg-white/10 transition"
                >
                  Закрыть
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
