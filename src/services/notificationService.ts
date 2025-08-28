import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface NotificationSchedule {
  time: string; // HH:MM format
  enabled: boolean;
  title: string;
  body: string;
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Set up notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('dream-reminders', {
          name: 'Dream Reminders',
          description: 'Daily reminders to record your dreams',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366f1',
        });
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
      return false;
    }
  }

  async scheduleDreamReminder(schedule: NotificationSchedule): Promise<string | null> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return null;
    }

    try {
      // Parse time
      const [hours, minutes] = schedule.time.split(':').map(Number);
      
      // Create trigger for daily repeat
      const trigger = {
        hour: hours,
        minute: minutes,
        repeats: true,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: schedule.title,
          body: schedule.body,
          data: { 
            type: 'dream-reminder',
            timestamp: Date.now(),
          },
          sound: 'default',
        },
        trigger,
      });

      console.log(`Dream reminder scheduled with ID: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling dream reminder:', error);
      return null;
    }
  }

  async cancelDreamReminder(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`Dream reminder cancelled: ${notificationId}`);
      return true;
    } catch (error) {
      console.error('Error cancelling dream reminder:', error);
      return false;
    }
  }

  async cancelAllDreamReminders(): Promise<boolean> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All dream reminders cancelled');
      return true;
    } catch (error) {
      console.error('Error cancelling all dream reminders:', error);
      return false;
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async updateDreamReminder(
    oldNotificationId: string,
    newSchedule: NotificationSchedule
  ): Promise<string | null> {
    // Cancel old notification
    await this.cancelDreamReminder(oldNotificationId);
    
    // Schedule new one
    if (newSchedule.enabled) {
      return await this.scheduleDreamReminder(newSchedule);
    }
    
    return null;
  }

  // Predefined reminder messages
  getDreamReminderMessages(): Array<{ title: string; body: string }> {
    return [
      {
        title: '🌙 Time to Record Your Dreams',
        body: 'Good morning! Take a moment to capture any dreams you remember from last night.',
      },
      {
        title: '✨ Dream Journal Reminder',
        body: 'Did you dream last night? Even fragments are worth recording!',
      },
      {
        title: '🔮 Your Subconscious is Calling',
        body: 'Your dreams hold valuable insights. Take a few minutes to record them.',
      },
      {
        title: '💭 Morning Dream Check-in',
        body: 'Before the day takes over, what dreams do you remember?',
      },
      {
        title: '🌅 Start Your Day with Dreams',
        body: 'Your unconscious mind worked all night. What stories did it create?',
      },
      {
        title: '📖 Dream Story Time',
        body: 'Every dream is a unique story from your psyche. What chapter was written last night?',
      },
      {
        title: '🎭 Your Nightly Theater',
        body: 'What dramas, comedies, or adventures played out in your dreams?',
      },
      {
        title: '🗝️ Unlock Your Dream Wisdom',
        body: 'Your dreams may hold the keys to understanding yourself better.',
      },
    ];
  }

  getRandomReminderMessage(): { title: string; body: string } {
    const messages = this.getDreamReminderMessages();
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Test notification (for debugging)
  async sendTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Dream Reminder',
          body: 'This is a test notification from Dream Journal Pro',
          data: { type: 'test' },
        },
        trigger: { seconds: 2 },
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }

  // Handle notification response (when user taps notification)
  addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Handle notification received while app is foreground
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Get permission status
  async getPermissionStatus(): Promise<Notifications.PermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  // Request permissions explicitly
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }
}

export default NotificationService.getInstance();