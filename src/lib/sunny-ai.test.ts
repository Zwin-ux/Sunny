import { vi, describe, it, expect, beforeEach } from 'vitest';
import { generateSunnyResponse, generateMiniChallenge } from './sunny-ai';
import OpenAI from 'openai';

// Mock the OpenAI API
vi.mock('openai', () => {
  const mockChatCompletions = {
    create: vi.fn(),
  };
  return {
    default: vi.fn(() => ({
      chat: {
        completions: mockChatCompletions,
      },
    })),
  };
});

const mockOpenAI = new OpenAI() as any;

describe('sunny-ai', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSunnyResponse', () => {
    it('should generate a streaming response from OpenAI', async () => {
      const mockStream = {
        toReadableStream: () => new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('Hello from Sunny!'));
            controller.close();
          },
        }),
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockStream);

      const conversation = [
        { role: 'user' as const, content: 'Hi Sunny!', id: '1', timestamp: 123, name: 'User', type: 'user' as const },
      ];
      const studentProfile = {
        name: 'TestKid',
        emotion: 'happy',
        learningStyle: 'visual' as const,
        difficulty: 'easy' as const,
        level: 1,
        points: 0,
        completedLessons: [],
      };

      const responseStream = await generateSunnyResponse(conversation, studentProfile);
      const reader = responseStream.getReader();
      let result = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += new TextDecoder().decode(value);
      }

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
      expect(result).toBe('Hello from Sunny!');
    });

    it('should return an error stream if OpenAI call fails', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const conversation = [
        { role: 'user' as const, content: 'Hi Sunny!', id: '1', timestamp: 123, name: 'User', type: 'user' as const },
      ];
      const studentProfile = {
        name: 'TestKid',
        emotion: 'happy',
        learningStyle: 'visual' as const,
        difficulty: 'easy' as const,
        level: 1,
        points: 0,
        completedLessons: [],
      };

      const responseStream = await generateSunnyResponse(conversation, studentProfile);
      const reader = responseStream.getReader();
      let result = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += new TextDecoder().decode(value);
      }

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
      expect(result).toBe('Error: Could not connect to Sunny. Please try again.');
    });
  });

  describe('generateMiniChallenge', () => {
    it('should generate a multiple-choice challenge', async () => {
      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              id: 'test-id-1',
              type: 'multiple-choice',
              question: 'What is 1 + 1?',
              options: ['1', '2', '3'],
              correctAnswer: '2',
              explanation: '1 + 1 equals 2.',
              points: 10,
              difficulty: 'easy',
              learningStyle: ['logical'],
            }),
          },
        }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockOpenAIResponse);

      const challenge = await generateMiniChallenge('math', 'easy', 'logical');

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
      expect(challenge).toEqual(expect.objectContaining({
        id: expect.any(String), // ID will be a new UUID
        type: 'multiple-choice',
        question: 'What is 1 + 1?',
        options: ['1', '2', '3'],
        correctAnswer: '2',
        explanation: '1 + 1 equals 2.',
        points: 10,
        difficulty: 'easy',
        learningStyle: ['logical'],
      }));
      expect(challenge.id).not.toBe('test-id-1'); // Ensure new UUID is generated
    });

    it('should return a default challenge if OpenAI call fails', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      const challenge = await generateMiniChallenge('science', 'medium', 'visual');

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
      expect(challenge).toEqual(expect.objectContaining({
        type: 'multiple-choice',
        question: 'What is 2 + 2?',
        correctAnswer: '4',
        explanation: 'When you add two and two together, you get four!',
        points: 10,
        difficulty: 'easy',
        learningStyle: ['logical'],
      }));
    });
  });
});
