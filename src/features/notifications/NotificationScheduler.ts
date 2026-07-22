import { Platform } from 'react-native';

export type NotificationDeliveryStatus = 'scheduled' | 'disabled' | 'denied' | 'unsupported';
export interface NotificationScheduler { apply(enabled: boolean, time: string): Promise<NotificationDeliveryStatus>; }

declare const require: (moduleName: string) => typeof import('expo-notifications');

export class ExpoNotificationScheduler implements NotificationScheduler {
  async apply(enabled: boolean, time: string): Promise<NotificationDeliveryStatus> {
    if (Platform.OS === 'web') return 'unsupported';
    const Notifications = require('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!enabled) return 'disabled';
    const existing = await Notifications.getPermissionsAsync();
    const permission = existing.granted ? existing : await Notifications.requestPermissionsAsync();
    if (!permission.granted) return 'denied';
    const [hour, minute] = time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: { title: 'A few good minutes', body: 'Your dog’s training plan is ready. Keep today’s session short and successful.', sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
    return 'scheduled';
  }
}
