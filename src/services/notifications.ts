import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { getAllCommitments, updateCommitment, getPart } from '../sync/yjsProvider';
import { useSettingsStore } from '../store/settingsStore';

// Notification thresholds in hours
const NOTIFICATION_THRESHOLDS = [24, 8, 1]; // 24h, 8h, 1h before deadline
const AGGRESSIVE_INTERVAL_MINUTES = 15; // In final hour, notify every 15 min

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Request notification permission on first use
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === 'granted';
    }
    return granted;
  } catch (error) {
    console.error('[Notifications] Permission request failed:', error);
    return false;
  }
}

/**
 * Send deadline warning notification
 */
export async function sendDeadlineWarning(
  partName: string,
  commitmentDesc: string,
  hoursRemaining: number
): Promise<void> {
  const settings = useSettingsStore.getState();
  if (!settings.notificationsEnabled) return;

  try {
    const granted = await isPermissionGranted();
    if (!granted) return;

    const timeDisplay = hoursRemaining < 1
      ? `${Math.round(hoursRemaining * 60)} minutes`
      : `${Math.round(hoursRemaining)} hours`;

    await sendNotification({
      title: `Commitment Due Soon - ${partName}`,
      body: `"${commitmentDesc}" - ${timeDisplay} remaining!`,
    });

    console.log(`[Notifications] Sent warning for ${partName}: ${timeDisplay} remaining`);
  } catch (error) {
    console.error('[Notifications] Failed to send warning:', error);
  }
}

/**
 * Send overdue notification
 */
export async function sendOverdueNotification(
  partName: string,
  commitmentDesc: string
): Promise<void> {
  const settings = useSettingsStore.getState();
  if (!settings.notificationsEnabled) return;

  try {
    const granted = await isPermissionGranted();
    if (!granted) return;

    await sendNotification({
      title: `COMMITMENT OVERDUE - ${partName}`,
      body: `"${commitmentDesc}" is past due! Credit score at risk.`,
    });

    console.log(`[Notifications] Sent overdue notification for ${partName}`);
  } catch (error) {
    console.error('[Notifications] Failed to send overdue notification:', error);
  }
}

/**
 * Calculate hours remaining until deadline
 */
function getHoursRemaining(deadline: string): number {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Determine if we should send a notification based on thresholds and notification count
 * Returns the appropriate threshold if notification should be sent, null otherwise
 */
function shouldNotify(
  hoursRemaining: number,
  notificationCount: number,
  lastNotificationAt: string | undefined,
  aggressiveMode: boolean
): { shouldSend: boolean; newCount: number } {
  // Already overdue - handle separately
  if (hoursRemaining <= 0) {
    return { shouldSend: false, newCount: notificationCount };
  }

  // Check standard thresholds (24h, 8h, 1h)
  // notificationCount: 0 = no notifications, 1 = 24h sent, 2 = 8h sent, 3 = 1h sent
  for (let i = 0; i < NOTIFICATION_THRESHOLDS.length; i++) {
    const threshold = NOTIFICATION_THRESHOLDS[i];
    const requiredCount = i + 1; // 1 for 24h, 2 for 8h, 3 for 1h

    if (hoursRemaining <= threshold && notificationCount < requiredCount) {
      return { shouldSend: true, newCount: requiredCount };
    }
  }

  // Aggressive mode: in final hour, notify every 15 minutes
  if (aggressiveMode && hoursRemaining <= 1 && notificationCount >= 3) {
    if (!lastNotificationAt) {
      return { shouldSend: true, newCount: notificationCount };
    }

    const lastNotification = new Date(lastNotificationAt);
    const now = new Date();
    const minutesSinceLast = (now.getTime() - lastNotification.getTime()) / (1000 * 60);

    if (minutesSinceLast >= AGGRESSIVE_INTERVAL_MINUTES) {
      return { shouldSend: true, newCount: notificationCount };
    }
  }

  return { shouldSend: false, newCount: notificationCount };
}

/**
 * Check all active commitments and send notifications as needed
 */
export function checkAndSendNotifications(): void {
  const settings = useSettingsStore.getState();
  if (!settings.notificationsEnabled) return;

  const commitments = getAllCommitments();
  const activeCommitments = commitments.filter((c) => c.status === 'active');

  for (const commitment of activeCommitments) {
    const hoursRemaining = getHoursRemaining(commitment.deadline);
    const part = getPart(commitment.partId);
    const partName = part?.name || 'Unknown Part';

    // Check for overdue
    if (hoursRemaining <= 0) {
      // Only send overdue notification once (when first overdue)
      const wasAlreadyOverdue = commitment.lastNotificationAt
        ? getHoursRemaining(commitment.deadline) <= 0 &&
          new Date(commitment.lastNotificationAt) > new Date(commitment.deadline)
        : false;

      if (!wasAlreadyOverdue) {
        sendOverdueNotification(partName, commitment.description);
        updateCommitment(commitment.id, {
          lastNotificationAt: new Date().toISOString(),
        });
      }
      continue;
    }

    // Check if we should send a warning
    const { shouldSend, newCount } = shouldNotify(
      hoursRemaining,
      commitment.notificationCount,
      commitment.lastNotificationAt,
      settings.aggressiveNotifications
    );

    if (shouldSend) {
      sendDeadlineWarning(partName, commitment.description, hoursRemaining);
      updateCommitment(commitment.id, {
        notificationCount: newCount,
        lastNotificationAt: new Date().toISOString(),
      });
    }
  }
}

/**
 * Start the notification scheduler
 * Checks every minute for commitments that need notifications
 * @returns Cleanup function to stop the scheduler
 */
export function startNotificationScheduler(): () => void {
  // Clear any existing scheduler
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  console.log('[Notifications] Starting notification scheduler');

  // Initial check
  checkAndSendNotifications();

  // Check every minute
  schedulerInterval = setInterval(() => {
    checkAndSendNotifications();
  }, 60 * 1000);

  // Return cleanup function
  return () => {
    if (schedulerInterval) {
      console.log('[Notifications] Stopping notification scheduler');
      clearInterval(schedulerInterval);
      schedulerInterval = null;
    }
  };
}

/**
 * Stop the notification scheduler
 */
export function stopNotificationScheduler(): void {
  if (schedulerInterval) {
    console.log('[Notifications] Stopping notification scheduler');
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}

/**
 * Get current scheduler status
 */
export function isSchedulerRunning(): boolean {
  return schedulerInterval !== null;
}
