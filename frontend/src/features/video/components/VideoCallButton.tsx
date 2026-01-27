import React, { useState } from 'react';
import { VideoCameraIcon } from '@heroicons/react/24/outline';
import { AxiosError } from 'axios';
import { apiClient } from '../../../api/client';
import { useAuthStore } from '../../../store/authStore';
import toast from 'react-hot-toast';
import { JitsiMeet } from './JitsiMeet';

interface VideoCallButtonProps {
  topicId: string;
}

export const VideoCallButton: React.FC<VideoCallButtonProps> = ({ topicId }) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);

  const startCall = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post<{
        room_name: string;
        room_url: string;
        domain: string;
      }>(`/topics/${topicId}/video/room`);

      console.info('Video call room response:', response.data);
      setRoomName(response.data.room_name);
      setRoomUrl(response.data.room_url);
      setDomain(response.data.domain);
      toast.success('Video call started!');
    } catch (error) {
      const apiError = error as AxiosError<{ error?: string }>;
      const apiMessage = apiError.response?.data?.error;
      if (apiError.response?.data) {
        console.error('Video call API error:', apiError.response.data);
      }
      toast.error(apiMessage ?? 'Failed to start video call');
    } finally {
      setLoading(false);
    }
  };

  const closeCall = () => {
    setRoomName(null);
    setRoomUrl(null);
    setDomain(null);
  };

  return (
    <>
      <button
        onClick={startCall}
        disabled={loading}
        className="rounded-xl p-2 text-slate-300 hover:bg-slate-800/60 hover:text-white transition disabled:opacity-50"
        title="Start video call"
      >
        <VideoCameraIcon className="w-5 h-5" />
      </button>

      {roomName && (
        <JitsiMeet
          roomName={roomName}
          userName={user?.name || 'Unknown'}
          roomUrl={roomUrl ?? undefined}
          domain={domain ?? undefined}
          onClose={closeCall}
        />
      )}
    </>
  );
};
