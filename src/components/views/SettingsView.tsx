import { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { Card, Button, Modal } from '../common';
import { getAllParts, getAllCommitments, getAllTransactions, getCentralBank, clearAllData, addPart, addCommitment, addTransaction, updateCentralBank } from '../../sync/yjsProvider';
import { isFirebaseConfigured } from '../../sync/firebaseConfig';
import { startSync, stopSync, onSyncStatusChange, type SyncStatus } from '../../sync/firebaseSync';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, onAuthStateChanged, parseAuthError, type User } from '../../services/auth';
import type { Part, Commitment, Transaction, CentralBank, KeizaiSettings } from '../../models/types';

interface ExportData {
  version: number;
  exportedAt: string;
  parts: Part[];
  commitments: Commitment[];
  transactions: Transaction[];
  centralBank: CentralBank;
  settings: Partial<KeizaiSettings>;
}

export function SettingsView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Auth and sync state
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const firebaseConfigured = isFirebaseConfigured();

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged((newUser) => {
      setUser(newUser);
      if (newUser && cloudSyncEnabled) {
        startSync(newUser.uid);
      } else {
        stopSync();
      }
    });
    return unsubscribe;
  }, []);

  // Subscribe to sync status changes
  useEffect(() => {
    const unsubscribe = onSyncStatusChange(setSyncStatus);
    return unsubscribe;
  }, []);

  // Settings store
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const aggressiveNotifications = useSettingsStore((state) => state.aggressiveNotifications);
  const cloudSyncEnabled = useSettingsStore((state) => state.cloudSyncEnabled);
  const startingBalance = useSettingsStore((state) => state.startingBalance);
  const startingCreditScore = useSettingsStore((state) => state.startingCreditScore);
  const baseInterestRate = useSettingsStore((state) => state.baseInterestRate);
  const falApiKey = useSettingsStore((state) => state.falApiKey);
  const theme = useSettingsStore((state) => state.theme);

  const setNotificationsEnabled = useSettingsStore((state) => state.setNotificationsEnabled);
  const setAggressiveNotifications = useSettingsStore((state) => state.setAggressiveNotifications);
  const setCloudSyncEnabled = useSettingsStore((state) => state.setCloudSyncEnabled);
  const setStartingBalance = useSettingsStore((state) => state.setStartingBalance);
  const setStartingCreditScore = useSettingsStore((state) => state.setStartingCreditScore);
  const setBaseInterestRate = useSettingsStore((state) => state.setBaseInterestRate);
  const setFalApiKey = useSettingsStore((state) => state.setFalApiKey);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const resetToDefaults = useSettingsStore((state) => state.resetToDefaults);

  // Auth handlers
  const handleSignIn = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithEmail(email, password);
      setEmail('');
      setPassword('');
    } catch (err) {
      setAuthError(parseAuthError(err));
    }
    setAuthLoading(false);
  };

  const handleSignUp = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signUpWithEmail(email, password);
      setEmail('');
      setPassword('');
    } catch (err) {
      setAuthError(parseAuthError(err));
    }
    setAuthLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(parseAuthError(err));
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    stopSync();
  };

  const handleSyncToggle = () => {
    const newValue = !cloudSyncEnabled;
    setCloudSyncEnabled(newValue);
    if (newValue && user) {
      startSync(user.uid);
    } else {
      stopSync();
    }
  };

  // Export data to JSON
  const handleExport = () => {
    const data: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      parts: getAllParts(),
      commitments: getAllCommitments(),
      transactions: getAllTransactions(),
      centralBank: getCentralBank(),
      settings: {
        startingBalance,
        startingCreditScore,
        baseInterestRate,
        notificationsEnabled,
        aggressiveNotifications,
        theme,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keizai-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import data from JSON
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);

      // Validate - support both old (loans) and new (commitments) formats
      if (!data.version || !data.parts || (!data.commitments && !(data as unknown as { loans: unknown[] }).loans) || !data.transactions) {
        throw new Error('Invalid backup file format');
      }

      // Clear existing data and import
      clearAllData();

      // Import parts
      for (const part of data.parts) {
        addPart(part);
      }

      // Import commitments (or convert old loans)
      const commitments = data.commitments || [];
      for (const commitment of commitments) {
        addCommitment(commitment);
      }

      // Import transactions
      for (const tx of data.transactions) {
        addTransaction(tx);
      }

      // Import central bank state
      if (data.centralBank) {
        updateCentralBank(data.centralBank);
      }

      // Import settings
      if (data.settings) {
        if (data.settings.startingBalance !== undefined) {
          setStartingBalance(data.settings.startingBalance);
        }
        if (data.settings.startingCreditScore !== undefined) {
          setStartingCreditScore(data.settings.startingCreditScore);
        }
        if (data.settings.baseInterestRate !== undefined) {
          setBaseInterestRate(data.settings.baseInterestRate);
        }
        if (data.settings.notificationsEnabled !== undefined) {
          setNotificationsEnabled(data.settings.notificationsEnabled);
        }
        if (data.settings.aggressiveNotifications !== undefined) {
          setAggressiveNotifications(data.settings.aggressiveNotifications);
        }
        if (data.settings.theme !== undefined) {
          setTheme(data.settings.theme);
        }
      }

      setImportSuccess(
        `Imported ${data.parts.length} parts, ${commitments.length} commitments, ${data.transactions.length} transactions`
      );
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import backup');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset all data
  const handleReset = () => {
    clearAllData();
    resetToDefaults();
    setShowResetConfirm(false);
  };

  const themes: { value: KeizaiSettings['theme']; label: string }[] = [
    { value: 'pixel', label: 'Pixel' },
    { value: 'cozy', label: 'Cozy' },
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <h1 className="text-[18px] text-[var(--color-pixel-accent)]">Settings</h1>

      {/* Notifications Section */}
      <Card>
        <h2 className="text-[14px] text-[var(--color-pixel-accent)] mb-4">
          Notifications
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-[var(--color-pixel-text)]">
                Enable Notifications
              </p>
              <p className="text-[10px] text-[var(--color-pixel-text-dim)]">
                Get reminded about upcoming loan deadlines
              </p>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`
                w-12 h-6 border-2 transition-colors relative
                ${notificationsEnabled
                  ? 'bg-[var(--color-pixel-success)] border-[var(--color-pixel-success)]'
                  : 'bg-[var(--color-pixel-bg)] border-[#888]'
                }
              `}
            >
              <div
                className={`
                  w-4 h-4 bg-white absolute top-0.5 transition-transform
                  ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'}
                `}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-[var(--color-pixel-text)]">
                Aggressive Mode
              </p>
              <p className="text-[10px] text-[var(--color-pixel-text-dim)]">
                More frequent reminders for approaching deadlines
              </p>
            </div>
            <button
              onClick={() => setAggressiveNotifications(!aggressiveNotifications)}
              disabled={!notificationsEnabled}
              className={`
                w-12 h-6 border-2 transition-colors relative
                ${!notificationsEnabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${aggressiveNotifications && notificationsEnabled
                  ? 'bg-[var(--color-pixel-success)] border-[var(--color-pixel-success)]'
                  : 'bg-[var(--color-pixel-bg)] border-[#888]'
                }
              `}
            >
              <div
                className={`
                  w-4 h-4 bg-white absolute top-0.5 transition-transform
                  ${aggressiveNotifications && notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'}
                `}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Cloud Sync Section */}
      <Card>
        <h2 className="text-[14px] text-[var(--color-pixel-accent)] mb-4">
          Cloud Sync
        </h2>

        {!firebaseConfigured ? (
          <div className="text-[10px] text-[var(--color-pixel-text-dim)]">
            <p>Firebase is not configured. Add Firebase credentials to your .env file to enable cloud sync.</p>
            <p className="mt-2">Required variables: VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, etc.</p>
          </div>
        ) : !user ? (
          <div className="space-y-4">
            {authError && (
              <div className="p-2 bg-[var(--color-pixel-error)]/20 border border-[var(--color-pixel-error)] text-[var(--color-pixel-error)] text-[10px]">
                {authError}
              </div>
            )}

            <div className="flex gap-2 text-[10px]">
              <button
                onClick={() => setAuthMode('signin')}
                className={`px-2 py-1 ${authMode === 'signin' ? 'text-[var(--color-pixel-accent)] border-b-2 border-[var(--color-pixel-accent)]' : 'text-[var(--color-pixel-text-dim)]'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`px-2 py-1 ${authMode === 'signup' ? 'text-[var(--color-pixel-accent)] border-b-2 border-[var(--color-pixel-accent)]' : 'text-[var(--color-pixel-text-dim)]'}`}
              >
                Sign Up
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[12px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[12px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={authMode === 'signin' ? handleSignIn : handleSignUp}
                disabled={authLoading || !email || !password}
              >
                {authLoading ? 'Loading...' : authMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </Button>
              <Button variant="secondary" onClick={handleGoogleSignIn} disabled={authLoading}>
                Google
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-[var(--color-pixel-text)]">
                  Signed in as
                </p>
                <p className="text-[10px] text-[var(--color-pixel-text-dim)]">
                  {user.email}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-[var(--color-pixel-text)]">
                  Enable Sync
                </p>
                <p className="text-[10px] text-[var(--color-pixel-text-dim)]">
                  Sync data across devices
                </p>
              </div>
              <button
                onClick={handleSyncToggle}
                className={`
                  w-12 h-6 border-2 transition-colors relative
                  ${cloudSyncEnabled
                    ? 'bg-[var(--color-pixel-success)] border-[var(--color-pixel-success)]'
                    : 'bg-[var(--color-pixel-bg)] border-[#888]'
                  }
                `}
              >
                <div
                  className={`
                    w-4 h-4 bg-white absolute top-0.5 transition-transform
                    ${cloudSyncEnabled ? 'translate-x-6' : 'translate-x-0.5'}
                  `}
                />
              </button>
            </div>

            {cloudSyncEnabled && (
              <div className="flex items-center gap-2 text-[10px]">
                <span className={`w-2 h-2 rounded-full ${
                  syncStatus === 'synced' ? 'bg-[var(--color-pixel-success)]' :
                  syncStatus === 'syncing' ? 'bg-[var(--color-pixel-warning)] animate-pulse' :
                  syncStatus === 'error' ? 'bg-[var(--color-pixel-error)]' :
                  'bg-[#888]'
                }`} />
                <span className="text-[var(--color-pixel-text-dim)]">
                  {syncStatus === 'synced' ? 'Synced' :
                   syncStatus === 'syncing' ? 'Syncing...' :
                   syncStatus === 'error' ? 'Sync Error' :
                   'Offline'}
                </span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Economy Settings Section */}
      <Card>
        <h2 className="text-[14px] text-[var(--color-pixel-accent)] mb-4">
          Economy Settings
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-1">
              Starting Balance (for new parts)
            </label>
            <input
              type="number"
              value={startingBalance}
              onChange={(e) => setStartingBalance(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[12px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-1">
              Starting Credit Score (for new parts)
            </label>
            <input
              type="number"
              value={startingCreditScore}
              onChange={(e) => setStartingCreditScore(Math.min(850, Math.max(300, parseInt(e.target.value) || 650)))}
              min={300}
              max={850}
              className="w-full px-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[12px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-1">
              Base Interest Rate (%)
            </label>
            <input
              type="number"
              value={Math.round(baseInterestRate * 100)}
              onChange={(e) => setBaseInterestRate(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100)}
              min={0}
              max={100}
              className="w-full px-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[12px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {/* Avatar Generation Section */}
      <Card>
        <h2 className="text-[14px] text-[var(--color-pixel-accent)] mb-4">
          Avatar Generation
        </h2>
        <div>
          <label className="block text-[10px] text-[var(--color-pixel-text-dim)] mb-1">
            fal.ai API Key
          </label>
          <div className="flex gap-2">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={falApiKey || ''}
              onChange={(e) => setFalApiKey(e.target.value)}
              placeholder="Enter your fal.ai API key..."
              className="flex-1 px-3 py-2 bg-[var(--color-pixel-bg)] border-2 border-[#888] text-[var(--color-pixel-text)] text-[12px] focus:border-[var(--color-pixel-accent)] focus:outline-none"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? 'Hide' : 'Show'}
            </Button>
          </div>
          <p className="text-[8px] text-[var(--color-pixel-text-dim)] mt-1">
            Get your API key from{' '}
            <a
              href="https://fal.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-pixel-accent)] hover:underline"
            >
              fal.ai
            </a>
          </p>
        </div>
      </Card>

      {/* Theme Section */}
      <Card>
        <h2 className="text-[14px] text-[var(--color-pixel-accent)] mb-4">Theme</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={`
                px-4 py-2 border-2 text-[10px] transition-colors
                ${theme === t.value
                  ? 'bg-[var(--color-pixel-accent)] border-[var(--color-pixel-accent)] text-black'
                  : 'bg-transparent border-[#888] text-[var(--color-pixel-text)] hover:border-[var(--color-pixel-accent)]'
                }
              `}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Data Management Section */}
      <Card>
        <h2 className="text-[14px] text-[var(--color-pixel-accent)] mb-4">
          Data Management
        </h2>

        {/* Import/Export Messages */}
        {importError && (
          <div className="mb-4 p-2 bg-[var(--color-pixel-error)]/20 border border-[var(--color-pixel-error)] text-[var(--color-pixel-error)] text-[10px]">
            {importError}
          </div>
        )}
        {importSuccess && (
          <div className="mb-4 p-2 bg-[var(--color-pixel-success)]/20 border border-[var(--color-pixel-success)] text-[var(--color-pixel-success)] text-[10px]">
            {importSuccess}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport}>
              Export Data
            </Button>
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Import Data
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>

          <div className="pt-4 border-t border-[#444]">
            <Button
              variant="danger"
              onClick={() => setShowResetConfirm(true)}
            >
              Reset All Data
            </Button>
            <p className="text-[8px] text-[var(--color-pixel-text-dim)] mt-2">
              This will delete all parts, loans, and transactions. This cannot be undone.
            </p>
          </div>
        </div>
      </Card>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Confirm Reset"
      >
        <div className="space-y-4">
          <p className="text-[12px] text-[var(--color-pixel-text)]">
            Are you sure you want to reset all data? This will:
          </p>
          <ul className="list-disc list-inside text-[10px] text-[var(--color-pixel-text-dim)] space-y-1">
            <li>Delete all parts</li>
            <li>Delete all loans</li>
            <li>Delete all transactions</li>
            <li>Reset the central bank</li>
            <li>Reset all settings to defaults</li>
          </ul>
          <p className="text-[10px] text-[var(--color-pixel-error)]">
            This action cannot be undone!
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowResetConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Yes, Reset Everything
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SettingsView;
