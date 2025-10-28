/**
 * Supabase Database Type Definitions
 *
 * This file defines TypeScript types for all tables in the Supabase database.
 * It provides type safety for database operations throughout the application.
 */

import { UserProfile } from './user'
import {
  ConceptMap,
  SessionLoop,
  LoopPerformance,
  SessionPerformance,
  ReviewPlan,
  FlashcardSet,
  Quiz,
  MicroGameSpec
} from './focus-session'
import { SunnyChatMessage, StudentProfile as BaseStudentProfile } from './chat'

// Database schema definition
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          password_hash: string
          learning_style: string | null
          learning_interests: string[]
          progress: Record<string, number>
          quiz_progress: Record<string, { correct: number; total: number }>
          chat_history: SunnyChatMessage[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          password_hash: string
          learning_style?: string | null
          learning_interests?: string[]
          progress?: Record<string, number>
          quiz_progress?: Record<string, { correct: number; total: number }>
          chat_history?: SunnyChatMessage[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          password_hash?: string
          learning_style?: string | null
          learning_interests?: string[]
          progress?: Record<string, number>
          quiz_progress?: Record<string, { correct: number; total: number }>
          chat_history?: SunnyChatMessage[]
          created_at?: string
          updated_at?: string
        }
      }
      student_profiles: {
        Row: {
          id: string
          user_id: string | null
          name: string
          level: number
          points: number
          emotion: string
          learning_style: string | null
          known_concepts: string[]
          knowledge_gaps: string[]
          completed_lessons: string[]
          conversation_history: SunnyChatMessage[]
          last_challenge: any
          cognitive_profile: Record<string, any>
          motivation_factors: Record<string, any>
          learning_velocity: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id?: string | null
          name: string
          level?: number
          points?: number
          emotion?: string
          learning_style?: string | null
          known_concepts?: string[]
          knowledge_gaps?: string[]
          completed_lessons?: string[]
          conversation_history?: SunnyChatMessage[]
          last_challenge?: any
          cognitive_profile?: Record<string, any>
          motivation_factors?: Record<string, any>
          learning_velocity?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          level?: number
          points?: number
          emotion?: string
          learning_style?: string | null
          known_concepts?: string[]
          knowledge_gaps?: string[]
          completed_lessons?: string[]
          conversation_history?: SunnyChatMessage[]
          last_challenge?: any
          cognitive_profile?: Record<string, any>
          motivation_factors?: Record<string, any>
          learning_velocity?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          user_id: string | null
          student_profile_id: string | null
          role: 'user' | 'assistant' | 'system'
          content: string
          message_type: 'chat' | 'challenge' | 'feedback' | null
          metadata: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          student_profile_id?: string | null
          role: 'user' | 'assistant' | 'system'
          content: string
          message_type?: 'chat' | 'challenge' | 'feedback' | null
          metadata?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          student_profile_id?: string | null
          role?: 'user' | 'assistant' | 'system'
          content?: string
          message_type?: 'chat' | 'challenge' | 'feedback' | null
          metadata?: Record<string, any>
          created_at?: string
        }
      }
      focus_sessions: {
        Row: {
          id: string
          student_id: string
          topic: string
          target_duration: number
          start_time: string
          end_time: string | null
          concept_map: ConceptMap
          loops: SessionLoop[]
          performance: SessionPerformance | null
          review_plan: ReviewPlan | null
          status: 'active' | 'completed' | 'abandoned'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          student_id: string
          topic: string
          target_duration?: number
          start_time: string
          end_time?: string | null
          concept_map: ConceptMap
          loops?: SessionLoop[]
          performance?: SessionPerformance | null
          review_plan?: ReviewPlan | null
          status?: 'active' | 'completed' | 'abandoned'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          topic?: string
          target_duration?: number
          start_time?: string
          end_time?: string | null
          concept_map?: ConceptMap
          loops?: SessionLoop[]
          performance?: SessionPerformance | null
          review_plan?: ReviewPlan | null
          status?: 'active' | 'completed' | 'abandoned'
          created_at?: string
          updated_at?: string
        }
      }
      concept_memories: {
        Row: {
          id: string
          student_id: string
          concept: string
          category: string | null
          mastery_level: number
          times_practiced: number
          times_correct: number
          ease_factor: number
          interval: number
          next_review_date: string | null
          recent_interactions: any[]
          first_seen: string
          last_practiced: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          concept: string
          category?: string | null
          mastery_level?: number
          times_practiced?: number
          times_correct?: number
          ease_factor?: number
          interval?: number
          next_review_date?: string | null
          recent_interactions?: any[]
          first_seen?: string
          last_practiced?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          concept?: string
          category?: string | null
          mastery_level?: number
          times_practiced?: number
          times_correct?: number
          ease_factor?: number
          interval?: number
          next_review_date?: string | null
          recent_interactions?: any[]
          first_seen?: string
          last_practiced?: string
          created_at?: string
          updated_at?: string
        }
      }
      lesson_plans: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          grade_level: string
          author: string
          is_sample: boolean
          content: any
          tags: string[]
          keywords: string[]
          learning_outcomes: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title: string
          description?: string | null
          category: string
          grade_level: string
          author: string
          is_sample?: boolean
          content: any
          tags?: string[]
          keywords?: string[]
          learning_outcomes?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string
          grade_level?: string
          author?: string
          is_sample?: boolean
          content?: any
          tags?: string[]
          keywords?: string[]
          learning_outcomes?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: string
          student_id: string
          game_type: string
          difficulty: string
          score: number
          duration: number | null
          completed: boolean
          metrics: Record<string, any>
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          student_id: string
          game_type: string
          difficulty: string
          score?: number
          duration?: number | null
          completed?: boolean
          metrics?: Record<string, any>
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          game_type?: string
          difficulty?: string
          score?: number
          duration?: number | null
          completed?: boolean
          metrics?: Record<string, any>
          started_at?: string
          completed_at?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
