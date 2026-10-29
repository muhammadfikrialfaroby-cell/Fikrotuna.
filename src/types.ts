export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  xp: number;
  level: number;
  wordsLearned: number;
  quizzesCompleted: number;
  garticScore: number;
  garticGamesPlayed: number;
  achievements: string[];
  token?: string;
  avatarUrl?: string;
}

export interface MufrodatItem {
  id: string;
  arabic: string;
  harakat: string;
  latin: string;
  indonesian: string;
  category: string;
  example: string;
  exampleMeaning: string;
  icon: string;
  drawingHints: string[];
}

export interface CategoryInfo {
  id: string;
  name: string;
  arabicName: string;
  icon: string;
  description: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  role?: 'bot' | 'user' | 'system' | 'admin';
  text: string;
  isCorrect?: boolean;
  time: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  role: string;
  score: number;
  badges: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  arabic?: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}
