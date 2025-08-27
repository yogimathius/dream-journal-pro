import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  useColorScheme,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDreamStore } from '../store/dreamStore';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Emotion, EmotionCategory } from '../types/dream';
import VoiceRecorder from '../components/VoiceRecorder';

type DreamEntryRouteProp = RouteProp<RootStackParamList, 'DreamEntry'>;
type NavigationProp = StackNavigationProp<RootStackParamList, 'DreamEntry'>;

const DreamEntryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DreamEntryRouteProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { addDream, updateDream, getDream } = useDreamStore();

  // Form state
  const [title, setTitle] = useState('');
  const [narrative, setNarrative] = useState('');
  const [lucidity, setLucidity] = useState(5);
  const [vividness, setVividness] = useState(5);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [sleepDuration, setSleepDuration] = useState(8); // hours
  const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>([]);
  const [lifeTags, setLifeTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isQuickCapture, setIsQuickCapture] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [voiceRecordingUri, setVoiceRecordingUri] = useState<string | null>(null);

  const isEditing = route.params?.dreamId !== undefined;
  const editingDream = isEditing ? getDream(route.params.dreamId!) : null;

  // Load existing dream data if editing
  useEffect(() => {
    if (editingDream) {
      setTitle(editingDream.title);
      setNarrative(editingDream.narrative);
      setLucidity(editingDream.lucidity);
      setVividness(editingDream.vividness);
      setSleepQuality(editingDream.sleepQuality);
      setSleepDuration(Math.round(editingDream.sleepDuration / 60)); // convert minutes to hours
      setSelectedEmotions(editingDream.emotions);
      setLifeTags(editingDream.lifeTags);
      setVoiceRecordingUri(editingDream.voiceRecordingUri || null);
      setIsQuickCapture(false);
    }
  }, [editingDream]);

  const emotionCategories: { category: EmotionCategory; emotions: string[]; color: string }[] = [
    { category: 'joy', emotions: ['Happy', 'Excited', 'Peaceful', 'Grateful'], color: '#10b981' },
    { category: 'fear', emotions: ['Scared', 'Anxious', 'Worried', 'Terrified'], color: '#ef4444' },
    { category: 'sadness', emotions: ['Sad', 'Lonely', 'Melancholy', 'Grief'], color: '#3b82f6' },
    { category: 'anger', emotions: ['Angry', 'Frustrated', 'Irritated', 'Rage'], color: '#f59e0b' },
    { category: 'surprise', emotions: ['Surprised', 'Shocked', 'Amazed', 'Bewildered'], color: '#8b5cf6' },
    { category: 'trust', emotions: ['Trusting', 'Safe', 'Confident', 'Secure'], color: '#06b6d4' },
  ];

  const commonLifeTags = [
    'work-stress', 'relationship', 'family', 'health', 'creativity',
    'travel', 'anxiety', 'change', 'growth', 'healing'
  ];

  const generateAutoTitle = (text: string): string => {
    if (!text) return 'Untitled Dream';
    
    const words = text.split(' ').slice(0, 4);
    let title = words.join(' ');
    if (title.length > 30) {
      title = title.substring(0, 30) + '...';
    }
    return title || 'Untitled Dream';
  };

  const extractSimpleSymbols = (text: string): string[] => {
    const commonSymbols = [
      'water', 'flying', 'falling', 'animals', 'house', 'car', 'people',
      'death', 'school', 'work', 'family', 'friends', 'chase', 'lost',
      'naked', 'teeth', 'fire', 'ocean', 'forest', 'mountain', 'snake',
      'dog', 'cat', 'bird', 'baby', 'wedding', 'money', 'phone'
    ];
    
    const lowerText = text.toLowerCase();
    return commonSymbols.filter(symbol => 
      lowerText.includes(symbol) || lowerText.includes(symbol + 's')
    );
  };

  const handleQuickSave = async () => {
    if (!narrative.trim() && !voiceRecordingUri) {
      Alert.alert('Dream Required', 'Please enter your dream or record a voice note before saving.');
      return;
    }

    setIsSaving(true);
    
    try {
      const dreamData = {
        title: title || generateAutoTitle(narrative),
        narrative: narrative.trim(),
        emotions: selectedEmotions,
        symbols: extractSimpleSymbols(narrative),
        lucidity,
        vividness,
        sleepQuality,
        date: new Date(),
        wakeUpTime: new Date(),
        sleepDuration: sleepDuration * 60, // convert hours to minutes
        lifeTags,
        voiceRecordingUri,
        status: 'draft' as const,
      };

      if (isEditing && editingDream) {
        updateDream(editingDream.id, dreamData);
      } else {
        addDream(dreamData);
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save dream. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDetailedSave = async () => {
    if (!narrative.trim() && !voiceRecordingUri) {
      Alert.alert('Dream Required', 'Please enter your dream narrative or record a voice note before saving.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your dream.');
      return;
    }

    setIsSaving(true);
    
    try {
      const dreamData = {
        title: title.trim(),
        narrative: narrative.trim(),
        emotions: selectedEmotions,
        symbols: extractSimpleSymbols(narrative),
        lucidity,
        vividness,
        sleepQuality,
        date: new Date(),
        wakeUpTime: new Date(),
        sleepDuration: sleepDuration * 60, // convert hours to minutes
        lifeTags,
        voiceRecordingUri,
        status: 'complete' as const,
      };

      if (isEditing && editingDream) {
        updateDream(editingDream.id, dreamData);
      } else {
        addDream(dreamData);
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save dream. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEmotion = (emotionName: string, category: EmotionCategory) => {
    const existingIndex = selectedEmotions.findIndex(e => e.name === emotionName);
    
    if (existingIndex >= 0) {
      setSelectedEmotions(prev => prev.filter((_, index) => index !== existingIndex));
    } else {
      const newEmotion: Emotion = {
        id: Date.now().toString(),
        name: emotionName,
        intensity: 7, // default intensity
        category,
      };
      setSelectedEmotions(prev => [...prev, newEmotion]);
    }
  };

  const toggleLifeTag = (tag: string) => {
    if (lifeTags.includes(tag)) {
      setLifeTags(prev => prev.filter(t => t !== tag));
    } else {
      setLifeTags(prev => [...prev, tag]);
    }
  };

  const addCustomLifeTag = () => {
    if (customTag.trim() && !lifeTags.includes(customTag.trim())) {
      setLifeTags(prev => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  const renderSlider = (
    label: string,
    value: number,
    setValue: (value: number) => void,
    min: number = 0,
    max: number = 10
  ) => (
    <View style={styles.sliderContainer}>
      <Text style={[styles.sliderLabel, { color: isDark ? '#ffffff' : '#000000' }]}>
        {label}: {value}/{max}
      </Text>
      <View style={styles.sliderTrack}>
        {[...Array(max - min + 1)].map((_, index) => {
          const sliderValue = min + index;
          return (
            <TouchableOpacity
              key={sliderValue}
              style={[
                styles.sliderDot,
                {
                  backgroundColor: sliderValue <= value ? '#6366f1' : (isDark ? '#374151' : '#e5e7eb'),
                },
              ]}
              onPress={() => setValue(sliderValue)}
            />
          );
        })}
      </View>
    </View>
  );

  if (isQuickCapture) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.quickCaptureHeader}>
            <Text style={[styles.quickTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              What did you dream about?
            </Text>
            <Text style={[styles.quickSubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Capture the essence while it's fresh in your mind
            </Text>
          </View>

          <View style={styles.quickInputContainer}>
            <TextInput
              style={[
                styles.quickTextInput,
                {
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000',
                },
              ]}
              placeholder="I dreamed about..."
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={narrative}
              onChangeText={setNarrative}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </View>

          <View style={styles.voiceRecorderContainer}>
            <VoiceRecorder
              onRecordingComplete={(uri) => setVoiceRecordingUri(uri)}
              onRecordingClear={() => setVoiceRecordingUri(null)}
            />
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.detailsButton, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}
              onPress={() => setIsQuickCapture(false)}
            >
              <Ionicons name="create-outline" size={20} color={isDark ? '#ffffff' : '#000000'} />
              <Text style={[styles.detailsButtonText, { color: isDark ? '#ffffff' : '#000000' }]}>
                Add Details
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, { opacity: (narrative.trim() || voiceRecordingUri) ? 1 : 0.5 }]}
              onPress={handleQuickSave}
              disabled={(!narrative.trim() && !voiceRecordingUri) || isSaving}
            >
              {isSaving ? (
                <Ionicons name="hourglass-outline" size={20} color="#ffffff" />
              ) : (
                <Ionicons name="save-outline" size={20} color="#ffffff" />
              )}
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Quick Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.detailedContainer}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Dream Title
            </Text>
            <TextInput
              style={[
                styles.titleInput,
                {
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000',
                },
              ]}
              placeholder="Give your dream a title..."
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Dream Narrative
            </Text>
            <TextInput
              style={[
                styles.narrativeInput,
                {
                  backgroundColor: isDark ? '#1f2937' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000',
                },
              ]}
              placeholder="Describe your dream in detail..."
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              value={narrative}
              onChangeText={setNarrative}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Dream Quality
            </Text>
            {renderSlider('Lucidity', lucidity, setLucidity)}
            {renderSlider('Vividness', vividness, setVividness)}
            {renderSlider('Sleep Quality', sleepQuality, setSleepQuality)}
            {renderSlider('Sleep Duration (hours)', sleepDuration, setSleepDuration, 1, 12)}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Emotions Present
            </Text>
            {emotionCategories.map(({ category, emotions, color }) => (
              <View key={category} style={styles.emotionCategory}>
                <Text style={[styles.emotionCategoryTitle, { color }]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                <View style={styles.emotionTags}>
                  {emotions.map(emotion => (
                    <TouchableOpacity
                      key={emotion}
                      style={[
                        styles.emotionTag,
                        {
                          backgroundColor: selectedEmotions.some(e => e.name === emotion)
                            ? color
                            : (isDark ? '#374151' : '#e5e7eb'),
                        },
                      ]}
                      onPress={() => toggleEmotion(emotion, category)}
                    >
                      <Text
                        style={[
                          styles.emotionTagText,
                          {
                            color: selectedEmotions.some(e => e.name === emotion)
                              ? '#ffffff'
                              : (isDark ? '#ffffff' : '#000000'),
                          },
                        ]}
                      >
                        {emotion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Life Context
            </Text>
            <View style={styles.lifeTags}>
              {commonLifeTags.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.lifeTag,
                    {
                      backgroundColor: lifeTags.includes(tag)
                        ? '#6366f1'
                        : (isDark ? '#374151' : '#e5e7eb'),
                    },
                  ]}
                  onPress={() => toggleLifeTag(tag)}
                >
                  <Text
                    style={[
                      styles.lifeTagText,
                      {
                        color: lifeTags.includes(tag)
                          ? '#ffffff'
                          : (isDark ? '#ffffff' : '#000000'),
                      },
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.customTagContainer}>
              <TextInput
                style={[
                  styles.customTagInput,
                  {
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    color: isDark ? '#ffffff' : '#000000',
                  },
                ]}
                placeholder="Add custom life context..."
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                value={customTag}
                onChangeText={setCustomTag}
                onSubmitEditing={addCustomLifeTag}
              />
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={addCustomLifeTag}
                disabled={!customTag.trim()}
              >
                <Ionicons name="add" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Voice Recording
            </Text>
            <VoiceRecorder
              onRecordingComplete={(uri) => setVoiceRecordingUri(uri)}
              onRecordingClear={() => setVoiceRecordingUri(null)}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}
              onPress={() => setIsQuickCapture(true)}
            >
              <Text style={[styles.backButtonText, { color: isDark ? '#ffffff' : '#000000' }]}>
                Quick Mode
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, { opacity: ((narrative.trim() || voiceRecordingUri) && title.trim()) ? 1 : 0.5 }]}
              onPress={handleDetailedSave}
              disabled={(!narrative.trim() && !voiceRecordingUri) || !title.trim() || isSaving}
            >
              {isSaving ? (
                <Ionicons name="hourglass-outline" size={20} color="#ffffff" />
              ) : (
                <Ionicons name="save-outline" size={20} color="#ffffff" />
              )}
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : (isEditing ? 'Update Dream' : 'Save Dream')}
              </Text>
            </TouchableOpacity>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  quickCaptureHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  quickTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  quickSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  quickInputContainer: {
    flex: 1,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  voiceRecorderContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickTextInput: {
    flex: 1,
    fontSize: 18,
    lineHeight: 26,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  detailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  detailsButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailedContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  titleInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  narrativeInput: {
    fontSize: 16,
    minHeight: 120,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sliderTrack: {
    flexDirection: 'row',
    gap: 4,
  },
  sliderDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  emotionCategory: {
    marginBottom: 16,
  },
  emotionCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  emotionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emotionTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  emotionTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lifeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  lifeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  lifeTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customTagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  customTagInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  addTagButton: {
    backgroundColor: '#6366f1',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DreamEntryScreen;