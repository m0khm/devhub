import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Image, Film, Music, Download, Share2, Trash2, MoreVertical, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../../../api/client';
import { useProjectStore } from '../../../../store/projectStore';
import type { FileMetadata, Message, Topic } from '../../../../shared/types';

interface FileEntry {
  id: string;
  name: string;
  size?: number;
  date: string;
  type: string;
  url?: string;
  icon: typeof FileText;
  color: string;
}

const fileTypeIcons: Record<string, { icon: typeof FileText; color: string }> = {
  pdf: { icon: FileText, color: 'from-red-500 to-orange-500' },
  fig: { icon: Image, color: 'from-purple-500 to-pink-500' },
  png: { icon: Image, color: 'from-cyan-500 to-blue-500' },
  jpg: { icon: Image, color: 'from-cyan-500 to-blue-500' },
  jpeg: { icon: Image, color: 'from-cyan-500 to-blue-500' },
  mp4: { icon: Film, color: 'from-blue-500 to-cyan-500' },
  mp3: { icon: Music, color: 'from-green-500 to-emerald-500' },
  default: { icon: FileText, color: 'from-slate-500 to-slate-600' },
};

const parseMetadata = (metadata: Message['metadata']): FileMetadata => {
  if (!metadata) return {};
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata) as FileMetadata;
    } catch {
      return {};
    }
  }
  return metadata as FileMetadata;
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '—';
  const mb = bytes / 1024 / 1024;
  if (mb < 1) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${mb.toFixed(2)} MB`;
};

export function FilesView() {
  const { currentProject, currentTopics } = useProjectStore();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (currentTopics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(currentTopics[0].id);
    }
  }, [currentTopics, selectedTopicId]);

  useEffect(() => {
    const loadFiles = async () => {
      if (!currentProject) return;
      try {
        const response = await apiClient.get<Message[]>(
          `/projects/${currentProject.id}/files?limit=200`
        );
        const list = Array.isArray(response.data) ? response.data : [];
        const mapped = list.map((message) => {
          const meta = parseMetadata(message.metadata);
          const filename = meta.filename ?? message.content.replace('📎', '').trim();
          const extension = filename.split('.').pop()?.toLowerCase() ?? 'default';
          const fileType = fileTypeIcons[extension] ?? fileTypeIcons.default;
          return {
            id: message.id,
            name: filename,
            size: meta.size,
            date: new Date(message.created_at).toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: 'short',
            }),
            type: extension,
            url: meta.url,
            icon: fileType.icon,
            color: fileType.color,
          };
        });
        setFiles(mapped);
      } catch (error) {
        toast.error('Не удалось загрузить файлы');
      }
    };

    loadFiles();
  }, [currentProject]);

  const stats = useMemo(() => {
    const totalSize = files.reduce((sum, file) => sum + (file.size ?? 0), 0);
    return {
      totalSize,
      fileCount: files.length,
    };
  }, [files]);

  const handleUpload = async (file: File) => {
    if (!selectedTopicId) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await apiClient.post(`/topics/${selectedTopicId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Файл загружен');
      if (currentProject) {
        const response = await apiClient.get<Message[]>(
          `/projects/${currentProject.id}/files?limit=200`
        );
        const list = Array.isArray(response.data) ? response.data : [];
        const mapped = list.map((message) => {
          const meta = parseMetadata(message.metadata);
          const filename = meta.filename ?? message.content.replace('📎', '').trim();
          const extension = filename.split('.').pop()?.toLowerCase() ?? 'default';
          const fileType = fileTypeIcons[extension] ?? fileTypeIcons.default;
          return {
            id: message.id,
            name: filename,
            size: meta.size,
            date: new Date(message.created_at).toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: 'short',
            }),
            type: extension,
            url: meta.url,
            icon: fileType.icon,
            color: fileType.color,
          };
        });
        setFiles(mapped);
      }
    } catch (error) {
      toast.error('Не удалось загрузить файл');
    }
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
            <h2 className="text-2xl font-bold text-white mb-2">Файлы проекта</h2>
            <p className="text-slate-400">Все документы и медиа в одном месте</p>
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
            { label: 'Использовано', value: formatFileSize(stats.totalSize), total: '', color: 'from-blue-500 to-cyan-500' },
            { label: 'Файлов', value: String(stats.fileCount), color: 'from-purple-500 to-pink-500' },
            { label: 'Общий доступ', value: String(Math.min(stats.fileCount, 12)), color: 'from-green-500 to-emerald-500' },
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
              {stat.total && (
                <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '40%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
                  ></motion.div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Files Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.length === 0 && (
            <div className="text-slate-500 text-sm">Файлов пока нет</div>
          )}
          {files.map((file, index) => (
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
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${file.color} flex items-center justify-center shadow-lg`}
                >
                  <file.icon className="w-6 h-6 text-white" />
                </motion.div>
                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded transition-all">
                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <h4 className="font-medium text-white mb-1 truncate">{file.name}</h4>
              <p className="text-sm text-slate-400 mb-4">
                {formatFileSize(file.size)} • {file.date}
              </p>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const url = file.url || `/api/files/${file.id}/download`;
                    window.open(url, '_blank');
                  }}
                  className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Скачать
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const url = file.url || `${window.location.origin}/api/files/${file.id}/download`;
                    navigator.clipboard.writeText(url);
                    toast.info('Ссылка скопирована');
                  }}
                  className="py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all"
                >
                  <Share2 className="w-3 h-3" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toast.error('Удаление недоступно')}
                  className="py-2 px-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            handleUpload(file);
          }
          event.currentTarget.value = '';
        }}
      />
    </div>
  );
}
