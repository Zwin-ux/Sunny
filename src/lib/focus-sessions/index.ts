// Focus Sessions - Main export file
// 20-minute adaptive learning sessions with concept extraction and practice artifacts

export { SessionOrchestrator, sessionOrchestrator } from './session-orchestrator';
export { ConceptExtractor, conceptExtractor } from './concept-extractor';
export { ArtifactGenerator, artifactGenerator } from './artifact-generator';
export { DifficultyAdapter, difficultyAdapter } from './difficulty-adapter';
export { MemoryManager, memoryManager } from './memory-manager';

// Re-export types for convenience
export type {
  FocusSession,
  FocusSessionRequest,
  SessionLoop,
  SessionArtifact,
  ArtifactType,
  ConceptMap,
  Subtopic,
  FlashcardSet,
  Flashcard,
  Quiz,
  QuizItem,
  MicroGameSpec,
  LoopPerformance,
  SessionPerformance,
  ReviewPlan,
  SessionSummary,
  ConceptMemory,
  FocusSessionEvent,
  DEFAULT_SESSION_CONFIG as SessionConfig,
} from '@/types/focus-session';
