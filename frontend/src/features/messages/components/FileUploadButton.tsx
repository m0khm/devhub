import React, { useRef, useState } from 'react';
import { PaperClipIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../../api/client';
import toast from 'react-hot-toast';

interface FileUploadButtonProps {
  topicId: string;
}

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({ topicId }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await apiClient.post(`/topics/${topicId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('File uploaded!');
    } catch (error: any) {
      if (error.response?.status === 503) {
        toast.error('Storage is unavailable. Please try again later.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to upload file');
      }
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        className="rounded-xl p-2 text-slate-400 hover:bg-slate-800/70 hover:text-slate-100 disabled:opacity-50 transition"
        title="Upload file"
      >
        <PaperClipIcon className="w-5 h-5" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,application/pdf,.doc,.docx,.txt,.zip"
      />
    </>
  );
};
