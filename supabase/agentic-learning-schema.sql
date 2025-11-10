-- ============================================================================
-- Agentic Learning Engine - Enhanced Database Schema
-- ============================================================================
--
-- This schema extends the Learning OS schema with comprehensive data models
-- for the agentic learning engine, including:
-- - Enhanced student profiling with cognitive and behavioral data
-- - Learning session and interaction history tracking
-- - Concept mastery and knowledge gap persistence
-- - Performance metrics and analytics data storage
-- - Real-time analytics processing support
--
-- Requirements: 5.1, 8.1, 8.4
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- ENHANCED STUDENT PROFILES
-- Comprehensive cognitive and behavioral profiling
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.student_profiles_enhanced (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Cognitive Profile (0-1 scale)
  processing_speed NUMERIC(3, 2) DEFAULT 0.50 CHECK (processing_speed >= 0 AND processing_speed <= 1),
  working_memory_capacity NUMERIC(3, 2) DEFAULT 0.50 CHECK (working_memory_capacity >= 0 AND working_memory_capacity <= 1),
  attention_control NUMERIC(3, 2) DEFAULT 0.50 CHECK (attention_control >= 0 AND attention_control <= 1),
  metacognition NUMERIC(3, 2) DEFAULT 0.50 CHECK (metacognition >= 0 AND metacognition <= 1),
  
  -- Motivation Profile (0-1 scale)
  intrinsic_motivation NUMERIC(3, 2) DEFAULT 0.50 CHECK (intrinsic_motivation >= 0 AND intrinsic_motivation <= 1),
  extrinsic_motivation NUMERIC(3, 2) DEFAULT 0.50 CHECK (extrinsic_motivation >= 0 AND extrinsic_motivation <= 1),
  competitive_spirit NUMERIC(3, 2) DEFAULT 0.50 CHECK (competitive_spirit >= 0 AND competitive_spirit <= 1),
  collaborative_preference NUMERIC(3, 2) DEFAULT 0.50 CHECK (collaborative_preference >= 0 AND collaborative_preference <= 1),
  autonomy_preference NUMERIC(3, 2) DEFAULT 0.50 CHECK (autonomy_preference >= 0 AND autonomy_preference <= 1),
  
  -- Learning Velocity
  concept_acquisition_rate NUMERIC(5, 2) DEFAULT 1.00, -- concepts per hour
  skill_development_rate NUMERIC(5, 2) DEFAULT 1.00, -- skill points per hour
  retention_rate NUMERIC(3, 2) DEFAULT 0.70 CHECK (retention_rate >= 0 AND retention_rate <= 1),
  transfer_rate NUMERIC(3, 2) DEFAULT 0.50 CHECK (transfer_rate >= 0 AND transfer_rate <= 1),
  
  -- Attention Span Data
  average_attention_span INTEGER DEFAULT 20, -- minutes
  peak_attention_span INTEGER DEFAULT 30, -- minutes
  attention_decline_pattern NUMERIC[] DEFAULT ARRAY[1.0, 0.9, 0.8, 0.7, 0.6, 0.5],
  attention_recovery_time INTEGER DEFAULT 5, -- minutes
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_analyzed TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_enhanced_user ON public.student_profiles_enhanced(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_enhanced_updated ON public.student_profiles_enhanced(updated_at DESC);

-- ============================================================================
-- RESPONSE PATTERNS
-- Tracks behavioral patterns in student responses
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.response_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Pattern identification
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('quick', 'thoughtful', 'impulsive', 'hesitant')),
  frequency NUMERIC(3, 2) DEFAULT 0 CHECK (frequency >= 0 AND frequency <= 1),
  effectiveness NUMERIC(3, 2) DEFAULT 0.50 CHECK (effectiveness >= 0 AND effectiveness <= 1),
  
  -- Context
  contexts TEXT[] DEFAULT ARRAY[]::TEXT[], -- When this pattern appears
  
  -- Metadata
  first_observed TIMESTAMPTZ DEFAULT NOW(),
  last_observed TIMESTAMPTZ DEFAULT NOW(),
  observation_count INTEGER DEFAULT 1,
  
  UNIQUE(user_id, pattern_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_response_patterns_user ON public.response_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_response_patterns_type ON public.response_patterns(pattern_type);

-- ============================================================================
-- ENGAGEMENT PATTERNS
-- Tracks what triggers and sustains engagement
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.engagement_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Pattern details
  trigger TEXT NOT NULL, -- What causes this engagement pattern
  duration INTEGER NOT NULL, -- How long it lasts (seconds)
  intensity NUMERIC(3, 2) NOT NULL CHECK (intensity >= 0 AND intensity <= 1),
  recovery_time INTEGER, -- How quickly engagement recovers (seconds)
  
  -- Context
  activity_type TEXT, -- What activity was happening
  difficulty_level TEXT,
  
  -- Metadata
  observed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_engagement_patterns_user ON public.engagement_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_patterns_observed ON public.engagement_patterns(observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_patterns_trigger ON public.engagement_patterns(trigger);

-- ============================================================================
-- ACTIVITY PREFERENCES
-- Tracks effectiveness and preference for different activity types
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'quiz', 'lesson', 'game', 'discussion', 'creative', 'practice', 'assessment', 'exploration'
  )),
  
  -- Metrics (0-1 scale)
  preference_score NUMERIC(3, 2) DEFAULT 0.50 CHECK (preference_score >= 0 AND preference_score <= 1),
  effectiveness_score NUMERIC(3, 2) DEFAULT 0.50 CHECK (effectiveness_score >= 0 AND effectiveness_score <= 1),
  
  -- Optimal duration
  optimal_duration_minutes INTEGER DEFAULT 15,
  
  -- Statistics
  total_sessions INTEGER DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, activity_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_prefs_user ON public.activity_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_prefs_effectiveness ON public.activity_preferences(effectiveness_score DESC);

-- ============================================================================
-- LEARNING SESSIONS ENHANCED
-- Extended session tracking with agent data
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.learning_sessions_enhanced (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE UNIQUE,
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Learning objectives
  objectives JSONB DEFAULT '[]'::JSONB, -- Array of learning objective objects
  
  -- Engagement data
  engagement_level NUMERIC(3, 2) CHECK (engagement_level >= 0 AND engagement_level <= 1),
  attention_span_minutes INTEGER,
  interaction_frequency NUMERIC(5, 2), -- interactions per minute
  frustration_level NUMERIC(3, 2) CHECK (frustration_level >= 0 AND frustration_level <= 1),
  motivation_level NUMERIC(3, 2) CHECK (motivation_level >= 0 AND motivation_level <= 1),
  
  -- Performance metrics
  response_time_avg NUMERIC(6, 1), -- seconds
  response_quality_avg NUMERIC(3, 2) CHECK (response_quality_avg >= 0 AND response_quality_avg <= 1),
  focus_level NUMERIC(3, 2) CHECK (focus_level >= 0 AND focus_level <= 1),
  
  -- Outcomes
  outcomes JSONB DEFAULT '[]'::JSONB, -- Array of session outcome objects
  
  -- Agent interventions
  interventions JSONB DEFAULT '[]'::JSONB, -- Array of intervention events
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_enhanced_user ON public.learning_sessions_enhanced(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_enhanced_session ON public.learning_sessions_enhanced(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_enhanced_created ON public.learning_sessions_enhanced(created_at DESC);

-- ============================================================================
-- INTERACTION HISTORY
-- Detailed tracking of all student interactions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.interaction_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  
  -- Interaction details
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'message', 'response', 'question', 'activity_start', 'activity_complete', 
    'hint_request', 'feedback_received', 'navigation'
  )),
  content TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Timing
  response_time_seconds INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Analysis
  comprehension_level NUMERIC(3, 2) CHECK (comprehension_level >= 0 AND comprehension_level <= 1),
  engagement_level NUMERIC(3, 2) CHECK (engagement_level >= 0 AND engagement_level <= 1),
  emotional_state TEXT CHECK (emotional_state IN ('positive', 'neutral', 'frustrated', 'confused', 'excited')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interactions_user ON public.interaction_history(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_session ON public.interaction_history(session_id);
CREATE INDEX IF NOT EXISTS idx_interactions_timestamp ON public.interaction_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON public.interaction_history(interaction_type);

-- ============================================================================
-- CONCEPTS
-- Knowledge graph of learning concepts
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Concept identification
  concept_id TEXT UNIQUE NOT NULL, -- e.g., "fractions_addition"
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- e.g., "math", "reading"
  
  -- Difficulty and prerequisites
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  prerequisites TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of concept_ids
  related_concepts TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of concept_ids
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_concepts_id ON public.concepts(concept_id);
CREATE INDEX IF NOT EXISTS idx_concepts_category ON public.concepts(category);
CREATE INDEX IF NOT EXISTS idx_concepts_difficulty ON public.concepts(difficulty_level);

-- ============================================================================
-- CONCEPT RELATIONSHIPS
-- Defines relationships between concepts
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.concept_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relationship
  from_concept TEXT NOT NULL,
  to_concept TEXT NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'prerequisite', 'related', 'builds-on', 'applies-to'
  )),
  strength NUMERIC(3, 2) DEFAULT 0.50 CHECK (strength >= 0 AND strength <= 1),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(from_concept, to_concept, relationship_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_concept_rels_from ON public.concept_relationships(from_concept);
CREATE INDEX IF NOT EXISTS idx_concept_rels_to ON public.concept_relationships(to_concept);
CREATE INDEX IF NOT EXISTS idx_concept_rels_type ON public.concept_relationships(relationship_type);

-- ============================================================================
-- CONCEPT MASTERY
-- Tracks student mastery of individual concepts
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.concept_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL,
  
  -- Mastery level
  mastery_level TEXT NOT NULL CHECK (mastery_level IN (
    'unknown', 'introduced', 'developing', 'proficient', 'mastered'
  )),
  confidence NUMERIC(3, 2) DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Assessment data
  last_assessed TIMESTAMPTZ DEFAULT NOW(),
  assessment_count INTEGER DEFAULT 0,
  
  -- Evidence
  evidence JSONB DEFAULT '[]'::JSONB, -- Array of assessment evidence
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, concept_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_concept_mastery_user ON public.concept_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_concept ON public.concept_mastery(concept_id);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_level ON public.concept_mastery(mastery_level);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_assessed ON public.concept_mastery(last_assessed DESC);

-- ============================================================================
-- KNOWLEDGE GAPS
-- Identified gaps in student knowledge
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.knowledge_gaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  concept_id TEXT NOT NULL,
  
  -- Gap details
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),
  description TEXT,
  
  -- Recommendations
  suggested_actions TEXT[] DEFAULT ARRAY[]::TEXT[],
  related_concepts TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'addressing', 'resolved')),
  
  -- Metadata
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_user ON public.knowledge_gaps(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_concept ON public.knowledge_gaps(concept_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_severity ON public.knowledge_gaps(severity);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_status ON public.knowledge_gaps(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_gaps_detected ON public.knowledge_gaps(detected_at DESC);

-- ============================================================================
-- PROGRESS EVENTS
-- Timeline of student progress milestones
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.progress_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'concept_mastered', 'skill_developed', 'objective_completed', 'level_advanced'
  )),
  description TEXT NOT NULL,
  data JSONB DEFAULT '{}'::JSONB,
  
  -- Metadata
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_progress_events_user ON public.progress_events(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_events_type ON public.progress_events(event_type);
CREATE INDEX IF NOT EXISTS idx_progress_events_timestamp ON public.progress_events(timestamp DESC);

-- ============================================================================
-- INTERVENTION EVENTS
-- Tracks agent interventions and their effectiveness
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.intervention_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  
  -- Intervention details
  trigger TEXT NOT NULL, -- What triggered the intervention
  intervention_type TEXT NOT NULL, -- Type of intervention applied
  agent_type TEXT NOT NULL CHECK (agent_type IN (
    'assessment', 'contentGeneration', 'pathPlanning', 'intervention', 'communication', 'orchestrator'
  )),
  
  -- Effectiveness
  effectiveness NUMERIC(3, 2) CHECK (effectiveness >= 0 AND effectiveness <= 1),
  student_response TEXT,
  
  -- Metadata
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interventions_user ON public.intervention_events(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_session ON public.intervention_events(session_id);
CREATE INDEX IF NOT EXISTS idx_interventions_agent ON public.intervention_events(agent_type);
CREATE INDEX IF NOT EXISTS idx_interventions_timestamp ON public.intervention_events(timestamp DESC);

-- ============================================================================
-- LEARNING ANALYTICS
-- Aggregated analytics data for reporting
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.learning_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Time window
  time_window_start TIMESTAMPTZ NOT NULL,
  time_window_end TIMESTAMPTZ NOT NULL,
  
  -- Performance metrics (0-1 scale)
  comprehension_rate NUMERIC(3, 2) CHECK (comprehension_rate >= 0 AND comprehension_rate <= 1),
  retention_rate NUMERIC(3, 2) CHECK (retention_rate >= 0 AND retention_rate <= 1),
  transfer_rate NUMERIC(3, 2) CHECK (transfer_rate >= 0 AND transfer_rate <= 1),
  
  -- Engagement metrics
  attention_span_minutes INTEGER,
  interaction_frequency NUMERIC(5, 2),
  motivation_level NUMERIC(3, 2) CHECK (motivation_level >= 0 AND motivation_level <= 1),
  
  -- Learning efficiency
  concept_acquisition_rate NUMERIC(5, 2),
  
  -- Insights
  error_patterns JSONB DEFAULT '[]'::JSONB,
  risk_factors JSONB DEFAULT '[]'::JSONB,
  recommendations JSONB DEFAULT '[]'::JSONB,
  optimal_activities TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_user ON public.learning_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_window ON public.learning_analytics(time_window_start, time_window_end);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.learning_analytics(created_at DESC);

-- ============================================================================
-- PERFORMANCE METRICS
-- Real-time performance tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  
  -- Accuracy metrics
  correct_responses INTEGER DEFAULT 0,
  total_responses INTEGER DEFAULT 0,
  accuracy_rate NUMERIC(3, 2) CHECK (accuracy_rate >= 0 AND accuracy_rate <= 1),
  
  -- Speed metrics
  average_response_time NUMERIC(6, 1), -- seconds
  response_time_variance NUMERIC(6, 1),
  
  -- Progress metrics
  concepts_mastered INTEGER DEFAULT 0,
  skills_acquired INTEGER DEFAULT 0,
  objectives_completed INTEGER DEFAULT 0,
  
  -- Quality metrics (0-1 scale)
  response_quality NUMERIC(3, 2) CHECK (response_quality >= 0 AND response_quality <= 1),
  explanation_depth NUMERIC(3, 2) CHECK (explanation_depth >= 0 AND explanation_depth <= 1),
  critical_thinking NUMERIC(3, 2) CHECK (critical_thinking >= 0 AND critical_thinking <= 1),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_perf_metrics_user ON public.performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_session ON public.performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_created ON public.performance_metrics(created_at DESC);

-- ============================================================================
-- ENGAGEMENT METRICS
-- Real-time engagement tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.engagement_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  
  -- Interaction metrics
  message_count INTEGER DEFAULT 0,
  average_message_length NUMERIC(6, 1),
  questions_asked INTEGER DEFAULT 0,
  
  -- Attention metrics
  focus_duration_seconds INTEGER,
  distraction_events INTEGER DEFAULT 0,
  reengagement_time_seconds INTEGER,
  
  -- Emotional metrics (0-1 scale)
  positive_indicators INTEGER DEFAULT 0,
  negative_indicators INTEGER DEFAULT 0,
  frustration_level NUMERIC(3, 2) CHECK (frustration_level >= 0 AND frustration_level <= 1),
  enthusiasm_level NUMERIC(3, 2) CHECK (enthusiasm_level >= 0 AND enthusiasm_level <= 1),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_eng_metrics_user ON public.engagement_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_eng_metrics_session ON public.engagement_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_eng_metrics_created ON public.engagement_metrics(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.student_profiles_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for student-owned data (students see their own, parents/teachers see linked students)
CREATE POLICY profile_enhanced_select ON public.student_profiles_enhanced
  FOR SELECT USING (
    auth.uid()::text = user_id OR
    EXISTS (SELECT 1 FROM public.parent_student_links WHERE student_id = user_id AND parent_id = auth.uid()::text)
  );

CREATE POLICY profile_enhanced_update ON public.student_profiles_enhanced
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY profile_enhanced_insert ON public.student_profiles_enhanced
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Apply similar policies to other user-specific tables
CREATE POLICY response_patterns_select ON public.response_patterns
  FOR SELECT USING (
    auth.uid()::text = user_id OR
    EXISTS (SELECT 1 FROM public.parent_student_links WHERE student_id = user_id AND parent_id = auth.uid()::text)
  );

CREATE POLICY engagement_patterns_select ON public.engagement_patterns
  FOR SELECT USING (
    auth.uid()::text = user_id OR
    EXISTS (SELECT 1 FROM public.parent_student_links WHERE student_id = user_id AND parent_id = auth.uid()::text)
  );

CREATE POLICY activity_prefs_select ON public.activity_preferences
  FOR SELECT USING (
    auth.uid()::text = user_id OR
    EXISTS (SELECT 1 FROM public.parent_student_links WHERE student_id = user_id AND parent_id = auth.uid()::text)
  );

-- Concepts are public (read-only for students)
CREATE POLICY concepts_select_all ON public.concepts FOR SELECT USING (true);
CREATE POLICY concept_rels_select_all ON public.concept_relationships FOR SELECT USING (true);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp for enhanced profiles
CREATE TRIGGER update_profiles_enhanced_updated_at BEFORE UPDATE ON public.student_profiles_enhanced
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_prefs_updated_at BEFORE UPDATE ON public.activity_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_concept_mastery_updated_at BEFORE UPDATE ON public.concept_mastery
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View: Student Learning Profile Summary
CREATE OR REPLACE VIEW student_learning_profile AS
SELECT 
  u.id as user_id,
  u.name,
  u.grade_level,
  pe.processing_speed,
  pe.working_memory_capacity,
  pe.intrinsic_motivation,
  pe.concept_acquisition_rate,
  pe.retention_rate,
  pe.average_attention_span,
  COUNT(DISTINCT cm.concept_id) FILTER (WHERE cm.mastery_level = 'mastered') as concepts_mastered,
  COUNT(DISTINCT kg.id) FILTER (WHERE kg.status = 'active') as active_knowledge_gaps,
  AVG(ap.effectiveness_score) as avg_activity_effectiveness
FROM public.users u
LEFT JOIN public.student_profiles_enhanced pe ON pe.user_id = u.id
LEFT JOIN public.concept_mastery cm ON cm.user_id = u.id
LEFT JOIN public.knowledge_gaps kg ON kg.user_id = u.id
LEFT JOIN public.activity_preferences ap ON ap.user_id = u.id
WHERE u.role = 'student'
GROUP BY u.id, u.name, u.grade_level, pe.processing_speed, pe.working_memory_capacity, 
         pe.intrinsic_motivation, pe.concept_acquisition_rate, pe.retention_rate, pe.average_attention_span;

-- View: Recent Analytics Summary
CREATE OR REPLACE VIEW recent_analytics_summary AS
SELECT 
  user_id,
  AVG(comprehension_rate) as avg_comprehension,
  AVG(retention_rate) as avg_retention,
  AVG(motivation_level) as avg_motivation,
  AVG(concept_acquisition_rate) as avg_acquisition_rate,
  COUNT(*) as analytics_count
FROM public.learning_analytics
WHERE time_window_end >= NOW() - INTERVAL '30 days'
GROUP BY user_id;

-- View: Active Knowledge Gaps by Severity
CREATE OR REPLACE VIEW active_knowledge_gaps AS
SELECT 
  kg.*,
  c.name as concept_name,
  c.category as concept_category,
  cm.mastery_level as current_mastery
FROM public.knowledge_gaps kg
LEFT JOIN public.concepts c ON c.concept_id = kg.concept_id
LEFT JOIN public.concept_mastery cm ON cm.concept_id = kg.concept_id AND cm.user_id = kg.user_id
WHERE kg.status = 'active'
ORDER BY 
  CASE kg.severity
    WHEN 'critical' THEN 1
    WHEN 'major' THEN 2
    WHEN 'moderate' THEN 3
    WHEN 'minor' THEN 4
  END,
  kg.detected_at DESC;

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================

COMMENT ON TABLE public.student_profiles_enhanced IS 'Enhanced student profiles with cognitive and behavioral data';
COMMENT ON TABLE public.concept_mastery IS 'Tracks student mastery of individual learning concepts';
COMMENT ON TABLE public.knowledge_gaps IS 'Identified gaps in student knowledge with recommendations';
COMMENT ON TABLE public.learning_analytics IS 'Aggregated analytics data for reporting and insights';
COMMENT ON TABLE public.interaction_history IS 'Detailed tracking of all student interactions';
