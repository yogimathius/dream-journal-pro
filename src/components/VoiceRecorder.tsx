import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVoiceRecording } from '../hooks/useVoiceRecording';

interface VoiceRecorderProps {
  onRecordingComplete?: (uri: string) => void;
  onRecordingClear?: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onRecordingClear,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const {
    isRecording,
    isPaused,
    recordingDuration,
    recordingUri,
    isPlaying,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecording,
    playRecording,
    stopPlayback,
  } = useVoiceRecording();

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStopRecording = async () => {
    await stopRecording();
    if (recordingUri) {
      onRecordingComplete?.(recordingUri);
    }
  };

  const handleClearRecording = () => {
    clearRecording();
    onRecordingClear?.();
  };

  const RecordingButton = () => {
    if (!isRecording && !recordingUri) {
      return (
        <TouchableOpacity
          style={[styles.recordButton, styles.startButton]}
          onPress={startRecording}
        >
          <Ionicons name="mic" size={32} color="#ffffff" />
        </TouchableOpacity>
      );
    }

    if (isRecording) {
      return (
        <View style={styles.recordingControls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.pauseButton]}
            onPress={isPaused ? resumeRecording : pauseRecording}
          >
            <Ionicons
              name={isPaused ? 'play' : 'pause'}
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>
          
          <View style={styles.recordingInfo}>
            <View style={styles.recordingIndicator}>
              <View style={[styles.recordingDot, { opacity: isPaused ? 0.5 : 1 }]} />
              <Text style={[styles.recordingText, { color: isDark ? '#ffffff' : '#000000' }]}>
                {isPaused ? 'PAUSED' : 'RECORDING'}
              </Text>
            </View>
            <Text style={[styles.durationText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              {formatDuration(recordingDuration)}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.stopButton]}
            onPress={handleStopRecording}
          >
            <Ionicons name="stop" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      );
    }

    if (recordingUri) {
      return (
        <View style={styles.playbackControls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.playButton]}
            onPress={isPlaying ? stopPlayback : playRecording}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>
          
          <View style={styles.playbackInfo}>
            <Text style={[styles.playbackText, { color: isDark ? '#ffffff' : '#000000' }]}>
              Voice recording ready
            </Text>
            <Text style={[styles.durationText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              {formatDuration(recordingDuration)}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.deleteButton]}
            onPress={handleClearRecording}
          >
            <Ionicons name="trash-outline" size={20} color="#ffffff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.recordAgainButton]}
            onPress={() => {
              handleClearRecording();
              startRecording();
            }}
          >
            <Ionicons name="refresh" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
      <View style={styles.header}>
        <Ionicons
          name="mic-outline"
          size={20}
          color="#6366f1"
          style={styles.headerIcon}
        />
        <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          Voice Recording
        </Text>
      </View>
      
      <RecordingButton />
      
      {!isRecording && !recordingUri && (
        <Text style={[styles.instructionText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
          Tap the microphone to record your dream
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#ef4444',
  },
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
  },
  stopButton: {
    backgroundColor: '#6b7280',
  },
  playButton: {
    backgroundColor: '#10b981',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  recordAgainButton: {
    backgroundColor: '#6366f1',
  },
  recordingInfo: {
    alignItems: 'center',
    minWidth: 120,
  },
  playbackInfo: {
    alignItems: 'center',
    minWidth: 120,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  recordingText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  playbackText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default VoiceRecorder;