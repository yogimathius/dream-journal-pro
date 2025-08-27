import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DreamFilters } from '../store/dreamStore';

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: DreamFilters;
  onFiltersChange: (filters: DreamFilters) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showFilters, setShowFilters] = useState(false);

  const commonEmotions = [
    'Happy', 'Excited', 'Peaceful', 'Grateful', 'Scared', 'Anxious', 'Worried', 
    'Sad', 'Lonely', 'Angry', 'Frustrated', 'Surprised', 'Amazed', 'Trusting', 'Safe'
  ];

  const commonSymbols = [
    'water', 'flying', 'falling', 'animals', 'house', 'car', 'people',
    'death', 'school', 'work', 'family', 'friends', 'chase', 'lost',
    'naked', 'teeth', 'fire', 'ocean', 'forest', 'mountain'
  ];

  const commonLifeTags = [
    'work-stress', 'relationship', 'family', 'health', 'creativity',
    'travel', 'anxiety', 'change', 'growth', 'healing'
  ];

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    return new Date(dateString);
  };

  const updateDateFilter = (field: 'dateFrom' | 'dateTo', value: string) => {
    const date = parseDate(value);
    onFiltersChange({
      ...filters,
      [field]: date,
    });
  };

  const updateArrayFilter = (field: 'emotions' | 'symbols' | 'lifeTags', value: string) => {
    const currentArray = filters[field] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    onFiltersChange({
      ...filters,
      [field]: newArray.length > 0 ? newArray : undefined,
    });
  };

  const updateRangeFilter = (field: string, value: number | undefined) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const renderFilterChip = (
    label: string,
    isSelected: boolean,
    onToggle: () => void,
    color: string = '#6366f1'
  ) => (
    <TouchableOpacity
      key={label}
      style={[
        styles.filterChip,
        {
          backgroundColor: isSelected ? color : (isDark ? '#374151' : '#e5e7eb'),
        },
      ]}
      onPress={onToggle}
    >
      <Text
        style={[
          styles.filterChipText,
          {
            color: isSelected ? '#ffffff' : (isDark ? '#ffffff' : '#000000'),
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderSliderFilter = (
    label: string,
    min: number,
    max: number,
    minValue: number | undefined,
    maxValue: number | undefined,
    onMinChange: (value: number | undefined) => void,
    onMaxChange: (value: number | undefined) => void
  ) => (
    <View style={styles.sliderFilterContainer}>
      <Text style={[styles.filterSectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
        {label}
      </Text>
      <View style={styles.sliderRow}>
        <View style={styles.sliderInput}>
          <Text style={[styles.sliderLabel, { color: isDark ? '#d1d5db' : '#374151' }]}>
            Min: {minValue || min}
          </Text>
          <View style={styles.sliderTrack}>
            {[...Array(max - min + 1)].map((_, index) => {
              const value = min + index;
              return (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.sliderDot,
                    {
                      backgroundColor: (minValue || min) <= value
                        ? '#6366f1'
                        : (isDark ? '#374151' : '#e5e7eb'),
                    },
                  ]}
                  onPress={() => onMinChange(value === min ? undefined : value)}
                />
              );
            })}
          </View>
        </View>
        
        <View style={styles.sliderInput}>
          <Text style={[styles.sliderLabel, { color: isDark ? '#d1d5db' : '#374151' }]}>
            Max: {maxValue || max}
          </Text>
          <View style={styles.sliderTrack}>
            {[...Array(max - min + 1)].map((_, index) => {
              const value = min + index;
              return (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.sliderDot,
                    {
                      backgroundColor: value <= (maxValue || max)
                        ? '#6366f1'
                        : (isDark ? '#374151' : '#e5e7eb'),
                    },
                  ]}
                  onPress={() => onMaxChange(value === max ? undefined : value)}
                />
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputContainer,
            { backgroundColor: isDark ? '#1f2937' : '#ffffff' },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={isDark ? '#9ca3af' : '#6b7280'}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: isDark ? '#ffffff' : '#000000' },
            ]}
            placeholder="Search dreams, symbols, emotions..."
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            value={searchQuery}
            onChangeText={onSearchChange}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: hasActiveFilters ? '#6366f1' : (isDark ? '#374151' : '#e5e7eb'),
            },
          ]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="filter"
            size={20}
            color={hasActiveFilters ? '#ffffff' : (isDark ? '#ffffff' : '#000000')}
          />
          {hasActiveFilters && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {Object.values(filters).filter(Boolean).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
          <View style={[styles.modalHeader, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
            <TouchableOpacity
              onPress={() => setShowFilters(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={isDark ? '#ffffff' : '#000000'} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              Filter Dreams
            </Text>
            <TouchableOpacity
              onPress={() => {
                onClearFilters();
                setShowFilters(false);
              }}
              style={styles.clearFiltersButton}
            >
              <Text style={styles.clearFiltersText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Date Range */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                Date Range
              </Text>
              <View style={styles.dateRow}>
                <View style={styles.dateInput}>
                  <Text style={[styles.dateLabel, { color: isDark ? '#d1d5db' : '#374151' }]}>
                    From
                  </Text>
                  <TextInput
                    style={[
                      styles.dateField,
                      {
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        color: isDark ? '#ffffff' : '#000000',
                      },
                    ]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                    value={formatDate(filters.dateFrom || null)}
                    onChangeText={(value) => updateDateFilter('dateFrom', value)}
                  />
                </View>
                <View style={styles.dateInput}>
                  <Text style={[styles.dateLabel, { color: isDark ? '#d1d5db' : '#374151' }]}>
                    To
                  </Text>
                  <TextInput
                    style={[
                      styles.dateField,
                      {
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        color: isDark ? '#ffffff' : '#000000',
                      },
                    ]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                    value={formatDate(filters.dateTo || null)}
                    onChangeText={(value) => updateDateFilter('dateTo', value)}
                  />
                </View>
              </View>
            </View>

            {/* Quality Filters */}
            {renderSliderFilter(
              'Lucidity',
              0,
              10,
              filters.lucidityMin,
              filters.lucidityMax,
              (value) => updateRangeFilter('lucidityMin', value),
              (value) => updateRangeFilter('lucidityMax', value)
            )}

            {renderSliderFilter(
              'Sleep Quality',
              0,
              10,
              filters.sleepQualityMin,
              filters.sleepQualityMax,
              (value) => updateRangeFilter('sleepQualityMin', value),
              (value) => updateRangeFilter('sleepQualityMax', value)
            )}

            {/* Emotions Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                Emotions
              </Text>
              <View style={styles.filterChips}>
                {commonEmotions.map(emotion => 
                  renderFilterChip(
                    emotion,
                    filters.emotions?.includes(emotion) || false,
                    () => updateArrayFilter('emotions', emotion),
                    '#ef4444'
                  )
                )}
              </View>
            </View>

            {/* Symbols Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                Dream Symbols
              </Text>
              <View style={styles.filterChips}>
                {commonSymbols.map(symbol => 
                  renderFilterChip(
                    symbol,
                    filters.symbols?.includes(symbol) || false,
                    () => updateArrayFilter('symbols', symbol),
                    '#10b981'
                  )
                )}
              </View>
            </View>

            {/* Life Tags Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                Life Context
              </Text>
              <View style={styles.filterChips}>
                {commonLifeTags.map(tag => 
                  renderFilterChip(
                    tag,
                    filters.lifeTags?.includes(tag) || false,
                    () => updateArrayFilter('lifeTags', tag),
                    '#f59e0b'
                  )
                )}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: '#6366f1' }]}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearFiltersText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginBottom: 24,
    marginTop: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  dateField: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    fontSize: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sliderFilterContainer: {
    marginBottom: 24,
  },
  sliderRow: {
    gap: 16,
  },
  sliderInput: {
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  sliderTrack: {
    flexDirection: 'row',
    gap: 4,
  },
  sliderDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalFooter: {
    paddingVertical: 24,
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SearchAndFilter;