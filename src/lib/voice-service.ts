import OpenAI from 'openai';
import { logger } from './logger';

export class VoiceService {
  private openai: OpenAI | null = null;
  private audioCache = new Map<string, string>(); // Cache audio URLs

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Convert text to speech using OpenAI TTS
   * Returns audio data as base64 or URL
   */
  async textToSpeech(
    text: string,
    options?: {
      voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
      speed?: number; // 0.25 to 4.0
      model?: 'tts-1' | 'tts-1-hd';
    }
  ): Promise<{ audio: string; format: 'mp3' }> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    // Check cache
    const cacheKey = `${text}-${options?.voice || 'nova'}`;
    if (this.audioCache.has(cacheKey)) {
      return {
        audio: this.audioCache.get(cacheKey)!,
        format: 'mp3',
      };
    }

    try {
      const response = await this.openai.audio.speech.create({
        model: options?.model || 'tts-1',
        voice: options?.voice || 'nova', // Warm, friendly voice
        input: text,
        speed: options?.speed || 1.0,
      });

      // Convert to base64 for easy transmission
      const buffer = Buffer.from(await response.arrayBuffer());
      const base64Audio = buffer.toString('base64');

      // Cache for reuse
      this.audioCache.set(cacheKey, base64Audio);

      logger.info('Generated speech', {
        textLength: text.length,
        voice: options?.voice || 'nova',
      });

      return {
        audio: base64Audio,
        format: 'mp3',
      };
    } catch (error) {
      logger.error('TTS generation failed', error as Error);
      throw new Error('Failed to generate speech');
    }
  }

  /**
   * Generate speech for Sunny's responses
   * Adds personality and warmth
   */
  async speakAsSunny(message: string): Promise<{ audio: string; format: 'mp3' }> {
    // Add natural pauses and emphasis
    const processedText = this.addNaturalSpeech(message);

    return this.textToSpeech(processedText, {
      voice: 'nova', // Sunny's voice
      speed: 0.95, // Slightly slower for clarity
      model: 'tts-1', // Fast generation
    });
  }

  /**
   * Add SSML-like markup for natural speech
   */
  private addNaturalSpeech(text: string): string {
    return text
      .replace(/\.\.\./g, '... ') // Add pause after ellipsis
      .replace(/!/g, '! ') // Pause after excitement
      .replace(/\?/g, '? ') // Pause after questions
      .replace(/🎉|⭐|🌟|☀️|💪|😊|🎨|🌈/g, '') // Remove emojis (can't speak them)
      .trim();
  }

  /**
   * Clear audio cache (for memory management)
   */
  clearCache(): void {
    this.audioCache.clear();
  }
}

// Singleton instance
export const voiceService = new VoiceService();
