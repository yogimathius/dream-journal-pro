import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, TouchableOpacity } from 'react-native';

// Screens (will be created)
import DreamListScreen from '../screens/DreamListScreen';
import DreamEntryScreen from '../screens/DreamEntryScreen';
import DreamDetailScreen from '../screens/DreamDetailScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  DreamDetail: { dreamId: string };
  DreamEntry: { dreamId?: string };
};

export type TabParamList = {
  Dreams: undefined;
  Analytics: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const TabNavigator = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dreams') {
            iconName = focused ? 'moon' : 'moon-outline';
          } else if (route.name === 'Analytics') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#6b7280',
        tabBarStyle: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderTopColor: isDark ? '#374151' : '#e5e7eb',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        headerStyle: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#374151' : '#e5e7eb',
        },
        headerTintColor: isDark ? '#ffffff' : '#000000',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen
        name="Dreams"
        component={DreamListScreen}
        options={({ navigation }) => ({
          title: 'Dream Journal',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('DreamEntry' as any)}
              style={{ marginRight: 15 }}
            >
              <Ionicons
                name="add-circle-outline"
                size={28}
                color="#6366f1"
              />
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: 'Insights',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: '#6366f1',
          background: isDark ? '#111827' : '#ffffff',
          card: isDark ? '#1f2937' : '#ffffff',
          text: isDark ? '#ffffff' : '#000000',
          border: isDark ? '#374151' : '#e5e7eb',
          notification: '#ef4444',
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen
          name="DreamDetail"
          component={DreamDetailScreen}
          options={{
            headerShown: true,
            title: 'Dream Details',
            headerStyle: {
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
            },
            headerTintColor: isDark ? '#ffffff' : '#000000',
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        />
        <Stack.Screen
          name="DreamEntry"
          component={DreamEntryScreen}
          options={{
            headerShown: true,
            title: 'Record Dream',
            headerStyle: {
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
            },
            headerTintColor: isDark ? '#ffffff' : '#000000',
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;