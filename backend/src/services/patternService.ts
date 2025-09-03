import { prisma } from '../config/database';
import { openaiService } from './openaiService';

interface PatternDetectionResult {
  patterns: Array<{
    type: 'SYMBOL_FREQUENCY' | 'EMOTIONAL_CYCLE' | 'TIMING_PATTERN' | 'THEME_EVOLUTION' | 'LUCIDITY_TRIGGER' | 'STRESS_RESPONSE' | 'SEASONAL_PATTERN';
    name: string;
    description: string;
    frequency: number;
    confidence: number;
    insight: string;
    relatedSymbols: string[];
    relatedEmotions: string[];
    relatedThemes: string[];
    timeRange: number;
    firstOccurrence: Date;
    lastOccurrence: Date;
  }>;
}

export class PatternService {
  static async detectUserPatterns(userId: string, timeRangeDays: number = 90): Promise<PatternDetectionResult> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRangeDays);

      // Get user's dreams within the time range
      const dreams = await prisma.dream.findMany({
        where: {
          userId,
          dreamDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          title: true,
          content: true,
          dreamDate: true,
          emotions: true,
          symbols: true,
          themes: true,
          sleepQuality: true,
          lucidity: true,
          vividness: true,
          lifeTags: true,
        },
        orderBy: { dreamDate: 'asc' },
      });

      if (dreams.length < 3) {
        return { patterns: [] };
      }

      const patterns: any[] = [];

      // 1. Symbol frequency patterns
      const symbolPatterns = await this.detectSymbolFrequencyPatterns(dreams);
      patterns.push(...symbolPatterns);

      // 2. Emotional cycle patterns
      const emotionalPatterns = await this.detectEmotionalCycles(dreams);
      patterns.push(...emotionalPatterns);

      // 3. Timing patterns
      const timingPatterns = await this.detectTimingPatterns(dreams);
      patterns.push(...timingPatterns);

      // 4. Theme evolution patterns
      const themePatterns = await this.detectThemeEvolution(dreams);
      patterns.push(...themePatterns);

      // 5. Lucidity trigger patterns
      const lucidityPatterns = await this.detectLucidityTriggers(dreams);
      patterns.push(...lucidityPatterns);

      // 6. Use AI for advanced pattern detection
      if (dreams.length >= 5) {
        const aiPatterns = await openaiService.detectPatterns(dreams);
        const convertedAiPatterns = aiPatterns.map(pattern => ({
          type: this.mapAiPatternType(pattern.type),
          name: pattern.name,
          description: pattern.description,
          frequency: pattern.frequency,
          confidence: pattern.confidence,
          insight: pattern.insight,
          relatedSymbols: [],
          relatedEmotions: [],
          relatedThemes: [],
          timeRange: timeRangeDays,
          firstOccurrence: dreams[0].dreamDate,
          lastOccurrence: dreams[dreams.length - 1].dreamDate,
        }));
        patterns.push(...convertedAiPatterns);
      }

      // Sort by confidence and remove duplicates
      const uniquePatterns = this.deduplicatePatterns(patterns)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10); // Top 10 patterns

      return { patterns: uniquePatterns };
    } catch (error) {
      console.error('Pattern detection error:', error);
      return { patterns: [] };
    }
  }

  private static async detectSymbolFrequencyPatterns(dreams: any[]): Promise<any[]> {
    const symbolCount: Record<string, { count: number; dreams: any[] }> = {};
    const totalDreams = dreams.length;

    dreams.forEach(dream => {
      dream.symbols.forEach((symbol: string) => {
        if (!symbolCount[symbol]) {
          symbolCount[symbol] = { count: 0, dreams: [] };
        }
        symbolCount[symbol].count++;
        symbolCount[symbol].dreams.push(dream);
      });
    });

    const patterns = [];
    for (const [symbol, data] of Object.entries(symbolCount)) {
      const frequency = data.count;
      const percentage = (frequency / totalDreams) * 100;
      
      if (frequency >= 3 && percentage >= 20) { // Appears in at least 3 dreams and 20% of dreams
        const confidence = Math.min(percentage / 100, 0.95);
        
        patterns.push({
          type: 'SYMBOL_FREQUENCY',
          name: `Recurring Symbol: ${symbol}`,
          description: `The symbol "${symbol}" appears frequently in your dreams (${frequency} times, ${percentage.toFixed(1)}% of dreams)`,
          frequency,
          confidence,
          insight: `This recurring symbol may represent an important aspect of your psyche that is seeking attention or integration.`,
          relatedSymbols: [symbol],
          relatedEmotions: this.extractCommonEmotions(data.dreams),
          relatedThemes: this.extractCommonThemes(data.dreams),
          timeRange: this.calculateTimeRange(data.dreams),
          firstOccurrence: data.dreams[0].dreamDate,
          lastOccurrence: data.dreams[data.dreams.length - 1].dreamDate,
        });
      }
    }

    return patterns;
  }

  private static async detectEmotionalCycles(dreams: any[]): Promise<any[]> {
    const patterns = [];
    
    // Group dreams by week
    const weeklyEmotions: Record<string, string[]> = {};
    dreams.forEach(dream => {
      const week = this.getWeekKey(dream.dreamDate);
      if (!weeklyEmotions[week]) {
        weeklyEmotions[week] = [];
      }
      weeklyEmotions[week].push(...dream.emotions);
    });

    // Look for emotional patterns
    const weeks = Object.keys(weeklyEmotions).sort();
    if (weeks.length >= 4) {
      const emotionTrends = this.analyzeEmotionTrends(weeklyEmotions, weeks);
      patterns.push(...emotionTrends);
    }

    return patterns;
  }

  private static async detectTimingPatterns(dreams: any[]): Promise<any[]> {
    const patterns = [];
    
    // Day of week analysis
    const dayOfWeekCount: Record<string, number> = {};
    dreams.forEach(dream => {
      const dayOfWeek = dream.dreamDate.toLocaleDateString('en-US', { weekday: 'long' });
      dayOfWeekCount[dayOfWeek] = (dayOfWeekCount[dayOfWeek] || 0) + 1;
    });

    const mostCommonDay = Object.entries(dayOfWeekCount)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostCommonDay && mostCommonDay[1] >= 3) {
      patterns.push({
        type: 'TIMING_PATTERN',
        name: `${mostCommonDay[0]} Dream Pattern`,
        description: `You tend to have more memorable dreams on ${mostCommonDay[0]}s`,
        frequency: mostCommonDay[1],
        confidence: Math.min(mostCommonDay[1] / dreams.length, 0.8),
        insight: `Your dream recall or intensity may be influenced by your ${mostCommonDay[0]} routine or mindset.`,
        relatedSymbols: [],
        relatedEmotions: [],
        relatedThemes: [],
        timeRange: this.calculateTimeRange(dreams),
        firstOccurrence: dreams[0].dreamDate,
        lastOccurrence: dreams[dreams.length - 1].dreamDate,
      });
    }

    return patterns;
  }

  private static async detectThemeEvolution(dreams: any[]): Promise<any[]> {
    const patterns = [];
    
    // Split dreams into early and late periods
    const midpoint = Math.floor(dreams.length / 2);
    const earlyDreams = dreams.slice(0, midpoint);
    const lateDreams = dreams.slice(midpoint);

    const earlyThemes = this.getThemeFrequency(earlyDreams);
    const lateThemes = this.getThemeFrequency(lateDreams);

    // Find themes that have increased or decreased
    const evolvingThemes = this.findEvolvingThemes(earlyThemes, lateThemes);
    
    evolvingThemes.forEach(theme => {
      patterns.push({
        type: 'THEME_EVOLUTION',
        name: `Evolving Theme: ${theme.theme}`,
        description: theme.description,
        frequency: theme.frequency,
        confidence: theme.confidence,
        insight: theme.insight,
        relatedSymbols: [],
        relatedEmotions: [],
        relatedThemes: [theme.theme],
        timeRange: this.calculateTimeRange(dreams),
        firstOccurrence: dreams[0].dreamDate,
        lastOccurrence: dreams[dreams.length - 1].dreamDate,
      });
    });

    return patterns;
  }

  private static async detectLucidityTriggers(dreams: any[]): Promise<any[]> {
    const patterns = [];
    const lucidDreams = dreams.filter(dream => dream.lucidity && dream.lucidity >= 7);
    
    if (lucidDreams.length >= 2) {
      // Find common elements in lucid dreams
      const commonSymbols = this.findCommonElements(lucidDreams, 'symbols');
      const commonEmotions = this.findCommonElements(lucidDreams, 'emotions');
      const commonThemes = this.findCommonElements(lucidDreams, 'themes');

      if (commonSymbols.length > 0 || commonEmotions.length > 0) {
        patterns.push({
          type: 'LUCIDITY_TRIGGER',
          name: 'Lucidity Triggers',
          description: `Elements that appear to trigger lucid dreaming`,
          frequency: lucidDreams.length,
          confidence: Math.min(lucidDreams.length / dreams.length * 2, 0.9),
          insight: `These elements may serve as dream signs to help increase lucidity awareness.`,
          relatedSymbols: commonSymbols,
          relatedEmotions: commonEmotions,
          relatedThemes: commonThemes,
          timeRange: this.calculateTimeRange(dreams),
          firstOccurrence: dreams[0].dreamDate,
          lastOccurrence: dreams[dreams.length - 1].dreamDate,
        });
      }
    }

    return patterns;
  }

  private static mapAiPatternType(aiType: string): string {
    const mapping: Record<string, string> = {
      'symbol': 'SYMBOL_FREQUENCY',
      'emotion': 'EMOTIONAL_CYCLE',
      'timing': 'TIMING_PATTERN',
      'theme': 'THEME_EVOLUTION',
      'stress': 'STRESS_RESPONSE',
      'seasonal': 'SEASONAL_PATTERN',
    };
    
    return mapping[aiType.toLowerCase()] || 'SYMBOL_FREQUENCY';
  }

  private static deduplicatePatterns(patterns: any[]): any[] {
    const seen = new Set();
    return patterns.filter(pattern => {
      const key = `${pattern.type}-${pattern.name}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private static extractCommonEmotions(dreams: any[]): string[] {
    const emotionCount: Record<string, number> = {};
    dreams.forEach(dream => {
      dream.emotions.forEach((emotion: string) => {
        emotionCount[emotion] = (emotionCount[emotion] || 0) + 1;
      });
    });
    
    return Object.entries(emotionCount)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([emotion]) => emotion);
  }

  private static extractCommonThemes(dreams: any[]): string[] {
    const themeCount: Record<string, number> = {};
    dreams.forEach(dream => {
      dream.themes.forEach((theme: string) => {
        themeCount[theme] = (themeCount[theme] || 0) + 1;
      });
    });
    
    return Object.entries(themeCount)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([theme]) => theme);
  }

  private static calculateTimeRange(dreams: any[]): number {
    if (dreams.length < 2) return 0;
    const first = dreams[0].dreamDate;
    const last = dreams[dreams.length - 1].dreamDate;
    return Math.ceil((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
  }

  private static getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week}`;
  }

  private static getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private static analyzeEmotionTrends(weeklyEmotions: Record<string, string[]>, weeks: string[]): any[] {
    // Simplified emotion trend analysis
    return [];
  }

  private static getThemeFrequency(dreams: any[]): Record<string, number> {
    const themeCount: Record<string, number> = {};
    dreams.forEach(dream => {
      dream.themes.forEach((theme: string) => {
        themeCount[theme] = (themeCount[theme] || 0) + 1;
      });
    });
    return themeCount;
  }

  private static findEvolvingThemes(early: Record<string, number>, late: Record<string, number>): any[] {
    return [];
  }

  private static findCommonElements(dreams: any[], field: string): string[] {
    const elementCount: Record<string, number> = {};
    dreams.forEach(dream => {
      dream[field].forEach((element: string) => {
        elementCount[element] = (elementCount[element] || 0) + 1;
      });
    });
    
    return Object.entries(elementCount)
      .filter(([, count]) => count >= 2)
      .map(([element]) => element);
  }
}