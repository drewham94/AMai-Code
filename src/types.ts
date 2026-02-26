export type Language = 'French' | 'Spanish';

export type SkillLevel = 'Novice' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export type PracticeFlavor = 'Casual' | 'Academic' | 'Conversational' | 'Professional' | 'Creative';

export type PracticeMode = 'Read' | 'Respond' | 'TongueTwister' | 'Slang';

export interface SlangTerm {
  id: string;
  term: string;
  meaning: string;
  example: string;
  region: string;
  language: Language;
  dateLearned: string;
}

export interface Accent {
  id: string;
  name: string;
  region: string;
}

export interface PracticeSession {
  id: string;
  date: string;
  language: Language;
  accent: string;
  skillLevel: SkillLevel;
  flavor: PracticeFlavor;
  mode: PracticeMode;
  prompt: string;
  score: number;
  assistantResponse?: string;
  feedback: {
    strengths: string[];
    improvements: string[];
    detailedAnalysis: string;
  };
}

export interface SavedPassage {
  id: string;
  text: string;
  date: string;
  language: Language;
}

export interface PracticePrompt {
  text: string;
  translation: string;
  vocabulary: { word: string; definition: string; englishEquivalent: string; wordType: string }[];
}

export interface Flashcard {
  id: string;
  word: string;
  definitionEn: string;
  definitionTarget?: string;
  wordType?: string;
  practiceCount: number;
  consecutiveCorrect: number;
  frequency: number; // 1-5
  language: Language;
  dateAdded: string;
  isCustom: boolean;
}

export interface FocusSession {
  id: string;
  date: string;
  minutes: number;
}

export interface UserProfile {
  email: string;
  name: string;
  targetLanguage: Language;
  targetAccent: string;
  skillLevel: SkillLevel;
  preferredFlavor: PracticeFlavor;
  dailyGoal: number;
  preferredVoice: string;
  assistantLanguage: 'Target' | 'English';
  assistantEnglishAccent: string;
  isLiveAssistantEnabled: boolean;
}
