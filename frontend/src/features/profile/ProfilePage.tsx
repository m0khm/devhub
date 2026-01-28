import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { ProfileForm } from './ProfileForm';
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from '../new-ui/components/ui/Card';

export const ProfilePage: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Please log in to view your profile.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-3xl bg-slate-900/60 border-white/10">
        <CardBody className="p-8">
          <ProfileForm user={user} />
        </CardBody>
      </Card>
    </div>
  );
};
