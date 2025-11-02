# 🚀 Sunny AI - Quick Start Guide

## For Impatient Developers (2 minutes)

```bash
# 1. Install
npm install

# 2. Run
npm run dev

# 3. Demo
open http://localhost:3000/landing
```

**That's it!** Click "Try Demo" and explore.

---

## For Demo Day (5 minutes)

### **Pre-Demo Setup**
```bash
# Verify everything works
npm install
npm run dev

# Open browser
open http://localhost:3000/landing

# Test demo login
# Click "Try Demo" button on login page
```

### **Demo Flow**
1. **Landing** (30 sec) - Show professional design
2. **Signup** (60 sec) - Use demo login or quick signup
3. **Onboarding** (90 sec) - Complete 5-step assessment
4. **Chat** (2 min) - Send messages, show features
5. **Architecture** (60 sec) - Show agent code files

### **Key Files to Show**
```
src/lib/agents/
├── assessment-agent.ts      ← "Detects knowledge gaps"
├── intervention-agent.ts    ← "Provides automatic support"
├── content-generation.ts    ← "Creates personalized lessons"
├── memory-system.ts         ← "Remembers past learning"
└── path-planner.ts          ← "Adapts learning journey"
```

---

## For New Developers (15 minutes)

### **Project Structure**
```
src/
├── app/                     # Next.js pages
│   ├── landing/            # Landing page
│   ├── login/              # Authentication
│   ├── signup/             # Registration
│   ├── onboarding/         # User setup
│   └── page.tsx            # Main chat
├── lib/                     # Core logic
│   ├── agents/             # AI agents ⭐
│   ├── gamification.ts     # Badges, points
│   └── sunny-ai.ts         # OpenAI integration
└── components/              # React components
```

### **Key Features**
- **Authentication**: Demo mode available (no API key needed)
- **Onboarding**: 5-step personalization
- **AI Agents**: 5 autonomous agents
- **Gamification**: 17+ badges, points, levels
- **Animations**: Framer Motion throughout

### **Environment Setup**
```bash
# Optional: Add .env.local for OpenAI
OPENAI_API_KEY=your_key_here
SUNNY_DEMO_MODE=true  # Use demo mode
```

### **Development Commands**
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run typecheck    # Check TypeScript
npm run lint         # Run linter
npm test             # Run tests
```

---

## For Investors (10 minutes)

### **What is Sunny?**
Autonomous AI teacher that adapts to each child's learning style.

### **Key Innovation**
Five specialized AI agents that:
1. Assess knowledge continuously
2. Generate personalized content
3. Intervene when students struggle
4. Remember past learning
5. Adapt learning paths

### **Market Opportunity**
- **Market Size**: $10B+ EdTech market
- **Target**: Kids aged 6-10 and their parents
- **Channels**: Direct-to-consumer + Schools

### **Business Model**
- Freemium (basic free, premium $9.99/mo)
- School licenses ($X per student/year)
- Content partnerships

### **Traction** (Update with your numbers)
- X beta testers
- Y teachers piloting
- Z% engagement rate

### **Ask**
Raising $X seed round for:
- Engineering team (3-4 devs)
- Content creation
- Marketing & growth
- School partnerships

---

## For Teachers (5 minutes)

### **What Can Sunny Do?**
- ✅ Teach any subject (math, science, reading, etc.)
- ✅ Adapt to each child's pace
- ✅ Provide instant feedback
- ✅ Track progress automatically
- ✅ Work 24/7

### **How to Use**
1. Create account (free)
2. Add students
3. Assign lessons or let Sunny adapt
4. Monitor progress dashboard

### **What Makes It Special?**
- Detects when kids struggle *before* they give up
- Celebrates wins automatically
- Remembers what each kid learned
- Adjusts difficulty in real-time

### **Try It Now**
```
1. Go to http://localhost:3000/landing
2. Click "Try Demo"
3. Explore as a student
```

---

## Troubleshooting

### **App Won't Start**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### **Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
npm run dev
```

### **TypeScript Errors**
```bash
# These are warnings, not blockers
# App still runs fine
npm run dev  # Ignore warnings for now
```

### **Demo Mode Not Working**
```bash
# Make sure you're using the demo login
# On login page, click "Try Demo" button
# OR use any email with password
```

---

## Resources

- **Full Documentation**: See `CLAUDE.md`
- **Project Summary**: See `PROJECT_SUMMARY.md`
- **MVP Report**: See `MVP_READINESS_REPORT.md`
- **Demo Checklist**: See `DEMO_CHECKLIST.md`

---

## Support

**Questions?**
- Read the docs above
- Check console for errors
- Review code comments

**Found a bug?**
- Note it for post-MVP fixes
- Check `MVP_READINESS_REPORT.md` for known issues

---

**Now go build something amazing!** 🚀✨
