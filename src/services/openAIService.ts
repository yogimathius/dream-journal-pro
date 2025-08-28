import { DreamEntry, DreamAnalysis } from '../types/dream';

// OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini'; // Using the more cost-effective model for production

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

class OpenAIService {
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = {
      model: MODEL,
      maxTokens: 800,
      temperature: 0.7,
      ...config,
    };
  }

  async analyzeDream(dream: DreamEntry): Promise<DreamAnalysis> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = this.createDreamAnalysisPrompt(dream);
    
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0]?.message?.content;
      
      if (!analysisText) {
        throw new Error('No analysis received from OpenAI');
      }

      return this.parseAnalysisResponse(analysisText);
    } catch (error) {
      console.error('Dream analysis error:', error);
      throw new Error(`Failed to analyze dream: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getSystemPrompt(): string {
    return `You are a wise and compassionate dream analyst with expertise in depth psychology, Jungian analysis, and symbolic interpretation. Your role is to help people understand their dreams through thoughtful, insightful analysis that connects to their personal growth journey.

Guidelines for your analysis:
- Focus on psychological growth and self-understanding, not prediction
- Draw from Jungian concepts like archetypes, shadow work, and individuation
- Consider both universal symbols and personal meanings
- Be supportive and encouraging while offering depth
- Avoid fortune-telling or medical advice
- Keep interpretations grounded in psychological principles
- Encourage personal reflection and integration

Your response should be structured as a JSON object with these exact fields:
{
  "symbolicLandscape": "2-3 sentences connecting key symbols to the dreamer's psyche",
  "emotionalUndercurrent": "What emotions is the unconscious processing?",
  "lifeIntegration": "How does this dream relate to current waking life?",
  "personalPatterns": "Patterns and themes based on the dream content",
  "soulQuestions": ["3 deep questions for self-reflection"],
  "integrationPractice": "One specific action to bridge dream insight into waking life",
  "confidence": 0.85,
  "processingTime": 12000
}

Respond ONLY with valid JSON, no additional text.`;
  }

  private createDreamAnalysisPrompt(dream: DreamEntry): string {
    const emotionList = dream.emotions.map(e => `${e.name} (${e.intensity}/10)`).join(', ');
    const symbolList = dream.symbols.join(', ');
    const lifeContextList = dream.lifeTags.join(', ');
    
    return `Please analyze this dream:

DREAM NARRATIVE:
"${dream.narrative}"

DREAM METADATA:
- Title: ${dream.title}
- Date: ${new Date(dream.date).toLocaleDateString()}
- Lucidity Level: ${dream.lucidity}/10
- Vividness: ${dream.vividness}/10
- Sleep Quality: ${dream.sleepQuality}/10
- Emotions Present: ${emotionList || 'None specified'}
- Key Symbols: ${symbolList || 'None identified'}
- Life Context: ${lifeContextList || 'None specified'}

Provide a comprehensive psychological analysis following the JSON structure specified in the system prompt.`;
  }

  private parseAnalysisResponse(response: string): DreamAnalysis {
    try {
      // Clean the response - remove any markdown formatting or extra text
      let cleanResponse = response.trim();
      
      // Extract JSON from response if it's wrapped in other text
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      const parsed = JSON.parse(cleanResponse);
      
      // Validate required fields
      const requiredFields = [
        'symbolicLandscape',
        'emotionalUndercurrent', 
        'lifeIntegration',
        'personalPatterns',
        'soulQuestions',
        'integrationPractice'
      ];

      for (const field of requiredFields) {
        if (!parsed[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Ensure soulQuestions is an array
      if (!Array.isArray(parsed.soulQuestions)) {
        parsed.soulQuestions = [parsed.soulQuestions];
      }

      // Set defaults for optional fields
      return {
        symbolicLandscape: parsed.symbolicLandscape,
        emotionalUndercurrent: parsed.emotionalUndercurrent,
        lifeIntegration: parsed.lifeIntegration,
        personalPatterns: parsed.personalPatterns,
        soulQuestions: parsed.soulQuestions,
        integrationPractice: parsed.integrationPractice,
        confidence: parsed.confidence || 0.8,
        processingTime: parsed.processingTime || Date.now(),
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid response format from AI analysis');
    }
  }
}

// Singleton instance for the app
let openAIService: OpenAIService | null = null;

export const initializeOpenAI = (config: OpenAIConfig): void => {
  openAIService = new OpenAIService(config);
};

export const getOpenAIService = (): OpenAIService => {
  if (!openAIService) {
    throw new Error('OpenAI service not initialized. Call initializeOpenAI() first.');
  }
  return openAIService;
};

// Helper function for dream analysis
export const analyzeDreamWithAI = async (dream: DreamEntry): Promise<DreamAnalysis> => {
  const service = getOpenAIService();
  return service.analyzeDream(dream);
};

// Mock analysis for development/demo purposes
export const generateMockAnalysis = (dream: DreamEntry): Promise<DreamAnalysis> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockAnalysis: DreamAnalysis = {
        symbolicLandscape: `The ${dream.symbols[0] || 'central imagery'} in your dream represents a bridge between your conscious and unconscious mind. These symbols are inviting you to explore deeper aspects of your psyche and embrace transformation.`,
        emotionalUndercurrent: dream.emotions.length > 0 
          ? `Your dream is processing feelings of ${dream.emotions[0].name.toLowerCase()}, which suggests your psyche is working through important emotional material that needs attention in your waking life.`
          : 'This dream carries a sense of exploration and discovery, indicating your unconscious mind is seeking new perspectives and growth opportunities.',
        lifeIntegration: dream.lifeTags.length > 0
          ? `The themes of ${dream.lifeTags[0]} appearing in your dream suggest this is directly connected to your current life situation. Your unconscious is providing guidance for navigating these circumstances.`
          : 'This dream appears to be offering insights about your personal growth journey and may be preparing you for upcoming changes or opportunities.',
        personalPatterns: `The ${dream.lucidity > 7 ? 'high lucidity' : 'symbolic nature'} of this dream suggests you're developing greater self-awareness. This type of dream often appears when you're ready to integrate new insights into your conscious life.`,
        soulQuestions: [
          'What aspect of my life is calling for deeper attention or transformation?',
          'How can I honor both my conscious goals and unconscious wisdom?',
          'What would change if I fully embraced the message of this dream?'
        ],
        integrationPractice: dream.symbols.includes('water') 
          ? 'Spend time near water today - whether a bath, shower, or natural body of water - and reflect on what emotions are ready to flow and be released.'
          : 'Take a mindful walk in nature and notice what captures your attention. Let your intuition guide you to discover connections between your outer environment and inner landscape.',
        confidence: 0.82,
        processingTime: 8500,
      };
      
      resolve(mockAnalysis);
    }, 2000 + Math.random() * 3000); // 2-5 second delay to simulate processing
  });
};

export default OpenAIService;