import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from '../components/ErrorBoundary';
import { colors } from '../design-system/tokens';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0, // Don't retry in dev mode
      staleTime: Infinity, // Never go stale in dev
    },
  },
});

export function DevScreenWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaView style={styles.container}>
          {children}
        </SafeAreaView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
});
