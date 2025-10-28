-- ============================================================================
-- Sunny AI Learning OS - Migration from Existing Schema
-- ============================================================================
--
-- This migration adds Learning OS features to existing Supabase tables
-- Run this INSTEAD of learning-os-schema.sql if you already have tables
--
-- ============================================================================

-- Enable UUID extension (safe to run if already exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- MIGRATE USERS TABLE
-- ============================================================================

-- Add new columns to existing users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student' CHECK (role IN ('student', 'parent', 'teacher', 'admin'));

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS grade_level INTEGER CHECK (grade_level BETWEEN 1 AND 12);

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS reading_level_estimate TEXT;

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS math_level_estimate TEXT;

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS last_mission_date DATE;

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW();

-- Add index for role
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON public.users(last_active DESC);

-- ============================================================================
-- CREATE SKILLS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Skill identification
  domain TEXT NOT NULL,
  category TEXT NOT NULL,
  display_name TEXT NOT NULL,
  
  -- Mastery tracking (0-100)
  mastery NUMERIC(5, 2) DEFAULT 0 CHECK (mastery >= 0 AND mastery <= 100),
  confidence TEXT DEFAULT 'low' CHECK (confidence IN ('low', 'medium', 'high')),
  
  -- Spaced repetition
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  decay_rate NUMERIC(3, 2) DEFAULT 0.10 CHECK (decay_rate >= 0 AND decay_rate <= 1),
  
  -- Performance metrics
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  average_time_seconds NUMERIC(6, 1),
  
  -- Behavioral patterns
  typical_answer_style TEXT,
  common_mistakes JSONB DEFAULT '[]'::JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_skills_user_id ON public.skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_mastery ON public.skills(mastery);
CREATE INDEX IF NOT EXISTS idx_skills_last_seen ON public.skills(last_seen);
CREATE INDEX IF NOT EXISTS idx_skills_category ON public.skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_decay ON public.skills(decay_rate, last_seen);

-- ============================================================================
-- CREATE SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Session timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Mission definition
  mission_type TEXT NOT NULL,
  sunny_goal TEXT NOT NULL,
  target_skill_id UUID REFERENCES public.skills(id),
  
  -- Session configuration
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  question_format TEXT,
  
  -- Performance summary
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  mastery_before NUMERIC(5, 2),
  mastery_after NUMERIC(5, 2),
  mastery_delta NUMERIC(5, 2),
  
  -- Behavioral observations
  average_response_time NUMERIC(6, 1),
  attention_quality TEXT,
  reasoning_quality_avg NUMERIC(3, 1),
  
  -- AI-generated summary
  sunny_summary TEXT,
  
  -- Metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON public.sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_target_skill ON public.sessions(target_skill_id);

-- ============================================================================
-- CREATE QUESTION_ATTEMPTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.question_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id),
  
  -- Question content
  question_text TEXT NOT NULL,
  question_type TEXT,
  expected_answer TEXT,
  
  -- Student response
  student_answer TEXT NOT NULL,
  time_to_answer_seconds INTEGER,
  
  -- AI evaluation
  correctness TEXT CHECK (correctness IN ('correct', 'incorrect', 'partial')),
  reasoning_quality INTEGER CHECK (reasoning_quality BETWEEN 1 AND 5),
  
  -- Behavioral analysis
  answer_style TEXT CHECK (answer_style IN ('guess', 'skip', 'worked', 'rushed')),
  misunderstanding_label TEXT,
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  
  -- AI feedback
  ai_feedback TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attempts_session ON public.question_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_skill ON public.question_attempts(skill_id);
CREATE INDEX IF NOT EXISTS idx_attempts_correctness ON public.question_attempts(correctness);
CREATE INDEX IF NOT EXISTS idx_attempts_created_at ON public.question_attempts(created_at DESC);

-- ============================================================================
-- CREATE NOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Note content
  sunny_comment TEXT NOT NULL,
  
  -- Context
  related_skill_id UUID REFERENCES public.skills(id),
  related_session_id UUID REFERENCES public.sessions(id),
  note_type TEXT CHECK (note_type IN ('pattern', 'insight', 'intervention', 'celebration')),
  
  -- Importance
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  actionable BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_timestamp ON public.notes(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notes_priority ON public.notes(priority);
CREATE INDEX IF NOT EXISTS idx_notes_actionable ON public.notes(actionable);

-- ============================================================================
-- CREATE PARENT_STUDENT_LINKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  relationship TEXT CHECK (relationship IN ('parent', 'teacher', 'guardian')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(parent_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_links_parent ON public.parent_student_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_links_student ON public.parent_student_links(student_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Skills RLS
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

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

-- Sessions RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

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

-- Question Attempts RLS
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;

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

-- Notes RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

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

-- Parent-Student Links RLS
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY links_select_involved ON public.parent_student_links
  FOR SELECT USING (
    auth.uid()::text = parent_id OR
    auth.uid()::text = student_id
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at on skills
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update last_active on users when session created
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

CREATE OR REPLACE VIEW skills_for_review AS
SELECT 
  sk.*,
  EXTRACT(EPOCH FROM (NOW() - sk.last_seen)) / 86400 as days_since_seen,
  (100 - sk.mastery) * sk.decay_rate as urgency_score
FROM public.skills sk
WHERE sk.mastery < 90
ORDER BY urgency_score DESC;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE public.skills IS 'Learning OS: Tracks student mastery with decay modeling';
COMMENT ON TABLE public.sessions IS 'Learning OS: Focused learning missions with mastery tracking';
COMMENT ON TABLE public.question_attempts IS 'Learning OS: AI evaluation with behavioral analysis';
COMMENT ON TABLE public.notes IS 'Learning OS: Sunny''s memory and behavioral observations';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Learning OS migration complete! New tables: skills, sessions, question_attempts, notes, parent_student_links';
END $$;
