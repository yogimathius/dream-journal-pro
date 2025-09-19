import React from 'react';
import { render, screen } from '@testing-library/react-native';
import DreamAnalysisCard from '../../components/DreamAnalysisCard';

// Mock the dream analysis data
const mockDreamAnalysis = {
  id: '1',
  dreamId: 'dream-1',
  symbols: ['water', 'flying', 'house'],
  emotions: ['anxiety', 'excitement'],
  themes: ['transformation', 'escape'],
  interpretation: 'This dream suggests a desire for freedom and change.',
  confidence: 0.85,
  createdAt: new Date('2023-01-01'),
};

describe('DreamAnalysisCard', () => {
  it('renders dream analysis card with basic information', () => {
    render(<DreamAnalysisCard analysis={mockDreamAnalysis} />);
    
    // Check if the interpretation is displayed
    expect(screen.getByText(mockDreamAnalysis.interpretation)).toBeTruthy();
    
    // Check if symbols are displayed
    expect(screen.getByText('water')).toBeTruthy();
    expect(screen.getByText('flying')).toBeTruthy();
    expect(screen.getByText('house')).toBeTruthy();
  });

  it('displays emotions correctly', () => {
    render(<DreamAnalysisCard analysis={mockDreamAnalysis} />);
    
    expect(screen.getByText('anxiety')).toBeTruthy();
    expect(screen.getByText('excitement')).toBeTruthy();
  });

  it('shows confidence level', () => {
    render(<DreamAnalysisCard analysis={mockDreamAnalysis} />);
    
    // Confidence should be displayed as percentage
    expect(screen.getByText('85%')).toBeTruthy();
  });

  it('handles missing analysis data gracefully', () => {
    const incompleteAnalysis = {
      ...mockDreamAnalysis,
      symbols: [],
      emotions: [],
      themes: [],
    };

    render(<DreamAnalysisCard analysis={incompleteAnalysis} />);
    
    // Should still render the interpretation
    expect(screen.getByText(mockDreamAnalysis.interpretation)).toBeTruthy();
  });

  it('formats date correctly', () => {
    render(<DreamAnalysisCard analysis={mockDreamAnalysis} />);
    
    // Check if date is formatted and displayed
    expect(screen.getByText(/2023/)).toBeTruthy();
  });
});