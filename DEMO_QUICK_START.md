# Sunny AI - Demo Quick Start 🚀

## 5-Minute Setup

### 1. Environment Check (30 seconds)

```bash
# Verify Node.js is installed
node --version  # Should be 18.x or higher

# Verify npm is installed
npm --version

# Check if .env.local exists
ls -la .env.local
```

**Required Environment Variables:**
```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 2. Install & Build (2 minutes)

```bash
# Install dependencies
npm install

# Build the application
npm run build

# If build succeeds, you're ready!
```

### 3. Start Demo Mode (1 minute)

```bash
# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

### 4. Enable Demo Features (30 seconds)

**Option A: Use Demo Toggle (Recommended)**
1. Open any page
2. Look for "Demo Controls" in bottom-right corner
3. Toggle "Demo Mode" ON
4. Click "Load Demo Data"
5. Page will reload with demo data

**Option B: Browser Console**
```javascript
// In browser console (F12)
localStorage.setItem('DEMO_MODE', 'true');
localStorage.setItem('POPULATE_DEMO_DATA', 'true');
location.reload();
```

### 5. Verify Demo is Ready (1 minute)

**Check these pages:**

✅ **Landing Page** (http://localhost:3000)
- Loads without errors
- "Try Demo" button visible

✅ **Chat Interface** (http://localhost:3000/chat)
- "AI Agents Active" shows green
- Progress visualization visible
- Agent Activity Feed appears (if enabled)

✅ **Teacher Dashboard** (http://localhost:3000/teacher-dashboard)
- Analytics show data
- Content review has items
- Configuration panel loads

---

## Demo Flow Checklist

### Before You Start
- [ ] Server is running (`npm run dev`)
- [ ] Demo mode is enabled
- [ ] All pages load without errors
- [ ] Browser console shows no critical errors
- [ ] You've practiced the flow once

### During Demo

**Part 1: Student Experience (2 min)**
- [ ] Show landing page
- [ ] Navigate to chat
- [ ] Point out "AI Agents Active"
- [ ] Send message: "I want to learn about fractions"
- [ ] Highlight progress visualization
- [ ] Show agent-generated content
- [ ] Complete a quiz question

**Part 2: Teacher Dashboard (2 min)**
- [ ] Navigate to teacher dashboard
- [ ] Show analytics tab with metrics
- [ ] Demonstrate content review
- [ ] Show configuration options
- [ ] Explain multi-student management

**Part 3: The Technology (1 min)**
- [ ] Explain multi-agent architecture
- [ ] Highlight real-time coordination
- [ ] Mention scalability

---

## Troubleshooting

### Issue: "AI Agents Active" stays yellow
**Solution:**
```javascript
// In console
localStorage.clear();
location.reload();
```

### Issue: No data in dashboard
**Solution:**
```javascript
// In console
localStorage.setItem('POPULATE_DEMO_DATA', 'true');
location.reload();
```

### Issue: API errors in console
**Solution:**
- Check OPENAI_API_KEY in .env.local
- Verify API key has credits
- Use demo mode as fallback

### Issue: Page won't load
**Solution:**
```bash
# Kill the server
# Ctrl+C

# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

---

## Demo URLs

| Page | URL | Purpose |
|------|-----|---------|
| Landing | http://localhost:3000 | Entry point |
| Chat | http://localhost:3000/chat | Student experience |
| Teacher Dashboard | http://localhost:3000/teacher-dashboard | Teacher tools |
| Demo Mode | http://localhost:3000/demo | Alternative demo |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+D` | Toggle demo mode |
| `F12` | Open browser console |
| `Ctrl+R` | Reload page |
| `Ctrl+Shift+R` | Hard reload (clear cache) |

---

## Demo Data Overview

When demo mode is enabled, you get:

**Student Profile:**
- Name: Alex Johnson
- Level: 3
- XP: 450 points
- Streak: 7 days
- Interests: Math, Science, Reading, Art

**Learning Progress:**
- 4 completed lessons
- 3 active learning objectives
- 5 concepts in knowledge map
- 2 identified knowledge gaps
- 85% engagement level

**Generated Content:**
- 1 pending lesson (Multiplying Fractions)
- 1 approved quiz
- 1 pending activity (Pizza Party game)

---

## Quick Commands

```bash
# Start fresh demo
npm run dev
open http://localhost:3000

# Enable demo mode
# (In browser console)
localStorage.setItem('DEMO_MODE', 'true');
localStorage.setItem('POPULATE_DEMO_DATA', 'true');
location.reload();

# Check for errors
# (In browser console)
console.clear();
# Then interact with app and watch for errors

# Reset everything
localStorage.clear();
location.reload();
```

---

## Pre-Demo Checklist (Print This!)

**30 Minutes Before:**
- [ ] Laptop fully charged
- [ ] Internet connection stable
- [ ] Server running (`npm run dev`)
- [ ] Demo mode enabled
- [ ] All pages tested
- [ ] Browser cache cleared
- [ ] Notifications disabled
- [ ] Backup screenshots ready

**5 Minutes Before:**
- [ ] Open all demo URLs in tabs
- [ ] Test full flow once
- [ ] Close unnecessary applications
- [ ] Put phone on silent
- [ ] Have water ready
- [ ] Take a deep breath

**During Demo:**
- [ ] Speak clearly and confidently
- [ ] Point to specific features
- [ ] Use the mouse to guide attention
- [ ] Pause for questions
- [ ] Stay calm if something breaks
- [ ] Have fun!

---

## Success Metrics

Your demo is successful if:

✅ Audience understands the multi-agent concept
✅ They see the real-time adaptation
✅ Teacher tools impress them
✅ Technical architecture is clear
✅ They ask for a follow-up meeting
✅ You get contact information
✅ They mention specific use cases

---

## Emergency Backup

If everything fails:

1. **Have screenshots ready** (take them now!)
   - Chat with agent active
   - Progress visualization
   - Teacher dashboard
   - Configuration panel

2. **Have video recording** (record now!)
   - Full demo flow
   - 2-3 minutes
   - With narration

3. **Pivot to slides**
   - Architecture diagram
   - Key features
   - Market opportunity
   - Schedule live demo later

---

## Post-Demo Actions

Immediately after:
- [ ] Send thank you email
- [ ] Share demo video link
- [ ] Provide one-pager
- [ ] Schedule follow-up
- [ ] Note their feedback
- [ ] Update demo based on questions

---

## Contact for Help

**Technical Issues:**
- Check GitHub issues
- Review error logs
- Test in incognito mode

**Demo Questions:**
- Review YC_DEMO_GUIDE.md
- Practice with a friend
- Record yourself

---

## Final Tips

1. **Practice 3 times** before the real demo
2. **Time yourself** - stay under 5 minutes
3. **Know your numbers** - traction, metrics, market size
4. **Be enthusiastic** - your energy is contagious
5. **Focus on value** - how this helps kids learn
6. **Handle errors gracefully** - have a backup plan
7. **End with a clear ask** - what do you want from them?

---

## You're Ready! 🎉

You've built something amazing. The demo is just showing them what you already know - that Sunny AI is the future of personalized education.

**Remember:**
- The technology works
- The vision is clear
- The market is huge
- You've got this

**Now go show them what Sunny can do! ☀️**

---

*Last Updated: [Current Date]*
*For: YC Demo Day / Investor Meetings*
*Version: 1.0*
