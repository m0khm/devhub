import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { ProfileForm } from './ProfileForm';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '../new-ui/components/ui/Card';

export const ProfilePage: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Настройки</CardTitle>
            <CardDescription>Пожалуйста, войдите в аккаунт.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="bg-slate-900/60 border-white/10">
          <CardBody className="p-8">
            <ProfileForm user={user} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
