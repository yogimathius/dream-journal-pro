import OpenAI from "openai/index.js";
import { env } from "../config/env";

interface DreamAnalysisInput {
  title: string;
  content: string;
  emotions?: string[];
  symbols?: string[];
  themes?: string[];
  userHistory?: Array<{
    date: Date;
    symbols: string[];
    emotions: string[];
    themes: string[];
  }>;
  analysisType?:
    | "BASIC"
    | "ADVANCED"
    | "PATTERN_RECOGNITION"
    | "PERSONAL_MYTHOLOGY";
}

interface DreamAnalysisResult {
  interpretation: string;
  symbolAnalysis: Record<string, any>;
  emotionalAnalysis: Record<string, any>;
  themes: string[];
  insights: string[];
  reflectionQuestions: string[];
  actionableAdvice?: string;
  confidence: number;
}

class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  async analyzeDream(input: DreamAnalysisInput): Promise<DreamAnalysisResult> {
    try {
      const prompt = this.buildAnalysisPrompt(input);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(input.analysisType || "BASIC"),
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      const analysisResult = JSON.parse(response) as DreamAnalysisResult;

      // Ensure confidence is a valid number between 0 and 1
      analysisResult.confidence = Math.max(
        0,
        Math.min(1, analysisResult.confidence || 0.7)
      );

      return analysisResult;
    } catch (error) {
      console.error("OpenAI analysis error:", error);
      throw new Error("Failed to analyze dream with AI");
    }
  }

  async extractSymbols(dreamContent: string): Promise<string[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a dream symbol extractor. Extract key symbols from the dream and return them as a JSON array. Focus on meaningful objects, animals, people, places, and concepts that appear in the dream.",
          },
          {
            role: "user",
            content: `Extract symbols from this dream: "${dreamContent}"`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return [];
      }

      const result = JSON.parse(response);
      return result.symbols || [];
    } catch (error) {
      console.error("Symbol extraction error:", error);
      return [];
    }
  }

  async detectPatterns(
    dreams: Array<{
      title: string;
      content: string;
      emotions: string[];
      symbols: string[];
      themes: string[];
      dreamDate: Date;
    }>
  ): Promise<
    Array<{
      type: string;
      name: string;
      description: string;
      frequency: number;
      confidence: number;
      insight: string;
    }>
  > {
    try {
      if (dreams.length < 3) {
        return []; // Need at least 3 dreams to detect patterns
      }

      const dreamsSummary = dreams.map((dream) => ({
        date: dream.dreamDate.toISOString().split("T")[0],
        symbols: dream.symbols.slice(0, 5), // Top 5 symbols
        emotions: dream.emotions.slice(0, 3), // Top 3 emotions
        themes: dream.themes.slice(0, 3), // Top 3 themes
        title: dream.title,
      }));

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are a dream pattern analyst. Analyze the provided dream data to identify recurring patterns, cycles, and insights. Look for:
            1. Symbol frequency patterns
            2. Emotional cycles
            3. Timing patterns
            4. Theme evolution
            5. Stress response patterns
            
            Return a JSON object with a "patterns" array containing pattern objects with: type, name, description, frequency, confidence (0-1), and insight.`,
          },
          {
            role: "user",
            content: `Analyze these dreams for patterns:\n${JSON.stringify(
              dreamsSummary,
              null,
              2
            )}`,
          },
        ],
        temperature: 0.6,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return [];
      }

      const result = JSON.parse(response);
      return result.patterns || [];
    } catch (error) {
      console.error("Pattern detection error:", error);
      return [];
    }
  }

  private buildAnalysisPrompt(input: DreamAnalysisInput): string {
    let prompt = `Analyze this dream:

Title: "${input.title}"
Content: "${input.content}"`;

    if (input.emotions?.length) {
      prompt += `\nIdentified Emotions: ${input.emotions.join(", ")}`;
    }

    if (input.symbols?.length) {
      prompt += `\nIdentified Symbols: ${input.symbols.join(", ")}`;
    }

    if (input.themes?.length) {
      prompt += `\nIdentified Themes: ${input.themes.join(", ")}`;
    }

    if (input.userHistory?.length) {
      prompt += `\n\nRecent Dream History (for context):`;
      input.userHistory.forEach((dream, index) => {
        prompt += `\n${index + 1}. Date: ${
          dream.date.toISOString().split("T")[0]
        }, Symbols: ${dream.symbols.join(
          ", "
        )}, Emotions: ${dream.emotions.join(", ")}`;
      });
    }

    return prompt;
  }

  private getSystemPrompt(analysisType: string): string {
    const basePrompt = `You are a skilled dream analyst with expertise in Jungian and Freudian psychology, mythology, and symbolism. Analyze dreams with psychological sophistication while being compassionate and insightful.

Return your analysis as a JSON object with this structure:
{
  "interpretation": "A comprehensive 2-3 paragraph interpretation of the dream",
  "symbolAnalysis": {
    "symbol_name": "meaning and significance in the dream context"
  },
  "emotionalAnalysis": {
    "primary_emotion": "analysis of the main emotional theme",
    "secondary_emotions": "analysis of supporting emotional elements",
    "emotional_progression": "how emotions evolved through the dream"
  },
  "themes": ["array", "of", "key", "themes"],
  "insights": ["array", "of", "personal", "insights"],
  "reflectionQuestions": ["question 1?", "question 2?", "question 3?"],
  "actionableAdvice": "practical advice for integration",
  "confidence": 0.85
}`;

    switch (analysisType) {
      case "ADVANCED":
        return (
          basePrompt +
          `\n\nProvide an advanced analysis that includes archetypal symbolism, potential shadow work, and deeper psychological insights.`
        );

      case "PATTERN_RECOGNITION":
        return (
          basePrompt +
          `\n\nFocus on identifying recurring patterns, symbols, and themes that connect to the dreamer's personal growth journey.`
        );

      case "PERSONAL_MYTHOLOGY":
        return (
          basePrompt +
          `\n\nAnalyze the dream as part of the dreamer's personal mythology and hero's journey. Look for mythological parallels and archetypal themes.`
        );

      default:
        return (
          basePrompt +
          `\n\nProvide a balanced, accessible analysis suitable for someone new to dream work.`
        );
    }
  }
}

export const openaiService = new OpenAIService();
