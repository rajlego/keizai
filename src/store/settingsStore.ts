import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { KeizaiSettings } from '../models/types';
import { DEFAULT_SETTINGS } from '../models/types';

interface SettingsState extends KeizaiSettings {
  setTheme: (theme: KeizaiSettings['theme']) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setAggressiveNotifications: (enabled: boolean) => void;
  setCloudSyncEnabled: (enabled: boolean) => void;
  setFalApiKey: (key: string) => void;
  setBaseInterestRate: (rate: number) => void;
  setStartingBalance: (balance: number) => void;
  setStartingCreditScore: (score: number) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => set({ theme }),

      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      setAggressiveNotifications: (enabled) => set({ aggressiveNotifications: enabled }),

      setCloudSyncEnabled: (enabled) => set({ cloudSyncEnabled: enabled }),

      setFalApiKey: (key) => set({ falApiKey: key }),

      setBaseInterestRate: (rate) => set({ baseInterestRate: rate }),

      setStartingBalance: (balance) => set({ startingBalance: balance }),

      setStartingCreditScore: (score) => set({ startingCreditScore: score }),

      resetToDefaults: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'keizai-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
