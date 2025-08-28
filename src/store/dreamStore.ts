import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DreamEntry, DreamAnalysis, UserPreferences, Pattern } from '../types/dream';
import { initializeOpenAI } from '../services/openAIService';
import notificationService from '../services/notificationService';

interface DreamStore {
  dreams: DreamEntry[];
  patterns: Pattern[];
  isAnalyzing: boolean;
  userPreferences: UserPreferences;
  
  // Dream CRUD operations
  addDream: (dream: Omit<DreamEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDream: (id: string, updates: Partial<DreamEntry>) => void;
  deleteDream: (id: string) => void;
  getDream: (id: string) => DreamEntry | undefined;
  
  // Search and filter
  searchDreams: (query: string) => DreamEntry[];
  filterDreams: (filters: DreamFilters) => DreamEntry[];
  
  // Analysis
  setAnalyzing: (analyzing: boolean) => void;
  updateDreamAnalysis: (dreamId: string, analysis: DreamAnalysis) => void;
  updatePatterns: (patterns: Pattern[]) => void;
  
  // Preferences
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  
  // Statistics
  getDreamStatistics: () => DreamStatistics;
  
  // Sample data
  loadSampleData: () => void;
  clearAllData: () => void;
}

export interface DreamFilters {
  dateFrom?: Date;
  dateTo?: Date;
  emotions?: string[];
  symbols?: string[];
  lucidityMin?: number;
  lucidityMax?: number;
  sleepQualityMin?: number;
  sleepQualityMax?: number;
  lifeTags?: string[];
}

export interface DreamStatistics {
  totalDreams: number;
  averageLucidity: number;
  averageSleepQuality: number;
  mostCommonSymbols: Array<{ symbol: string; count: number }>;
  mostCommonEmotions: Array<{ emotion: string; count: number }>;
  dreamFrequencyByDay: Record<string, number>;
  longestStreak: number;
  currentStreak: number;
}

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const defaultPreferences: UserPreferences = {
  reminderTime: '07:00',
  reminderEnabled: true,
  darkModeEnabled: true,
  voiceRecordingEnabled: true,
  analysisLanguage: 'en',
  privacySettings: {
    shareAnalytics: false,
    sharePatterns: false,
    dataRetentionDays: 365,
    allowVoiceProcessing: true,
  },
};

export const useDreamStore = create<DreamStore>()(
  persist(
    (set, get) => ({
      dreams: [],
      patterns: [],
      isAnalyzing: false,
      userPreferences: defaultPreferences,

      addDream: (dreamData) => {
        const dream: DreamEntry = {
          ...dreamData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          dreams: [dream, ...state.dreams],
        }));
      },

      updateDream: (id, updates) => {
        set((state) => ({
          dreams: state.dreams.map((dream) =>
            dream.id === id
              ? { ...dream, ...updates, updatedAt: new Date() }
              : dream
          ),
        }));
      },

      deleteDream: (id) => {
        set((state) => ({
          dreams: state.dreams.filter((dream) => dream.id !== id),
        }));
      },

      getDream: (id) => {
        return get().dreams.find((dream) => dream.id === id);
      },

      searchDreams: (query) => {
        const { dreams } = get();
        const lowercaseQuery = query.toLowerCase();
        
        return dreams.filter((dream) =>
          dream.title.toLowerCase().includes(lowercaseQuery) ||
          dream.narrative.toLowerCase().includes(lowercaseQuery) ||
          dream.symbols.some((symbol) =>
            symbol.toLowerCase().includes(lowercaseQuery)
          ) ||
          dream.emotions.some((emotion) =>
            emotion.name.toLowerCase().includes(lowercaseQuery)
          )
        );
      },

      filterDreams: (filters) => {
        const { dreams } = get();
        
        return dreams.filter((dream) => {
          if (filters.dateFrom && new Date(dream.date) < filters.dateFrom) {
            return false;
          }
          if (filters.dateTo && new Date(dream.date) > filters.dateTo) {
            return false;
          }
          if (filters.emotions && filters.emotions.length > 0) {
            const dreamEmotions = dream.emotions.map((e) => e.name.toLowerCase());
            if (!filters.emotions.some((e) => dreamEmotions.includes(e.toLowerCase()))) {
              return false;
            }
          }
          if (filters.symbols && filters.symbols.length > 0) {
            const dreamSymbols = dream.symbols.map((s) => s.toLowerCase());
            if (!filters.symbols.some((s) => dreamSymbols.includes(s.toLowerCase()))) {
              return false;
            }
          }
          if (filters.lucidityMin && dream.lucidity < filters.lucidityMin) {
            return false;
          }
          if (filters.lucidityMax && dream.lucidity > filters.lucidityMax) {
            return false;
          }
          if (filters.sleepQualityMin && dream.sleepQuality < filters.sleepQualityMin) {
            return false;
          }
          if (filters.sleepQualityMax && dream.sleepQuality > filters.sleepQualityMax) {
            return false;
          }
          if (filters.lifeTags && filters.lifeTags.length > 0) {
            if (!filters.lifeTags.some((tag) => dream.lifeTags.includes(tag))) {
              return false;
            }
          }
          
          return true;
        });
      },

      setAnalyzing: (analyzing) => {
        set({ isAnalyzing: analyzing });
      },

      updateDreamAnalysis: (dreamId, analysis) => {
        set((state) => ({
          dreams: state.dreams.map((dream) =>
            dream.id === dreamId
              ? { ...dream, aiInterpretation: JSON.stringify(analysis), updatedAt: new Date() }
              : dream
          ),
        }));
      },

      updatePatterns: (patterns) => {
        set({ patterns });
      },

      updatePreferences: async (preferences) => {
        const oldPrefs = get().userPreferences;
        const newPrefs = { ...oldPrefs, ...preferences };
        
        set((state) => ({
          userPreferences: newPrefs,
        }));
        
        // Initialize OpenAI if API key is provided
        if (newPrefs.openAIApiKey) {
          try {
            initializeOpenAI({ apiKey: newPrefs.openAIApiKey });
          } catch (error) {
            console.error('Failed to initialize OpenAI:', error);
          }
        }

        // Handle notification scheduling
        if ('reminderEnabled' in preferences || 'reminderTime' in preferences) {
          try {
            // Cancel existing notification if it exists
            if (oldPrefs.reminderNotificationId) {
              await notificationService.cancelDreamReminder(oldPrefs.reminderNotificationId);
            }

            // Schedule new notification if enabled
            if (newPrefs.reminderEnabled) {
              const reminderMessage = notificationService.getRandomReminderMessage();
              const notificationId = await notificationService.scheduleDreamReminder({
                time: newPrefs.reminderTime,
                enabled: true,
                title: reminderMessage.title,
                body: reminderMessage.body,
              });

              if (notificationId) {
                set((state) => ({
                  userPreferences: { 
                    ...state.userPreferences, 
                    reminderNotificationId: notificationId 
                  },
                }));
              }
            } else {
              // Clear notification ID if disabled
              set((state) => ({
                userPreferences: { 
                  ...state.userPreferences, 
                  reminderNotificationId: undefined 
                },
              }));
            }
          } catch (error) {
            console.error('Error updating dream reminder:', error);
          }
        }
      },

      getDreamStatistics: () => {
        const { dreams } = get();
        
        if (dreams.length === 0) {
          return {
            totalDreams: 0,
            averageLucidity: 0,
            averageSleepQuality: 0,
            mostCommonSymbols: [],
            mostCommonEmotions: [],
            dreamFrequencyByDay: {},
            longestStreak: 0,
            currentStreak: 0,
          };
        }

        // Calculate statistics
        const totalLucidity = dreams.reduce((sum, dream) => sum + dream.lucidity, 0);
        const totalSleepQuality = dreams.reduce((sum, dream) => sum + dream.sleepQuality, 0);
        
        // Symbol frequency
        const symbolCounts: Record<string, number> = {};
        dreams.forEach((dream) => {
          dream.symbols.forEach((symbol) => {
            symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
          });
        });
        
        // Emotion frequency
        const emotionCounts: Record<string, number> = {};
        dreams.forEach((dream) => {
          dream.emotions.forEach((emotion) => {
            emotionCounts[emotion.name] = (emotionCounts[emotion.name] || 0) + 1;
          });
        });
        
        // Dream frequency by day
        const dayFrequency: Record<string, number> = {};
        dreams.forEach((dream) => {
          const dayKey = new Date(dream.date).toISOString().split('T')[0];
          dayFrequency[dayKey] = (dayFrequency[dayKey] || 0) + 1;
        });
        
        // Calculate streaks
        const sortedDates = dreams
          .map((dream) => new Date(dream.date))
          .sort((a, b) => b.getTime() - a.getTime());
        
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        
        if (sortedDates.length > 0) {
          const today = new Date();
          const lastDreamDate = sortedDates[0];
          
          // Check if current streak is still active
          const daysDiff = Math.floor(
            (today.getTime() - lastDreamDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysDiff <= 1) {
            currentStreak = 1;
            tempStreak = 1;
            
            for (let i = 1; i < sortedDates.length; i++) {
              const prevDate = sortedDates[i - 1];
              const currentDate = sortedDates[i];
              const diff = Math.floor(
                (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              
              if (diff === 1) {
                tempStreak++;
                if (i === 1) currentStreak = tempStreak;
              } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
              }
            }
          }
          
          longestStreak = Math.max(longestStreak, tempStreak);
        }

        return {
          totalDreams: dreams.length,
          averageLucidity: totalLucidity / dreams.length,
          averageSleepQuality: totalSleepQuality / dreams.length,
          mostCommonSymbols: Object.entries(symbolCounts)
            .map(([symbol, count]) => ({ symbol, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          mostCommonEmotions: Object.entries(emotionCounts)
            .map(([emotion, count]) => ({ emotion, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          dreamFrequencyByDay: dayFrequency,
          longestStreak,
          currentStreak,
        };
      },

      loadSampleData: () => {
        const { generateMultipleSampleDreams } = require('../utils/sampleData');
        const sampleDreams = generateMultipleSampleDreams(15);
        
        set((state) => ({
          dreams: [...sampleDreams, ...state.dreams],
        }));
      },

      clearAllData: () => {
        set(() => ({
          dreams: [],
          patterns: [],
          isAnalyzing: false,
          userPreferences: defaultPreferences,
        }));
      },
    }),
    {
      name: 'dream-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Initialize services when store is rehydrated
        if (state?.userPreferences) {
          // Initialize OpenAI service
          if (state.userPreferences.openAIApiKey) {
            try {
              initializeOpenAI({ apiKey: state.userPreferences.openAIApiKey });
            } catch (error) {
              console.error('Failed to initialize OpenAI on startup:', error);
            }
          }

          // Initialize notification service
          notificationService.initialize().then((initialized) => {
            if (initialized && state.userPreferences.reminderEnabled) {
              console.log('Notification service initialized, reminders should be active');
            }
          }).catch(error => {
            console.error('Failed to initialize notifications on startup:', error);
          });
        }
      },
    }
  )
);