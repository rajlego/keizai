import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { KeizaiSettings, GameStyle } from '../models/types';
import { DEFAULT_SETTINGS } from '../models/types';

interface SettingsState extends KeizaiSettings {
  // Appearance
  setTheme: (theme: KeizaiSettings['theme']) => void;

  // Notifications
  setNotificationsEnabled: (enabled: boolean) => void;
  setAggressiveNotifications: (enabled: boolean) => void;

  // Sync
  setCloudSyncEnabled: (enabled: boolean) => void;

  // API Keys
  setFalApiKey: (key: string) => void;
  setClaudeApiKey: (key: string) => void;
  setElevenLabsApiKey: (key: string) => void;

  // Voice
  setVoiceEnabled: (enabled: boolean) => void;
  setVoiceVolume: (volume: number) => void;

  // General update
  updateSettings: (settings: Partial<KeizaiSettings>) => void;

  // Economy
  setBaseInterestRate: (rate: number) => void;
  setStartingBalance: (balance: number) => void;
  setStartingCreditScore: (score: number) => void;

  // Game Settings
  setGameStyle: (style: GameStyle) => void;
  setAutoGeneratePersonalities: (enabled: boolean) => void;
  setShowRelationshipLevels: (enabled: boolean) => void;
  setEnablePartInitiatedConversations: (enabled: boolean) => void;
  setNarratorEnabled: (enabled: boolean) => void;

  // Reset
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      // Appearance
      setTheme: (theme) => set({ theme }),

      // Notifications
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setAggressiveNotifications: (enabled) => set({ aggressiveNotifications: enabled }),

      // Sync
      setCloudSyncEnabled: (enabled) => set({ cloudSyncEnabled: enabled }),

      // API Keys
      setFalApiKey: (key) => set({ falApiKey: key }),
      setClaudeApiKey: (key) => set({ claudeApiKey: key }),
      setElevenLabsApiKey: (key) => set({ elevenLabsApiKey: key }),

      // Voice
      setVoiceEnabled: (enabled) => set({ voiceEnabled: enabled }),
      setVoiceVolume: (volume) => set({ voiceVolume: volume }),

      // General update
      updateSettings: (settings) => set(settings),

      // Economy
      setBaseInterestRate: (rate) => set({ baseInterestRate: rate }),
      setStartingBalance: (balance) => set({ startingBalance: balance }),
      setStartingCreditScore: (score) => set({ startingCreditScore: score }),

      // Game Settings
      setGameStyle: (style) => set({ gameStyle: style }),
      setAutoGeneratePersonalities: (enabled) => set({ autoGeneratePersonalities: enabled }),
      setShowRelationshipLevels: (enabled) => set({ showRelationshipLevels: enabled }),
      setEnablePartInitiatedConversations: (enabled) => set({ enablePartInitiatedConversations: enabled }),
      setNarratorEnabled: (enabled) => set({ narratorEnabled: enabled }),

      // Reset
      resetToDefaults: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'keizai-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
