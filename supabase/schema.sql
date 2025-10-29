-- ============================================================================
-- Sunny AI for Kids - Supabase Database Schema
-- ============================================================================
--
-- This schema defines all database tables, indexes, and Row Level Security (RLS)
-- policies for the Sunny AI educational platform.
--
-- To apply this schema:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to the SQL Editor
-- 3. Paste and run this entire file
--
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- Stores user profiles, authentication, and learning data
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  -- Primary identification
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,

  -- Learning preferences
  learning_style TEXT CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'reading', 'logical')),
  learning_interests TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Progress tracking
  progress JSONB DEFAULT '{}'::JSONB, -- lessonId -> completion percentage
  quiz_progress JSONB DEFAULT '{}'::JSONB, -- topic -> { correct, total }

  -- Chat history (array of message objects)
  chat_history JSONB DEFAULT '[]'::JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- ============================================================================
-- STUDENT PROFILES TABLE
-- Enhanced student profiles for the multi-agent learning system
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.student_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,

  -- Learning state
  emotion TEXT DEFAULT 'neutral',
  learning_style TEXT CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'reading', 'logical')),

  -- Knowledge tracking
  known_concepts TEXT[] DEFAULT ARRAY[]::TEXT[],
  knowledge_gaps TEXT[] DEFAULT ARRAY[]::TEXT[],
  completed_lessons TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Conversation history (array of message objects)
  conversation_history JSONB DEFAULT '[]'::JSONB,

  -- Current challenge
  last_challenge JSONB,

  -- Enhanced cognitive data for agent system
  cognitive_profile JSONB DEFAULT '{}'::JSONB,
  motivation_factors JSONB DEFAULT '{}'::JSONB,
  learning_velocity JSONB DEFAULT '{}'::JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id) -- One profile per user
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON public.student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_level ON public.student_profiles(level);

-- ============================================================================
-- CHAT MESSAGES TABLE
-- Stores individual chat messages for better querying and analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  student_profile_id TEXT REFERENCES public.student_profiles(id) ON DELETE CASCADE,

  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('chat', 'challenge', 'feedback')),

  -- Message metadata
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_student_profile_id ON public.chat_messages(student_profile_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- ============================================================================
-- FOCUS SESSIONS TABLE
-- Stores 20-minute adaptive learning session summaries
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL, -- References student_profiles.id

  -- Session config
  topic TEXT NOT NULL,
  target_duration INTEGER DEFAULT 1200, -- seconds (20 minutes)
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,

  -- Session data
  concept_map JSONB NOT NULL, -- Full concept map
  loops JSONB DEFAULT '[]'::JSONB, -- Array of loop data

  -- Performance metrics
  performance JSONB, -- Session performance summary
  review_plan JSONB, -- Next session recommendations

  -- Metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_focus_sessions_student_id ON public.focus_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_topic ON public.focus_sessions(topic);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_created_at ON public.focus_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_status ON public.focus_sessions(status);

-- ============================================================================
-- CONCEPT MEMORIES TABLE
-- Tracks long-term concept mastery and spaced repetition
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.concept_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT NOT NULL, -- References student_profiles.id

  -- Concept identification
  concept TEXT NOT NULL,
  category TEXT, -- e.g., 'multiplication', 'reading comprehension'

  -- Mastery tracking
  mastery_level NUMERIC(3, 2) DEFAULT 0.0 CHECK (mastery_level >= 0 AND mastery_level <= 1),
  times_practiced INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,

  -- Spaced repetition data
  ease_factor NUMERIC(3, 2) DEFAULT 2.5 CHECK (ease_factor >= 1.3),
  interval INTEGER DEFAULT 1, -- days until next review
  next_review_date TIMESTAMPTZ,

  -- Interaction history (last 10 interactions)
  recent_interactions JSONB DEFAULT '[]'::JSONB,

  -- Metadata
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_practiced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, concept) -- One memory per concept per student
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_concept_memories_student_id ON public.concept_memories(student_id);
CREATE INDEX IF NOT EXISTS idx_concept_memories_concept ON public.concept_memories(concept);
CREATE INDEX IF NOT EXISTS idx_concept_memories_mastery ON public.concept_memories(mastery_level);
CREATE INDEX IF NOT EXISTS idx_concept_memories_next_review ON public.concept_memories(next_review_date);
CREATE INDEX IF NOT EXISTS idx_concept_memories_category ON public.concept_memories(category);

-- ============================================================================
-- LESSON PLANS TABLE
-- Stores teacher-created custom lesson plans
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lesson_plans (
  id TEXT PRIMARY KEY,

  -- Lesson metadata
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  grade_level TEXT NOT NULL,

  -- Authorship
  author TEXT NOT NULL,
  is_sample BOOLEAN DEFAULT FALSE, -- Built-in sample lessons

  -- Lesson content
  content JSONB NOT NULL, -- Full LessonContent structure

  -- Taxonomies
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  learning_outcomes TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lesson_plans_category ON public.lesson_plans(category);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_grade_level ON public.lesson_plans(grade_level);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_author ON public.lesson_plans(author);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_is_sample ON public.lesson_plans(is_sample);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_created_at ON public.lesson_plans(created_at DESC);

-- GIN index for array searches
CREATE INDEX IF NOT EXISTS idx_lesson_plans_tags ON public.lesson_plans USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_keywords ON public.lesson_plans USING GIN(keywords);

-- ============================================================================
-- GAME SESSIONS TABLE
-- Tracks game performance and progress
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT NOT NULL,

  -- Game info
  game_type TEXT NOT NULL, -- e.g., 'memory_match', 'word_builder', 'math_race'
  difficulty TEXT NOT NULL,

  -- Session data
  score INTEGER DEFAULT 0,
  duration INTEGER, -- seconds
  completed BOOLEAN DEFAULT FALSE,

  -- Performance metrics
  metrics JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_game_sessions_student_id ON public.game_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_type ON public.game_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_game_sessions_started_at ON public.game_sessions(started_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Users: Can only access their own data
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid()::text = id);

-- Student Profiles: Can only access their own profile
CREATE POLICY student_profiles_select_own ON public.student_profiles
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY student_profiles_insert_own ON public.student_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY student_profiles_update_own ON public.student_profiles
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Chat Messages: Can only access their own messages
CREATE POLICY chat_messages_select_own ON public.chat_messages
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY chat_messages_insert_own ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Focus Sessions: Can only access their own sessions
CREATE POLICY focus_sessions_select_own ON public.focus_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = focus_sessions.student_id
      AND sp.user_id = auth.uid()::text
    )
  );

CREATE POLICY focus_sessions_insert_own ON public.focus_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = focus_sessions.student_id
      AND sp.user_id = auth.uid()::text
    )
  );

CREATE POLICY focus_sessions_update_own ON public.focus_sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = focus_sessions.student_id
      AND sp.user_id = auth.uid()::text
    )
  );

-- Concept Memories: Can only access their own memories
CREATE POLICY concept_memories_select_own ON public.concept_memories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = concept_memories.student_id
      AND sp.user_id = auth.uid()::text
    )
  );

CREATE POLICY concept_memories_insert_own ON public.concept_memories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = concept_memories.student_id
      AND sp.user_id = auth.uid()::text
    )
  );

CREATE POLICY concept_memories_update_own ON public.concept_memories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = concept_memories.student_id
      AND sp.user_id = auth.uid()::text
    )
  );

-- Lesson Plans: Sample lessons are public, custom lessons visible to creator
CREATE POLICY lesson_plans_select_all ON public.lesson_plans
  FOR SELECT USING (
    is_sample = TRUE OR
    auth.uid()::text IN (SELECT id FROM public.users WHERE email = lesson_plans.author)
  );

CREATE POLICY lesson_plans_insert_own ON public.lesson_plans
  FOR INSERT WITH CHECK (
    auth.uid()::text IN (SELECT id FROM public.users WHERE email = author)
  );

CREATE POLICY lesson_plans_update_own ON public.lesson_plans
  FOR UPDATE USING (
    auth.uid()::text IN (SELECT id FROM public.users WHERE email = author)
  );

-- Game Sessions: Can only access their own sessions
CREATE POLICY game_sessions_select_own ON public.game_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = game_sessions.student_id
      AND sp.user_id = auth.uid()::text
    )
  );

CREATE POLICY game_sessions_insert_own ON public.game_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = game_sessions.student_id
      AND sp.user_id = auth.uid()::text
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_focus_sessions_updated_at BEFORE UPDATE ON public.focus_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_concept_memories_updated_at BEFORE UPDATE ON public.concept_memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lesson_plans_updated_at BEFORE UPDATE ON public.lesson_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Note: Sample lesson plans and other initial data should be inserted
-- through the application code or separate data migration scripts.

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================

-- Grant appropriate permissions to authenticated users
-- (Supabase automatically handles this based on RLS policies)
