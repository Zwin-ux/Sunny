# 🚀 MVP Quick Start Guide

## Start Here: First 3 Steps

### Step 1: Set Up Waitlist Database (15 min)

1. **Open Supabase Dashboard**: https://app.supabase.com/project/xlekrmhquzkyjzgjtrip/editor

2. **Run this SQL** in the SQL Editor:

```sql
-- Create waitlist table
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('parent', 'teacher', 'student', 'other')),
  status TEXT DEFAULT 'pending',
  position INTEGER,
  signed_up_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Auto-increment position
CREATE OR REPLACE FUNCTION set_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.position IS NULL THEN
    SELECT COALESCE(MAX(position), 0) + 1 INTO NEW.position FROM waitlist;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_waitlist_position
BEFORE INSERT ON waitlist
FOR EACH ROW
EXECUTE FUNCTION set_waitlist_position();

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Public can insert (join waitlist)
CREATE POLICY "Anyone can join waitlist"
ON waitlist FOR INSERT
TO anon
WITH CHECK (true);

-- Users can view their own entry
CREATE POLICY "Users can view own entry"
ON waitlist FOR SELECT
TO anon
USING (email = current_setting('request.jwt.claims', true)::json->>'email');
```

3. **Test it**: Insert a test row:
```sql
INSERT INTO waitlist (email, name) VALUES ('test@example.com', 'Test User');
SELECT * FROM waitlist;
```

### Step 2: Create Waitlist API (20 min)

Create `src/appvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv/api/waitlist/join/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    // Check if already exists
    const { data: existing } = await supabase
      .from('waitlist')
      .select('position')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({
        message: 'Already on waitlist',
        position: existing.position,
      });
    }

    // Add to waitlist
    const { data, error } = await supabase
      .from('waitlist')
      .insert({ email, name })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: 'Successfully joined!',
      position: data.position,
    });
  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
}
```

### Step 3: Create Simple Landing Page (30 min)

Replace `src/app/page.tsx` with:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function Home() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [position, setPosition] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setPosition(data.position);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 via-orange-50 to-white">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* Hero */}
          <div className="text-8xl mb-6">☀️</div>
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Meet Sunny
          </h1>
          <p className="text-2xl text-gray-600 mb-8">
            Your child's AI learning companion that adapts to how they learn
          </p>

          {/* Waitlist Form */}
          {status === 'success' ? (
            <Card className="p-8 bg-green-50 border-green-200 max-w-md mx-auto">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                You're on the list!
              </h2>
              <p className="text-green-700 mb-4">
                You're <span className="font-bold">#{position}</span> in line
              </p>
              <p className="text-sm text-green-600">
                We'll email you when it's your turn!
              </p>
            </Card>
          ) : (
            <Card className="p-8 max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-4">Join the Waitlist</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                />
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
                <Button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                >
                  {status === 'loading' ? 'Joining...' : 'Get Early Access'}
                </Button>
              </form>
              {status === 'error' && (
                <p className="text-red-600 text-sm mt-2">
                  Something went wrong. Please try again.
                </p>
              )}
            </Card>
          )}

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="p-6">
              <div className="text-4xl mb-3">🧠</div>
              <h3 className="font-bold mb-2">Adaptive Learning</h3>
              <p className="text-gray-600 text-sm">
                Adjusts difficulty in real-time based on your child's performance
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-bold mb-2">Personalized Missions</h3>
              <p className="text-gray-600 text-sm">
                Every question generated specifically for your child's level
              </p>
            </div>
            <div className="p-6">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-bold mb-2">Progress Tracking</h3>
              <p className="text-gray-600 text-sm">
                See exactly what they're learning and where they excel
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Test It!

1. **Start dev server**:
```bash
npm run dev
```

2. **Visit**: http://localhost:3000

3. **Test waitlist**:
   - Enter your email
   - Click "Get Early Access"
   - Should see success message with position

4. **Check database**:
   - Go to Supabase → Table Editor → waitlist
   - Should see your entry

## Next Steps

Once the basic waitlist is working:

1. **Add email notifications** (use Resend)
2. **Create demo experience** (`/demo` page)
3. **Polish landing page** (add testimonials, more features)
4. **Deploy to Vercel**

## Quick Wins

### Add Social Proof
```typescript
<p className="text-sm text-gray-500 mt-4">
  Join {count}+ parents waiting for early access
</p>
```

### Add Referral Tracking
```typescript
const referral = searchParams.get('ref');
// Save referral source in waitlist entry
```

### Add Loading Animation
```typescript
{status === 'loading' && (
  <div className="animate-spin">⏳</div>
)}
```

## Troubleshooting

### "Service unavailable"
- Check Supabase env vars are set
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct

### "Failed to join waitlist"
- Check browser console for errors
- Verify RLS policies are enabled
- Test SQL query directly in Supabase

### Email already exists
- This is expected behavior
- Returns existing position

## Resources

- **Full Plan**: `MVP_IMPLEMENTATION_PLAN.md`
- **Supabase Dashboard**: https://app.supabase.com
- **Vercel Dashboard**: https://vercel.com
- **Design Inspiration**: https://linear.app, https://cal.com

---

**Time to MVP**: ~2 hours for basic waitlist, 2 weeks for full experience

**Let's ship it!** 🚀
