import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { ProfileForm } from './ProfileForm';

export const ProfilePage: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center rounded-2xl border border-white/10 bg-slate-900/60 p-8">
          <h2 className="text-xl font-bold text-white mb-2">Настройки</h2>
          <p className="text-slate-400">Пожалуйста, войдите в аккаунт.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <ProfileForm user={user} />
      </div>
    </div>
  );
};
