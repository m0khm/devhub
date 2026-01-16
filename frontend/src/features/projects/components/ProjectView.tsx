import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import { useProjectStore } from '../../../store/projectStore';
import type { Project, Topic } from '../../../shared/types';
import toast from 'react-hot-toast';
import { TopicSidebar } from '../../topics/components/TopicSidebar';
import { ChatView } from '../../messages/components/ChatView';

export const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject, setCurrentProject, currentTopics, setCurrentTopics } = useProjectStore();
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadTopics();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const response = await apiClient.get<Project>(`/projects/${projectId}`);
      setCurrentProject(response.data);
    } catch (error) {
      toast.error('Failed to load project');
    }
  };

  const loadTopics = async () => {
    try {
      const response = await apiClient.get<Topic[]>(`/projects/${projectId}/topics`);
      setCurrentTopics(response.data);
      
      // Auto-select first topic
      if (response.data.length > 0 && !selectedTopicId) {
        setSelectedTopicId(response.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const selectedTopic = currentTopics.find((t) => t.id === selectedTopicId);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar with topics */}
      <TopicSidebar
        topics={currentTopics}
        selectedTopicId={selectedTopicId}
        onSelectTopic={setSelectedTopicId}
        onTopicCreated={loadTopics}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selectedTopic ? (
          <ChatView topic={selectedTopic} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500">Select a topic to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
