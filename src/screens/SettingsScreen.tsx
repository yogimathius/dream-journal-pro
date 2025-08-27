import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, useColorScheme } from 'react-native';

const SettingsScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#111827' : '#f9fafb' },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
          Settings Screen
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
          This screen will contain user preferences, subscription management, and privacy controls.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default SettingsScreen;