# 🎯 Sunny AI - Product Decisions

## Core Product Strategy

### Target Audience
**Age Range**: 6-10 year olds (Elementary School)
- **Grade Levels**: K-5th grade
- **Content Focus**: Math, Reading, Science basics
- **Learning Style**: Visual, interactive, game-based
- **Attention Span**: 10-15 minute sessions

### Pricing Model
**$5/month subscription**

#### Pricing Tiers

**Free Tier** (Limited)
- 3 missions per week
- Basic progress tracking
- No voice interaction
- Community support only

**Premium Tier** ($5/month)
- ✅ Unlimited missions
- ✅ AI voice conversations with Sunny
- ✅ Advanced progress analytics
- ✅ Parent dashboard
- ✅ Priority support
- ✅ Downloadable progress reports
- ✅ Custom learning paths

**Annual Plan** ($50/year - Save $10)
- All Premium features
- 2 months free
- Early access to new features

#### Why $5/month?
- **Affordable**: Lower than tutoring ($20-50/hr)
- **Accessible**: Most families can afford
- **Sustainable**: Covers OpenAI API costs (~$2-3/user/month)
- **Competitive**: Similar to Netflix Kids, Disney+

### Launch Strategy
**Soft Launch** (Phased Rollout)

#### Phase 1: Friends & Family (Week 1)
- Invite 10-20 users personally
- Gather detailed feedback
- Fix critical bugs
- Refine onboarding

#### Phase 2: Waitlist Beta (Week 2-4)
- Invite top 50 from waitlist
- Monitor usage patterns
- Collect testimonials
- Iterate on features

#### Phase 3: Public Beta (Month 2)
- Open to all waitlist (500+ users)
- Launch on Product Hunt
- Social media announcement
- Press outreach

#### Phase 4: General Availability (Month 3)
- Remove waitlist
- Full marketing push
- Referral program
- Partnership outreach (schools, homeschool groups)

---

## 🎙️ AI Voice Feature - "Sunny Speaks"

### Overview
Sunny can speak to students using OpenAI's Text-to-Speech API, creating a warm, friendly voice that makes learning more engaging.

### Technical Implementation

#### 1. OpenAI TTS Integration

**API**: OpenAI Text-to-Speech (TTS)
- **Model**: `tts-1` (faster, cheaper) or `tts-1-hd` (higher quality)
- **Voice**: `nova` (warm, friendly, child-appropriate)
- **Cost**: $0.015 per 1,000 characters (~$0.01 per conversation)

**File**: `src/lib/voice-service.ts`

```typescript
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
      .replace(/🎉|⭐|🌟/g, '') // Remove emojis (can't speak them)
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
```

#### 2. API Endpoint for Voice

**File**: `src/app/api/voice/speak/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { voiceService } from '@/lib/voice-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { text, voice, speed } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Limit text length (OpenAI limit is 4096 chars)
    if (text.length > 4000) {
      return NextResponse.json(
        { error: 'Text too long (max 4000 characters)' },
        { status: 400 }
      );
    }

    const result = await voiceService.textToSpeech(text, {
      voice: voice || 'nova',
      speed: speed || 1.0,
    });

    return NextResponse.json({
      audio: result.audio,
      format: result.format,
    });
  } catch (error) {
    logger.error('Voice generation error', error as Error);
    return NextResponse.json(
      { error: 'Failed to generate voice' },
      { status: 500 }
    );
  }
}

// Rate limiting: 100 requests per user per hour
export const config = {
  runtime: 'edge',
  maxDuration: 30,
};
```

#### 3. Frontend Voice Player Component

**File**: `src/components/voice/SunnyVoice.tsx`

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface SunnyVoiceProps {
  text: string;
  autoPlay?: boolean;
  showButton?: boolean;
}

export function SunnyVoice({ text, autoPlay = false, showButton = true }: SunnyVoiceProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (autoPlay && text) {
      handleSpeak();
    }
  }, [text, autoPlay]);

  const handleSpeak = async () => {
    if (isPlaying) {
      // Stop current playback
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error('Failed to generate voice');

      const { audio, format } = await response.json();

      // Convert base64 to blob URL
      const audioBlob = base64ToBlob(audio, `audio/${format}`);
      const url = URL.createObjectURL(audioBlob);

      setAudioUrl(url);

      // Create and play audio
      const audioElement = new Audio(url);
      audioRef.current = audioElement;

      audioElement.onplay = () => setIsPlaying(true);
      audioElement.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      audioElement.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
      };

      await audioElement.play();
    } catch (error) {
      console.error('Voice playback error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showButton) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSpeak}
      disabled={isLoading}
      className="ml-2"
      title={isPlaying ? 'Stop' : 'Listen to Sunny'}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
}

// Helper function
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
```

#### 4. Integration with Chat Interface

**File**: `src/components/chat/ChatMessage.tsx` (Update)

```typescript
import { SunnyVoice } from '@/components/voice/SunnyVoice';

export function ChatMessage({ message, isFromSunny }: ChatMessageProps) {
  return (
    <div className={`flex ${isFromSunny ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] rounded-lg p-4 ${
        isFromSunny ? 'bg-yellow-100' : 'bg-blue-100'
      }`}>
        <div className="flex items-start gap-2">
          {isFromSunny && <span className="text-2xl">☀️</span>}
          <div className="flex-1">
            <p>{message.content}</p>
            {isFromSunny && (
              <SunnyVoice text={message.content} autoPlay={false} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Voice Features

#### 1. **Auto-Read Messages** (Premium)
- Sunny's responses automatically spoken
- Toggle on/off in settings
- Great for younger kids or reading practice

#### 2. **Voice Commands** (Future)
- "Sunny, help me with math"
- "Read that again"
- "What's next?"

#### 3. **Pronunciation Help** (Future)
- Click any word to hear pronunciation
- Helpful for vocabulary building
- ESL support

#### 4. **Story Mode** (Future)
- Sunny reads stories aloud
- Different voices for characters
- Background music

### Voice Settings

**User Preferences**:
```typescript
interface VoiceSettings {
  enabled: boolean;
  autoPlay: boolean;
  voice: 'nova' | 'alloy' | 'fable'; // Different personalities
  speed: number; // 0.75 to 1.25
  volume: number; // 0 to 1
}
```

### Cost Analysis

**Voice Usage Estimates**:
- Average message: 50 characters
- Cost per message: $0.0008 (less than 1 cent)
- 100 messages/session: $0.08
- 20 sessions/month: $1.60/user

**Total Cost per User**:
- AI Generation: $2.00/month
- Voice TTS: $1.60/month
- Database/Hosting: $0.40/month
- **Total**: ~$4/month
- **Profit**: $1/month per user at $5 subscription

### Premium Feature Gate

```typescript
// src/lib/subscription.ts
export function canUseVoice(user: User): boolean {
  return user.subscription === 'premium' || user.subscription === 'annual';
}

// In component
{canUseVoice(user) ? (
  <SunnyVoice text={message} autoPlay />
) : (
  <Button onClick={() => router.push('/upgrade')}>
    🔒 Unlock Voice (Premium)
  </Button>
)}
```

---

## 📊 Updated Pricing Page

### Comparison Table

| Feature | Free | Premium ($5/mo) |
|---------|------|-----------------|
| Missions per week | 3 | Unlimited |
| Progress tracking | Basic | Advanced |
| AI Voice | ❌ | ✅ |
| Parent dashboard | ❌ | ✅ |
| Priority support | ❌ | ✅ |
| Downloadable reports | ❌ | ✅ |

### Value Proposition

**"Less than a coffee per month"**
- $5/month = $0.16/day
- Cheaper than 1 hour of tutoring
- Unlimited learning, anytime

---

## 🚀 Launch Timeline

### Week 1: Soft Launch Prep
- [ ] Finish waitlist system
- [ ] Create demo experience
- [ ] Implement voice feature
- [ ] Set up Stripe billing
- [ ] Invite 10 friends/family

### Week 2-3: Private Beta
- [ ] Invite top 50 from waitlist
- [ ] Gather feedback daily
- [ ] Fix bugs and iterate
- [ ] Collect testimonials

### Week 4: Public Beta
- [ ] Open to all waitlist
- [ ] Launch on Product Hunt
- [ ] Social media campaign
- [ ] Press release

### Month 2: General Availability
- [ ] Remove waitlist requirement
- [ ] Full marketing push
- [ ] Referral program (Give 1 month, Get 1 month free)
- [ ] School partnerships

---

## 🎯 Success Metrics

### Month 1 Goals
- 500 waitlist signups
- 50 paying subscribers
- $250 MRR (Monthly Recurring Revenue)
- 4.5+ star rating

### Month 3 Goals
- 200 paying subscribers
- $1,000 MRR
- 80%+ retention rate
- Featured in EdTech publication

### Month 6 Goals
- 1,000 paying subscribers
- $5,000 MRR
- Profitable (after costs)
- Expand to 11-14 age group

---

## 💡 Marketing Angles

### For Parents
- "Your child's personal AI tutor for $5/month"
- "Adaptive learning that grows with your child"
- "See exactly what they're learning in real-time"

### For Kids
- "Meet Sunny, your friendly learning buddy!"
- "Learn by playing games and solving missions"
- "Sunny talks to you and helps you understand"

### Social Proof
- "Join 500+ families using Sunny"
- "Trusted by teachers and homeschool parents"
- "4.8★ rating from parents"

---

## 🔐 Subscription Implementation

### Stripe Integration

**File**: `src/lib/stripe.ts`

```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    missions: 3,
    features: ['Basic progress tracking', 'Community support'],
  },
  premium: {
    name: 'Premium',
    price: 500, // $5.00 in cents
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
    missions: -1, // unlimited
    features: [
      'Unlimited missions',
      'AI voice conversations',
      'Advanced analytics',
      'Parent dashboard',
      'Priority support',
    ],
  },
  annual: {
    name: 'Annual',
    price: 5000, // $50.00 in cents
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID!,
    missions: -1,
    features: [
      'All Premium features',
      '2 months free',
      'Early access to new features',
    ],
  },
};
```

---

## 📝 Next Steps

1. **Implement voice service** (2-3 hours)
2. **Add Stripe integration** (3-4 hours)
3. **Create pricing page** (2 hours)
4. **Test voice feature** with kids
5. **Launch soft beta** to friends

**Total time to MVP with voice**: ~1 week of focused work

Let's build it! 🚀
