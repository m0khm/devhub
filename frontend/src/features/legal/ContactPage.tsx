import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

type ContactRequest = {
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<ContactRequest[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('devhub-contacts');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Заполните все поля');
      return;
    }

    const nextRequest: ContactRequest = {
      name,
      email,
      message,
      createdAt: new Date().toISOString(),
    };
    const nextHistory = [nextRequest, ...history].slice(0, 5);
    setHistory(nextHistory);
    localStorage.setItem('devhub-contacts', JSON.stringify(nextHistory));
    setName('');
    setEmail('');
    setMessage('');
    toast.success('Сообщение отправлено');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-6 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Связаться с командой DevHub</h1>
          <p className="text-slate-300">
            Оставьте сообщение, и мы вернемся с ответом в ближайшее время.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
          <label className="block text-sm text-slate-300">
            Имя
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Сообщение
            <textarea
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-3 font-semibold text-white hover:from-blue-600 hover:to-purple-700 transition"
          >
            Отправить
          </button>
        </form>

        {history.length > 0 && (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold text-white">Последние обращения</h2>
            <div className="space-y-3 text-sm text-slate-300">
              {history.map((request) => (
                <div key={request.createdAt} className="border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                  <div className="font-semibold text-white">{request.name}</div>
                  <div className="text-slate-400">{request.email}</div>
                  <p className="mt-2">{request.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <Link to="/" className="text-blue-400 hover:text-blue-300 font-medium">
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
};
