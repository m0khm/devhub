import React, { useState } from 'react';
import { VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
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

  const startCall = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post<{
        room_name: string;
        room_url: string;
      }>(`/topics/${topicId}/video/room`);

      setRoomName(response.data.room_name);
      toast.success('Video call started!');
    } catch (error) {
      toast.error('Failed to start video call');
    } finally {
      setLoading(false);
    }
  };

  const closeCall = () => {
    setRoomName(null);
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
          onClose={closeCall}
        />
      )}
    </>
  );
};
