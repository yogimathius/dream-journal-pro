import { DreamEntry, Pattern, LifeCorrelation } from '../types/dream';

export interface PatternInsight {
  pattern: Pattern;
  severity: 'low' | 'medium' | 'high';
  actionable: boolean;
  description: string;
  recommendation?: string;
}

export interface PatternAnalysisResult {
  patterns: Pattern[];
  insights: PatternInsight[];
  trends: {
    improving: Pattern[];
    declining: Pattern[];
    stable: Pattern[];
  };
  summary: {
    totalPatterns: number;
    significantPatterns: number;
    strongCorrelations: number;
    averageConfidence: number;
  };
}

class PatternAnalysisService {
  private readonly MIN_DREAMS_FOR_PATTERN = 3;
  private readonly MIN_FREQUENCY_THRESHOLD = 0.3;
  private readonly MIN_CORRELATION_STRENGTH = 0.6;

  analyzePatterns(dreams: DreamEntry[]): PatternAnalysisResult {
    if (dreams.length < this.MIN_DREAMS_FOR_PATTERN) {
      return this.getEmptyResult();
    }

    const sortedDreams = this.sortDreamsByDate(dreams);
    const patterns: Pattern[] = [
      ...this.analyzeSymbolPatterns(sortedDreams),
      ...this.analyzeEmotionPatterns(sortedDreams),
      ...this.analyzeNarrativePatterns(sortedDreams),
      ...this.analyzeTimingPatterns(sortedDreams),
    ];

    const insights = this.generateInsights(patterns, sortedDreams);
    const trends = this.analyzeTrends(patterns, sortedDreams);
    const summary = this.generateSummary(patterns);

    return {
      patterns,
      insights,
      trends,
      summary,
    };
  }

  private sortDreamsByDate(dreams: DreamEntry[]): DreamEntry[] {
    return [...dreams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private analyzeSymbolPatterns(dreams: DreamEntry[]): Pattern[] {
    const symbolFrequency: Record<string, number> = {};
    const symbolDreams: Record<string, DreamEntry[]> = {};

    // Count symbol frequencies and track which dreams contain each symbol
    dreams.forEach(dream => {
      dream.symbols.forEach(symbol => {
        symbolFrequency[symbol] = (symbolFrequency[symbol] || 0) + 1;
        if (!symbolDreams[symbol]) {
          symbolDreams[symbol] = [];
        }
        symbolDreams[symbol].push(dream);
      });
    });

    const patterns: Pattern[] = [];

    // Analyze each symbol that appears frequently enough
    Object.entries(symbolFrequency).forEach(([symbol, frequency]) => {
      const relativeFrequency = frequency / dreams.length;
      
      if (relativeFrequency >= this.MIN_FREQUENCY_THRESHOLD) {
        const correlation = this.analyzeLifeCorrelation(symbolDreams[symbol]);
        const confidence = this.calculatePatternConfidence(frequency, dreams.length, correlation);
        
        patterns.push({
          type: 'symbol',
          pattern: symbol,
          frequency,
          correlation,
          insight: this.generateSymbolInsight(symbol, relativeFrequency, correlation),
          confidence,
        });
      }
    });

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  private analyzeEmotionPatterns(dreams: DreamEntry[]): Pattern[] {
    const emotionFrequency: Record<string, number> = {};
    const emotionDreams: Record<string, DreamEntry[]> = {};
    const emotionIntensities: Record<string, number[]> = {};

    dreams.forEach(dream => {
      dream.emotions.forEach(emotion => {
        emotionFrequency[emotion.name] = (emotionFrequency[emotion.name] || 0) + 1;
        
        if (!emotionDreams[emotion.name]) {
          emotionDreams[emotion.name] = [];
          emotionIntensities[emotion.name] = [];
        }
        
        emotionDreams[emotion.name].push(dream);
        emotionIntensities[emotion.name].push(emotion.intensity);
      });
    });

    const patterns: Pattern[] = [];

    Object.entries(emotionFrequency).forEach(([emotion, frequency]) => {
      const relativeFrequency = frequency / dreams.length;
      
      if (relativeFrequency >= this.MIN_FREQUENCY_THRESHOLD) {
        const correlation = this.analyzeLifeCorrelation(emotionDreams[emotion]);
        const avgIntensity = emotionIntensities[emotion].reduce((sum, val) => sum + val, 0) / emotionIntensities[emotion].length;
        const confidence = this.calculatePatternConfidence(frequency, dreams.length, correlation);
        
        patterns.push({
          type: 'emotion',
          pattern: emotion,
          frequency,
          correlation,
          insight: this.generateEmotionInsight(emotion, relativeFrequency, avgIntensity, correlation),
          confidence,
        });
      }
    });

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  private analyzeNarrativePatterns(dreams: DreamEntry[]): Pattern[] {
    const patterns: Pattern[] = [];
    
    // Analyze recurring themes in narratives
    const themeKeywords = {
      'flying': ['fly', 'flying', 'soar', 'float', 'levitate'],
      'chase': ['chase', 'chasing', 'running', 'escape', 'pursue'],
      'water': ['water', 'ocean', 'sea', 'river', 'lake', 'swimming'],
      'falling': ['fall', 'falling', 'drop', 'plunge'],
      'death': ['death', 'dying', 'dead', 'funeral'],
      'school': ['school', 'exam', 'test', 'classroom', 'teacher'],
      'work': ['work', 'job', 'office', 'boss', 'colleague'],
      'family': ['family', 'mother', 'father', 'parent', 'sibling'],
    };

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      let frequency = 0;
      const themeDreams: DreamEntry[] = [];

      dreams.forEach(dream => {
        const narrative = dream.narrative.toLowerCase();
        const hasTheme = keywords.some(keyword => narrative.includes(keyword));
        
        if (hasTheme) {
          frequency++;
          themeDreams.push(dream);
        }
      });

      const relativeFrequency = frequency / dreams.length;
      
      if (relativeFrequency >= this.MIN_FREQUENCY_THRESHOLD) {
        const correlation = this.analyzeLifeCorrelation(themeDreams);
        const confidence = this.calculatePatternConfidence(frequency, dreams.length, correlation);
        
        patterns.push({
          type: 'narrative',
          pattern: theme,
          frequency,
          correlation,
          insight: this.generateNarrativeInsight(theme, relativeFrequency, correlation),
          confidence,
        });
      }
    });

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  private analyzeTimingPatterns(dreams: DreamEntry[]): Pattern[] {
    const patterns: Pattern[] = [];
    
    // Analyze day of week patterns
    const dayOfWeekCounts: Record<string, number> = {};
    const dayOfWeekDreams: Record<string, DreamEntry[]> = {};
    
    dreams.forEach(dream => {
      const dayOfWeek = new Date(dream.date).getDay();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
      
      dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;
      if (!dayOfWeekDreams[dayName]) {
        dayOfWeekDreams[dayName] = [];
      }
      dayOfWeekDreams[dayName].push(dream);
    });

    // Find significantly high or low days
    const avgDreamsPerDay = dreams.length / 7;
    
    Object.entries(dayOfWeekCounts).forEach(([day, count]) => {
      const deviation = Math.abs(count - avgDreamsPerDay) / avgDreamsPerDay;
      
      if (deviation > 0.5 && count >= 3) { // At least 50% deviation and minimum 3 dreams
        const correlation = this.analyzeLifeCorrelation(dayOfWeekDreams[day]);
        const confidence = Math.min(0.9, deviation); // Cap confidence at 0.9 for timing patterns
        
        patterns.push({
          type: 'timing',
          pattern: day,
          frequency: count,
          correlation,
          insight: this.generateTimingInsight(day, count, avgDreamsPerDay, correlation),
          confidence,
        });
      }
    });

    return patterns;
  }

  private analyzeLifeCorrelation(dreamSubset: DreamEntry[]): LifeCorrelation {
    const lifeTagFrequency: Record<string, number> = {};
    
    dreamSubset.forEach(dream => {
      dream.lifeTags.forEach(tag => {
        lifeTagFrequency[tag] = (lifeTagFrequency[tag] || 0) + 1;
      });
    });

    // Find the most common life tag
    const sortedTags = Object.entries(lifeTagFrequency).sort((a, b) => b[1] - a[1]);
    
    if (sortedTags.length === 0) {
      return {
        eventType: 'general',
        strength: 0.1,
        description: 'No specific life context correlation found',
      };
    }

    const [mostCommonTag, tagFrequency] = sortedTags[0];
    const strength = Math.min(1.0, tagFrequency / dreamSubset.length);
    
    return {
      eventType: mostCommonTag,
      strength,
      description: this.generateCorrelationDescription(mostCommonTag, strength),
    };
  }

  private calculatePatternConfidence(frequency: number, totalDreams: number, correlation: LifeCorrelation): number {
    const frequencyScore = Math.min(1.0, frequency / totalDreams);
    const correlationScore = correlation.strength;
    const sampleSizeScore = Math.min(1.0, totalDreams / 20); // Confidence increases with more dreams
    
    return Math.min(1.0, (frequencyScore * 0.4 + correlationScore * 0.4 + sampleSizeScore * 0.2));
  }

  private generateSymbolInsight(symbol: string, frequency: number, correlation: LifeCorrelation): string {
    const frequencyDesc = frequency > 0.7 ? 'very frequently' : frequency > 0.5 ? 'frequently' : 'regularly';
    const correlationDesc = correlation.strength > this.MIN_CORRELATION_STRENGTH 
      ? ` and strongly correlates with ${correlation.eventType} in your waking life`
      : '';
    
    return `The symbol "${symbol}" appears ${frequencyDesc} in your dreams${correlationDesc}. This may represent ${this.getSymbolMeaning(symbol)}.`;
  }

  private generateEmotionInsight(emotion: string, frequency: number, avgIntensity: number, correlation: LifeCorrelation): string {
    const frequencyDesc = frequency > 0.7 ? 'very frequently' : frequency > 0.5 ? 'frequently' : 'regularly';
    const intensityDesc = avgIntensity > 7 ? 'intense' : avgIntensity > 5 ? 'moderate' : 'mild';
    const correlationDesc = correlation.strength > this.MIN_CORRELATION_STRENGTH 
      ? ` and strongly correlates with ${correlation.eventType}`
      : '';
    
    return `You experience ${emotion.toLowerCase()} ${frequencyDesc} in dreams with ${intensityDesc} intensity${correlationDesc}. This suggests ${this.getEmotionMeaning(emotion, avgIntensity)}.`;
  }

  private generateNarrativeInsight(theme: string, frequency: number, correlation: LifeCorrelation): string {
    const frequencyDesc = frequency > 0.7 ? 'very often' : frequency > 0.5 ? 'often' : 'regularly';
    const correlationDesc = correlation.strength > this.MIN_CORRELATION_STRENGTH 
      ? ` particularly when dealing with ${correlation.eventType}`
      : '';
    
    return `Dreams about ${theme} occur ${frequencyDesc}${correlationDesc}. This pattern may indicate ${this.getThemeMeaning(theme)}.`;
  }

  private generateTimingInsight(day: string, count: number, average: number, correlation: LifeCorrelation): string {
    const comparison = count > average ? 'more' : 'fewer';
    const correlationDesc = correlation.strength > this.MIN_CORRELATION_STRENGTH 
      ? ` This may relate to ${correlation.eventType} activities on ${day}s.`
      : '';
    
    return `You have ${comparison} vivid dreams on ${day}s than other days of the week.${correlationDesc}`;
  }

  private generateCorrelationDescription(eventType: string, strength: number): string {
    if (strength > 0.8) return `Very strong correlation with ${eventType}`;
    if (strength > 0.6) return `Strong correlation with ${eventType}`;
    if (strength > 0.4) return `Moderate correlation with ${eventType}`;
    return `Weak correlation with ${eventType}`;
  }

  private getSymbolMeaning(symbol: string): string {
    const meanings: Record<string, string> = {
      'water': 'emotional processing and the unconscious mind',
      'flying': 'desire for freedom and transcendence of limitations',
      'house': 'aspects of the self and personal security',
      'animals': 'instinctual behaviors and natural wisdom',
      'car': 'life direction and personal control',
      'death': 'transformation and major life changes',
      'fire': 'passion, transformation, or destructive emotions',
      'family': 'personal relationships and inner dynamics',
      'school': 'learning experiences and performance anxiety',
      'work': 'professional concerns and achievement motivations',
    };
    return meanings[symbol] || 'important personal symbolism requiring deeper reflection';
  }

  private getEmotionMeaning(emotion: string, intensity: number): string {
    const meanings: Record<string, string> = {
      'fear': intensity > 7 ? 'significant anxieties requiring attention' : 'normal processing of concerns',
      'joy': 'positive life experiences and emotional well-being',
      'anger': intensity > 7 ? 'unresolved conflicts or frustrations' : 'healthy emotional processing',
      'sadness': 'grief processing or emotional release needs',
      'anxiety': 'stress management and coping mechanisms need attention',
      'love': 'connection and relationship fulfillment',
      'excitement': 'anticipation and positive life engagement',
    };
    return meanings[emotion.toLowerCase()] || 'emotional patterns worth exploring';
  }

  private getThemeMeaning(theme: string): string {
    const meanings: Record<string, string> = {
      'flying': 'desire for freedom or escape from constraints',
      'chase': 'avoidance behaviors or feeling pressured',
      'water': 'emotional or spiritual cleansing needs',
      'falling': 'fear of losing control or failure anxiety',
      'death': 'transformation and letting go of the old',
      'school': 'performance anxiety or learning challenges',
      'work': 'career concerns or professional identity',
      'family': 'relationship dynamics and personal history',
    };
    return meanings[theme] || 'recurring life themes requiring attention';
  }

  private generateInsights(patterns: Pattern[], dreams: DreamEntry[]): PatternInsight[] {
    return patterns.map(pattern => {
      const severity = this.calculateSeverity(pattern, dreams);
      const actionable = pattern.correlation.strength > this.MIN_CORRELATION_STRENGTH;
      
      return {
        pattern,
        severity,
        actionable,
        description: pattern.insight,
        recommendation: actionable ? this.generateRecommendation(pattern) : undefined,
      };
    });
  }

  private calculateSeverity(pattern: Pattern, dreams: DreamEntry[]): 'low' | 'medium' | 'high' {
    const frequency = pattern.frequency / dreams.length;
    const confidence = pattern.confidence;
    const correlation = pattern.correlation.strength;
    
    const score = (frequency * 0.4 + confidence * 0.3 + correlation * 0.3);
    
    if (score > 0.7) return 'high';
    if (score > 0.4) return 'medium';
    return 'low';
  }

  private generateRecommendation(pattern: Pattern): string {
    const eventType = pattern.correlation.eventType;
    
    if (pattern.type === 'emotion' && ['fear', 'anxiety', 'anger'].includes(pattern.pattern.toLowerCase())) {
      return `Consider stress management techniques for ${eventType} situations`;
    }
    
    if (pattern.type === 'symbol' && pattern.pattern === 'water') {
      return 'Engage in emotional processing activities like journaling or meditation';
    }
    
    if (pattern.type === 'narrative' && pattern.pattern === 'chase') {
      return `Address avoidance patterns related to ${eventType}`;
    }
    
    return `Reflect on how ${eventType} influences your dream patterns`;
  }

  private analyzeTrends(patterns: Pattern[], dreams: DreamEntry[]): {
    improving: Pattern[];
    declining: Pattern[];
    stable: Pattern[];
  } {
    // For now, return empty arrays - trend analysis would require historical pattern data
    return {
      improving: [],
      declining: [],
      stable: patterns,
    };
  }

  private generateSummary(patterns: Pattern[]): {
    totalPatterns: number;
    significantPatterns: number;
    strongCorrelations: number;
    averageConfidence: number;
  } {
    const significantPatterns = patterns.filter(p => p.confidence > 0.6).length;
    const strongCorrelations = patterns.filter(p => p.correlation.strength > this.MIN_CORRELATION_STRENGTH).length;
    const averageConfidence = patterns.length > 0 
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length 
      : 0;

    return {
      totalPatterns: patterns.length,
      significantPatterns,
      strongCorrelations,
      averageConfidence,
    };
  }

  private getEmptyResult(): PatternAnalysisResult {
    return {
      patterns: [],
      insights: [],
      trends: { improving: [], declining: [], stable: [] },
      summary: {
        totalPatterns: 0,
        significantPatterns: 0,
        strongCorrelations: 0,
        averageConfidence: 0,
      },
    };
  }
}

// Singleton instance
const patternAnalysisService = new PatternAnalysisService();

export default patternAnalysisService;