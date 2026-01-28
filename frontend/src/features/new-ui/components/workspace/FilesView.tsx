import { motion, AnimatePresence } from 'motion/react';
import { FileText, Image, Film, Music, Download, Share2, Trash2, MoreVertical, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const initialFiles = [
  { id: 1, name: 'Project_Proposal.pdf', type: 'document', size: '2.4 MB', date: '26 янв', icon: FileText, color: 'from-red-500 to-orange-500' },
  { id: 2, name: 'Design_Mockup.fig', type: 'design', size: '8.1 MB', date: '25 янв', icon: Image, color: 'from-purple-500 to-pink-500' },
  { id: 3, name: 'Demo_Video.mp4', type: 'video', size: '45 MB', date: '24 янв', icon: Film, color: 'from-blue-500 to-cyan-500' },
  { id: 4, name: 'Presentation.pptx', type: 'document', size: '5.2 MB', date: '23 янв', icon: FileText, color: 'from-orange-500 to-red-500' },
  { id: 5, name: 'Soundtrack.mp3', type: 'audio', size: '3.8 MB', date: '22 янв', icon: Music, color: 'from-green-500 to-emerald-500' },
  { id: 6, name: 'Screenshot_2026.png', type: 'image', size: '1.2 MB', date: '21 янв', icon: Image, color: 'from-cyan-500 to-blue-500' },
];

export function FilesView() {
  const [fileList, setFileList] = useState(initialFiles);
  const [selectedFile, setSelectedFile] = useState<typeof initialFiles[number] | null>(null);
  const [fileNameDraft, setFileNameDraft] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('devhub-files');
    if (stored) {
      setFileList(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('devhub-files', JSON.stringify(fileList));
  }, [fileList]);

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

        {/* Files Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fileList.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => {
                setSelectedFile(file);
                setFileNameDraft(file.name);
              }}
              className="group p-5 bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-white/20 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${file.color} flex items-center justify-center shadow-lg`}
                >
                  <file.icon className="w-6 h-6 text-white" />
                </motion.div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedFile(file);
                    setFileNameDraft(file.name);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded transition-all"
                >
                  <MoreVertical className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <h4 className="font-medium text-white mb-1 truncate">{file.name}</h4>
              <p className="text-sm text-slate-400 mb-4">
                {file.size} • {file.date}
              </p>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toast.success('Файл скачан')}
                  className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white hover:bg-white/10 transition-all flex items-center justify-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  Скачать
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toast.info('Ссылка скопирована')}
                  className="py-2 px-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all"
                >
                  <Share2 className="w-3 h-3" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toast.error('Файл удален')}
                  className="py-2 px-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
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
