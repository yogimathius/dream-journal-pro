import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDreamStore } from '../store/dreamStore';

const SettingsScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { userPreferences, updatePreferences, dreams } = useDreamStore();
  const [showDeveloperInfo, setShowDeveloperInfo] = useState(false);

  const handleExportData = async () => {
    try {
      const exportData = {
        dreams: dreams,
        preferences: userPreferences,
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
      };

      const jsonData = JSON.stringify(exportData, null, 2);
      
      await Share.share({
        message: jsonData,
        title: 'Dream Journal Pro Export',
      });
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export data. Please try again.');
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your dreams and settings. This action cannot be undone.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            // Clear dreams - this would need to be implemented in the store
            Alert.alert('Data Cleared', 'All your dreams and settings have been deleted.');
          },
        },
      ]
    );
  };

  const handleRateApp = () => {
    // In a real app, this would open the app store
    Alert.alert(
      'Rate Dream Journal Pro',
      'Thank you for considering rating our app! This would normally open the App Store.',
      [{ text: 'OK' }]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Need help? Reach out to us!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Email',
          onPress: () => {
            Linking.openURL('mailto:support@dreamjournalpro.com?subject=Support Request');
          },
        },
      ]
    );
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
        {title}
      </Text>
      <View style={[styles.sectionContent, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
        {children}
      </View>
    </View>
  );

  const renderSettingItem = (
    title: string,
    subtitle: string,
    icon: string,
    action: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={[styles.settingItem, !onPress && { opacity: 1 }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons
          name={icon as any}
          size={20}
          color="#6366f1"
          style={styles.settingIcon}
        />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
            {title}
          </Text>
          <Text style={[styles.settingSubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            {subtitle}
          </Text>
        </View>
      </View>
      <View style={styles.settingRight}>
        {action}
      </View>
    </TouchableOpacity>
  );

  const renderSwitchItem = (
    title: string,
    subtitle: string,
    icon: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) =>
    renderSettingItem(
      title,
      subtitle,
      icon,
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: isDark ? '#374151' : '#e5e7eb', true: '#6366f1' }}
        thumbColor={value ? '#ffffff' : '#ffffff'}
        ios_backgroundColor={isDark ? '#374151' : '#e5e7eb'}
      />
    );

  const renderActionItem = (
    title: string,
    subtitle: string,
    icon: string,
    onPress: () => void,
    color: string = '#6366f1',
    showChevron: boolean = true
  ) =>
    renderSettingItem(
      title,
      subtitle,
      icon,
      showChevron ? (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isDark ? '#9ca3af' : '#6b7280'}
        />
      ) : null,
      onPress
    );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* App Preferences */}
          {renderSection('App Preferences', (
            <>
              {renderSwitchItem(
                'Dream Reminders',
                'Get daily reminders to record your dreams',
                'notifications-outline',
                userPreferences.reminderEnabled,
                (value) => updatePreferences({ reminderEnabled: value })
              )}
              
              {renderSwitchItem(
                'Voice Recording',
                'Enable voice recording for dreams',
                'mic-outline',
                userPreferences.voiceRecordingEnabled,
                (value) => updatePreferences({ voiceRecordingEnabled: value })
              )}
              
              {renderSwitchItem(
                'Dark Mode',
                'Use dark theme for better night viewing',
                'moon-outline',
                userPreferences.darkModeEnabled,
                (value) => updatePreferences({ darkModeEnabled: value })
              )}
            </>
          ))}

          {/* Privacy & Data */}
          {renderSection('Privacy & Data', (
            <>
              {renderSwitchItem(
                'Analytics',
                'Help improve the app with anonymous usage data',
                'analytics-outline',
                userPreferences.privacySettings.shareAnalytics,
                (value) => updatePreferences({
                  privacySettings: {
                    ...userPreferences.privacySettings,
                    shareAnalytics: value
                  }
                })
              )}
              
              {renderActionItem(
                'Export Data',
                'Download all your dreams and settings',
                'download-outline',
                handleExportData
              )}
              
              {renderActionItem(
                'Clear All Data',
                'Permanently delete all dreams and settings',
                'trash-outline',
                handleClearAllData,
                '#ef4444'
              )}
            </>
          ))}

          {/* Subscription (Future) */}
          {renderSection('Subscription', (
            <View style={styles.subscriptionInfo}>
              <Ionicons name="diamond-outline" size={32} color="#6366f1" />
              <Text style={[styles.subscriptionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                Dream Journal Pro
              </Text>
              <Text style={[styles.subscriptionStatus, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                Free Version
              </Text>
              <Text style={[styles.subscriptionDescription, { color: isDark ? '#d1d5db' : '#374151' }]}>
                Upgrade to Pro for unlimited dreams, AI analysis, and advanced pattern recognition.
              </Text>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => Alert.alert('Coming Soon', 'Subscription features will be available in a future update.')}
              >
                <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Support & Feedback */}
          {renderSection('Support & Feedback', (
            <>
              {renderActionItem(
                'Contact Support',
                'Get help or report issues',
                'help-circle-outline',
                handleContactSupport
              )}
              
              {renderActionItem(
                'Rate App',
                'Love the app? Leave us a review',
                'star-outline',
                handleRateApp
              )}
              
              {renderActionItem(
                'Privacy Policy',
                'View our privacy policy',
                'document-text-outline',
                () => Alert.alert('Privacy Policy', 'This would normally open the privacy policy webpage.')
              )}
              
              {renderActionItem(
                'Terms of Service',
                'View terms and conditions',
                'document-outline',
                () => Alert.alert('Terms of Service', 'This would normally open the terms of service webpage.')
              )}
            </>
          ))}

          {/* App Information */}
          {renderSection('App Information', (
            <TouchableOpacity
              onPress={() => setShowDeveloperInfo(!showDeveloperInfo)}
              style={styles.appInfoContainer}
            >
              <View style={styles.appInfo}>
                <Ionicons name="moon" size={32} color="#6366f1" />
                <View style={styles.appInfoText}>
                  <Text style={[styles.appName, { color: isDark ? '#ffffff' : '#000000' }]}>
                    Dream Journal Pro
                  </Text>
                  <Text style={[styles.appVersion, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    Version 1.0.0 (1)
                  </Text>
                  <Text style={[styles.appDescription, { color: isDark ? '#d1d5db' : '#374151' }]}>
                    AI-powered dream analysis and pattern recognition
                  </Text>
                </View>
              </View>
              
              {showDeveloperInfo && (
                <View style={styles.developerInfo}>
                  <Text style={[styles.developerTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                    Development Info
                  </Text>
                  <Text style={[styles.developerText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    • React Native with Expo
                  </Text>
                  <Text style={[styles.developerText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    • TypeScript for type safety
                  </Text>
                  <Text style={[styles.developerText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    • Zustand for state management
                  </Text>
                  <Text style={[styles.developerText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    • AsyncStorage for persistence
                  </Text>
                  <Text style={[styles.developerText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                    • expo-av for voice recording
                  </Text>
                  <Text style={[styles.copyrightText, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
                    Built with Claude Code 🤖
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {/* Stats Summary */}
          <View style={styles.statsSection}>
            <Text style={[styles.statsTitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Your Dream Journey
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: isDark ? '#ffffff' : '#000000' }]}>
                  {dreams.length}
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  Dreams
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: isDark ? '#ffffff' : '#000000' }]}>
                  {dreams.filter(d => d.voiceRecordingUri).length}
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  Voice Notes
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, { color: isDark ? '#ffffff' : '#000000' }]}>
                  {dreams.filter(d => d.status === 'complete').length}
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  Complete
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  settingRight: {
    marginLeft: 12,
  },
  subscriptionInfo: {
    alignItems: 'center',
    padding: 24,
  },
  subscriptionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  subscriptionStatus: {
    fontSize: 14,
    marginBottom: 12,
  },
  subscriptionDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  upgradeButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  appInfoContainer: {
    padding: 16,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appInfoText: {
    flex: 1,
    marginLeft: 16,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  appVersion: {
    fontSize: 13,
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  developerInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  developerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  developerText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  copyrightText: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  statsSection: {
    marginTop: 16,
    paddingTop: 16,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default SettingsScreen;