import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { ProfileForm } from './ProfileForm';

export const ProfilePage: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
          <p className="mt-4 text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-8">
        <ProfileForm user={user} />
      </div>
    </div>
  );
};
