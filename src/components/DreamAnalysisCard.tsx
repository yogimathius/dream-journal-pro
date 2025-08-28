import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DreamEntry, DreamAnalysis } from '../types/dream';
import { getOpenAIService, generateMockAnalysis } from '../services/openAIService';
import { useDreamStore } from '../store/dreamStore';

interface DreamAnalysisCardProps {
  dream: DreamEntry;
}

const DreamAnalysisCard: React.FC<DreamAnalysisCardProps> = ({ dream }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DreamAnalysis | null>(
    dream.aiInterpretation ? JSON.parse(dream.aiInterpretation) : null
  );
  const { updateDreamAnalysis } = useDreamStore();

  const performAnalysis = async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    
    try {
      // Try to use OpenAI service, fallback to mock analysis
      let dreamAnalysis: DreamAnalysis;
      
      try {
        const openAIService = getOpenAIService();
        dreamAnalysis = await openAIService.analyzeDream(dream);
      } catch (error) {
        // Fallback to mock analysis if OpenAI service isn't configured
        console.log('Using mock analysis (OpenAI not configured)');
        dreamAnalysis = await generateMockAnalysis(dream);
      }
      
      setAnalysis(dreamAnalysis);
      updateDreamAnalysis(dream.id, dreamAnalysis);
      
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert(
        'Analysis Error',
        'Unable to analyze dream at this time. Please try again later.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const regenerateAnalysis = () => {
    Alert.alert(
      'Regenerate Analysis',
      'This will create a new AI analysis of your dream. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Regenerate', onPress: performAnalysis }
      ]
    );
  };

  const renderAnalysisContent = () => {
    if (!analysis) return null;

    return (
      <View style={styles.analysisContent}>
        {/* Symbolic Landscape */}
        <View style={styles.analysisSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={16} color="#8b5cf6" />
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Symbolic Landscape
            </Text>
          </View>
          <Text style={[styles.analysisText, { color: isDark ? '#d1d5db' : '#374151' }]}>
            {analysis.symbolicLandscape}
          </Text>
        </View>

        {/* Emotional Undercurrent */}
        <View style={styles.analysisSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart" size={16} color="#ef4444" />
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Emotional Undercurrent
            </Text>
          </View>
          <Text style={[styles.analysisText, { color: isDark ? '#d1d5db' : '#374151' }]}>
            {analysis.emotionalUndercurrent}
          </Text>
        </View>

        {/* Life Integration */}
        <View style={styles.analysisSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="leaf" size={16} color="#10b981" />
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Life Integration
            </Text>
          </View>
          <Text style={[styles.analysisText, { color: isDark ? '#d1d5db' : '#374151' }]}>
            {analysis.lifeIntegration}
          </Text>
        </View>

        {/* Personal Patterns */}
        <View style={styles.analysisSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trending-up" size={16} color="#6366f1" />
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Personal Patterns
            </Text>
          </View>
          <Text style={[styles.analysisText, { color: isDark ? '#d1d5db' : '#374151' }]}>
            {analysis.personalPatterns}
          </Text>
        </View>

        {/* Soul Questions */}
        <View style={styles.analysisSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle" size={16} color="#f59e0b" />
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Soul Questions
            </Text>
          </View>
          <View style={styles.questionsList}>
            {analysis.soulQuestions.map((question, index) => (
              <View key={index} style={styles.questionItem}>
                <Text style={[styles.questionBullet, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  •
                </Text>
                <Text style={[styles.questionText, { color: isDark ? '#d1d5db' : '#374151' }]}>
                  {question}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Integration Practice */}
        <View style={styles.analysisSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="compass" size={16} color="#06b6d4" />
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Integration Practice
            </Text>
          </View>
          <View style={[styles.practiceCard, { backgroundColor: isDark ? '#1e40af' : '#dbeafe' }]}>
            <Text style={[styles.practiceText, { color: isDark ? '#dbeafe' : '#1e40af' }]}>
              {analysis.integrationPractice}
            </Text>
          </View>
        </View>

        {/* Analysis Metadata */}
        <View style={styles.metadataRow}>
          <View style={styles.metadataItem}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={[styles.metadataText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              {Math.round(analysis.confidence * 100)}% confidence
            </Text>
          </View>
          <TouchableOpacity style={styles.regenerateButton} onPress={regenerateAnalysis}>
            <Ionicons name="refresh" size={14} color="#6366f1" />
            <Text style={styles.regenerateText}>Regenerate</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="psychology" size={24} color="#6366f1" />
          <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
            AI Dream Analysis
          </Text>
        </View>
        {analysis && !isAnalyzing && (
          <TouchableOpacity style={styles.headerAction} onPress={regenerateAnalysis}>
            <Ionicons name="refresh" size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
        )}
      </View>

      {isAnalyzing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={[styles.loadingText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Analyzing your dream...
          </Text>
          <Text style={[styles.loadingSubtext, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
            This may take a moment
          </Text>
        </View>
      ) : analysis ? (
        renderAnalysisContent()
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="bulb-outline" size={48} color={isDark ? '#4b5563' : '#d1d5db'} />
          <Text style={[styles.emptyTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Discover Hidden Meanings
          </Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Let AI analyze the symbols, emotions, and patterns in your dream to unlock deeper insights.
          </Text>
          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={performAnalysis}
            disabled={isAnalyzing}
          >
            <Ionicons name="sparkles" size={20} color="#ffffff" />
            <Text style={styles.analyzeButtonText}>Analyze Dream</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAction: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  analyzeButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  analysisContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  analysisSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
  },
  questionsList: {
    gap: 8,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  questionBullet: {
    fontSize: 14,
    marginTop: 2,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  practiceCard: {
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#06b6d4',
  },
  practiceText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  regenerateText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
});

export default DreamAnalysisCard;