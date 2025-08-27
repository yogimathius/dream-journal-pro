import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface VoicePlaybackProps {
  uri: string;
}

const VoicePlayback: React.FC<VoicePlaybackProps> = ({ uri }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [position, setPosition] = useState<number>(0);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadAndPlaySound = async () => {
    try {
      setIsLoading(true);
      
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false, isLooping: false }
      );

      setSound(newSound);

      // Get duration
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis || null);
      }

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis || 0);
          
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
          }
        }
      });

      await newSound.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error loading/playing sound:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pauseSound = async () => {
    try {
      if (sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Error pausing sound:', error);
    }
  };

  const resumeSound = async () => {
    try {
      if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error resuming sound:', error);
    }
  };

  const stopSound = async () => {
    try {
      if (sound) {
        await sound.stopAsync();
        setIsPlaying(false);
        setPosition(0);
      }
    } catch (error) {
      console.error('Error stopping sound:', error);
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!duration || duration === 0) return 0;
    return (position / duration) * 100;
  };

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.playButton, styles.primaryButton]}
          onPress={isPlaying ? pauseSound : (sound ? resumeSound : loadAndPlaySound)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Ionicons name="hourglass-outline" size={24} color="#ffffff" />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={24}
              color="#ffffff"
            />
          )}
        </TouchableOpacity>

        {sound && (
          <TouchableOpacity
            style={[styles.controlButton, styles.secondaryButton]}
            onPress={stopSound}
          >
            <Ionicons name="stop" size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={[styles.timeText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            {formatTime(position)}
          </Text>
          {duration && (
            <Text style={[styles.timeText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              {formatTime(duration)}
            </Text>
          )}
        </View>
        
        {duration && (
          <View style={[styles.progressBar, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${getProgressPercentage()}%`,
                  backgroundColor: '#6366f1',
                },
              ]}
            />
          </View>
        )}
      </View>

      <Text style={[styles.statusText, { color: isDark ? '#d1d5db' : '#374151' }]}>
        {isLoading
          ? 'Loading recording...'
          : isPlaying
          ? 'Playing voice recording'
          : sound
          ? 'Recording ready to play'
          : 'Tap play to listen to voice recording'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#10b981',
  },
  secondaryButton: {
    backgroundColor: '#6b7280',
  },
  progressContainer: {
    width: '100%',
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default VoicePlayback;