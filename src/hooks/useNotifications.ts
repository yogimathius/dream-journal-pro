import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import notificationService from '../services/notificationService';

export const useNotifications = () => {
  const navigation = useNavigation();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Initialize notification service
    notificationService.initialize();

    // Handle notification received while app is in foreground
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received in foreground:', notification);
        // You could show an in-app notification here if needed
      }
    );

    // Handle notification tapped
    responseListener.current = notificationService.addNotificationResponseListener(
      (response) => {
        console.log('Notification tapped:', response);
        
        const data = response.notification.request.content.data;
        
        if (data?.type === 'dream-reminder') {
          // Navigate to dream entry screen when dream reminder is tapped
          navigation.navigate('DreamEntry' as never);
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [navigation]);

  return {
    sendTestNotification: notificationService.sendTestNotification.bind(notificationService),
    getPermissionStatus: notificationService.getPermissionStatus.bind(notificationService),
    requestPermissions: notificationService.requestPermissions.bind(notificationService),
  };
};