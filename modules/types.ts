
export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  targetDate?: string; // ISO date string YYYY-MM-DD
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
}

export type AlarmSound = 'classic' | 'zen' | 'digital';
export type AlarmDuration = 30 | 60 | 120 | 300 | 0; // 0 for infinite

export interface Reminder {
  id: string;
  title: string;
  time: string;
  date: string;
  repeat: 'none' | 'daily' | 'weekly';
  lastNotified?: string; // ISO date of last notification
  sound?: AlarmSound;
  duration?: AlarmDuration;
}

export type View = 'notes' | 'todo' | 'reminders' | 'calculator' | 'calendar' | 'locker' | 'settings' | 'ai';

export interface AppSettings {
  darkMode: boolean;
  language: 'English' | 'Hindi';
  pinLock: string | null;
  appLockEnabled: boolean;
  lastBackup?: number;
  defaultAlarmSound: AlarmSound;
  defaultAlarmDuration: AlarmDuration;
  // Assistant Toggle
  enableAssistant: boolean;
}

export interface Document {
  id: string;
  type: string;
  name: string;
  imageData: string;
  createdAt: number;
}
