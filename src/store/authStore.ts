import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/apiClient';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  subscriptionStatus: string;
  createdAt: Date;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  
  // Utility
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiClient.login({ email, password });
          
          const user: User = {
            ...response.user,
            createdAt: new Date(response.user.createdAt || new Date()),
          };

          set({ 
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null 
          });
        } catch (error) {
          console.error('Login failed:', error);
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Login failed. Please try again.';
          
          set({ 
            error: errorMessage,
            isLoading: false,
            user: null,
            isAuthenticated: false
          });
          throw error;
        }
      },

      register: async (userData) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await apiClient.register(userData);
          
          const user: User = {
            ...response.user,
            createdAt: new Date(response.user.createdAt || new Date()),
          };

          set({ 
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null 
          });
        } catch (error) {
          console.error('Registration failed:', error);
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Registration failed. Please try again.';
          
          set({ 
            error: errorMessage,
            isLoading: false,
            user: null,
            isAuthenticated: false
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          
          // Call logout endpoint to invalidate token on server
          await apiClient.logout();
          
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null 
          });
        } catch (error) {
          console.error('Logout failed:', error);
          // Even if logout fails on server, clear local state
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null 
          });
        }
      },

      refreshProfile: async () => {
        try {
          if (!get().isAuthenticated) return;
          
          set({ isLoading: true, error: null });
          
          const profileData = await apiClient.getProfile();
          
          const user: User = {
            ...profileData,
            createdAt: new Date(profileData.createdAt || new Date()),
          };

          set({ 
            user,
            isLoading: false,
            error: null 
          });
        } catch (error) {
          console.error('Profile refresh failed:', error);
          
          // If token is invalid, log out the user
          if (error instanceof Error && error.message.includes('Authentication required')) {
            set({ 
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null 
            });
            return;
          }
          
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Failed to refresh profile';
          
          set({ 
            error: errorMessage,
            isLoading: false 
          });
        }
      },

      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist user and authentication state
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        // Check if user is still authenticated when app starts
        if (state?.isAuthenticated && state.user) {
          // Optionally refresh profile in background to verify token is still valid
          setTimeout(() => {
            state.refreshProfile?.();
          }, 1000);
        }
      },
    }
  )
);

// Helper hooks for common authentication checks
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);