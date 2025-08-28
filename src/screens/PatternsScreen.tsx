import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDreamStore } from '../store/dreamStore';
import patternAnalysisService, { PatternAnalysisResult, PatternInsight } from '../services/patternAnalysisService';
import { Pattern } from '../types/dream';

const PatternsScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { dreams, patterns, updatePatterns } = useDreamStore();
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PatternAnalysisResult | null>(null);
  const [selectedTab, setSelectedTab] = useState<'patterns' | 'insights' | 'trends'>('patterns');

  useEffect(() => {
    if (dreams.length >= 3) {
      performPatternAnalysis();
    }
  }, [dreams]);

  const performPatternAnalysis = async () => {
    if (dreams.length < 3) return;
    
    setIsAnalyzing(true);
    
    // Simulate analysis delay
    setTimeout(() => {
      try {
        const result = patternAnalysisService.analyzePatterns(dreams);
        setAnalysisResult(result);
        updatePatterns(result.patterns);
      } catch (error) {
        console.error('Pattern analysis error:', error);
        Alert.alert('Analysis Error', 'Failed to analyze patterns. Please try again.');
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500);
  };

  const renderTabButton = (tab: 'patterns' | 'insights' | 'trends', label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        selectedTab === tab && { backgroundColor: '#6366f1' },
        { borderColor: isDark ? '#374151' : '#e5e7eb' }
      ]}
      onPress={() => setSelectedTab(tab)}
    >
      <Ionicons
        name={icon as any}
        size={16}
        color={selectedTab === tab ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280')}
      />
      <Text
        style={[
          styles.tabButtonText,
          {
            color: selectedTab === tab ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280')
          }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderPatternCard = (pattern: Pattern) => (
    <View
      key={`${pattern.type}-${pattern.pattern}`}
      style={[styles.patternCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
    >
      <View style={styles.patternHeader}>
        <View style={styles.patternTypeRow}>
          <Ionicons
            name={getPatternIcon(pattern.type)}
            size={20}
            color={getPatternColor(pattern.type)}
          />
          <Text style={[styles.patternType, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            {pattern.type.charAt(0).toUpperCase() + pattern.type.slice(1)}
          </Text>
        </View>
        <View style={styles.confidenceRow}>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceFill,
                {
                  width: `${pattern.confidence * 100}%`,
                  backgroundColor: getPatternColor(pattern.type),
                },
              ]}
            />
          </View>
          <Text style={[styles.confidenceText, { color: isDark ? '#d1d5db' : '#374151' }]}>
            {Math.round(pattern.confidence * 100)}%
          </Text>
        </View>
      </View>

      <Text style={[styles.patternTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
        {pattern.pattern}
      </Text>

      <Text style={[styles.patternInsight, { color: isDark ? '#d1d5db' : '#374151' }]}>
        {pattern.insight}
      </Text>

      <View style={styles.patternStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Frequency
          </Text>
          <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#000000' }]}>
            {pattern.frequency}
          </Text>
        </View>
        
        {pattern.correlation.strength > 0.3 && (
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Life Context
            </Text>
            <Text style={[styles.statValue, { color: getPatternColor(pattern.type) }]}>
              {pattern.correlation.eventType}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderInsightCard = (insight: PatternInsight, index: number) => (
    <View
      key={index}
      style={[styles.insightCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}
    >
      <View style={styles.insightHeader}>
        <View style={styles.insightTypeRow}>
          <Ionicons
            name={getSeverityIcon(insight.severity)}
            size={20}
            color={getSeverityColor(insight.severity)}
          />
          <Text style={[styles.severityText, { color: getSeverityColor(insight.severity) }]}>
            {insight.severity.toUpperCase()} PRIORITY
          </Text>
        </View>
        {insight.actionable && (
          <View style={styles.actionableBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={[styles.actionableText, { color: '#10b981' }]}>
              Actionable
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.insightTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
        {insight.pattern.pattern}
      </Text>

      <Text style={[styles.insightDescription, { color: isDark ? '#d1d5db' : '#374151' }]}>
        {insight.description}
      </Text>

      {insight.recommendation && (
        <View style={[styles.recommendationBox, { backgroundColor: isDark ? '#065f46' : '#ecfccb' }]}>
          <Ionicons name="bulb" size={16} color={isDark ? '#34d399' : '#16a34a'} />
          <Text style={[styles.recommendationText, { color: isDark ? '#34d399' : '#16a34a' }]}>
            {insight.recommendation}
          </Text>
        </View>
      )}
    </View>
  );

  const renderSummaryCard = () => {
    if (!analysisResult) return null;

    const { summary } = analysisResult;

    return (
      <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
        <Text style={[styles.summaryTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Pattern Analysis Summary
        </Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#6366f1' }]}>
              {summary.totalPatterns}
            </Text>
            <Text style={[styles.summaryLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Total Patterns
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
              {summary.significantPatterns}
            </Text>
            <Text style={[styles.summaryLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Significant
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>
              {summary.strongCorrelations}
            </Text>
            <Text style={[styles.summaryLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Life Connections
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#8b5cf6' }]}>
              {Math.round(summary.averageConfidence * 100)}%
            </Text>
            <Text style={[styles.summaryLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Avg Confidence
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const getPatternIcon = (type: string): string => {
    switch (type) {
      case 'symbol': return 'sparkles';
      case 'emotion': return 'heart';
      case 'narrative': return 'book';
      case 'timing': return 'time';
      default: return 'analytics';
    }
  };

  const getPatternColor = (type: string): string => {
    switch (type) {
      case 'symbol': return '#8b5cf6';
      case 'emotion': return '#ef4444';
      case 'narrative': return '#10b981';
      case 'timing': return '#f59e0b';
      default: return '#6366f1';
    }
  };

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'high': return 'warning';
      case 'medium': return 'information-circle';
      case 'low': return 'checkmark-circle';
      default: return 'information-circle';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6366f1';
    }
  };

  if (dreams.length < 3) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
        <View style={styles.emptyContainer}>
          <Ionicons
            name="analytics-outline"
            size={80}
            color={isDark ? '#4b5563' : '#d1d5db'}
          />
          <Text style={[styles.emptyTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Not Enough Dreams Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Record at least 3 dreams to start seeing patterns and insights about your dream life.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Dream Patterns
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={performPatternAnalysis}
          disabled={isAnalyzing}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={isAnalyzing ? (isDark ? '#6b7280' : '#9ca3af') : '#6366f1'}
          />
        </TouchableOpacity>
      </View>

      {isAnalyzing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={[styles.loadingText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Analyzing your dream patterns...
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.tabContainer}>
            {renderTabButton('patterns', 'Patterns', 'analytics')}
            {renderTabButton('insights', 'Insights', 'bulb')}
            {renderTabButton('trends', 'Trends', 'trending-up')}
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {analysisResult && renderSummaryCard()}

              {selectedTab === 'patterns' && analysisResult?.patterns.map(renderPatternCard)}
              
              {selectedTab === 'insights' && analysisResult?.insights.map(renderInsightCard)}
              
              {selectedTab === 'trends' && (
                <View style={[styles.trendsContainer, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                  <Ionicons name="trending-up" size={48} color={isDark ? '#4b5563' : '#d1d5db'} />
                  <Text style={[styles.trendsTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                    Trends Coming Soon
                  </Text>
                  <Text style={[styles.trendsSubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    Trend analysis will show how your patterns change over time.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  refreshButton: {
    padding: 8,
  },
  emptyContainer: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  patternCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patternTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patternType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBar: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  patternTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  patternInsight: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  patternStats: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  insightCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
  },
  actionableText: {
    fontSize: 10,
    fontWeight: '600',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#16a34a',
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  trendsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    borderRadius: 12,
    marginBottom: 16,
  },
  trendsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  trendsSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default PatternsScreen;