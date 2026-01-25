import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../shared/types';

interface ProfileFormProps {
  user: User;
  onSaved?: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ user, onSaved }) => {
  const updateUser = useAuthStore((state) => state.updateUser);
  const [name, setName] = useState(user?.name ?? '');
  const [handle, setHandle] = useState(user?.handle ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [company, setCompany] = useState(user?.company ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [profileVisible, setProfileVisible] = useState(true);
  const [shareContactInfo, setShareContactInfo] = useState(false);
  const [allowMentions, setAllowMentions] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setHandle(user.handle ?? '');
      setAvatarUrl(user.avatar_url ?? '');
      setBio(user.bio ?? '');
      setCompany(user.company ?? '');
      setLocation(user.location ?? '');
      setPhone(user.phone ?? '');
    }
  }, [user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload: {
      name?: string;
      handle?: string;
      avatar_url?: string;
      bio?: string;
      company?: string;
      location?: string;
      phone?: string;
    } = {};

    if (name.trim() && name.trim() !== user.name) {
      payload.name = name.trim();
    }

    if (handle.trim() !== (user.handle ?? '')) {
      payload.handle = handle.trim();
    }

    if (avatarUrl.trim() && avatarUrl.trim() !== (user.avatar_url ?? '')) {
      payload.avatar_url = avatarUrl.trim();
    }

    if (bio.trim() && bio.trim() !== (user.bio ?? '')) {
      payload.bio = bio.trim();
    }

    if (company.trim() && company.trim() !== (user.company ?? '')) {
      payload.company = company.trim();
    }

    if (location.trim() && location.trim() !== (user.location ?? '')) {
      payload.location = location.trim();
    }

    if (phone.trim() && phone.trim() !== (user.phone ?? '')) {
      payload.phone = phone.trim();
    }

    if (Object.keys(payload).length === 0) {
      toast('No changes to save');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.patch<User>('/users/me', payload);
      updateUser(response.data);
      toast.success('Profile updated');
      onSaved?.();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to update profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Update your personal information</p>
      </div>

      <div className="mb-8 rounded-xl border border-gray-100 bg-gray-50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Profile details
        </h2>
        <dl className="grid grid-cols-1 gap-4 text-sm text-gray-700 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-gray-500">Handle</dt>
            <dd>{user.handle ?? 'Not provided'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Company</dt>
            <dd>{user.company ?? 'Not provided'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Location</dt>
            <dd>{user.location ?? 'Not provided'}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Phone</dt>
            <dd>{user.phone ?? 'Not provided'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="font-medium text-gray-500">Bio</dt>
            <dd>{user.bio ?? 'Not provided'}</dd>
          </div>
        </dl>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Основные</h2>
            <p className="text-sm text-gray-500">
              Обновите публичные данные профиля и контакты.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                readOnly
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Handle
              </label>
              <input
                type="text"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="@devhub"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Avatar URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/avatar.png"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Company
              </label>
              <input
                type="text"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="Your company"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="City, Country"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="+1 555 123 4567"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us a little about yourself"
                rows={4}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Приватность</h2>
            <p className="text-sm text-gray-500">
              Управляйте видимостью и тем, какие данные доступны коллегам.
            </p>
          </div>
          <div className="space-y-4 text-sm text-gray-700">
            <label className="flex items-center justify-between gap-4">
              <span>Показывать профиль в команде</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600"
                checked={profileVisible}
                onChange={(event) => setProfileVisible(event.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between gap-4">
              <span>Делиться контактной информацией</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600"
                checked={shareContactInfo}
                onChange={(event) => setShareContactInfo(event.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between gap-4">
              <span>Разрешить упоминания в темах</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600"
                checked={allowMentions}
                onChange={(event) => setAllowMentions(event.target.checked)}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Уведомления</h2>
            <p className="text-sm text-gray-500">
              Настройте, как часто и куда отправлять уведомления.
            </p>
          </div>
          <div className="space-y-4 text-sm text-gray-700">
            <label className="flex items-center justify-between gap-4">
              <span>Email-уведомления о сообщениях</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600"
                checked={emailNotifications}
                onChange={(event) => setEmailNotifications(event.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between gap-4">
              <span>Обновления продукта</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600"
                checked={productUpdates}
                onChange={(event) => setProductUpdates(event.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between gap-4">
              <span>Еженедельный дайджест</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600"
                checked={weeklyDigest}
                onChange={(event) => setWeeklyDigest(event.target.checked)}
              />
            </label>
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </>
  );
};
