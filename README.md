# Dream Journal Pro 🌙

AI-powered dream analysis and pattern recognition mobile app built with React Native and Expo.

## Features

### 📱 Core Functionality
- **Dream Entry**: Dual-mode dream recording (quick capture + detailed entry)
- **Voice Recording**: Record dream narratives with expo-av integration
- **Rich Metadata**: Track emotions, symbols, lucidity, sleep quality, and life context
- **Dream Search & Filtering**: Advanced search with multiple filter criteria
- **Offline-First**: All data stored locally with AsyncStorage

### 🤖 AI-Powered Analysis
- **OpenAI Integration**: GPT-4o-mini powered dream interpretation
- **Psychological Framework**: Jungian and depth psychology approach
- **Structured Analysis**: Symbolic landscape, emotional insights, life integration
- **Reflection Questions**: Soul questions for deeper self-understanding
- **Integration Practices**: Actionable recommendations for dream work

### 📊 Pattern Recognition
- **Symbol Patterns**: Frequency analysis of recurring dream symbols
- **Emotion Tracking**: Emotional pattern identification with intensity mapping
- **Narrative Themes**: Detection of 8+ common dream themes (flying, chase, water, etc.)
- **Timing Patterns**: Day-of-week dream frequency analysis
- **Life Correlations**: Connect dream patterns to waking life events
- **Confidence Scoring**: AI confidence levels for pattern reliability

### 🔔 Smart Notifications
- **Daily Reminders**: Configurable dream recording reminders
- **8 Motivational Messages**: Rotating inspirational notification content
- **Time Picker**: Custom reminder time selection
- **Permission Handling**: Proper iOS/Android notification permissions
- **Deep Linking**: Tap notifications to open dream entry screen

### 📈 Analytics Dashboard
- **Dream Statistics**: Total dreams, streaks, quality averages
- **Visual Charts**: Quality bars, symbol rankings, emotion analysis
- **Personalized Insights**: Dynamic insights based on user patterns
- **Progress Tracking**: Dream frequency and consistency metrics

## Tech Stack

### Frontend
- **React Native** with TypeScript for type safety
- **Expo SDK 53+** for cross-platform development
- **React Navigation** (tabs + stack navigation)
- **Zustand** for state management with persistence
- **Dark Mode** optimized UI with automatic theme switching

### AI & Analytics
- **OpenAI GPT-4o-mini** for dream analysis
- **Custom Pattern Analysis** algorithms for dream insights
- **Statistical Analysis** for trend detection and correlations

### Data & Persistence
- **AsyncStorage** for offline-first data storage
- **JSON serialization** with proper type validation
- **Sample Data Generation** for demo and onboarding

### Audio & Notifications
- **expo-av** for voice recording and playback
- **expo-notifications** for cross-platform push notifications
- **@react-native-community/datetimepicker** for time selection

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/dream-journal-pro.git
cd dream-journal-pro

# Install dependencies
npm install

# Start the development server
npx expo start
```

## Configuration

### OpenAI Setup
1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Open the app and go to Settings → AI Features → OpenAI Configuration
3. Enter your API key (stored locally and encrypted)

### Notifications
- Permissions are requested automatically on first launch
- Configure reminder time in Settings → App Preferences
- Test notifications available in developer settings

## Development

### Project Structure
```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── navigation/         # React Navigation setup
├── screens/            # Screen components
├── services/           # Business logic and external APIs
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and sample data
```

### Key Components
- **DreamAnalysisCard**: AI-powered dream interpretation display
- **VoiceRecorder**: Audio recording with real-time feedback
- **SearchAndFilter**: Advanced dream filtering modal
- **PatternAnalysisService**: Core pattern recognition algorithms
- **NotificationService**: Cross-platform notification handling

### Development Features
- **Hot Reload** with Expo
- **TypeScript** for compile-time safety
- **Sample Data Generator** for testing (15 realistic dreams)
- **Mock AI Analysis** for offline development
- **Test Notifications** for debugging

## Architecture

### State Management
- **Zustand** store with AsyncStorage persistence
- **Automatic rehydration** on app startup
- **Service initialization** (OpenAI, notifications) on store load

### Offline-First Design
- All data stored locally by default
- Optional cloud sync (future feature)
- Works completely offline except for AI analysis

### Cross-Platform Compatibility
- iOS and Android optimized
- Platform-specific UI adaptations (time pickers, notifications)
- Web support for development

## Project Overview

- **Market**: 8M+ people actively interested in dream work
- **MVP Timeline**: 3 weeks ✅ (Completed)
- **Tech Stack**: Mobile app + OpenAI + advanced pattern recognition ✅
- **Revenue Model**: $6.99/month subscription after 7-day free trial
- **Joy Factor**: ⭐⭐⭐⭐⭐ Daily exploration of the unconscious

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes with conventional commits
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **OpenAI** for GPT-4o-mini API
- **Expo Team** for the amazing development platform
- **React Native Community** for essential packages
- **Jungian Psychology** for dream analysis framework

---

*Built with ❤️ and 🤖 by Claude Code*
