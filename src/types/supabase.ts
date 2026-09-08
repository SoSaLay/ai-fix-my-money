// ============================================================================
// The database, as TypeScript.
//
// Hand-written to match `supabase/migrations/`. Regenerate with
// `supabase gen types typescript --project-id <id> > src/types/supabase.ts`
// once the project exists; until then this file and the migration are edited
// together, and a mismatch is a bug in this file.
// ============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

/** The browser storage keys that are mirrored to the database. */
export const USER_STATE_KEYS = [
  'llg_financial_data',
  'llg_spending_limit',
  'llg_savings_goals',
  'llg_investing_goal',
  'llg_general_savings',
  'llg_manual_accounts',
  'llg_ledger',
  'llg_learning_progress_v2',
  'llg_learning_review',
  'llg_learning_ack',
  'llg_learning_guided',
] as const

export type UserStateKey = (typeof USER_STATE_KEYS)[number]

/** Mirrors the `user_state_key_allowed` constraint, so a bad key fails here. */
export function isUserStateKey(value: string): value is UserStateKey {
  return (USER_STATE_KEYS as readonly string[]).includes(value)
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          display_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_state: {
        Row: {
          user_id: string
          key: UserStateKey
          value: Json
          updated_at: string
        }
        Insert: {
          user_id: string
          key: UserStateKey
          value: Json
          updated_at?: string
        }
        Update: {
          value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          track_id: string
          video_ids: string[]
          choice_ids: string[]
          correct: number | null
          total: number | null
          passed: boolean | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          track_id: string
          video_ids?: string[]
          choice_ids?: string[]
          correct?: number | null
          total?: number | null
          passed?: boolean | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          correct?: number | null
          total?: number | null
          passed?: boolean | null
          completed_at?: string | null
        }
        Relationships: []
      }
      graded_answers: {
        Row: {
          id: string
          attempt_id: string | null
          user_id: string
          track_id: string
          question_id: string
          answer_text: string
          score: number
          verdict: 'missed' | 'partial' | 'full'
          reasoning: string | null
          missed: string[]
          created_at: string
        }
        Insert: {
          id?: string
          attempt_id?: string | null
          user_id: string
          track_id: string
          question_id: string
          answer_text: string
          score: number
          verdict: 'missed' | 'partial' | 'full'
          reasoning?: string | null
          missed?: string[]
          created_at?: string
        }
        Update: never
        Relationships: []
      }
      video_reports: {
        Row: {
          id: string
          user_id: string | null
          track_id: string
          video_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          track_id: string
          video_id: string
          created_at?: string
        }
        Update: never
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
