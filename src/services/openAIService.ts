import { DreamEntry, DreamAnalysis } from '../types/dream';
import { apiClient } from './apiClient';

class OpenAIService {
  async analyzeDream(dream: DreamEntry): Promise<DreamAnalysis> {
    try {
      // Use the backend API instead of calling OpenAI directly
      const response = await apiClient.analyzeDream(dream.id);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('Dream analysis error:', error);
      throw new Error(`Failed to analyze dream: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  private parseAnalysisResponse(response: any): DreamAnalysis {
    try {
      // Response from backend is already structured
      if (typeof response === 'object' && response !== null) {
        return {
          symbolicLandscape: response.symbolicLandscape || 'No symbolic analysis available',
          emotionalUndercurrent: response.emotionalUndercurrent || 'No emotional analysis available',
          lifeIntegration: response.lifeIntegration || 'No life integration analysis available',
          personalPatterns: response.personalPatterns || 'No patterns identified',
          soulQuestions: Array.isArray(response.soulQuestions) ? response.soulQuestions : [
            'What deeper meaning might this dream hold for me?',
            'How does this dream connect to my current life situation?',
            'What emotions is my unconscious mind processing?'
          ],
          integrationPractice: response.integrationPractice || 'Take time to journal about this dream and reflect on its meaning for you.',
          confidence: response.confidence || 0.8,
          processingTime: response.processingTime || Date.now(),
        };
      }

      // If response is a string, try to parse it
      if (typeof response === 'string') {
        const parsed = JSON.parse(response);
        return this.parseAnalysisResponse(parsed);
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid response format from AI analysis');
    }
  }
}

// Singleton instance for the app
const openAIService = new OpenAIService();

export const getOpenAIService = (): OpenAIService => {
  return openAIService;
};

// Helper function for dream analysis
export const analyzeDreamWithAI = async (dream: DreamEntry): Promise<DreamAnalysis> => {
  return openAIService.analyzeDream(dream);
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