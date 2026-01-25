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
  const logout = useAuthStore((state) => state.logout);
  const [name, setName] = useState(user?.name ?? '');
  const [handle, setHandle] = useState(user?.handle ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [company, setCompany] = useState(user?.company ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Delete your account? This will disable your profile and sign you out.'
    );
    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      await apiClient.delete('/users/me');
      toast.success('Account deleted');
      logout();
      onSaved?.();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to delete account';
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Update your personal information</p>
      </div>

      <div className="mb-8 rounded-xl border border-gray-100 bg-gray-50 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile details</h2>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={user.email}
            readOnly
            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Your name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Handle
          </label>
          <input
            type="text"
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="@devhub"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Avatar URL
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="https://example.com/avatar.png"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company
          </label>
          <input
            type="text"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Your company"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="City, Country"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="+1 555 123 4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            placeholder="Tell us a little about yourself"
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <div className="mt-8 rounded-xl border border-red-100 bg-red-50/60 p-6">
        <h2 className="text-lg font-semibold text-red-700">Danger zone</h2>
        <p className="mt-2 text-sm text-red-600">
          Deleting your account will remove your access. You can&apos;t undo this
          action.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleteLoading}
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleteLoading ? 'Deleting...' : 'Delete account'}
        </button>
      </div>
    </>
  );
};
