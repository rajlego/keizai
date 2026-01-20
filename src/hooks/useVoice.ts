import { useState, useCallback, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import {
  textToSpeech,
  getVoiceId,
  isVoiceAvailable,
} from '../services/voice';

interface UseVoiceOptions {
  volume?: number;
  autoPlay?: boolean;
}

interface VoiceState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for using ElevenLabs TTS in components
 *
 * @param options - Voice options
 * @returns Voice state and methods
 */
export function useVoice(options: UseVoiceOptions = {}) {
  const { volume = 1.0 } = options;

  const [state, setState] = useState<VoiceState>({
    isPlaying: false,
    isLoading: false,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const elevenLabsApiKey = useSettingsStore((state) => state.elevenLabsApiKey);
  const voiceEnabled = useSettingsStore((state) => state.voiceEnabled);

  // Check if voice is available
  const available = voiceEnabled && isVoiceAvailable(elevenLabsApiKey);

  // Stop current audio
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setState(s => ({ ...s, isPlaying: false }));
  }, []);

  // Speak text
  const speak = useCallback(async (
    text: string,
    archetype?: string,
    customVoiceId?: string
  ): Promise<boolean> => {
    if (!available || !elevenLabsApiKey) {
      return false;
    }

    // Stop any current audio
    stop();

    setState({ isPlaying: false, isLoading: true, error: null });

    try {
      const voiceId = getVoiceId(archetype, customVoiceId);
      const result = await textToSpeech(text, voiceId, elevenLabsApiKey);

      if (!result.success || !result.audioUrl) {
        setState({ isPlaying: false, isLoading: false, error: result.error ?? 'Unknown error' });
        return false;
      }

      // Create audio element
      const audio = new Audio(result.audioUrl);
      audio.volume = volume;
      audioRef.current = audio;

      // Set up event listeners
      audio.onplay = () => {
        setState(s => ({ ...s, isPlaying: true, isLoading: false }));
      };

      audio.onended = () => {
        URL.revokeObjectURL(result.audioUrl!);
        audioRef.current = null;
        setState(s => ({ ...s, isPlaying: false }));
      };

      audio.onerror = () => {
        URL.revokeObjectURL(result.audioUrl!);
        audioRef.current = null;
        setState({ isPlaying: false, isLoading: false, error: 'Playback failed' });
      };

      // Start playback
      await audio.play();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ isPlaying: false, isLoading: false, error: errorMessage });
      return false;
    }
  }, [available, elevenLabsApiKey, volume, stop]);

  // Set volume on current audio
  const setVolume = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume));
    }
  }, []);

  return {
    // State
    isPlaying: state.isPlaying,
    isLoading: state.isLoading,
    error: state.error,
    available,

    // Actions
    speak,
    stop,
    setVolume,
  };
}

/**
 * Hook for managing voice settings
 */
export function useVoiceSettings() {
  const elevenLabsApiKey = useSettingsStore((state) => state.elevenLabsApiKey);
  const voiceEnabled = useSettingsStore((state) => state.voiceEnabled);
  const voiceVolume = useSettingsStore((state) => state.voiceVolume);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  const setApiKey = useCallback((key: string) => {
    updateSettings({ elevenLabsApiKey: key });
  }, [updateSettings]);

  const setVoiceEnabled = useCallback((enabled: boolean) => {
    updateSettings({ voiceEnabled: enabled });
  }, [updateSettings]);

  const setVoiceVolume = useCallback((volume: number) => {
    updateSettings({ voiceVolume: Math.max(0, Math.min(1, volume)) });
  }, [updateSettings]);

  return {
    apiKey: elevenLabsApiKey,
    enabled: voiceEnabled,
    volume: voiceVolume,
    isConfigured: isVoiceAvailable(elevenLabsApiKey),
    setApiKey,
    setVoiceEnabled,
    setVoiceVolume,
  };
}
