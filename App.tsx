import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NotificationWrapper from './src/components/NotificationWrapper';
import 'react-native-gesture-handler';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationWrapper />
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
