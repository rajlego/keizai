/**
 * Voice Service using ElevenLabs TTS
 * Provides text-to-speech for battle dialogue
 */

// ElevenLabs API endpoint
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Default voice settings
const DEFAULT_VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.5,
  use_speaker_boost: true,
};

// Voice IDs for different archetypes
export const ARCHETYPE_VOICES: Record<string, string> = {
  // These are ElevenLabs default voice IDs - users may need to configure their own
  saber: 'EXAVITQu4vr4xnSDxMaL', // Rachel - clear, commanding
  archer: 'TxGEqnHWrfWFTfGW9XjX', // Josh - calm, measured
  lancer: 'VR6AewLTigWG4xSOukaG', // Arnold - energetic
  caster: 'pNInz6obpgDQGcFmaJgB', // Adam - wise, gentle
  rider: 'ODq5zmih8GrVes37Dizd', // Patrick - adventurous
  assassin: 'yoZ06aMxZJJ28mfd3POQ', // Sam - quiet, precise
  berserker: '2EiwWnXFnvU5JabPnv8n', // Clyde - intense
  shielder: 'jBpfuIE2acCO8z3wKNLl', // Gigi - warm, reassuring
  ruler: 'onwK4e9ZLuTAKqWW03F9', // Daniel - authoritative
  villain: 'N2lVS1w4EtoT3dr4eOWO', // Callum - dramatic, intense
};

/**
 * Voice synthesis result
 */
export interface VoiceResult {
  success: boolean;
  audioBlob?: Blob;
  audioUrl?: string;
  error?: string;
}

/**
 * Generate speech from text using ElevenLabs
 *
 * @param text - The text to convert to speech
 * @param voiceId - ElevenLabs voice ID to use
 * @param apiKey - ElevenLabs API key
 * @returns Audio data or error
 */
export async function textToSpeech(
  text: string,
  voiceId: string,
  apiKey: string
): Promise<VoiceResult> {
  if (!apiKey) {
    return {
      success: false,
      error: 'ElevenLabs API key not configured',
    };
  }

  if (!text.trim()) {
    return {
      success: false,
      error: 'No text provided',
    };
  }

  try {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: DEFAULT_VOICE_SETTINGS,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Voice] API error: ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `API error: ${response.status} - ${response.statusText}`,
      };
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    return {
      success: true,
      audioBlob,
      audioUrl,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Voice] TTS failed: ${errorMessage}`);
    return {
      success: false,
      error: `TTS failed: ${errorMessage}`,
    };
  }
}

/**
 * Get the appropriate voice ID for a character archetype
 *
 * @param archetype - The character archetype or 'villain'
 * @param customVoiceId - Optional custom voice ID to use instead
 * @returns The ElevenLabs voice ID
 */
export function getVoiceId(
  archetype: string | undefined,
  customVoiceId?: string
): string {
  if (customVoiceId) {
    return customVoiceId;
  }

  if (archetype && archetype in ARCHETYPE_VOICES) {
    return ARCHETYPE_VOICES[archetype];
  }

  // Default to a neutral voice
  return ARCHETYPE_VOICES.caster;
}

/**
 * Play audio from a URL
 *
 * @param url - The audio URL to play
 * @param volume - Volume level (0-1)
 * @returns Promise that resolves when audio finishes or fails
 */
export function playAudio(url: string, volume = 1.0): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.volume = Math.max(0, Math.min(1, volume));

    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Audio playback failed'));
    };

    audio.play().catch(reject);
  });
}

/**
 * Check if voice synthesis is available
 *
 * @param apiKey - The ElevenLabs API key to check
 * @returns True if the API key is set
 */
export function isVoiceAvailable(apiKey?: string): boolean {
  return Boolean(apiKey && apiKey.trim().length > 0);
}

/**
 * Generate and play speech
 * Convenience function that combines TTS and playback
 *
 * @param text - The text to speak
 * @param archetype - Character archetype for voice selection
 * @param apiKey - ElevenLabs API key
 * @param volume - Playback volume (0-1)
 * @returns Success status
 */
export async function speak(
  text: string,
  archetype: string | undefined,
  apiKey: string,
  volume = 1.0
): Promise<boolean> {
  const voiceId = getVoiceId(archetype);
  const result = await textToSpeech(text, voiceId, apiKey);

  if (!result.success || !result.audioUrl) {
    console.error('[Voice] Failed to generate speech:', result.error);
    return false;
  }

  try {
    await playAudio(result.audioUrl, volume);
    return true;
  } catch (error) {
    console.error('[Voice] Playback failed:', error);
    return false;
  }
}

/**
 * Get available ElevenLabs voices
 * Requires API key to list custom/cloned voices
 *
 * @param apiKey - ElevenLabs API key
 * @returns List of available voices
 */
export async function getAvailableVoices(
  apiKey: string
): Promise<Array<{ voice_id: string; name: string }>> {
  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      console.error(`[Voice] Failed to get voices: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.voices ?? [];
  } catch (error) {
    console.error('[Voice] Failed to get voices:', error);
    return [];
  }
}
