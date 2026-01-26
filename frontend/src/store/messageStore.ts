import { create } from 'zustand';
import type { Message } from '../shared/types';

interface MessageState {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  clearMessages: () => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => {
      if (state.messages.some((existing) => existing.id === message.id)) {
        return state;
      }
      return { messages: [...state.messages, message] };
    }),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    })),

  clearMessages: () => set({ messages: [] }),
}));
