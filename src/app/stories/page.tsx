/**
 * Story Builder Page - AI-powered story generation
 * NEW feature for Learning OS
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, RefreshCw, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/ui/TabNavigation';
import { getCurrentUser } from '@/lib/auth';
import { getOpenAIClient } from '@/lib/sunny-ai';

interface StoryParams {
  protagonist: string;
  setting: string;
  challenge: string;
  topic: string; // Educational topic to weave in
  length: 'short' | 'medium' | 'long';
}

export default function StoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [storyParams, setStoryParams] = useState<StoryParams>({
    protagonist: '',
    setting: '',
    challenge: '',
    topic: '',
    length: 'medium'
  });
  const [generatedStory, setGeneratedStory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Get user
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);

    // Set default protagonist to user's name
    if (currentUser.name || currentUser.childName) {
      setStoryParams(prev => ({
        ...prev,
        protagonist: currentUser.childName || currentUser.name || 'Alex'
      }));
    }
  }, [router]);

  // Auto-generate if params provided
  useEffect(() => {
    const topic = searchParams.get('topic');
    if (topic && user && !generatedStory) {
      setStoryParams(prev => ({ ...prev, topic }));
      // Could auto-generate here
    }
  }, [searchParams, user, generatedStory]);

  const generateStory = async () => {
    if (!storyParams.protagonist || !storyParams.topic) {
      alert('Please fill in at least your name and a topic!');
      return;
    }

    setIsGenerating(true);
    setGeneratedStory('');

    try {
      const client = getOpenAIClient();

      const lengthWords = {
        short: '200-300',
        medium: '400-600',
        long: '800-1000'
      };

      const prompt = `Write an educational story for a child aged 6-10 with these details:

Protagonist: ${storyParams.protagonist}
${storyParams.setting ? `Setting: ${storyParams.setting}` : ''}
${storyParams.challenge ? `Challenge/Problem: ${storyParams.challenge}` : ''}
Educational Topic: ${storyParams.topic}
Length: ${lengthWords[storyParams.length]} words

Requirements:
- Make it fun and engaging for children
- Weave in educational content about ${storyParams.topic} naturally
- Include a problem that ${storyParams.protagonist} solves using knowledge about ${storyParams.topic}
- Use age-appropriate language (grades 1-5)
- Include dialogue and description
- Have a positive, encouraging message
- Add some emojis for fun
- End with a lesson learned

The story should teach about ${storyParams.topic} while being entertaining!`;

      const response = await client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a creative children\'s story writer who makes learning fun. You write engaging, educational stories that teach important concepts in an entertaining way.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1500
      });

      const story = response.choices[0].message.content || '';
      setGeneratedStory(story);

    } catch (error) {
      console.error('Error generating story:', error);

      // Fallback story
      const fallbackStory = `Once upon a time, there was a curious child named ${storyParams.protagonist} who loved learning about ${storyParams.topic}!

One sunny morning, ${storyParams.protagonist} discovered something amazing about ${storyParams.topic}...

Every day is an adventure when you're curious and love to learn! ✨

The End! 🌟`;

      setGeneratedStory(fallbackStory);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetStory = () => {
    setGeneratedStory('');
    setStoryParams(prev => ({
      ...prev,
      setting: '',
      challenge: '',
      topic: ''
    }));
  };

  if (!user) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">☀️</div>
            <p className="text-xl text-gray-600">Loading...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-5xl font-black mb-4">Story Builder</h1>
          <p className="text-xl text-gray-600">
            Create your own personalized learning adventure!
          </p>
        </motion.div>

        {!generatedStory ? (
          /* Story Form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <h2 className="text-2xl font-bold mb-6">Tell me about your story...</h2>

            <div className="space-y-6">
              {/* Protagonist */}
              <div>
                <label className="block font-bold mb-2">
                  Who is the hero? (Your name!) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={storyParams.protagonist}
                  onChange={(e) => setStoryParams(prev => ({ ...prev, protagonist: e.target.value }))}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border-2 border-black rounded-lg font-medium"
                />
              </div>

              {/* Topic */}
              <div>
                <label className="block font-bold mb-2">
                  What do you want to learn about? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={storyParams.topic}
                  onChange={(e) => setStoryParams(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="e.g., dinosaurs, space, ocean animals, math..."
                  className="w-full px-4 py-3 border-2 border-black rounded-lg font-medium"
                />
              </div>

              {/* Setting */}
              <div>
                <label className="block font-bold mb-2">
                  Where does the story happen? (Optional)
                </label>
                <input
                  type="text"
                  value={storyParams.setting}
                  onChange={(e) => setStoryParams(prev => ({ ...prev, setting: e.target.value }))}
                  placeholder="e.g., a magical forest, outer space, underwater..."
                  className="w-full px-4 py-3 border-2 border-black rounded-lg font-medium"
                />
              </div>

              {/* Challenge */}
              <div>
                <label className="block font-bold mb-2">
                  What challenge or problem should you solve? (Optional)
                </label>
                <input
                  type="text"
                  value={storyParams.challenge}
                  onChange={(e) => setStoryParams(prev => ({ ...prev, challenge: e.target.value }))}
                  placeholder="e.g., helping a lost animal, solving a mystery..."
                  className="w-full px-4 py-3 border-2 border-black rounded-lg font-medium"
                />
              </div>

              {/* Length */}
              <div>
                <label className="block font-bold mb-2">
                  How long should the story be?
                </label>
                <div className="flex gap-4">
                  {(['short', 'medium', 'long'] as const).map((length) => (
                    <button
                      key={length}
                      onClick={() => setStoryParams(prev => ({ ...prev, length }))}
                      className={`
                        px-6 py-3 rounded-lg border-2 border-black font-bold capitalize
                        ${storyParams.length === length
                          ? 'bg-blue-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white hover:bg-gray-50'
                        }
                      `}
                    >
                      {length}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateStory}
                disabled={isGenerating || !storyParams.protagonist || !storyParams.topic}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 text-lg font-bold rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Creating Your Story...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Story!
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          /* Generated Story Display */
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  Your Story
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => alert('Share feature coming soon!')}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => alert('Download feature coming soon!')}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="prose prose-lg max-w-none">
                {generatedStory.split('\n\n').map((paragraph, index) => (
                  <motion.p
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="mb-4 text-gray-800 leading-relaxed"
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </div>
            </motion.div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={resetStory}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-900 px-8 py-6 text-lg font-bold rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Create New Story
              </Button>
              <Button
                onClick={generateStory}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-6 text-lg font-bold rounded-xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Regenerate
              </Button>
            </div>
          </div>
        )}

        {/* Story Ideas */}
        {!generatedStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 p-6 bg-yellow-100 rounded-2xl border-2 border-black"
          >
            <h3 className="font-bold text-lg mb-3">💡 Story Ideas:</h3>
            <ul className="space-y-2 text-sm">
              <li>• Learn about the solar system while helping an alien find their way home</li>
              <li>• Discover how plants grow while solving a garden mystery</li>
              <li>• Understand fractions by sharing treasure with pirate friends</li>
              <li>• Explore ocean animals while diving for lost artifacts</li>
              <li>• Learn about weather by helping animals prepare for a storm</li>
            </ul>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
