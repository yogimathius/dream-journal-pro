import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import VoiceRecorder from '../../components/VoiceRecorder';
import { Audio } from 'expo-av';

// Mock expo-av
jest.mock('expo-av');
const mockAudio = Audio as jest.Mocked<typeof Audio>;

describe('VoiceRecorder', () => {
  const mockOnRecordingComplete = jest.fn();
  const mockOnRecordingStart = jest.fn();
  const mockOnRecordingStop = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Audio mocks
    mockAudio.Recording.createAsync = jest.fn().mockResolvedValue({
      recording: {
        startAsync: jest.fn().mockResolvedValue(undefined),
        stopAndUnloadAsync: jest.fn().mockResolvedValue({ uri: 'mock-recording-uri' }),
        getURI: jest.fn().mockReturnValue('mock-recording-uri'),
      },
      status: { canRecord: true },
    });
    mockAudio.setAudioModeAsync = jest.fn().mockResolvedValue(undefined);
  });

  it('renders voice recorder component', () => {
    render(
      <VoiceRecorder
        onRecordingComplete={mockOnRecordingComplete}
        onRecordingStart={mockOnRecordingStart}
        onRecordingStop={mockOnRecordingStop}
      />
    );

    expect(screen.getByTestId('voice-recorder')).toBeTruthy();
  });

  it('starts recording when record button is pressed', async () => {
    render(
      <VoiceRecorder
        onRecordingComplete={mockOnRecordingComplete}
        onRecordingStart={mockOnRecordingStart}
        onRecordingStop={mockOnRecordingStop}
      />
    );

    const recordButton = screen.getByTestId('record-button');
    fireEvent.press(recordButton);

    await waitFor(() => {
      expect(mockOnRecordingStart).toHaveBeenCalled();
    });

    expect(mockAudio.setAudioModeAsync).toHaveBeenCalled();
    expect(mockAudio.Recording.createAsync).toHaveBeenCalled();
  });

  it('stops recording when stop button is pressed', async () => {
    render(
      <VoiceRecorder
        onRecordingComplete={mockOnRecordingComplete}
        onRecordingStart={mockOnRecordingStart}
        onRecordingStop={mockOnRecordingStop}
      />
    );

    // Start recording first
    const recordButton = screen.getByTestId('record-button');
    fireEvent.press(recordButton);

    await waitFor(() => {
      expect(mockOnRecordingStart).toHaveBeenCalled();
    });

    // Stop recording
    const stopButton = screen.getByTestId('stop-button');
    fireEvent.press(stopButton);

    await waitFor(() => {
      expect(mockOnRecordingStop).toHaveBeenCalled();
      expect(mockOnRecordingComplete).toHaveBeenCalledWith('mock-recording-uri');
    });
  });

  it('handles recording errors gracefully', async () => {
    // Mock an error in recording
    mockAudio.Recording.createAsync = jest.fn().mockRejectedValue(new Error('Recording failed'));

    render(
      <VoiceRecorder
        onRecordingComplete={mockOnRecordingComplete}
        onRecordingStart={mockOnRecordingStart}
        onRecordingStop={mockOnRecordingStop}
      />
    );

    const recordButton = screen.getByTestId('record-button');
    fireEvent.press(recordButton);

    await waitFor(() => {
      // Should show error message
      expect(screen.getByText(/recording failed/i)).toBeTruthy();
    });
  });

  it('shows recording duration', async () => {
    render(
      <VoiceRecorder
        onRecordingComplete={mockOnRecordingComplete}
        onRecordingStart={mockOnRecordingStart}
        onRecordingStop={mockOnRecordingStop}
      />
    );

    const recordButton = screen.getByTestId('record-button');
    fireEvent.press(recordButton);

    await waitFor(() => {
      expect(screen.getByTestId('recording-duration')).toBeTruthy();
    });
  });
});