import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDreamStore } from '../store/dreamStore';

const { width: screenWidth } = Dimensions.get('window');

const AnalyticsScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { getDreamStatistics, dreams } = useDreamStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  
  const statistics = getDreamStatistics();

  const renderStatCard = (
    title: string,
    value: string | number,
    icon: string,
    color: string,
    subtitle?: string
  ) => (
    <View style={[styles.statCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={24} color="#ffffff" />
        </View>
        <Text style={[styles.statTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#000000' }]}>
        {value}
      </Text>
      {subtitle && (
        <Text style={[styles.statSubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const renderQualityChart = () => (
    <View style={[styles.chartCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
      <Text style={[styles.chartTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
        Dream Quality Averages
      </Text>
      <View style={styles.qualityBars}>
        <View style={styles.qualityBar}>
          <Text style={[styles.qualityLabel, { color: isDark ? '#d1d5db' : '#374151' }]}>
            Lucidity
          </Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${(statistics.averageLucidity / 10) * 100}%`,
                  backgroundColor: '#6366f1',
                },
              ]}
            />
          </View>
          <Text style={[styles.qualityValue, { color: isDark ? '#ffffff' : '#000000' }]}>
            {statistics.averageLucidity.toFixed(1)}
          </Text>
        </View>
        
        <View style={styles.qualityBar}>
          <Text style={[styles.qualityLabel, { color: isDark ? '#d1d5db' : '#374151' }]}>
            Sleep Quality
          </Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${(statistics.averageSleepQuality / 10) * 100}%`,
                  backgroundColor: '#10b981',
                },
              ]}
            />
          </View>
          <Text style={[styles.qualityValue, { color: isDark ? '#ffffff' : '#000000' }]}>
            {statistics.averageSleepQuality.toFixed(1)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTopSymbols = () => (
    <View style={[styles.chartCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
      <Text style={[styles.chartTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
        Most Common Symbols
      </Text>
      {statistics.mostCommonSymbols.length > 0 ? (
        <View style={styles.symbolsList}>
          {statistics.mostCommonSymbols.slice(0, 8).map((item, index) => (
            <View key={index} style={styles.symbolItem}>
              <View style={styles.symbolRank}>
                <Text style={[styles.rankText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  #{index + 1}
                </Text>
              </View>
              <Text style={[styles.symbolText, { color: isDark ? '#ffffff' : '#000000' }]}>
                {item.symbol}
              </Text>
              <View style={styles.symbolCount}>
                <Text style={[styles.countText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  {item.count}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name="sparkles-outline"
            size={48}
            color={isDark ? '#4b5563' : '#d1d5db'}
          />
          <Text style={[styles.emptyText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Record more dreams to see symbol patterns
          </Text>
        </View>
      )}
    </View>
  );

  const renderTopEmotions = () => (
    <View style={[styles.chartCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
      <Text style={[styles.chartTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
        Most Common Emotions
      </Text>
      {statistics.mostCommonEmotions.length > 0 ? (
        <View style={styles.emotionsList}>
          {statistics.mostCommonEmotions.slice(0, 6).map((item, index) => (
            <View key={index} style={styles.emotionItem}>
              <View style={[styles.emotionChip, { backgroundColor: getEmotionColor(item.emotion) }]}>
                <Text style={styles.emotionText}>{item.emotion}</Text>
                <Text style={styles.emotionCount}>{item.count}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name="heart-outline"
            size={48}
            color={isDark ? '#4b5563' : '#d1d5db'}
          />
          <Text style={[styles.emptyText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Add emotions to dreams to see patterns
          </Text>
        </View>
      )}
    </View>
  );

  const getEmotionColor = (emotion: string): string => {
    const emotionColors: Record<string, string> = {
      'Happy': '#10b981',
      'Excited': '#f59e0b',
      'Peaceful': '#06b6d4',
      'Grateful': '#8b5cf6',
      'Scared': '#ef4444',
      'Anxious': '#f97316',
      'Worried': '#dc2626',
      'Sad': '#3b82f6',
      'Lonely': '#6366f1',
      'Angry': '#dc2626',
      'Frustrated': '#f97316',
      'Surprised': '#8b5cf6',
      'Amazed': '#06b6d4',
    };
    return emotionColors[emotion] || '#6b7280';
  };

  const renderInsights = () => (
    <View style={[styles.chartCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
      <Text style={[styles.chartTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
        Dream Insights
      </Text>
      <View style={styles.insightsList}>
        {statistics.currentStreak > 0 && (
          <View style={styles.insightItem}>
            <Ionicons name="flame" size={20} color="#f59e0b" />
            <Text style={[styles.insightText, { color: isDark ? '#d1d5db' : '#374151' }]}>
              You're on a {statistics.currentStreak}-day dream recording streak!
            </Text>
          </View>
        )}
        
        {statistics.longestStreak > 1 && (
          <View style={styles.insightItem}>
            <Ionicons name="trophy" size={20} color="#10b981" />
            <Text style={[styles.insightText, { color: isDark ? '#d1d5db' : '#374151' }]}>
              Your longest streak was {statistics.longestStreak} days
            </Text>
          </View>
        )}
        
        {statistics.averageLucidity > 7 && (
          <View style={styles.insightItem}>
            <Ionicons name="eye" size={20} color="#6366f1" />
            <Text style={[styles.insightText, { color: isDark ? '#d1d5db' : '#374151' }]}>
              You have high dream lucidity! Consider lucid dreaming techniques
            </Text>
          </View>
        )}
        
        {statistics.mostCommonSymbols.length > 0 && (
          <View style={styles.insightItem}>
            <Ionicons name="sparkles" size={20} color="#8b5cf6" />
            <Text style={[styles.insightText, { color: isDark ? '#d1d5db' : '#374151' }]}>
              "{statistics.mostCommonSymbols[0].symbol}" appears most in your dreams
            </Text>
          </View>
        )}
        
        {statistics.totalDreams === 0 && (
          <View style={styles.insightItem}>
            <Ionicons name="moon" size={20} color="#6b7280" />
            <Text style={[styles.insightText, { color: isDark ? '#d1d5db' : '#374151' }]}>
              Start recording your dreams to unlock personalized insights
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (dreams.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
        <View style={styles.emptyAnalytics}>
          <Ionicons
            name="analytics-outline"
            size={80}
            color={isDark ? '#4b5563' : '#d1d5db'}
          />
          <Text style={[styles.emptyTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            No Dream Analytics Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Record some dreams to see patterns, insights, and your dream journey visualization.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Stats Overview */}
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Total Dreams',
              statistics.totalDreams,
              'moon',
              '#6366f1',
              'dreams recorded'
            )}
            {renderStatCard(
              'Current Streak',
              statistics.currentStreak,
              'flame',
              '#f59e0b',
              'days in a row'
            )}
            {renderStatCard(
              'Avg Lucidity',
              statistics.averageLucidity.toFixed(1),
              'eye',
              '#8b5cf6',
              'out of 10'
            )}
            {renderStatCard(
              'Best Streak',
              statistics.longestStreak,
              'trophy',
              '#10b981',
              'days record'
            )}
          </View>

          {/* Quality Chart */}
          {renderQualityChart()}

          {/* Top Symbols */}
          {renderTopSymbols()}

          {/* Top Emotions */}
          {renderTopEmotions()}

          {/* Insights */}
          {renderInsights()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyAnalytics: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: (screenWidth - 44) / 2,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
  },
  chartCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  qualityBars: {
    gap: 16,
  },
  qualityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qualityLabel: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 80,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  qualityValue: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },
  symbolsList: {
    gap: 8,
  },
  symbolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  symbolRank: {
    width: 32,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
  },
  symbolText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
  },
  symbolCount: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  emotionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionItem: {
    marginBottom: 8,
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  emotionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  emotionCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default AnalyticsScreen;