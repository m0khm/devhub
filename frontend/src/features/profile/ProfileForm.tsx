import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "../../api/client";
import { useAuthStore } from "../../store/authStore";
import type { User } from "../../shared/types";
import {
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Bell,
  Trash2,
  ChevronDown,
  ChevronUp,
  Upload,
  MapPin,
  Phone,
  Building,
  AtSign,
  FileText,
} from "lucide-react";

interface ProfileFormProps {
  user: User;
  onSaved?: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ user, onSaved }) => {
  const updateUser = useAuthStore((state) => state.updateUser);
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);

  const normalizeAvatarUrl = (url: string) =>
    url
      .replace("http://minio:9000/devhub/uploads/", "/uploads/")
      .replace("https://minio:9000/devhub/uploads/", "/uploads/");

  const [name, setName] = useState(user?.name ?? "");
  const [handle, setHandle] = useState(user?.handle ?? "");
  const [avatarUrl, setAvatarUrl] = useState(
    normalizeAvatarUrl(user?.avatar_url ?? ""),
  );
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bio, setBio] = useState(user?.bio ?? "");
  const [company, setCompany] = useState(user?.company ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
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

  type OpenSection =
    | "basic"
    | "email"
    | "privacy"
    | "notifications"
    | "danger"
    | null;
  const [openSection, setOpenSection] = useState<OpenSection>("basic");

  const handleSectionToggle = (section: Exclude<OpenSection, null>) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setHandle(user.handle ?? "");
      setAvatarUrl(normalizeAvatarUrl(user.avatar_url ?? ""));
      setBio(user.bio ?? "");
      setCompany(user.company ?? "");
      setLocation(user.location ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setAvatarUploading(true);
    try {
      const response = await apiClient.post<User>("/users/me/avatar", formData);
      const normalizedUser = {
        ...response.data,
        avatar_url: normalizeAvatarUrl(response.data.avatar_url ?? ""),
      };
      updateUser(normalizedUser);
      setAvatarUrl(normalizedUser.avatar_url ?? "");
      toast.success("Аватар обновлен");
      onSaved?.();
    } catch (error: any) {
      const message = error.response?.data?.error || "Не удалось загрузить аватар";
      toast.error(message);
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  const handleSendEmailCode = async () => {
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      toast.error("Введите новый email");
      return;
    }

    if (trimmedEmail === user.email) {
      toast.error("Новый email должен отличаться");
      return;
    }

    if (!currentPassword) {
      toast.error("Введите текущий пароль");
      return;
    }

    setEmailChangeLoading(true);
    try {
      await apiClient.post("/users/me/email", {
        new_email: trimmedEmail,
        password: currentPassword,
      });
      setEmailCodeSent(true);
      setEmailCode("");
      toast.success("Код подтверждения отправлен");
    } catch (error: any) {
      const message =
        error.response?.data?.error || "Не удалось отправить код";
      toast.error(message);
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const handleConfirmEmail = async () => {
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      toast.error("Введите новый email");
      return;
    }

    if (!emailCode.trim()) {
      toast.error("Введите код подтверждения");
      return;
    }

    setEmailConfirmLoading(true);
    try {
      const response = await apiClient.post<{ token: string; user: User }>(
        "/users/me/email/confirm",
        {
          new_email: trimmedEmail,
          code: emailCode.trim(),
        },
      );
      setAuth(response.data.user, response.data.token);
      setNewEmail("");
      setCurrentPassword("");
      setEmailCode("");
      setEmailCodeSent(false);
      toast.success("Email обновлен");
      onSaved?.();
    } catch (error: any) {
      const message =
        error.response?.data?.error || "Не удалось подтвердить смену email";
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

    if (handle.trim() !== (user.handle ?? "")) {
      payload.handle = handle.trim();
    }

    if (avatarUrl.trim() && avatarUrl.trim() !== (user.avatar_url ?? "")) {
      payload.avatar_url = avatarUrl.trim();
    }

    if (bio.trim() && bio.trim() !== (user.bio ?? "")) {
      payload.bio = bio.trim();
    }

    if (company.trim() && company.trim() !== (user.company ?? "")) {
      payload.company = company.trim();
    }

    if (location.trim() && location.trim() !== (user.location ?? "")) {
      payload.location = location.trim();
    }

    if (phone.trim() && phone.trim() !== (user.phone ?? "")) {
      payload.phone = phone.trim();
    }

    if (Object.keys(payload).length === 0) {
      toast("Нет изменений для сохранения");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.patch<User>("/users/me", payload);
      const normalizedUser = {
        ...response.data,
        avatar_url: normalizeAvatarUrl(response.data.avatar_url ?? ""),
      };
      updateUser(normalizedUser);
      toast.success("Профиль обновлен");
      onSaved?.();
    } catch (error: any) {
      const message = error.response?.data?.error || "Не удалось обновить профиль";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Удалить аккаунт? Это действие нельзя отменить.",
    );
    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      await apiClient.delete("/users/me");
      toast.success("Аккаунт удален");
      logout();
      onSaved?.();
    } catch (error: any) {
      const message = error.response?.data?.error || "Не удалось удалить аккаунт";
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all";

  const sectionClass =
    "rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-6";

  const toggleClass =
    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50";

  const SectionHeader = ({
    icon: Icon,
    title,
    description,
    section,
    variant = "default",
  }: {
    icon: React.ElementType;
    title: string;
    description: string;
    section: Exclude<OpenSection, null>;
    variant?: "default" | "danger";
  }) => (
    <button
      type="button"
      onClick={() => handleSectionToggle(section)}
      className="flex w-full items-start justify-between gap-4 text-left"
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center ${
          variant === "danger"
            ? "bg-red-500/10 text-red-400"
            : "bg-white/5 text-slate-400"
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className={`text-base font-semibold ${
            variant === "danger" ? "text-red-400" : "text-white"
          }`}>
            {title}
          </h2>
          <p className={`text-sm ${
            variant === "danger" ? "text-red-400/60" : "text-slate-500"
          }`}>
            {description}
          </p>
        </div>
      </div>
      {openSection === section ? (
        <ChevronUp className="w-5 h-5 text-slate-500 flex-shrink-0 mt-1" />
      ) : (
        <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0 mt-1" />
      )}
    </button>
  );

  const Toggle = ({
    checked,
    onChange,
    label,
  }: {
    checked: boolean;
    onChange: (val: boolean) => void;
    label: string;
  }) => (
    <label className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-slate-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`${toggleClass} ${
          checked ? "bg-blue-500" : "bg-white/10"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Настройки
        </h1>
        <p className="text-slate-400">Управление профилем и аккаунтом</p>
      </div>

      {/* Profile summary card */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex items-center gap-4 mb-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-16 h-16 rounded-xl object-cover border border-white/10"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
              {(user.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-white">{user.name}</h2>
            <p className="text-sm text-slate-400">{user.email}</p>
            {user.handle && (
              <p className="text-xs text-slate-500">@{user.handle}</p>
            )}
          </div>
        </div>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500 text-xs">Компания</dt>
            <dd className="text-slate-300">{user.company || "Не указано"}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">Локация</dt>
            <dd className="text-slate-300">{user.location || "Не указано"}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">Телефон</dt>
            <dd className="text-slate-300">{user.phone || "Не указано"}</dd>
          </div>
          <div>
            <dt className="text-slate-500 text-xs">Био</dt>
            <dd className="text-slate-300">{user.bio || "Не указано"}</dd>
          </div>
        </dl>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic info */}
        <section className={sectionClass}>
          <SectionHeader
            icon={UserIcon}
            title="Основные"
            description="Публичные данные профиля и контакты"
            section="basic"
          />
          {openSection === "basic" && (
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Имя
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                  placeholder="Ваше имя"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Handle
                </label>
                <div className="relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={handle}
                    onChange={(event) => setHandle(event.target.value)}
                    className={`${inputClass} pl-10`}
                    placeholder="username"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Аватар
                </label>
                <div
                  className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/10 bg-white/5 cursor-pointer hover:border-blue-500/30 transition-all"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-400">
                    {avatarUploading ? "Загрузка..." : "PNG, JPG, GIF до 5MB"}
                  </span>
                </div>
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
                  className="hidden"
                  disabled={avatarUploading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Локация
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      className={`${inputClass} pl-10`}
                      placeholder="Город, Страна"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Телефон
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className={`${inputClass} pl-10`}
                      placeholder="+7 123 456 78 90"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Био
                </label>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  className={inputClass}
                  placeholder="Расскажите о себе"
                  rows={3}
                />
              </div>
            </div>
          )}
        </section>

        {/* Email */}
        <section className={sectionClass}>
          <SectionHeader
            icon={Mail}
            title="Email"
            description="Измените адрес электронной почты"
            section="email"
          />
          {openSection === "email" && (
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Текущий email
                </label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full px-4 py-3 bg-white/3 border border-white/5 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Новый email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(event) => {
                    setNewEmail(event.target.value);
                    setEmailCodeSent(false);
                  }}
                  className={inputClass}
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Текущий пароль
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
              <button
                type="button"
                onClick={handleSendEmailCode}
                disabled={emailChangeLoading}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-blue-400 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailChangeLoading ? "Отправляем..." : "Отправить код"}
              </button>

              {emailCodeSent && (
                <div className="space-y-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">
                      Код подтверждения
                    </label>
                    <input
                      type="text"
                      value={emailCode}
                      onChange={(event) => setEmailCode(event.target.value)}
                      className={inputClass}
                      placeholder="6-значный код"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmEmail}
                    disabled={emailConfirmLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-semibold text-white hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
                  >
                    {emailConfirmLoading ? "Подтверждаем..." : "Подтвердить email"}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Privacy */}
        <section className={sectionClass}>
          <SectionHeader
            icon={Shield}
            title="Приватность"
            description="Видимость профиля и данных"
            section="privacy"
          />
          {openSection === "privacy" && (
            <div className="mt-5 space-y-1">
              <Toggle
                label="Показывать профиль в команде"
                checked={profileVisible}
                onChange={setProfileVisible}
              />
              <Toggle
                label="Делиться контактной информацией"
                checked={shareContactInfo}
                onChange={setShareContactInfo}
              />
              <Toggle
                label="Разрешить упоминания в темах"
                checked={allowMentions}
                onChange={setAllowMentions}
              />
            </div>
          )}
        </section>

        {/* Notifications */}
        <section className={sectionClass}>
          <SectionHeader
            icon={Bell}
            title="Уведомления"
            description="Настройте каналы и частоту уведомлений"
            section="notifications"
          />
          {openSection === "notifications" && (
            <div className="mt-5 space-y-1">
              <Toggle
                label="Email-уведомления о сообщениях"
                checked={emailNotifications}
                onChange={setEmailNotifications}
              />
              <Toggle
                label="Обновления продукта"
                checked={productUpdates}
                onChange={setProductUpdates}
              />
              <Toggle
                label="Еженедельный дайджест"
                checked={weeklyDigest}
                onChange={setWeeklyDigest}
              />
            </div>
          )}
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Сохраняем..." : "Сохранить изменения"}
        </button>
      </form>

      {/* Danger zone */}
      <section className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 sm:p-6">
        <SectionHeader
          icon={Trash2}
          title="Опасная зона"
          description="Удаление аккаунта необратимо"
          section="danger"
          variant="danger"
        />
        {openSection === "danger" && (
          <div className="mt-5">
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className="w-full py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteLoading ? "Удаляем..." : "Удалить аккаунт"}
            </button>
          </div>
        )}
      </section>
    </>
  );
};
