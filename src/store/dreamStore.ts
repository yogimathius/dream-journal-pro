import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DreamEntry, DreamAnalysis, UserPreferences, Pattern } from '../types/dream';
import { apiClient } from '../services/apiClient';
import notificationService from '../services/notificationService';

interface DreamStore {
  dreams: DreamEntry[];
  patterns: Pattern[];
  isAnalyzing: boolean;
  userPreferences: UserPreferences;
  isLoading: boolean;
  error: string | null;
  
  // Dream CRUD operations
  addDream: (dream: Omit<DreamEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDream: (id: string, updates: Partial<DreamEntry>) => Promise<void>;
  deleteDream: (id: string) => Promise<void>;
  getDream: (id: string) => DreamEntry | undefined;
  fetchDreams: () => Promise<void>;
  
  // Search and filter
  searchDreams: (query: string) => DreamEntry[];
  filterDreams: (filters: DreamFilters) => DreamEntry[];
  
  // Analysis
  setAnalyzing: (analyzing: boolean) => void;
  analyzeDream: (dreamId: string) => Promise<void>;
  updateDreamAnalysis: (dreamId: string, analysis: DreamAnalysis) => void;
  updatePatterns: (patterns: Pattern[]) => void;
  fetchPatterns: () => Promise<void>;
  
  // Preferences
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  
  // Statistics
  getDreamStatistics: () => DreamStatistics;
  
  // Utility
  setError: (error: string | null) => void;
  clearError: () => void;
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

// Transform backend dream format to frontend format
const transformBackendDream = (backendDream: any): DreamEntry => {
  return {
    id: backendDream.id,
    title: backendDream.title,
    narrative: backendDream.content,
    date: new Date(backendDream.recordedAt || backendDream.createdAt),
    lucidity: backendDream.lucidityLevel || 5,
    vividness: backendDream.vividnessLevel || 5,
    sleepQuality: backendDream.sleepQuality || 7,
    emotions: backendDream.emotions ? JSON.parse(backendDream.emotions) : [],
    symbols: backendDream.symbols ? JSON.parse(backendDream.symbols) : [],
    lifeTags: backendDream.tags ? JSON.parse(backendDream.tags) : [],
    voiceRecording: backendDream.voiceFileUrl ? {
      uri: backendDream.voiceFileUrl,
      duration: backendDream.voiceDuration || 0,
      transcription: backendDream.voiceTranscription || '',
    } : undefined,
    aiInterpretation: backendDream.aiAnalysis,
    createdAt: new Date(backendDream.createdAt),
    updatedAt: new Date(backendDream.updatedAt),
  };
};

// Transform frontend dream format to backend format
const transformFrontendDream = (frontendDream: Omit<DreamEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
  return {
    title: frontendDream.title,
    content: frontendDream.narrative,
    mood: frontendDream.emotions[0]?.name || 'neutral',
    lucidityLevel: frontendDream.lucidity,
    vividnessLevel: frontendDream.vividness,
    sleepQuality: frontendDream.sleepQuality,
    emotions: JSON.stringify(frontendDream.emotions),
    symbols: JSON.stringify(frontendDream.symbols),
    tags: JSON.stringify(frontendDream.lifeTags),
    recordedAt: frontendDream.date.toISOString(),
  };
};

export const useDreamStore = create<DreamStore>()(
  persist(
    (set, get) => ({
      dreams: [],
      patterns: [],
      isAnalyzing: false,
      userPreferences: defaultPreferences,
      isLoading: false,
      error: null,

      fetchDreams: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await apiClient.getDreams();
          const transformedDreams = response.dreams?.map(transformBackendDream) || [];
          set({ dreams: transformedDreams, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch dreams:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch dreams',
            isLoading: false 
          });
        }
      },

      addDream: async (dreamData) => {
        try {
          set({ isLoading: true, error: null });
          const backendData = transformFrontendDream(dreamData);
          const response = await apiClient.createDream(backendData);
          const newDream = transformBackendDream(response.dream);
          
          set((state) => ({
            dreams: [newDream, ...state.dreams],
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to add dream:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add dream',
            isLoading: false 
          });
          throw error;
        }
      },

      updateDream: async (id, updates) => {
        try {
          set({ isLoading: true, error: null });
          const backendUpdates: any = {};
          
          if (updates.title) backendUpdates.title = updates.title;
          if (updates.narrative) backendUpdates.content = updates.narrative;
          if (updates.emotions) backendUpdates.emotions = JSON.stringify(updates.emotions);
          if (updates.symbols) backendUpdates.symbols = JSON.stringify(updates.symbols);
          if (updates.lifeTags) backendUpdates.tags = JSON.stringify(updates.lifeTags);
          if (updates.lucidity !== undefined) backendUpdates.lucidityLevel = updates.lucidity;
          if (updates.vividness !== undefined) backendUpdates.vividnessLevel = updates.vividness;
          if (updates.sleepQuality !== undefined) backendUpdates.sleepQuality = updates.sleepQuality;
          
          const response = await apiClient.updateDream({ id, ...backendUpdates });
          const updatedDream = transformBackendDream(response.dream);
          
          set((state) => ({
            dreams: state.dreams.map((dream) =>
              dream.id === id ? updatedDream : dream
            ),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to update dream:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update dream',
            isLoading: false 
          });
          throw error;
        }
      },

      deleteDream: async (id) => {
        try {
          set({ isLoading: true, error: null });
          await apiClient.deleteDream(id);
          
          set((state) => ({
            dreams: state.dreams.filter((dream) => dream.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to delete dream:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete dream',
            isLoading: false 
          });
          throw error;
        }
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

      analyzeDream: async (dreamId) => {
        try {
          set({ isAnalyzing: true, error: null });
          const response = await apiClient.analyzeDream(dreamId);
          
          // Update the dream with analysis
          set((state) => ({
            dreams: state.dreams.map((dream) =>
              dream.id === dreamId
                ? { 
                    ...dream, 
                    aiInterpretation: JSON.stringify(response.analysis),
                    updatedAt: new Date()
                  }
                : dream
            ),
            isAnalyzing: false,
          }));
        } catch (error) {
          console.error('Failed to analyze dream:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to analyze dream',
            isAnalyzing: false 
          });
          throw error;
        }
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

      fetchPatterns: async () => {
        try {
          const response = await apiClient.getPatterns();
          set({ patterns: response.patterns || [] });
        } catch (error) {
          console.error('Failed to fetch patterns:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch patterns'
          });
        }
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

      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      clearAllData: () => {
        set(() => ({
          dreams: [],
          patterns: [],
          isAnalyzing: false,
          error: null,
          userPreferences: defaultPreferences,
        }));
      },
    }),
    {
      name: 'dream-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user preferences, not dreams (they come from backend)
      partialize: (state) => ({ 
        userPreferences: state.userPreferences 
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize services when store is rehydrated
        if (state?.userPreferences) {
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