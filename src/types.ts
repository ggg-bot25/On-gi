export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface EmotionCard {
  id: string;
  emoji: string;
  label: string;
  description: string;
  color: string; // Tailwind class background & borders
  tags: string[];
}

export interface ComfortNote {
  id: string;
  text: string;
  author: string;
  date: string;
  likes: number;
}

export interface CounselingSession {
  id: string;
  title: string;
  date: string;
  emotions: string[];
  messages: Message[];
}
