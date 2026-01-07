export interface AnalyzedWord {
  text: string;
  status: 'correct' | 'mispronounced';
  phonetic?: string;
}

export interface GrammarError {
  phrase: string;
  explanationVi: string;
  correction: string;
  examples: string[];
}

export interface PronunciationAnalysis {
  overallScore: number;
  transcription: string;
  words: AnalyzedWord[];
  grammarErrors: GrammarError[];
  summaryVi: string;
}

export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT'
}

export interface UserStats {
  xp: number;
  level: number;
  totalPractices: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  requirement: string;
}

export const LEVELS = [
  { name: 'Beginner', minXp: 0 },
  { name: 'Improver', minXp: 100 },
  { name: 'Confident Speaker', minXp: 300 },
  { name: 'Fluent Master', minXp: 700 }
];

export const BADGES: Badge[] = [
  { id: 'first_step', name: 'First Step', icon: '🌱', color: 'bg-green-100', requirement: 'Complete your first practice.' },
  { id: 'perfect_80', name: 'Elite Speaker', icon: '💎', color: 'bg-blue-100', requirement: 'Get a score of 80% or higher.' },
  { id: 'streak_3', name: 'Consistency', icon: '🔥', color: 'bg-orange-100', requirement: 'Practice 3 times in a row.' },
  { id: 'grammar_god', name: 'Grammar Pro', icon: '📚', color: 'bg-purple-100', requirement: 'Complete analysis with zero grammar errors.' }
];