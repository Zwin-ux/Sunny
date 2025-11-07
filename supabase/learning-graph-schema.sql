-- =============================================================================
-- SUNNY LEARNING GRAPH SCHEMA
-- =============================================================================
-- A typed Directed Acyclic Graph (DAG) for representing learning relationships
--
-- Design Principles:
-- 1. Nodes represent discrete learning elements (concepts, skills, activities)
-- 2. Edges represent typed relationships (prerequisites, reinforces, etc.)
-- 3. Mastery is tracked per-student per-node with Bayesian Knowledge Tracing
-- 4. Graph is queryable for pathfinding, prerequisite chains, and recommendations
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- NODE TYPES
-- =============================================================================

CREATE TYPE node_type AS ENUM (
  'concept',      -- Abstract learning concept (e.g., "addition", "photosynthesis")
  'skill',        -- Concrete skill (e.g., "add two-digit numbers")
  'activity',     -- Learning activity (e.g., "multiplication quiz")
  'assessment',   -- Assessment/test
  'intervention', -- Remedial intervention
  'evidence'      -- Evidence of learning (completed work, performance data)
);

CREATE TYPE edge_type AS ENUM (
  'prerequisite',  -- A must come before B
  'reinforces',    -- A strengthens understanding of B
  'assessed_by',   -- Concept A is assessed by Assessment B
  'next_best',     -- Recommended next step in learning path
  'related_to',    -- Semantically related concepts
  'part_of',       -- A is a component of larger concept B
  'applies_to',    -- Skill A applies to context B
  'evidences'      -- Evidence node supports mastery of concept
);

CREATE TYPE mastery_level AS ENUM (
  'unknown',       -- No interaction yet (0-10%)
  'introduced',    -- Seen once (10-30%)
  'developing',    -- Working on it (30-60%)
  'proficient',    -- Can do with minor errors (60-85%)
  'mastered',      -- Consistent success (85-95%)
  'expert'         -- Deep understanding, can teach others (95-100%)
);

CREATE TYPE bloom_level AS ENUM (
  'remember',      -- Recall facts
  'understand',    -- Explain ideas
  'apply',         -- Use in new situations
  'analyze',       -- Break down and examine
  'evaluate',      -- Judge and critique
  'create'         -- Produce new work
);

-- =============================================================================
-- GRAPH NODES TABLE
-- =============================================================================

CREATE TABLE learning_graph_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Node metadata
  node_type node_type NOT NULL,
  label TEXT NOT NULL, -- Human-readable name (e.g., "Addition")
  description TEXT,

  -- Content metadata
  subject TEXT, -- e.g., "math", "science", "language"
  grade_level INTEGER CHECK (grade_level BETWEEN 1 AND 12),
  bloom_level bloom_level,
  estimated_duration_minutes INTEGER, -- How long to learn this

  -- Curriculum alignment
  common_core_standard TEXT, -- e.g., "CCSS.MATH.CONTENT.2.OA.A.1"
  tags TEXT[], -- Searchable tags

  -- Content (varies by node_type)
  content JSONB, -- Flexible storage for activity instructions, assessment questions, etc.

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,

  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(label, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(coalesce(tags, ARRAY[]::TEXT[]), ' ')), 'C')
  ) STORED
);

-- Indexes for performance
CREATE INDEX idx_graph_nodes_type ON learning_graph_nodes(node_type);
CREATE INDEX idx_graph_nodes_subject ON learning_graph_nodes(subject);
CREATE INDEX idx_graph_nodes_grade ON learning_graph_nodes(grade_level);
CREATE INDEX idx_graph_nodes_search ON learning_graph_nodes USING GIN(search_vector);
CREATE INDEX idx_graph_nodes_tags ON learning_graph_nodes USING GIN(tags);
CREATE INDEX idx_graph_nodes_active ON learning_graph_nodes(is_active) WHERE is_active = TRUE;

-- =============================================================================
-- GRAPH EDGES TABLE
-- =============================================================================

CREATE TABLE learning_graph_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Edge definition
  source_node_id UUID NOT NULL REFERENCES learning_graph_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES learning_graph_nodes(id) ON DELETE CASCADE,
  edge_type edge_type NOT NULL,

  -- Edge metadata
  strength DECIMAL(3, 2) CHECK (strength BETWEEN 0 AND 1), -- How strong is this relationship? (0-1)
  confidence DECIMAL(3, 2) CHECK (confidence BETWEEN 0 AND 1), -- How confident are we in this edge?
  evidence TEXT[], -- Citations, research, teacher input

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,

  -- Prevent cycles and duplicate edges
  CONSTRAINT no_self_loops CHECK (source_node_id != target_node_id),
  CONSTRAINT unique_edge UNIQUE (source_node_id, target_node_id, edge_type)
);

-- Indexes
CREATE INDEX idx_graph_edges_source ON learning_graph_edges(source_node_id);
CREATE INDEX idx_graph_edges_target ON learning_graph_edges(target_node_id);
CREATE INDEX idx_graph_edges_type ON learning_graph_edges(edge_type);
CREATE INDEX idx_graph_edges_active ON learning_graph_edges(is_active) WHERE is_active = TRUE;

-- =============================================================================
-- STUDENT MASTERY TRACKING
-- =============================================================================

CREATE TABLE student_node_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Link to student and node
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES learning_graph_nodes(id) ON DELETE CASCADE,

  -- Mastery metrics (Bayesian Knowledge Tracing)
  mastery_level mastery_level DEFAULT 'unknown',
  mastery_probability DECIMAL(5, 4) CHECK (mastery_probability BETWEEN 0 AND 1), -- P(mastery)

  -- BKT parameters
  p_learn DECIMAL(5, 4) DEFAULT 0.3, -- Probability of learning from instruction
  p_guess DECIMAL(5, 4) DEFAULT 0.25, -- Probability of guessing correctly
  p_slip DECIMAL(5, 4) DEFAULT 0.1, -- Probability of making a mistake despite knowing
  p_init DECIMAL(5, 4) DEFAULT 0.05, -- Initial probability student knows skill

  -- Performance tracking
  total_attempts INTEGER DEFAULT 0,
  successful_attempts INTEGER DEFAULT 0,
  accuracy DECIMAL(5, 4), -- successful_attempts / total_attempts

  -- Time tracking
  total_time_spent_seconds INTEGER DEFAULT 0,
  first_seen_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ, -- When they reached 'mastered' level

  -- Decay (spaced repetition)
  decay_rate DECIMAL(5, 4) DEFAULT 0.05, -- How fast mastery decays (per day)
  next_review_at TIMESTAMPTZ, -- When should this be reviewed next?

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_student_node UNIQUE (student_id, node_id)
);

-- Indexes
CREATE INDEX idx_mastery_student ON student_node_mastery(student_id);
CREATE INDEX idx_mastery_node ON student_node_mastery(node_id);
CREATE INDEX idx_mastery_level ON student_node_mastery(mastery_level);
CREATE INDEX idx_mastery_review ON student_node_mastery(next_review_at) WHERE next_review_at IS NOT NULL;
CREATE INDEX idx_mastery_updated ON student_node_mastery(updated_at);

-- =============================================================================
-- LEARNING INTERACTIONS (Evidence Collection)
-- =============================================================================

CREATE TABLE learning_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Links
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES learning_graph_nodes(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id),

  -- Interaction details
  interaction_type TEXT NOT NULL, -- 'question_answer', 'activity_complete', 'assessment', 'practice'
  success BOOLEAN, -- Did they get it right?
  response JSONB, -- Student's response/work
  correct_answer JSONB, -- What the correct answer was

  -- Performance metrics
  time_spent_seconds INTEGER,
  hints_used INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 1,
  confidence_self_reported INTEGER CHECK (confidence_self_reported BETWEEN 1 AND 5),

  -- Context
  difficulty_level TEXT, -- 'easy', 'medium', 'hard'
  context_tags TEXT[], -- Additional context (e.g., 'timed', 'collaborative')

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_interactions_student ON learning_interactions(student_id);
CREATE INDEX idx_interactions_node ON learning_interactions(node_id);
CREATE INDEX idx_interactions_session ON learning_interactions(session_id);
CREATE INDEX idx_interactions_created ON learning_interactions(created_at);
CREATE INDEX idx_interactions_type ON learning_interactions(interaction_type);

-- =============================================================================
-- MASTERY UPDATE FUNCTION (Bayesian Knowledge Tracing)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_mastery(
  p_student_id UUID,
  p_node_id UUID,
  p_correct BOOLEAN,
  p_time_spent_seconds INTEGER DEFAULT NULL
) RETURNS student_node_mastery AS $$
DECLARE
  v_mastery student_node_mastery;
  v_p_mastery_prev DECIMAL(5, 4);
  v_p_mastery_new DECIMAL(5, 4);
  v_accuracy DECIMAL(5, 4);
  v_new_level mastery_level;
BEGIN
  -- Get or create mastery record
  INSERT INTO student_node_mastery (student_id, node_id, first_seen_at, last_seen_at)
  VALUES (p_student_id, p_node_id, NOW(), NOW())
  ON CONFLICT (student_id, node_id) DO NOTHING;

  SELECT * INTO v_mastery
  FROM student_node_mastery
  WHERE student_id = p_student_id AND node_id = p_node_id;

  -- Update attempts
  v_mastery.total_attempts := v_mastery.total_attempts + 1;
  IF p_correct THEN
    v_mastery.successful_attempts := v_mastery.successful_attempts + 1;
  END IF;

  v_accuracy := v_mastery.successful_attempts::DECIMAL / v_mastery.total_attempts::DECIMAL;
  v_mastery.accuracy := v_accuracy;

  -- Bayesian Knowledge Tracing update
  v_p_mastery_prev := COALESCE(v_mastery.mastery_probability, v_mastery.p_init);

  IF p_correct THEN
    -- Correct response: P(L_new) = P(L_prev) / [P(L_prev) + (1 - P(L_prev)) * P(G)]
    v_p_mastery_new := v_p_mastery_prev / (v_p_mastery_prev + (1 - v_p_mastery_prev) * v_mastery.p_guess);
  ELSE
    -- Incorrect response: P(L_new) = P(L_prev) * P(S) / [P(L_prev) * P(S) + (1 - P(L_prev)) * (1 - P(G))]
    v_p_mastery_new := (v_p_mastery_prev * v_mastery.p_slip) /
      (v_p_mastery_prev * v_mastery.p_slip + (1 - v_p_mastery_prev) * (1 - v_mastery.p_guess));
  END IF;

  -- Account for learning from instruction (gradual improvement)
  v_p_mastery_new := v_p_mastery_new + (1 - v_p_mastery_new) * v_mastery.p_learn;

  -- Clamp between 0 and 1
  v_p_mastery_new := GREATEST(0, LEAST(1, v_p_mastery_new));

  v_mastery.mastery_probability := v_p_mastery_new;

  -- Determine mastery level from probability
  v_new_level := CASE
    WHEN v_p_mastery_new >= 0.95 THEN 'expert'::mastery_level
    WHEN v_p_mastery_new >= 0.85 THEN 'mastered'::mastery_level
    WHEN v_p_mastery_new >= 0.60 THEN 'proficient'::mastery_level
    WHEN v_p_mastery_new >= 0.30 THEN 'developing'::mastery_level
    WHEN v_p_mastery_new >= 0.10 THEN 'introduced'::mastery_level
    ELSE 'unknown'::mastery_level
  END;

  -- Check if just reached mastery
  IF v_mastery.mastery_level < 'mastered'::mastery_level AND v_new_level >= 'mastered'::mastery_level THEN
    v_mastery.mastered_at := NOW();
  END IF;

  v_mastery.mastery_level := v_new_level;

  -- Update time tracking
  IF p_time_spent_seconds IS NOT NULL THEN
    v_mastery.total_time_spent_seconds := v_mastery.total_time_spent_seconds + p_time_spent_seconds;
  END IF;

  v_mastery.last_seen_at := NOW();
  v_mastery.updated_at := NOW();

  -- Calculate next review date (spaced repetition)
  -- Higher mastery = longer interval
  v_mastery.next_review_at := NOW() + INTERVAL '1 day' * (
    CASE
      WHEN v_new_level = 'expert' THEN 30
      WHEN v_new_level = 'mastered' THEN 14
      WHEN v_new_level = 'proficient' THEN 7
      WHEN v_new_level = 'developing' THEN 3
      WHEN v_new_level = 'introduced' THEN 1
      ELSE 1
    END
  );

  -- Save
  UPDATE student_node_mastery
  SET
    mastery_level = v_mastery.mastery_level,
    mastery_probability = v_mastery.mastery_probability,
    total_attempts = v_mastery.total_attempts,
    successful_attempts = v_mastery.successful_attempts,
    accuracy = v_mastery.accuracy,
    total_time_spent_seconds = v_mastery.total_time_spent_seconds,
    last_seen_at = v_mastery.last_seen_at,
    mastered_at = v_mastery.mastered_at,
    next_review_at = v_mastery.next_review_at,
    updated_at = v_mastery.updated_at
  WHERE id = v_mastery.id;

  RETURN v_mastery;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PATHFINDING FUNCTIONS
-- =============================================================================

-- Get all prerequisites for a node (recursive)
CREATE OR REPLACE FUNCTION get_prerequisites(p_node_id UUID)
RETURNS TABLE (
  node_id UUID,
  label TEXT,
  distance INTEGER
) AS $$
WITH RECURSIVE prereq_chain AS (
  -- Base case: direct prerequisites
  SELECT
    e.source_node_id AS node_id,
    n.label,
    1 AS distance
  FROM learning_graph_edges e
  JOIN learning_graph_nodes n ON n.id = e.source_node_id
  WHERE e.target_node_id = p_node_id
    AND e.edge_type = 'prerequisite'
    AND e.is_active = TRUE
    AND n.is_active = TRUE

  UNION

  -- Recursive case: prerequisites of prerequisites
  SELECT
    e.source_node_id,
    n.label,
    pc.distance + 1
  FROM learning_graph_edges e
  JOIN learning_graph_nodes n ON n.id = e.source_node_id
  JOIN prereq_chain pc ON pc.node_id = e.target_node_id
  WHERE e.edge_type = 'prerequisite'
    AND e.is_active = TRUE
    AND n.is_active = TRUE
    AND pc.distance < 10 -- Prevent infinite loops
)
SELECT DISTINCT node_id, label, distance
FROM prereq_chain
ORDER BY distance;
$$ LANGUAGE SQL;

-- Get recommended next nodes for a student
CREATE OR REPLACE FUNCTION get_next_best_nodes(
  p_student_id UUID,
  p_limit INTEGER DEFAULT 5
) RETURNS TABLE (
  node_id UUID,
  label TEXT,
  node_type node_type,
  estimated_duration_minutes INTEGER,
  reason TEXT,
  score DECIMAL
) AS $$
SELECT
  n.id AS node_id,
  n.label,
  n.node_type,
  n.estimated_duration_minutes,
  'Prerequisites met, not yet mastered' AS reason,
  (1.0 - COALESCE(m.mastery_probability, 0)) * e.strength AS score
FROM learning_graph_nodes n
LEFT JOIN student_node_mastery m ON m.node_id = n.id AND m.student_id = p_student_id
JOIN learning_graph_edges e ON e.target_node_id = n.id AND e.edge_type = 'next_best'
WHERE n.is_active = TRUE
  AND (m.mastery_level IS NULL OR m.mastery_level < 'mastered')
  -- Check all prerequisites are mastered
  AND NOT EXISTS (
    SELECT 1
    FROM learning_graph_edges prereq
    LEFT JOIN student_node_mastery prereq_mastery
      ON prereq_mastery.node_id = prereq.source_node_id
      AND prereq_mastery.student_id = p_student_id
    WHERE prereq.target_node_id = n.id
      AND prereq.edge_type = 'prerequisite'
      AND prereq.is_active = TRUE
      AND (prereq_mastery.mastery_level IS NULL OR prereq_mastery.mastery_level < 'proficient')
  )
ORDER BY score DESC
LIMIT p_limit;
$$ LANGUAGE SQL;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_graph_nodes_updated_at
  BEFORE UPDATE ON learning_graph_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_mastery_updated_at
  BEFORE UPDATE ON student_node_mastery
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE learning_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_node_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for graph nodes (public read, teacher/admin write)
CREATE POLICY "Public can view active nodes"
  ON learning_graph_nodes FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Teachers can manage nodes"
  ON learning_graph_nodes FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('teacher', 'admin')
    )
  );

-- Policies for edges (same as nodes)
CREATE POLICY "Public can view active edges"
  ON learning_graph_edges FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Teachers can manage edges"
  ON learning_graph_edges FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('teacher', 'admin')
    )
  );

-- Policies for mastery (students can view their own)
CREATE POLICY "Students can view their own mastery"
  ON student_node_mastery FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can update their own mastery"
  ON student_node_mastery FOR UPDATE
  USING (student_id = auth.uid());

CREATE POLICY "System can insert mastery records"
  ON student_node_mastery FOR INSERT
  WITH CHECK (TRUE); -- Controlled by application logic

-- Policies for interactions
CREATE POLICY "Students can view their own interactions"
  ON learning_interactions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "System can insert interactions"
  ON learning_interactions FOR INSERT
  WITH CHECK (TRUE); -- Controlled by application logic

-- =============================================================================
-- SAMPLE DATA
-- =============================================================================

-- Insert sample concept nodes
INSERT INTO learning_graph_nodes (node_type, label, description, subject, grade_level, bloom_level, tags) VALUES
('concept', 'Addition', 'Combining two numbers to get a sum', 'math', 1, 'understand', ARRAY['arithmetic', 'operations']),
('concept', 'Subtraction', 'Taking one number away from another', 'math', 1, 'understand', ARRAY['arithmetic', 'operations']),
('concept', 'Multiplication', 'Repeated addition', 'math', 2, 'apply', ARRAY['arithmetic', 'operations', 'times-tables']),
('skill', 'Add Single-Digit Numbers', 'Add numbers 0-9', 'math', 1, 'apply', ARRAY['addition', 'basic']),
('skill', 'Add Two-Digit Numbers', 'Add numbers 10-99', 'math', 2, 'apply', ARRAY['addition', 'intermediate']),
('activity', 'Addition Flashcards', 'Practice addition with flashcards', 'math', 1, 'remember', ARRAY['addition', 'practice']);

-- Create prerequisite edges
WITH nodes AS (
  SELECT id, label FROM learning_graph_nodes WHERE label IN ('Addition', 'Add Single-Digit Numbers', 'Add Two-Digit Numbers', 'Multiplication')
)
INSERT INTO learning_graph_edges (source_node_id, target_node_id, edge_type, strength, confidence)
SELECT
  (SELECT id FROM nodes WHERE label = 'Addition'),
  (SELECT id FROM nodes WHERE label = 'Add Single-Digit Numbers'),
  'prerequisite',
  0.9,
  0.95
UNION ALL
SELECT
  (SELECT id FROM nodes WHERE label = 'Add Single-Digit Numbers'),
  (SELECT id FROM nodes WHERE label = 'Add Two-Digit Numbers'),
  'prerequisite',
  0.85,
  0.9
UNION ALL
SELECT
  (SELECT id FROM nodes WHERE label = 'Addition'),
  (SELECT id FROM nodes WHERE label = 'Multiplication'),
  'prerequisite',
  0.95,
  0.98;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE learning_graph_nodes IS 'Nodes in the learning graph representing concepts, skills, activities, assessments, and evidence';
COMMENT ON TABLE learning_graph_edges IS 'Typed edges connecting nodes in the learning graph';
COMMENT ON TABLE student_node_mastery IS 'Per-student mastery tracking using Bayesian Knowledge Tracing';
COMMENT ON TABLE learning_interactions IS 'Evidence of learning - all student interactions with nodes';
COMMENT ON FUNCTION update_mastery IS 'Updates student mastery using BKT algorithm based on correct/incorrect responses';
COMMENT ON FUNCTION get_prerequisites IS 'Recursively finds all prerequisite nodes for a given node';
COMMENT ON FUNCTION get_next_best_nodes IS 'Recommends next learning nodes for a student based on mastery and prerequisites';
