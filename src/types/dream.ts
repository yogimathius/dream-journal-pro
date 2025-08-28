export interface DreamEntry {
  id: string;
  date: Date;
  title: string;
  narrative: string;
  emotions: Emotion[];
  symbols: string[];
  lucidity: number; // 0-10 scale
  vividness: number; // 0-10 scale
  sleepQuality: number; // 0-10 scale
  wakeUpTime: Date;
  sleepDuration: number; // minutes
  lifeTags: string[]; // "work-stress", "relationship", "health"
  aiInterpretation?: string;
  patterns?: Pattern[];
  status: 'draft' | 'complete';
  voiceRecordingUri?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Emotion {
  id: string;
  name: string;
  intensity: number; // 0-10 scale
  category: EmotionCategory;
}

export type EmotionCategory = 'joy' | 'fear' | 'sadness' | 'anger' | 'surprise' | 'anticipation' | 'trust' | 'disgust';

export interface Pattern {
  type: 'symbol' | 'emotion' | 'narrative' | 'timing';
  pattern: string;
  frequency: number;
  correlation: LifeCorrelation;
  insight: string;
  confidence: number;
}

export interface LifeCorrelation {
  eventType: string;
  strength: number; // 0-1
  description: string;
}

export interface DreamAnalysis {
  symbolicLandscape: string;
  emotionalUndercurrent: string;
  lifeIntegration: string;
  personalPatterns: string;
  soulQuestions: string[];
  integrationPractice: string;
  confidence: number;
  processingTime: number;
}

export interface DreamSymbol {
  symbol: string;
  universalMeanings: string[];
  contextualInterpretation: string;
  personalAssociation?: string;
  frequency: number;
  dreamContext: string;
  jungianAspect?: string;
  freudianAspect?: string;
}

export interface UserPreferences {
  reminderTime: string;
  reminderEnabled: boolean;
  darkModeEnabled: boolean;
  voiceRecordingEnabled: boolean;
  analysisLanguage: string;
  openAIApiKey?: string;
  privacySettings: PrivacySettings;
}

export interface PrivacySettings {
  shareAnalytics: boolean;
  sharePatterns: boolean;
  dataRetentionDays: number;
  allowVoiceProcessing: boolean;
}