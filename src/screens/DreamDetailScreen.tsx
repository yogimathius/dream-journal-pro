import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useDreamStore } from '../store/dreamStore';
import { DreamEntry, DreamAnalysis } from '../types/dream';
import VoicePlayback from '../components/VoicePlayback';

type DreamDetailRouteProp = RouteProp<RootStackParamList, 'DreamDetail'>;
type NavigationProp = StackNavigationProp<RootStackParamList, 'DreamDetail'>;

const DreamDetailScreen = () => {
  const route = useRoute<DreamDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { getDream, deleteDream } = useDreamStore();
  
  const dream = getDream(route.params.dreamId);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('DreamEntry', { dreamId: dream?.id })}
            style={styles.headerButton}
          >
            <Ionicons name="create-outline" size={24} color="#6366f1" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteDream}
            style={styles.headerButton}
          >
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [dream, navigation]);

  const handleDeleteDream = () => {
    if (!dream) return;
    
    Alert.alert(
      'Delete Dream',
      'Are you sure you want to delete this dream? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteDream(dream.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!dream) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? '#111827' : '#f9fafb' },
        ]}
      >
        <View style={styles.notFoundContainer}>
          <Ionicons
            name="moon-outline"
            size={80}
            color={isDark ? '#4b5563' : '#d1d5db'}
          />
          <Text style={[styles.notFoundTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            Dream Not Found
          </Text>
          <Text style={[styles.notFoundSubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            This dream may have been deleted or doesn't exist.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getAnalysis = (): DreamAnalysis | null => {
    if (!dream.aiInterpretation) return null;
    
    try {
      return JSON.parse(dream.aiInterpretation);
    } catch {
      return null;
    }
  };

  const analysis = getAnalysis();

  const renderSection = (title: string, content: React.ReactNode, icon?: string) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color="#6366f1"
            style={styles.sectionIcon}
          />
        )}
        <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          {title}
        </Text>
      </View>
      <View style={[styles.sectionContent, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
        {content}
      </View>
    </View>
  );

  const renderSliderValue = (label: string, value: number, max: number = 10) => (
    <View style={styles.sliderValueContainer}>
      <Text style={[styles.sliderLabel, { color: isDark ? '#d1d5db' : '#374151' }]}>
        {label}
      </Text>
      <View style={styles.sliderDisplay}>
        <View style={styles.sliderTrack}>
          {[...Array(max + 1)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.sliderDot,
                {
                  backgroundColor: index <= value ? '#6366f1' : (isDark ? '#374151' : '#e5e7eb'),
                },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.sliderValue, { color: isDark ? '#ffffff' : '#000000' }]}>
          {value}/{max}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Dream Header */}
          <View style={[styles.header, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
            <Text style={[styles.dreamTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              {dream.title}
            </Text>
            <View style={styles.dreamMeta}>
              <Text style={[styles.dreamDate, { color: isDark ? '#d1d5db' : '#374151' }]}>
                {formatDate(dream.date)}
              </Text>
              <Text style={[styles.dreamTime, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                {formatTime(dream.date)}
              </Text>
            </View>
            {dream.status === 'draft' && (
              <View style={styles.statusBadge}>
                <Ionicons name="create-outline" size={12} color="#ffffff" />
                <Text style={styles.statusText}>Draft</Text>
              </View>
            )}
          </View>

          {/* Dream Narrative */}
          {renderSection(
            'Dream Narrative',
            <Text style={[styles.narrativeText, { color: isDark ? '#d1d5db' : '#374151' }]}>
              {dream.narrative}
            </Text>,
            'book-outline'
          )}

          {/* Dream Quality Metrics */}
          {renderSection(
            'Dream Quality',
            <View style={styles.qualityMetrics}>
              {renderSliderValue('Lucidity', dream.lucidity)}
              {renderSliderValue('Vividness', dream.vividness)}
              {renderSliderValue('Sleep Quality', dream.sleepQuality)}
              <View style={styles.sliderValueContainer}>
                <Text style={[styles.sliderLabel, { color: isDark ? '#d1d5db' : '#374151' }]}>
                  Sleep Duration
                </Text>
                <Text style={[styles.sliderValue, { color: isDark ? '#ffffff' : '#000000' }]}>
                  {formatDuration(dream.sleepDuration)}
                </Text>
              </View>
            </View>,
            'stats-chart-outline'
          )}

          {/* Emotions */}
          {dream.emotions.length > 0 &&
            renderSection(
              'Emotions Present',
              <View style={styles.emotionsContainer}>
                {dream.emotions.map((emotion, index) => (
                  <View key={index} style={styles.emotionChip}>
                    <Text style={styles.emotionText}>{emotion.name}</Text>
                    <View style={styles.emotionIntensity}>
                      <Text style={styles.emotionIntensityText}>
                        {emotion.intensity}/10
                      </Text>
                    </View>
                  </View>
                ))}
              </View>,
              'heart-outline'
            )}

          {/* Symbols */}
          {dream.symbols.length > 0 &&
            renderSection(
              'Dream Symbols',
              <View style={styles.symbolsContainer}>
                {dream.symbols.map((symbol, index) => (
                  <View key={index} style={styles.symbolChip}>
                    <Text style={styles.symbolText}>{symbol}</Text>
                  </View>
                ))}
              </View>,
              'sparkles-outline'
            )}

          {/* Life Context */}
          {dream.lifeTags.length > 0 &&
            renderSection(
              'Life Context',
              <View style={styles.lifeTagsContainer}>
                {dream.lifeTags.map((tag, index) => (
                  <View key={index} style={styles.lifeTagChip}>
                    <Text style={styles.lifeTagText}>{tag}</Text>
                  </View>
                ))}
              </View>,
              'library-outline'
            )}

          {/* Voice Recording */}
          {dream.voiceRecordingUri &&
            renderSection(
              'Voice Recording',
              <VoicePlayback uri={dream.voiceRecordingUri} />,
              'mic-outline'
            )}

          {/* AI Analysis */}
          {analysis &&
            renderSection(
              'AI Dream Analysis',
              <View style={styles.analysisContainer}>
                <View style={styles.analysisSection}>
                  <Text style={[styles.analysisSubtitle, { color: isDark ? '#60a5fa' : '#3b82f6' }]}>
                    Symbolic Landscape
                  </Text>
                  <Text style={[styles.analysisText, { color: isDark ? '#d1d5db' : '#374151' }]}>
                    {analysis.symbolicLandscape}
                  </Text>
                </View>

                <View style={styles.analysisSection}>
                  <Text style={[styles.analysisSubtitle, { color: isDark ? '#34d399' : '#10b981' }]}>
                    Emotional Undercurrent
                  </Text>
                  <Text style={[styles.analysisText, { color: isDark ? '#d1d5db' : '#374151' }]}>
                    {analysis.emotionalUndercurrent}
                  </Text>
                </View>

                <View style={styles.analysisSection}>
                  <Text style={[styles.analysisSubtitle, { color: isDark ? '#fbbf24' : '#f59e0b' }]}>
                    Life Integration
                  </Text>
                  <Text style={[styles.analysisText, { color: isDark ? '#d1d5db' : '#374151' }]}>
                    {analysis.lifeIntegration}
                  </Text>
                </View>

                {analysis.soulQuestions && analysis.soulQuestions.length > 0 && (
                  <View style={styles.analysisSection}>
                    <Text style={[styles.analysisSubtitle, { color: isDark ? '#c084fc' : '#8b5cf6' }]}>
                      Soul Questions
                    </Text>
                    {analysis.soulQuestions.map((question, index) => (
                      <Text
                        key={index}
                        style={[styles.questionText, { color: isDark ? '#d1d5db' : '#374151' }]}
                      >
                        • {question}
                      </Text>
                    ))}
                  </View>
                )}

                {analysis.integrationPractice && (
                  <View style={styles.analysisSection}>
                    <Text style={[styles.analysisSubtitle, { color: isDark ? '#fb7185' : '#ec4899' }]}>
                      Integration Practice
                    </Text>
                    <Text style={[styles.analysisText, { color: isDark ? '#d1d5db' : '#374151' }]}>
                      {analysis.integrationPractice}
                    </Text>
                  </View>
                )}
              </View>,
              'bulb-outline'
            )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => navigation.navigate('DreamEntry', { dreamId: dream.id })}
            >
              <Ionicons name="create-outline" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Edit Dream</Text>
            </TouchableOpacity>

            {!analysis && (
              <TouchableOpacity
                style={[styles.actionButton, styles.analyzeButton]}
                onPress={() => {
                  // TODO: Implement AI analysis
                  Alert.alert('Coming Soon', 'AI analysis feature will be implemented in the next phase.');
                }}
              >
                <Ionicons name="sparkles-outline" size={20} color="#ffffff" />
                <Text style={styles.actionButtonText}>Analyze with AI</Text>
              </TouchableOpacity>
            )}
          </View>
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
  headerButtons: {
    flexDirection: 'row',
    marginRight: 8,
  },
  headerButton: {
    marginLeft: 16,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  notFoundTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  notFoundSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  dreamTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  dreamMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dreamDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  dreamTime: {
    fontSize: 14,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionContent: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  narrativeText: {
    fontSize: 16,
    lineHeight: 24,
  },
  qualityMetrics: {
    gap: 16,
  },
  sliderValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  sliderDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderTrack: {
    flexDirection: 'row',
    gap: 2,
  },
  sliderDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
  },
  emotionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
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
  emotionIntensity: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  emotionIntensityText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  symbolsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symbolChip: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  symbolText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  lifeTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  lifeTagChip: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  lifeTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  analysisContainer: {
    gap: 20,
  },
  analysisSection: {
    gap: 8,
  },
  analysisSubtitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
  },
  questionText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#6366f1',
  },
  analyzeButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DreamDetailScreen;