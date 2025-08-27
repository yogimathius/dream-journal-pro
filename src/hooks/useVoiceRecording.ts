import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

interface UseVoiceRecordingReturn {
  isRecording: boolean;
  isPaused: boolean;
  recordingDuration: number;
  recordingUri: string | null;
  startRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
  playRecording: () => Promise<void>;
  stopPlayback: () => Promise<void>;
  isPlaying: boolean;
}

export const useVoiceRecording = (): UseVoiceRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to record dreams.');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create recording
      const recording = new Audio.Recording();
      recordingRef.current = recording;

      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm;codecs=opus',
          bitsPerSecond: 128000,
        },
      };

      await recording.prepareToRecordAsync(recordingOptions);
      await recording.startAsync();
      
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      
      // Start duration tracking
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const pauseRecording = async () => {
    try {
      if (recordingRef.current && isRecording && !isPaused) {
        await recordingRef.current.pauseAsync();
        setIsPaused(true);
        
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
      }
    } catch (error) {
      console.error('Failed to pause recording:', error);
    }
  };

  const resumeRecording = async () => {
    try {
      if (recordingRef.current && isRecording && isPaused) {
        await recordingRef.current.startAsync();
        setIsPaused(false);
        
        // Resume duration tracking
        durationIntervalRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to resume recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      if (recordingRef.current && isRecording) {
        await recordingRef.current.stopAndUnloadAsync();
        const uri = recordingRef.current.getURI();
        
        setIsRecording(false);
        setIsPaused(false);
        setRecordingUri(uri);
        
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        
        recordingRef.current = null;
        
        // Reset audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
    }
  };

  const clearRecording = () => {
    setRecordingUri(null);
    setRecordingDuration(0);
    setIsRecording(false);
    setIsPaused(false);
    setIsPlaying(false);
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    if (soundRef.current) {
      soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  const playRecording = async () => {
    try {
      if (recordingUri && !isPlaying) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: recordingUri },
          { shouldPlay: true }
        );
        
        soundRef.current = sound;
        setIsPlaying(true);
        
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
            soundRef.current = null;
          }
        });
      }
    } catch (error) {
      console.error('Failed to play recording:', error);
      Alert.alert('Playback Error', 'Failed to play recording.');
    }
  };

  const stopPlayback = async () => {
    try {
      if (soundRef.current && isPlaying) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  };

  return {
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
  };
};