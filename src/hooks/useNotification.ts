import { useCallback, useEffect, useState } from 'react';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { useSettingsStore } from '../store/settingsStore';
import {
  requestNotificationPermission as requestPermissionService,
  startNotificationScheduler,
  sendDeadlineWarning,
  sendOverdueNotification,
} from '../services/notifications';

export function useNotification() {
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Check permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const granted = await isPermissionGranted();
        setPermissionGranted(granted);
      } catch {
        setPermissionGranted(false);
      }
    };
    checkPermission();
  }, []);

  // Start notification scheduler when enabled
  useEffect(() => {
    if (!notificationsEnabled) return;

    const stopScheduler = startNotificationScheduler();
    return stopScheduler;
  }, [notificationsEnabled]);

  const notify = useCallback(
    async (title: string, body?: string) => {
      if (!notificationsEnabled) return;
      try {
        let granted = await isPermissionGranted();
        if (!granted) {
          const permission = await requestPermission();
          granted = permission === 'granted';
          setPermissionGranted(granted);
        }
        if (granted) {
          sendNotification({ title, body });
        }
      } catch (error) {
        console.error('Notification error:', error);
      }
    },
    [notificationsEnabled]
  );

  // Legacy method for backward compatibility
  const sendLoanWarning = useCallback(
    async (partName: string, hoursLeft: number, amount: number) => {
      await notify(
        `Loan Due Soon - ${partName}`,
        `${hoursLeft}h remaining to repay ${amount} credits!`
      );
    },
    [notify]
  );

  // Legacy method for backward compatibility
  const sendLoanOverdue = useCallback(
    async (partName: string, amount: number) => {
      await notify(
        `LOAN OVERDUE - ${partName}`,
        `${amount} credits past due! Credit score at risk.`
      );
    },
    [notify]
  );

  // New commitment-based methods
  const sendCommitmentWarning = useCallback(
    async (partName: string, commitmentDesc: string, hoursRemaining: number) => {
      await sendDeadlineWarning(partName, commitmentDesc, hoursRemaining);
    },
    []
  );

  const sendCommitmentOverdue = useCallback(
    async (partName: string, commitmentDesc: string) => {
      await sendOverdueNotification(partName, commitmentDesc);
    },
    []
  );

  const requestNotificationPermission = useCallback(async () => {
    const granted = await requestPermissionService();
    setPermissionGranted(granted);
    return granted;
  }, []);

  return {
    // Permission state
    permissionGranted,
    requestPermission: requestNotificationPermission,

    // Generic notification
    notify,

    // Commitment notifications (new)
    sendCommitmentWarning,
    sendCommitmentOverdue,

    // Legacy loan notifications (for backward compatibility)
    sendLoanWarning,
    sendLoanOverdue,
    requestNotificationPermission,
  };
}
