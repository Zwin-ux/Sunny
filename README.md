# Sunny AI Learning Platform ☀️

![GitHub last commit](https://img.shields.io/github/last-commit/Zwin-ux/Sunny?logo=github)
![Vercel Deploy](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)
![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)
![Status](https://img.shields.io/badge/status-production-success)

**Deployed**: [https://sunny-phi-two.vercel.app/](https://sunny-phi-two.vercel.app/)

An **autonomous AI teaching platform** that adapts to how each student learns, provides real-time intervention, and generates personalized learning paths—all without requiring constant teacher prompts.

🚀 **Latest Update**: Complete data overhaul with real educational content, intelligent learning system fully integrated, and production deployment active.

![Sunny AI for Kids](public/rainbow.png)

---

## 🧠 Intelligent Learning System

### What Makes Sunny Autonomous?

Sunny doesn't just chat—it **teaches intelligently** using a multi-agent architecture:

1. **Learning Brain** (`src/lib/learning-brain/`)
   - Analyzes student performance patterns in real-time
   - Detects knowledge gaps and struggle patterns
   - Calculates Zone of Proximal Development (ZPD)
   - Provides evidence-based interventions

2. **Adaptive Quiz Engine** (`src/lib/quiz/`)
   - **Dynamic Question Generation**: AI creates pedagogically-sound questions
   - **Scaffolding System**: Progressive hints (nudge → guidance → reveal)
   - **10+ Question Types**: Multiple-choice, fill-in-blank, true/false with explanation, error analysis, etc.
   - **Bloom's Taxonomy Alignment**: Questions target appropriate cognitive levels

3. **Multi-Agent System** (`src/lib/agents/`)
   - **Assessment Agent**: Continuous learning analysis and gap detection
   - **Content Generation Agent**: Creates lessons, quizzes, and activities on-demand
   - **Intervention Agent**: 5 trigger types (frustration, disengagement, confusion, fatigue, success)
   - **Path Planner Agent**: Generates personalized learning paths with milestones
   - **Memory System**: Contextual awareness across sessions

4. **Real-Time Tutoring** (`src/lib/tutoring/`)
   - Instant intervention when students struggle (2+ wrong answers)
   - Progressive help: encouragement → hint → worked example
   - Emotional support and frustration detection
   - Celebration moments for streaks and achievements

---

## 🎯 Key Features

### For Students
- **Personalized Learning Paths**: AI analyzes performance and creates custom learning journeys
- **Adaptive Difficulty**: Automatically adjusts to maintain optimal challenge (ZPD)
- **Smart Homework Generation**: Targets weak areas with spaced repetition
- **Gamification System**: 30+ achievements, XP, levels, badges (Common → Legendary rarity)
- **Real-Time Support**: Instant help when stuck, with context-aware interventions

### For Teachers & Parents
- **Intelligent Dashboard**: Real student data showing learning patterns and progress
- **Comprehensive Curriculum**: 40+ topics across Math, Reading, Science, and Logic
- **Learning Analytics**: Performance tracking, knowledge gap identification
- **Customizable Lesson Plans**: Create and manage educational content
- **Parent/Teacher Portal**: (In development) Monitor multiple students

### Data Overhaul ✅
All mock data has been replaced with **real, engaging educational content**:
- ✅ **30+ Achievements** with rarity system and XP values
- ✅ **40+ Curriculum Topics** with prerequisites and grade-level alignment
- ✅ **Real Student Scenarios** (e.g., "Sarah learning multiplication")
- ✅ **Pedagogically Sound Content** aligned with educational standards

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              INTELLIGENT LEARNING SYSTEM                     │
│                                                              │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  Learning  │  │   Adaptive   │  │   AI Generation    │ │
│  │  Brain     │◄─┤   Quiz       │◄─┤   (OpenAI)         │ │
│  │  Analysis  │  │   Engine     │  │                    │ │
│  └────────────┘  └──────────────┘  └────────────────────┘ │
│        ▲               ▲                      ▲             │
│        │               │                      │             │
│        └───────────────┴──────────────────────┘             │
│                        │                                    │
│                 ┌──────▼──────┐                            │
│                 │ Multi-Agent  │                            │
│                 │ Orchestrator │                            │
│                 └──────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

### Core Systems

1. **Assessment & Analysis**
   - Continuous performance tracking
   - Knowledge gap detection
   - Struggle pattern identification
   - Real-time difficulty adjustment

2. **Content Generation**
   - AI-powered question creation
   - Adaptive lesson planning
   - Personalized learning paths
   - Smart homework generation

3. **Intervention & Support**
   - Automatic help when needed
   - Context-aware encouragement
   - Break suggestions
   - Success celebrations

4. **Memory & Context**
   - Session continuity
   - Learning history tracking
   - Preference adaptation
   - Insight generation

---

## Getting Started for Developers

### Prerequisites

- Node.js 16.8 or later
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Zwin-ux/Sunny.git
cd sunny-ai-for-kids

# Install dependencies
npm install
# or
pnpm install

# Start the development server
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📁 Project Structure

```
sunny/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes (missions, quiz, chat, brain)
│   │   ├── dashboard/            # Student & intelligent dashboards
│   │   ├── demo/                 # Demo & waitlist pages
│   │   ├── landing/              # Landing page
│   │   ├── login/                # Authentication
│   │   ├── onboarding/           # Student onboarding flow
│   │   ├── chat/                 # AI chat interface
│   │   ├── missions/             # Learning missions
│   │   ├── games/                # Educational games
│   │   └── focus/                # Focus sessions
│   │
│   ├── lib/                      # Core logic
│   │   ├── agents/               # Multi-agent system
│   │   │   ├── assessment-agent.ts       # Gap detection
│   │   │   ├── content-generation-agent.ts
│   │   │   ├── intervention-agent.ts     # Real-time support
│   │   │   ├── path-planner-agent.ts
│   │   │   └── memory-system.ts
│   │   ├── learning-brain/       # Performance analysis
│   │   ├── quiz/                 # Adaptive quiz engine
│   │   │   ├── AdaptiveSelector.ts
│   │   │   ├── ScaffoldingSystem.ts
│   │   │   └── DynamicQuizEngine.ts
│   │   ├── tutoring/             # Real-time tutoring
│   │   ├── achievements.ts       # 30+ achievements
│   │   ├── curriculum.ts         # 40+ topics
│   │   ├── gamification.ts       # Points, badges, levels
│   │   ├── sunny-ai.ts           # OpenAI integration
│   │   └── intelligent-learning-system.ts  # Main orchestrator
│   │
│   ├── components/               # React components
│   │   ├── quiz/                 # Quiz UI components
│   │   ├── demo/                 # Demo components
│   │   ├── voice/                # Voice features
│   │   └── stages/               # Learning stages
│   │
│   └── types/                    # TypeScript types
│       ├── quiz.ts               # Quiz & assessment types
│       ├── demo.ts               # Demo types
│       └── activity.ts           # Activity types
│
├── public/                       # Static assets
├── supabase/                     # Database schema
└── docs/                         # Documentation
    ├── DATA_OVERHAUL_COMPLETE.md
    ├── INTEGRATION_COMPLETE.md
    ├── ALL_4_FEATURES_COMPLETE.md
    └── DYNAMIC_LEARNING_ARCHITECTURE.md
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```env
# OpenAI API Key (required for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Demo Mode (optional - defaults to true in production without API key)
SUNNY_DEMO_MODE=true

# Supabase (optional - for persistent storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Version (optional)
NEXT_PUBLIC_APP_VERSION=v2
```

---

## 🚀 Quick Start

### For Developers

```bash
# Clone the repository
git clone https://github.com/Zwin-ux/Sunny.git
cd Sunny

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### For Teachers

1. Visit the deployed app: [https://sunny-phi-two.vercel.app/](https://sunny-phi-two.vercel.app/)
2. Navigate to the **Demo** page to explore features
3. Try the **Chat** interface to interact with Sunny
4. Check the **Dashboard** to see student analytics

---

## 📊 Recent Updates & Overhaul

### ✅ Complete Data Overhaul (Nov 2025)
- Replaced all mock data with real educational content
- Created 30+ achievements with rarity system (Common → Legendary)
- Built comprehensive curriculum (40+ topics with prerequisites)
- Added real student scenarios and learning patterns
- Implemented pedagogically-sound content aligned with standards

### ✅ Intelligent Learning System Integration
- Connected Learning Brain, Quiz Engine, and AI generation
- Built multi-agent orchestration system
- Added real-time intervention and tutoring capabilities
- Implemented adaptive difficulty and personalized learning paths

### ✅ Production Deployment
- Fixed Windows device-name collision (`nul` file issue)
- Successfully deployed to Vercel
- Site serving content at [https://sunny-phi-two.vercel.app/](https://sunny-phi-two.vercel.app/)

---

## 🎮 Demo Mode

Sunny includes a robust demo mode perfect for:
- Showcasing the platform without API keys
- Development without internet access
- Presentations and demonstrations

When demo mode is active, the application:
- Uses pre-defined educational content
- Simulates AI responses
- Shows sample student data
- Maintains full UI functionality

Enable demo mode: Set `SUNNY_DEMO_MODE=true` in your environment variables.

---

## 🤝 Contributing

We welcome contributions from educators, developers, and designers!

### Areas for Contribution

1. **Educational Content**
   - Create lesson plans and activities
   - Add quiz questions for specific topics
   - Develop new curriculum topics

2. **Features**
   - Enhance the multi-agent system
   - Improve adaptive difficulty algorithms
   - Add new question types
   - Build interactive mini-games

3. **UI/UX**
   - Improve accessibility
   - Add animations and visual feedback
   - Design new dashboard visualizations

4. **Documentation**
   - Write tutorials and guides
   - Create video demos
   - Document best practices

### Development Workflow

```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/Sunny.git

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes and test
npm run dev

# 4. Commit with descriptive messages
git commit -m "feat: add new achievement system"

# 5. Push and create a pull request
git push origin feature/your-feature-name
```

---

## 📚 Documentation

Comprehensive documentation available in the `/docs` folder:

- **[DATA_OVERHAUL_COMPLETE.md](DATA_OVERHAUL_COMPLETE.md)** - Real data implementation details
- **[ALL_4_FEATURES_COMPLETE.md](ALL_4_FEATURES_COMPLETE.md)** - Personalized learning, homework generation, tutoring
- **[INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md)** - System architecture and integration guide
- **[DYNAMIC_LEARNING_ARCHITECTURE.md](DYNAMIC_LEARNING_ARCHITECTURE.md)** - Full architecture overview
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete project status and roadmap

---

## 🎯 Roadmap

### ✅ Completed
- [x] Intelligent Learning System with multi-agent architecture
- [x] Adaptive Quiz Engine with 10+ question types
- [x] Real-time tutoring and intervention system
- [x] Personalized learning paths
- [x] Smart homework generation
- [x] Gamification system (30+ achievements)
- [x] Comprehensive curriculum (40+ topics)
- [x] Data overhaul with real educational content
- [x] Production deployment to Vercel

### 🚧 In Progress
- [ ] Persistent database integration (Supabase)
- [ ] Progress dashboard with visual charts
- [ ] Parent/Teacher portal for monitoring
- [ ] Interactive mini-games

### 🔮 Planned
- [ ] Mobile app (React Native)
- [ ] Offline mode support
- [ ] Multi-language support
- [ ] Voice interaction features
- [ ] AR/VR learning experiences

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Educators** who provided feedback and pedagogical guidance
- **Students** whose curiosity and joy inspire this project
- **Open Source Community** for amazing tools and libraries
- **Contributors** who help make Sunny better every day

---

## 📞 Contact & Support

- **Website**: [https://sunny-phi-two.vercel.app/](https://sunny-phi-two.vercel.app/)
- **GitHub**: [https://github.com/Zwin-ux/Sunny](https://github.com/Zwin-ux/Sunny)
- **Issues**: [GitHub Issues](https://github.com/Zwin-ux/Sunny/issues)

---

**Built with ❤️ for learners everywhere**

*Last Updated: November 6, 2025*
