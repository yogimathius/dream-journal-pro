import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  SafeAreaView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDreamStore, DreamFilters } from '../store/dreamStore';
import { DreamEntry } from '../types/dream';
import { RootStackParamList } from '../navigation/AppNavigator';
import SearchAndFilter from '../components/SearchAndFilter';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const DreamListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { dreams, searchDreams, filterDreams } = useDreamStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DreamFilters>({});

  // Apply search and filters
  const getFilteredDreams = () => {
    let result = dreams;
    
    // Apply search first
    if (searchQuery) {
      result = searchDreams(searchQuery);
    }
    
    // Apply filters
    const hasActiveFilters = Object.values(filters).some(Boolean);
    if (hasActiveFilters) {
      result = filterDreams(filters);
      
      // If we have both search and filters, we need to intersect the results
      if (searchQuery) {
        const searchResults = searchDreams(searchQuery);
        const filteredResults = filterDreams(filters);
        result = searchResults.filter(dream => 
          filteredResults.some(filtered => filtered.id === dream.id)
        );
      }
    }
    
    return result;
  };
  
  const filteredDreams = getFilteredDreams();
  const hasActiveFilters = Object.values(filters).some(Boolean);
  
  const clearFilters = () => {
    setFilters({});
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const renderDreamItem = ({ item }: { item: DreamEntry }) => (
    <TouchableOpacity
      style={[
        styles.dreamCard,
        { backgroundColor: isDark ? '#1f2937' : '#ffffff' },
      ]}
      onPress={() => navigation.navigate('DreamDetail', { dreamId: item.id })}
    >
      <View style={styles.dreamHeader}>
        <Text
          style={[
            styles.dreamTitle,
            { color: isDark ? '#ffffff' : '#000000' },
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <View style={styles.dreamMeta}>
          <Text style={[styles.dreamDate, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            {formatDate(item.date)}
          </Text>
          <Text style={[styles.dreamTime, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            {formatTime(item.date)}
          </Text>
        </View>
      </View>
      
      <Text
        style={[
          styles.dreamNarrative,
          { color: isDark ? '#d1d5db' : '#374151' },
        ]}
        numberOfLines={3}
      >
        {truncateText(item.narrative)}
      </Text>
      
      <View style={styles.dreamFooter}>
        <View style={styles.dreamStats}>
          <View style={styles.statItem}>
            <Ionicons name="moon" size={14} color="#6366f1" />
            <Text style={[styles.statText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Lucidity: {item.lucidity}/10
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={14} color="#ef4444" />
            <Text style={[styles.statText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Sleep: {item.sleepQuality}/10
            </Text>
          </View>
          {item.voiceRecordingUri && (
            <View style={styles.statItem}>
              <Ionicons name="mic" size={14} color="#10b981" />
              <Text style={[styles.statText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                Voice
              </Text>
            </View>
          )}
        </View>
        
        {item.symbols.length > 0 && (
          <View style={styles.symbolsContainer}>
            {item.symbols.slice(0, 3).map((symbol, index) => (
              <View key={index} style={styles.symbolTag}>
                <Text style={styles.symbolText}>{symbol}</Text>
              </View>
            ))}
            {item.symbols.length > 3 && (
              <Text style={[styles.moreSymbols, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                +{item.symbols.length - 3} more
              </Text>
            )}
          </View>
        )}
      </View>
      
      {item.status === 'draft' && (
        <View style={styles.draftBadge}>
          <Text style={styles.draftText}>Draft</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="moon-outline"
        size={80}
        color={isDark ? '#4b5563' : '#d1d5db'}
      />
      <Text style={[styles.emptyTitle, { color: isDark ? '#d1d5db' : '#6b7280' }]}>
        No dreams recorded yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: isDark ? '#9ca3af' : '#9ca3af' }]}>
        Tap the + button to record your first dream
      </Text>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate('DreamEntry')}
      >
        <Ionicons name="add" size={24} color="#ffffff" />
        <Text style={styles.startButtonText}>Record First Dream</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#111827' : '#f9fafb' },
      ]}
    >
      <SearchAndFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {(searchQuery || hasActiveFilters) && (
        <View style={styles.resultsContainer}>
          <Text style={[styles.resultsText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            {filteredDreams.length} {filteredDreams.length === 1 ? 'dream' : 'dreams'} found
          </Text>
          {(searchQuery || hasActiveFilters) && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setFilters({});
              }}
              style={styles.clearAllButton}
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={filteredDreams}
        renderItem={renderDreamItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('DreamEntry')}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  dreamCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  dreamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dreamTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  dreamMeta: {
    alignItems: 'flex-end',
  },
  dreamDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  dreamTime: {
    fontSize: 12,
    marginTop: 2,
  },
  dreamNarrative: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  dreamFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  dreamStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  symbolsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  symbolTag: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  symbolText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  moreSymbols: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  draftBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  draftText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});

export default DreamListScreen;