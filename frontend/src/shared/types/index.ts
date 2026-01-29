export interface User {
  id: string;
  email: string;
  name: string;
  handle?: string;
  avatar_url?: string;
  bio?: string;
  company?: string;
  location?: string;
  phone?: string;
  handle?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  access_level?: 'private' | 'members' | 'public';
  visibility?: 'visible' | 'hidden' | 'archived';
  notifications_muted?: boolean;
  owner_id: string;
  workspace_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface ProjectMemberWithUser extends ProjectMember {
  user: {
    id: string;
    email: string;
    name: string;
    handle?: string;
    avatar_url?: string;
  };
}

export interface Topic {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  type: 'chat' | 'code' | 'deploy' | 'bugs' | 'planning' | 'custom' | 'direct';
  icon?: string;
  access_level?: 'members' | 'admins' | 'public';
  visibility?: 'visible' | 'hidden' | 'archived';
  notifications_muted?: boolean;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TopicWithStats extends Topic {
  message_count: number;
  last_message_at?: string;
}

export interface DirectMessageThread extends Topic {
  user: User;
}

export interface Message {
  id: string;
  topic_id: string;
  user_id?: string;
  content: string;
  type: 'text' | 'file' | 'system' | 'code' | 'integration';
  metadata?: MessageMetadata | string | null;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name: string;
    email: string;
    handle?: string;
    avatar_url?: string;
  };
  reactions?: ReactionGroup[];
}

export interface FileMetadata {
  filename?: string;
  mime_type?: string;
  size?: number;
  url?: string;
  storage_key?: string;
}

export interface CodeMetadata {
  language?: string;
  filename?: string;
  content?: string;
}

export type MessageMetadata = FileMetadata | CodeMetadata | Record<string, unknown>;

export interface Mention {
  id: string;
  name: string;
  handle?: string;
}

export interface ReactionGroup {
  emoji: string;
  count: number;
  users: string[];
  has_self: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  link?: string;
  type: string;
  metadata?: Record<string, unknown> | null;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  handle?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
