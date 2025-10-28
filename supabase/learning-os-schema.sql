-- ============================================================================
-- Sunny AI Learning OS - Production Schema
-- ============================================================================
--
-- This schema implements a personal learning OS with memory.
-- Core concept: Sunny learns the student, not just tracks scores.
--
-- Design principles:
-- 1. Mastery is continuous (0-100), not binary pass/fail
-- 2. Skills decay over time (spaced repetition)
-- 3. Sunny keeps behavioral notes, not just grades
-- 4. Every interaction updates the learning model
--
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE (Enhanced)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  
  -- Role-based access
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'parent', 'teacher', 'admin')),
  
  -- Student metadata
  grade_level INTEGER CHECK (grade_level BETWEEN 1 AND 12),
  reading_level_estimate TEXT, -- e.g., "3.5" or "grade 4"
  math_level_estimate TEXT,    -- e.g., "grade 3 fractions"
  
  -- Learning preferences (from existing schema)
  learning_style TEXT CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'reading', 'logical')),
  learning_interests TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- System metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  
  -- Streak tracking
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_mission_date DATE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON public.users(last_active DESC);

-- ============================================================================
-- SKILLS TABLE
-- Tracks mastery for each skill domain per student
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Skill identification
  domain TEXT NOT NULL, -- e.g., "fractions_comparison", "main_idea", "context_clues"
  category TEXT NOT NULL, -- e.g., "math", "reading", "science"
  display_name TEXT NOT NULL, -- e.g., "Comparing Fractions"
  
  -- Mastery tracking (0-100)
  mastery NUMERIC(5, 2) DEFAULT 0 CHECK (mastery >= 0 AND mastery <= 100),
  confidence TEXT DEFAULT 'low' CHECK (confidence IN ('low', 'medium', 'high')),
  
  -- Spaced repetition
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  decay_rate NUMERIC(3, 2) DEFAULT 0.10 CHECK (decay_rate >= 0 AND decay_rate <= 1),
  -- decay_rate: how fast they forget (0.1 = slow decay, 0.5 = fast decay)
  
  -- Performance metrics
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  average_time_seconds NUMERIC(6, 1),
  
  -- Behavioral patterns
  typical_answer_style TEXT, -- "rushed", "thoughtful", "guessing", "systematic"
  common_mistakes JSONB DEFAULT '[]'::JSONB, -- Array of mistake patterns
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, domain)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON public.skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_mastery ON public.skills(mastery);
CREATE INDEX IF NOT EXISTS idx_skills_last_seen ON public.skills(last_seen);
CREATE INDEX IF NOT EXISTS idx_skills_category ON public.skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_decay ON public.skills(decay_rate, last_seen);

-- ============================================================================
-- SESSIONS TABLE
-- Tracks focused learning missions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Session timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Mission definition
  mission_type TEXT NOT NULL, -- e.g., "fractions_review", "reading_inference"
  sunny_goal TEXT NOT NULL, -- e.g., "We are fixing comparing fractions with unlike denominators"
  target_skill_id UUID REFERENCES public.skills(id),
  
  -- Session configuration
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  question_format TEXT, -- e.g., "visual_word_problems", "number_line", "real_world"
  
  -- Performance summary
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  mastery_before NUMERIC(5, 2),
  mastery_after NUMERIC(5, 2),
  mastery_delta NUMERIC(5, 2), -- Change in mastery
  
  -- Behavioral observations
  average_response_time NUMERIC(6, 1),
  attention_quality TEXT, -- "focused", "declining", "distracted"
  reasoning_quality_avg NUMERIC(3, 1), -- 1-5 scale
  
  -- AI-generated summary
  sunny_summary TEXT, -- One-sentence summary from OpenAI
  
  -- Metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON public.sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_target_skill ON public.sessions(target_skill_id);

-- ============================================================================
-- QUESTION_ATTEMPTS TABLE
-- Tracks individual question responses with rich context
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.question_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id),
  
  -- Question content
  question_text TEXT NOT NULL,
  question_type TEXT, -- "multiple_choice", "open_ended", "explanation"
  expected_answer TEXT,
  
  -- Student response
  student_answer TEXT NOT NULL,
  time_to_answer_seconds INTEGER,
  
  -- AI evaluation
  correctness TEXT CHECK (correctness IN ('correct', 'incorrect', 'partial')),
  reasoning_quality INTEGER CHECK (reasoning_quality BETWEEN 1 AND 5),
  -- 1 = guessed, 2 = confused, 3 = partial understanding, 4 = solid, 5 = expert
  
  -- Behavioral analysis
  answer_style TEXT CHECK (answer_style IN ('guess', 'skip', 'worked', 'rushed')),
  misunderstanding_label TEXT, -- e.g., "confuses numerator and denominator"
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  
  -- AI feedback
  ai_feedback TEXT, -- Personalized feedback from OpenAI
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attempts_session ON public.question_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_skill ON public.question_attempts(skill_id);
CREATE INDEX IF NOT EXISTS idx_attempts_correctness ON public.question_attempts(correctness);
CREATE INDEX IF NOT EXISTS idx_attempts_created_at ON public.question_attempts(created_at DESC);

-- ============================================================================
-- NOTES TABLE
-- Sunny's memory: behavioral patterns and insights
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Note content
  sunny_comment TEXT NOT NULL,
  -- Examples:
  -- "Mazen keeps confusing numerator and denominator. We should reteach with pizzas not number lines."
  -- "You usually answer fraction questions in 6 seconds. This one took 31. Something here is confusing."
  
  -- Context
  related_skill_id UUID REFERENCES public.skills(id),
  related_session_id UUID REFERENCES public.sessions(id),
  note_type TEXT CHECK (note_type IN ('pattern', 'insight', 'intervention', 'celebration')),
  
  -- Importance
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  actionable BOOLEAN DEFAULT FALSE, -- Should this trigger an intervention?
  
  -- Metadata
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_timestamp ON public.notes(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notes_priority ON public.notes(priority);
CREATE INDEX IF NOT EXISTS idx_notes_actionable ON public.notes(actionable);

-- ============================================================================
-- PARENT_STUDENT_LINKS TABLE
-- Links parents/teachers to students
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  relationship TEXT CHECK (relationship IN ('parent', 'teacher', 'guardian')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(parent_id, student_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_links_parent ON public.parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_links_student ON public.parent_student_links(student_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

-- Users: Can only access their own data
CREATE POLICY users_select_own ON public.users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING (auth.uid()::text = id);

-- Skills: Students see their own, parents/teachers see linked students
CREATE POLICY skills_select_own ON public.skills
  FOR SELECT USING (
    auth.uid()::text = user_id OR
    EXISTS (
      SELECT 1 FROM public.parent_student_links
      WHERE student_id = skills.user_id
      AND parent_id = auth.uid()::text
    )
  );

CREATE POLICY skills_insert_own ON public.skills
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY skills_update_own ON public.skills
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Sessions: Same as skills
CREATE POLICY sessions_select_own ON public.sessions
  FOR SELECT USING (
    auth.uid()::text = user_id OR
    EXISTS (
      SELECT 1 FROM public.parent_student_links
      WHERE student_id = sessions.user_id
      AND parent_id = auth.uid()::text
    )
  );

CREATE POLICY sessions_insert_own ON public.sessions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY sessions_update_own ON public.sessions
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Question Attempts: Accessible via session ownership
CREATE POLICY attempts_select_via_session ON public.question_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = question_attempts.session_id
      AND (
        sessions.user_id = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM public.parent_student_links
          WHERE student_id = sessions.user_id
          AND parent_id = auth.uid()::text
        )
      )
    )
  );

CREATE POLICY attempts_insert_via_session ON public.question_attempts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = question_attempts.session_id
      AND sessions.user_id = auth.uid()::text
    )
  );

-- Notes: Same as skills
CREATE POLICY notes_select_own ON public.notes
  FOR SELECT USING (
    auth.uid()::text = user_id OR
    EXISTS (
      SELECT 1 FROM public.parent_student_links
      WHERE student_id = notes.user_id
      AND parent_id = auth.uid()::text
    )
  );

CREATE POLICY notes_insert_own ON public.notes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Parent-Student Links: Both parties can see
CREATE POLICY links_select_involved ON public.parent_student_links
  FOR SELECT USING (
    auth.uid()::text = parent_id OR
    auth.uid()::text = student_id
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update last_active on users
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET last_active = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_last_active_on_session AFTER INSERT ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION update_last_active();

-- Calculate mastery delta when session ends
CREATE OR REPLACE FUNCTION calculate_mastery_delta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    NEW.mastery_delta = NEW.mastery_after - NEW.mastery_before;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calc_mastery_delta BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION calculate_mastery_delta();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View: Student Dashboard Summary
CREATE OR REPLACE VIEW student_dashboard AS
SELECT 
  u.id as user_id,
  u.name,
  u.current_streak,
  u.grade_level,
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT sk.id) as skills_tracked,
  AVG(sk.mastery) as average_mastery,
  COUNT(CASE WHEN sk.mastery >= 70 THEN 1 END) as skills_mastered,
  COUNT(CASE WHEN sk.mastery < 40 THEN 1 END) as skills_struggling,
  MAX(s.started_at) as last_session_date
FROM public.users u
LEFT JOIN public.sessions s ON s.user_id = u.id
LEFT JOIN public.skills sk ON sk.user_id = u.id
WHERE u.role = 'student'
GROUP BY u.id, u.name, u.current_streak, u.grade_level;

-- View: Skills Needing Review (spaced repetition)
CREATE OR REPLACE VIEW skills_for_review AS
SELECT 
  sk.*,
  EXTRACT(EPOCH FROM (NOW() - sk.last_seen)) / 86400 as days_since_seen,
  (100 - sk.mastery) * sk.decay_rate as urgency_score
FROM public.skills sk
WHERE sk.mastery < 90
ORDER BY urgency_score DESC;

-- ============================================================================
-- INITIAL SKILL DOMAINS (Seed Data)
-- ============================================================================

-- This would be inserted via application code or migration
-- Example skill domains for Grade 3-6 Math:

/*
INSERT INTO public.skills (user_id, domain, category, display_name, mastery, confidence)
VALUES
  ('user-123', 'fractions_comparison', 'math', 'Comparing Fractions', 0, 'low'),
  ('user-123', 'fractions_addition', 'math', 'Adding Fractions', 0, 'low'),
  ('user-123', 'multiplication_facts', 'math', 'Multiplication Facts', 0, 'low'),
  ('user-123', 'word_problems_multi_step', 'math', 'Multi-Step Word Problems', 0, 'low'),
  ('user-123', 'decimals_place_value', 'math', 'Decimal Place Value', 0, 'low');
*/

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================

COMMENT ON TABLE public.skills IS 'Tracks student mastery for each skill domain with decay modeling';
COMMENT ON TABLE public.sessions IS 'Focused learning missions with before/after mastery tracking';
COMMENT ON TABLE public.question_attempts IS 'Individual question responses with AI evaluation and behavioral analysis';
COMMENT ON TABLE public.notes IS 'Sunny''s memory: patterns, insights, and behavioral observations';
COMMENT ON COLUMN public.skills.decay_rate IS 'How fast the student forgets this skill (0.1=slow, 0.5=fast)';
COMMENT ON COLUMN public.question_attempts.reasoning_quality IS '1=guessed, 2=confused, 3=partial, 4=solid, 5=expert';
