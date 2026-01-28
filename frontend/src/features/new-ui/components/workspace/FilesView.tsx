import { motion } from 'motion/react';
import {
  FileText,
  Image,
  Film,
  Music,
  Download,
  Share2,
  Trash2,
  MoreVertical,
  Upload,
  FolderOpen,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';
import { apiClient, API_URL } from '../../../../api/client';
import type { Message, FileMetadata } from '../../../../shared/types';
import type { WorkspaceOutletContext } from '../../pages/WorkspaceLayout';

const files = [
  { id: 1, name: 'Project_Proposal.pdf', type: 'document', size: '2.4 MB', date: '26 янв', icon: FileText, color: 'from-red-500 to-orange-500' },
  { id: 2, name: 'Design_Mockup.fig', type: 'design', size: '8.1 MB', date: '25 янв', icon: Image, color: 'from-purple-500 to-pink-500' },
  { id: 3, name: 'Demo_Video.mp4', type: 'video', size: '45 MB', date: '24 янв', icon: Film, color: 'from-blue-500 to-cyan-500' },
  { id: 4, name: 'Presentation.pptx', type: 'document', size: '5.2 MB', date: '23 янв', icon: FileText, color: 'from-orange-500 to-red-500' },
  { id: 5, name: 'Soundtrack.mp3', type: 'audio', size: '3.8 MB', date: '22 янв', icon: Music, color: 'from-green-500 to-emerald-500' },
  { id: 6, name: 'Screenshot_2026.png', type: 'image', size: '1.2 MB', date: '21 янв', icon: Image, color: 'from-cyan-500 to-blue-500' },
];

export function FilesView() {
  const { currentProject, currentTopic, topics, setSelectedTopicId } =
    useOutletContext<WorkspaceOutletContext>();
  const [files, setFiles] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTopicId, setSelectedTopicIdState] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentTopics = useMemo(() => topics, [topics]);

  useEffect(() => {
    if (!currentProject?.id) {
      setFiles([]);
      return;
    }

    const loadFiles = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<Message[]>(
          `/projects/${currentProject.id}/files`,
          { params: { limit: 100 } }
        );
        const data = Array.isArray(response.data) ? response.data : [];
        setFiles(data);
      } catch (error) {
        toast.error('Не удалось загрузить файлы');
      } finally {
        setLoading(false);
      }
    };

    void loadFiles();
  }, [currentProject?.id]);

  useEffect(() => {
    if (!currentTopic?.id) {
      return;
    }
    setSelectedTopicIdState(currentTopic.id);
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
              onChange={(event) => {
                setSelectedTopicIdState(event.target.value);
                setSelectedTopicId(event.target.value);
              }}
              className="bg-slate-900/60 border border-white/10 text-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              {currentTopics.length === 0 ? (
                <option value="" disabled>
                  Нет доступных тем
                </option>
              ) : (
                currentTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))
              )}
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
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toast.success('Загрузка файла')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg"
          >
            <Upload className="w-5 h-5" />
            Загрузить файл
          </motion.button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={() => toast.info('Загрузка файлов пока недоступна')}
        />

        {/* Storage Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Использовано', value: '68 GB', total: '/ 100 GB', color: 'from-blue-500 to-cyan-500' },
            { label: 'Файлов', value: '234', color: 'from-purple-500 to-pink-500' },
            { label: 'Общий доступ', value: '12', color: 'from-green-500 to-emerald-500' },
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
                    animate={{ width: '68%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
                  ></motion.div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="text-slate-400">Загрузка файлов...</div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-10 text-center">
            <div className="mb-4 rounded-full bg-slate-800/60 p-4">
              <FolderOpen className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-white">Файлы пока не загружены</h3>
            <p className="mt-2 text-sm text-slate-400">
              Добавьте первый файл или выберите другую тему, чтобы увидеть материалы.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file, index) => {
              const metadata = parseMetadata(file.metadata);
              const fileType = getFileType(metadata.mime_type);
              const Icon = fileIconMap[fileType as keyof typeof fileIconMap] ?? FileText;
              const downloadUrl = `${API_URL}/files/${file.id}/download`;

              return (
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${file.color} flex items-center justify-center shadow-lg`}
                >
                  <file.icon className="w-6 h-6 text-white" />
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

    </div>
  );
}
