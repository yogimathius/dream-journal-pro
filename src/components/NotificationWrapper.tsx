import React from 'react';
import AppNavigator from '../navigation/AppNavigator';
import { useNotifications } from '../hooks/useNotifications';

const NotificationWrapper: React.FC = () => {
  // Initialize notifications
  useNotifications();

  return <AppNavigator />;
};

export default NotificationWrapper;