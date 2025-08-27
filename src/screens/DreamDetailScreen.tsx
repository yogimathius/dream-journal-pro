import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, useColorScheme } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useDreamStore } from '../store/dreamStore';

type DreamDetailRouteProp = RouteProp<RootStackParamList, 'DreamDetail'>;

const DreamDetailScreen = () => {
  const route = useRoute<DreamDetailRouteProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { getDream } = useDreamStore();
  
  const dream = getDream(route.params.dreamId);

  if (!dream) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? '#111827' : '#f9fafb' },
        ]}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
            Dream Not Found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#111827' : '#f9fafb' },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
          {dream.title}
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
          Dream detail screen for: {dream.title}
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

export default DreamDetailScreen;