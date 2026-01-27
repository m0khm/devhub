import React, { useEffect, useRef, useState } from 'react';
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
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const [name, setName] = useState(user?.name ?? '');
  const [handle, setHandle] = useState(user?.handle ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bio, setBio] = useState(user?.bio ?? '');
  const [company, setCompany] = useState(user?.company ?? '');
  const [location, setLocation] = useState(user?.location ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [profileVisible, setProfileVisible] = useState(true);
  const [shareContactInfo, setShareContactInfo] = useState(false);
  const [allowMentions, setAllowMentions] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [loading, setLoading] = useState(false);
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailConfirmLoading, setEmailConfirmLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setAvatarUploading(true);
    try {
      const response = await apiClient.post<User>('/users/me/avatar', formData);
      updateUser(response.data);
      setAvatarUrl(response.data.avatar_url ?? '');
      toast.success('Avatar updated');
      onSaved?.();
    } catch (error: any) {
      const message =
        error.response?.data?.error || 'Failed to upload avatar';
      toast.error(message);
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleSendEmailCode = async () => {
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      toast.error('Enter a new email');
      return;
    }

    if (trimmedEmail === user.email) {
      toast.error('New email must be different');
      return;
    }

    if (!currentPassword) {
      toast.error('Enter your current password');
      return;
    }

    setEmailChangeLoading(true);
    try {
      await apiClient.post('/users/me/email', {
        new_email: trimmedEmail,
        password: currentPassword,
      });
      setEmailCodeSent(true);
      setEmailCode('');
      toast.success('Verification code sent');
    } catch (error: any) {
      const message =
        error.response?.data?.error || 'Failed to send verification code';
      toast.error(message);
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const handleConfirmEmail = async () => {
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      toast.error('Enter a new email');
      return;
    }

    if (!emailCode.trim()) {
      toast.error('Enter the verification code');
      return;
    }

    setEmailConfirmLoading(true);
    try {
      const response = await apiClient.post<{ token: string; user: User }>(
        '/users/me/email/confirm',
        {
          new_email: trimmedEmail,
          code: emailCode.trim(),
        }
      );
      setAuth(response.data.user, response.data.token);
      setNewEmail('');
      setCurrentPassword('');
      setEmailCode('');
      setEmailCodeSent(false);
      toast.success('Email updated');
      onSaved?.();
    } catch (error: any) {
      const message =
        error.response?.data?.error || 'Failed to confirm email change';
      toast.error(message);
    } finally {
      setEmailConfirmLoading(false);
    }
  };

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

  const handleSectionToggle = (
    section: 'basic' | 'email' | 'privacy' | 'notifications' | 'danger'
  ) => {
    setOpenSection(section);
  };

  const getSectionButtonLabel = (isOpen: boolean) =>
    isOpen ? 'Скрыть' : 'Открыть';

  const sectionContainerClass =
    'rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6';

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <section className={sectionContainerClass}>
          <button
            type="button"
            onClick={() => handleSectionToggle('basic')}
            aria-expanded={openSection === 'basic'}
            aria-controls="profile-basic-section"
            className="flex w-full items-start justify-between gap-4 text-left"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Основные</h2>
              <p className="text-sm text-gray-500">
                Обновите публичные данные профиля и контакты.
              </p>
            </div>
            <span className="text-sm font-medium text-blue-600">
              {getSectionButtonLabel(openSection === 'basic')}
            </span>
          </button>
          {openSection === 'basic' && (
            <div id="profile-basic-section" className="mt-5 space-y-4">
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
                Upload avatar
              </label>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    handleAvatarUpload(file);
                  }
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-3"
                disabled={avatarUploading}
              />
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, GIF до 5MB. Загрузка обновит аватар в профиле.
              </p>
              {avatarUploading && (
                <p className="mt-2 text-xs text-blue-600">Uploading...</p>
              )}
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
                  placeholder="+7 123 456 78 90"
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
          )}
        </section>

        <section className={sectionContainerClass}>
          <button
            type="button"
            onClick={() => handleSectionToggle('email')}
            aria-expanded={openSection === 'email'}
            aria-controls="profile-email-section"
            className="flex w-full items-start justify-between gap-4 text-left"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Email</h2>
              <p className="text-sm text-gray-500">
                Измените адрес электронной почты и подтвердите его.
              </p>
            </div>
            <span className="text-sm font-medium text-blue-600">
              {getSectionButtonLabel(openSection === 'email')}
            </span>
          </button>
          {openSection === 'email' && (
            <div id="profile-email-section" className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Current email
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
                  New email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(event) => {
                    setNewEmail(event.target.value);
                    setEmailCodeSent(false);
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Current password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="button"
                onClick={handleSendEmailCode}
                disabled={emailChangeLoading}
                className="inline-flex w-full items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {emailChangeLoading ? 'Sending...' : 'Send code'}
              </button>

              {emailCodeSent && (
                <div className="space-y-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Verification code
                    </label>
                    <input
                      type="text"
                      value={emailCode}
                      onChange={(event) => setEmailCode(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      placeholder="6-digit code"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmEmail}
                    disabled={emailConfirmLoading}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {emailConfirmLoading ? 'Confirming...' : 'Confirm email'}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <section className={sectionContainerClass}>
          <button
            type="button"
            onClick={() => handleSectionToggle('privacy')}
            aria-expanded={openSection === 'privacy'}
            aria-controls="profile-privacy-section"
            className="flex w-full items-start justify-between gap-4 text-left"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Приватность</h2>
              <p className="text-sm text-gray-500">
                Управляйте видимостью и тем, какие данные доступны коллегам.
              </p>
            </div>
            <span className="text-sm font-medium text-blue-600">
              {getSectionButtonLabel(openSection === 'privacy')}
            </span>
          </button>
          {openSection === 'privacy' && (
            <div
              id="profile-privacy-section"
              className="mt-5 space-y-4 text-sm text-gray-700"
            >
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
          )}
        </section>

        <section className={sectionContainerClass}>
          <button
            type="button"
            onClick={() => handleSectionToggle('notifications')}
            aria-expanded={openSection === 'notifications'}
            aria-controls="profile-notifications-section"
            className="flex w-full items-start justify-between gap-4 text-left"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Уведомления
              </h2>
              <p className="text-sm text-gray-500">
                Настройте, как часто и куда отправлять уведомления.
              </p>
            </div>
            <span className="text-sm font-medium text-blue-600">
              {getSectionButtonLabel(openSection === 'notifications')}
            </span>
          </button>
          {openSection === 'notifications' && (
            <div
              id="profile-notifications-section"
              className="mt-5 space-y-4 text-sm text-gray-700"
            >
              <label className="flex items-center justify-between gap-4">
                <span>Email-уведомления о сообщениях</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-blue-600"
                  checked={emailNotifications}
                  onChange={(event) =>
                    setEmailNotifications(event.target.checked)
                  }
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
          )}
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <section className="mt-8 rounded-2xl border border-red-100 bg-red-50/40 p-4 shadow-sm sm:p-6">
        <button
          type="button"
          onClick={() => handleSectionToggle('danger')}
          aria-expanded={openSection === 'danger'}
          aria-controls="profile-danger-section"
          className="flex w-full items-start justify-between gap-4 text-left"
        >
          <div>
            <h2 className="text-lg font-semibold text-red-700">Danger zone</h2>
            <p className="text-sm text-red-600">
              Deleting your account will remove your access. You can&apos;t undo
              this action.
            </p>
          </div>
          <span className="text-sm font-semibold text-red-600">
            {getSectionButtonLabel(openSection === 'danger')}
          </span>
        </button>
        {openSection === 'danger' && (
          <div id="profile-danger-section" className="mt-5">
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className="inline-flex w-full items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleteLoading ? 'Deleting...' : 'Delete account'}
            </button>
          </div>
        )}
      </section>
    </>
  );
};
