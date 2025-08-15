export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          row_id: string | null
          source: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          row_id?: string | null
          source?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          row_id?: string | null
          source?: string | null
          table_name?: string
        }
        Relationships: []
      }
      biometrics: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      burnout_selfcheck_logs: {
        Row: {
          connection_id: string
          energy: number | null
          id: string
          irritability: number | null
          mood: number | null
          motivation: number | null
          notes: string | null
          sleep_quality: number | null
          timestamp: string | null
        }
        Insert: {
          connection_id: string
          energy?: number | null
          id?: string
          irritability?: number | null
          mood?: number | null
          motivation?: number | null
          notes?: string | null
          sleep_quality?: number | null
          timestamp?: string | null
        }
        Update: {
          connection_id?: string
          energy?: number | null
          id?: string
          irritability?: number | null
          mood?: number | null
          motivation?: number | null
          notes?: string | null
          sleep_quality?: number | null
          timestamp?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          embeddings: string | null
          id: string
          metadata: Json | null
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          embeddings?: string | null
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          embeddings?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          agent_type: string
          context: Json | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_type?: string
          context?: Json | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_type?: string
          context?: Json | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_resources: {
        Row: {
          created_at: string | null
          date: string | null
          id: string
          image_url: string | null
          link: string
          published_at: string | null
          summary: string | null
          title: string
          topic_tags: string[] | null
          type: string
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          id?: string
          image_url?: string | null
          link: string
          published_at?: string | null
          summary?: string | null
          title: string
          topic_tags?: string[] | null
          type: string
        }
        Update: {
          created_at?: string | null
          date?: string | null
          id?: string
          image_url?: string | null
          link?: string
          published_at?: string | null
          summary?: string | null
          title?: string
          topic_tags?: string[] | null
          type?: string
        }
        Relationships: []
      }
      mood_reflections: {
        Row: {
          created_at: string | null
          id: string
          mood_emoji: string | null
          mood_text: string | null
          suggestion_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mood_emoji?: string | null
          mood_text?: string | null
          suggestion_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mood_emoji?: string | null
          mood_text?: string | null
          suggestion_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mood_reflections_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "suggestion_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_pkce_states: {
        Row: {
          code_verifier: string
          created_at: string
          expires_at: string
          id: string
          state: string
          user_id: string
        }
        Insert: {
          code_verifier: string
          created_at?: string
          expires_at: string
          id?: string
          state: string
          user_id: string
        }
        Update: {
          code_verifier?: string
          created_at?: string
          expires_at?: string
          id?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_items: {
        Row: {
          created_at: string | null
          date: string
          duration_min: number | null
          evidence_snippets: Json | null
          id: string
          intensity: string | null
          pillar: Database["public"]["Enums"]["pillar"]
          plan_id: string
          rationale: string | null
          scheduled_time: string | null
          status: Database["public"]["Enums"]["plan_item_status"]
          suggested_slot: string | null
          task_payload: Json
          task_title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          duration_min?: number | null
          evidence_snippets?: Json | null
          id?: string
          intensity?: string | null
          pillar: Database["public"]["Enums"]["pillar"]
          plan_id: string
          rationale?: string | null
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["plan_item_status"]
          suggested_slot?: string | null
          task_payload: Json
          task_title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          duration_min?: number | null
          evidence_snippets?: Json | null
          id?: string
          intensity?: string | null
          pillar?: Database["public"]["Enums"]["pillar"]
          plan_id?: string
          rationale?: string | null
          scheduled_time?: string | null
          status?: Database["public"]["Enums"]["plan_item_status"]
          suggested_slot?: string | null
          task_payload?: Json
          task_title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_plan_items_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "mv_plan_metrics_rollups"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "fk_plan_items_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_progress_events: {
        Row: {
          event_type: Database["public"]["Enums"]["progress_event_type"]
          id: string
          mood_after: number | null
          mood_before: number | null
          notes: string | null
          plan_item_id: string
          timestamp: string
          user_id: string
        }
        Insert: {
          event_type: Database["public"]["Enums"]["progress_event_type"]
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          plan_item_id: string
          timestamp?: string
          user_id: string
        }
        Update: {
          event_type?: Database["public"]["Enums"]["progress_event_type"]
          id?: string
          mood_after?: number | null
          mood_before?: number | null
          notes?: string | null
          plan_item_id?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_events_item"
            columns: ["plan_item_id"]
            isOneToOne: false
            referencedRelation: "plan_items"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          metadata: Json | null
          source: Database["public"]["Enums"]["plan_source"]
          source_ref: string | null
          start_date: string
          status: Database["public"]["Enums"]["plan_status"]
          updated_at: string | null
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          metadata?: Json | null
          source: Database["public"]["Enums"]["plan_source"]
          source_ref?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string | null
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          metadata?: Json | null
          source?: Database["public"]["Enums"]["plan_source"]
          source_ref?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["plan_status"]
          updated_at?: string | null
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      program_templates: {
        Row: {
          audience_tags: string[] | null
          created_at: string | null
          days: Json
          description: string | null
          id: string
          name: string
          updated_at: string | null
          version: number
        }
        Insert: {
          audience_tags?: string[] | null
          created_at?: string | null
          days: Json
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          audience_tags?: string[] | null
          created_at?: string | null
          days?: Json
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: []
      }
      recovery_plan_reflections: {
        Row: {
          created_at: string | null
          day: string
          id: string
          plan_id: string | null
          prompt: string
          reflection_text: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          day: string
          id?: string
          plan_id?: string | null
          prompt: string
          reflection_text?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          day?: string
          id?: string
          plan_id?: string | null
          prompt?: string
          reflection_text?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recovery_plan_reflections_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "recovery_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      recovery_plan_tasks: {
        Row: {
          category: string | null
          completed: boolean | null
          created_at: string | null
          date: string
          duration_minutes: number | null
          evidence_ids: string[] | null
          id: string
          pillar: string | null
          plan_id: string | null
          rationale: string | null
          recipe_id: string | null
          scheduled_at: string | null
          slot_hint: string | null
          slug: string | null
          task_payload: Json | null
          time_suggestion: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          completed?: boolean | null
          created_at?: string | null
          date: string
          duration_minutes?: number | null
          evidence_ids?: string[] | null
          id?: string
          pillar?: string | null
          plan_id?: string | null
          rationale?: string | null
          recipe_id?: string | null
          scheduled_at?: string | null
          slot_hint?: string | null
          slug?: string | null
          task_payload?: Json | null
          time_suggestion?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          completed?: boolean | null
          created_at?: string | null
          date?: string
          duration_minutes?: number | null
          evidence_ids?: string[] | null
          id?: string
          pillar?: string | null
          plan_id?: string | null
          rationale?: string | null
          recipe_id?: string | null
          scheduled_at?: string | null
          slot_hint?: string | null
          slug?: string | null
          task_payload?: Json | null
          time_suggestion?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recovery_plan_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "recovery_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      recovery_plans: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          length_days: number | null
          metadata: Json | null
          mode: string | null
          source: string | null
          source_ref: string | null
          start_date: string
          title: string
          user_id: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          length_days?: number | null
          metadata?: Json | null
          mode?: string | null
          source?: string | null
          source_ref?: string | null
          start_date: string
          title: string
          user_id?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          length_days?: number | null
          metadata?: Json | null
          mode?: string | null
          source?: string | null
          source_ref?: string | null
          start_date?: string
          title?: string
          user_id?: string | null
          version?: number | null
        }
        Relationships: []
      }
      studies_inventory: {
        Row: {
          authors: string[] | null
          doi: string | null
          error_message: string | null
          filename: string
          id: string
          integrated_at: string | null
          pdf_url: string | null
          publication_date: string | null
          status: string
          tags: string[] | null
          title: string | null
          uploaded_at: string
          vector_store_count: number | null
        }
        Insert: {
          authors?: string[] | null
          doi?: string | null
          error_message?: string | null
          filename: string
          id?: string
          integrated_at?: string | null
          pdf_url?: string | null
          publication_date?: string | null
          status?: string
          tags?: string[] | null
          title?: string | null
          uploaded_at?: string
          vector_store_count?: number | null
        }
        Update: {
          authors?: string[] | null
          doi?: string | null
          error_message?: string | null
          filename?: string
          id?: string
          integrated_at?: string | null
          pdf_url?: string | null
          publication_date?: string | null
          status?: string
          tags?: string[] | null
          title?: string | null
          uploaded_at?: string
          vector_store_count?: number | null
        }
        Relationships: []
      }
      suggestion_logs: {
        Row: {
          completed: boolean | null
          created_at: string | null
          data_used: string | null
          evidence_note: string | null
          focus_used: string | null
          id: string
          kb_doc_ids: Json | null
          recovery_score: number | null
          source: string | null
          subjective_input: Json | null
          suggestion: Json | null
          suggestion_date: string | null
          trend: string | null
          user_id: string | null
          wearable_data: Json | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          data_used?: string | null
          evidence_note?: string | null
          focus_used?: string | null
          id?: string
          kb_doc_ids?: Json | null
          recovery_score?: number | null
          source?: string | null
          subjective_input?: Json | null
          suggestion?: Json | null
          suggestion_date?: string | null
          trend?: string | null
          user_id?: string | null
          wearable_data?: Json | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          data_used?: string | null
          evidence_note?: string | null
          focus_used?: string | null
          id?: string
          kb_doc_ids?: Json | null
          recovery_score?: number | null
          source?: string | null
          subjective_input?: Json | null
          suggestion?: Json | null
          suggestion_date?: string | null
          trend?: string | null
          user_id?: string | null
          wearable_data?: Json | null
        }
        Relationships: []
      }
      task_library: {
        Row: {
          content: Json | null
          contraindications: string[] | null
          created_at: string | null
          default_circadian_slots: string[] | null
          description: string | null
          duration_max: number | null
          duration_min: number | null
          evidence_refs: string[] | null
          id: string
          intensity_tags: string[] | null
          pillar: Database["public"]["Enums"]["pillar"]
          slug: string
          title: string
          updated_at: string | null
          version: number
          zeitgeber_tags: string[] | null
        }
        Insert: {
          content?: Json | null
          contraindications?: string[] | null
          created_at?: string | null
          default_circadian_slots?: string[] | null
          description?: string | null
          duration_max?: number | null
          duration_min?: number | null
          evidence_refs?: string[] | null
          id?: string
          intensity_tags?: string[] | null
          pillar: Database["public"]["Enums"]["pillar"]
          slug: string
          title: string
          updated_at?: string | null
          version?: number
          zeitgeber_tags?: string[] | null
        }
        Update: {
          content?: Json | null
          contraindications?: string[] | null
          created_at?: string | null
          default_circadian_slots?: string[] | null
          description?: string | null
          duration_max?: number | null
          duration_min?: number | null
          evidence_refs?: string[] | null
          id?: string
          intensity_tags?: string[] | null
          pillar?: Database["public"]["Enums"]["pillar"]
          slug?: string
          title?: string
          updated_at?: string | null
          version?: number
          zeitgeber_tags?: string[] | null
        }
        Relationships: []
      }
      user_circadian_profiles: {
        Row: {
          bedtime: string
          caffeine_cutoff: string | null
          chronotype: Database["public"]["Enums"]["chronotype"]
          created_at: string | null
          light_exposure_prefs: string | null
          shift_work_flag: boolean | null
          updated_at: string | null
          user_id: string
          wake_time: string
        }
        Insert: {
          bedtime: string
          caffeine_cutoff?: string | null
          chronotype?: Database["public"]["Enums"]["chronotype"]
          created_at?: string | null
          light_exposure_prefs?: string | null
          shift_work_flag?: boolean | null
          updated_at?: string | null
          user_id: string
          wake_time: string
        }
        Update: {
          bedtime?: string
          caffeine_cutoff?: string | null
          chronotype?: Database["public"]["Enums"]["chronotype"]
          created_at?: string | null
          light_exposure_prefs?: string | null
          shift_work_flag?: boolean | null
          updated_at?: string | null
          user_id?: string
          wake_time?: string
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          availability: string | null
          created_at: string | null
          energy_level: string | null
          id: string
          preferred_focus: string | null
          sleep_quality: string | null
          stress_level: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          availability?: string | null
          created_at?: string | null
          energy_level?: string | null
          id?: string
          preferred_focus?: string | null
          sleep_quality?: string | null
          stress_level?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          availability?: string | null
          created_at?: string | null
          energy_level?: string | null
          id?: string
          preferred_focus?: string | null
          sleep_quality?: string | null
          stress_level?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_vector_context: {
        Row: {
          content: string
          content_type: string
          created_at: string
          embeddings: string | null
          id: string
          metadata: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          content_type: string
          created_at?: string
          embeddings?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string
          embeddings?: string | null
          id?: string
          metadata?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          ai_preferences: Json | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          health_profile: Json | null
          id: string
          location: string | null
          receive_daily_email: boolean | null
          receive_weekly_email: boolean | null
          recovery_goals: Json | null
          role: string
          timezone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          ai_preferences?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          health_profile?: Json | null
          id: string
          location?: string | null
          receive_daily_email?: boolean | null
          receive_weekly_email?: boolean | null
          recovery_goals?: Json | null
          role?: string
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          ai_preferences?: Json | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          health_profile?: Json | null
          id?: string
          location?: string | null
          receive_daily_email?: boolean | null
          receive_weekly_email?: boolean | null
          recovery_goals?: Json | null
          role?: string
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      wearable_connections: {
        Row: {
          access_token: string
          access_token_expires_at: string
          created_at: string
          id: string
          refresh_token: string | null
          refresh_token_expires_at: string | null
          scopes: string[] | null
          updated_at: string
          user_id: string
          wearable_type: string
          wearable_user_id: string
        }
        Insert: {
          access_token: string
          access_token_expires_at: string
          created_at?: string
          id?: string
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          scopes?: string[] | null
          updated_at?: string
          user_id: string
          wearable_type: string
          wearable_user_id: string
        }
        Update: {
          access_token?: string
          access_token_expires_at?: string
          created_at?: string
          id?: string
          refresh_token?: string | null
          refresh_token_expires_at?: string | null
          scopes?: string[] | null
          updated_at?: string
          user_id?: string
          wearable_type?: string
          wearable_user_id?: string
        }
        Relationships: []
      }
      wearable_data: {
        Row: {
          connection_id: string
          created_at: string
          id: string
          metric_type: string
          source: string
          timestamp: string
          unit: string | null
          value: number
        }
        Insert: {
          connection_id: string
          created_at?: string
          id?: string
          metric_type: string
          source: string
          timestamp: string
          unit?: string | null
          value: number
        }
        Update: {
          connection_id?: string
          created_at?: string
          id?: string
          metric_type?: string
          source?: string
          timestamp?: string
          unit?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "wearable_data_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "wearable_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_event_raw: {
        Row: {
          id: string
          payload: Json
          received_at: string
        }
        Insert: {
          id?: string
          payload: Json
          received_at?: string
        }
        Update: {
          id?: string
          payload?: Json
          received_at?: string
        }
        Relationships: []
      }
      wellness_embeddings: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          study_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          study_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          study_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_wellness_embeddings_study"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "studies_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      wellness_kb_docs: {
        Row: {
          created_at: string
          id: string
          source_url: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          source_url?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          source_url?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      wellness_kb_embeddings: {
        Row: {
          chunk_id: string
          content: string
          created_at: string
          doc_id: string
          embedding: string
          id: string
        }
        Insert: {
          chunk_id: string
          content: string
          created_at?: string
          doc_id: string
          embedding: string
          id?: string
        }
        Update: {
          chunk_id?: string
          content?: string
          created_at?: string
          doc_id?: string
          embedding?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_kb_embeddings_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "wellness_kb_docs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_plan_metrics_rollups: {
        Row: {
          adherence_rate_pct: number | null
          items_done: number | null
          median_time_to_complete_min: number | null
          plan_id: string | null
          total_items: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_program_templates_days: {
        Row: {
          day_number: string | null
          items: Json | null
          name: string | null
          template_id: string | null
          version: number | null
        }
        Relationships: []
      }
      v_task_library_min: {
        Row: {
          default_circadian_slots: string[] | null
          duration_max: number | null
          duration_min: number | null
          id: string | null
          intensity_tags: string[] | null
          pillar: Database["public"]["Enums"]["pillar"] | null
          slug: string | null
          title: string | null
          updated_at: string | null
          version: number | null
          zeitgeber_tags: string[] | null
        }
        Insert: {
          default_circadian_slots?: string[] | null
          duration_max?: number | null
          duration_min?: number | null
          id?: string | null
          intensity_tags?: string[] | null
          pillar?: Database["public"]["Enums"]["pillar"] | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          version?: number | null
          zeitgeber_tags?: string[] | null
        }
        Update: {
          default_circadian_slots?: string[] | null
          duration_max?: number | null
          duration_min?: number | null
          id?: string | null
          intensity_tags?: string[] | null
          pillar?: Database["public"]["Enums"]["pillar"] | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
          version?: number | null
          zeitgeber_tags?: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_latest_metrics: {
        Args: { p_connection_id: string }
        Returns: {
          metric_type: string
          ts: string
          unit: string
          value: number
        }[]
      }
      import_program_templates: {
        Args: { tpls: Json }
        Returns: {
          id: string
          name: string
          version: number
        }[]
      }
      import_task_library: {
        Args: { tasks: Json }
        Returns: {
          id: string
          slug: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never> | { p_uid: string }
        Returns: boolean
      }
      kb_match_documents: {
        Args: {
          match_count?: number
          min_score?: number
          query_embedding: string
        }
        Returns: {
          chunk_id: string
          content: string
          doc_id: string
          score: number
          source_url: string
          title: string
        }[]
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          created_at: string
          distance: number
          embedding: string
          id: string
          metadata: Json
        }[]
      }
      match_documents_edge: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          distance: number
          id: string
          metadata: Json
        }[]
      }
      pg_advisory_unlock_bigint: {
        Args: { key: string }
        Returns: boolean
      }
      pg_try_advisory_lock_bigint: {
        Args: { key: string }
        Returns: boolean
      }
      upsert_program_template: {
        Args: { tpl: Json }
        Returns: string
      }
      upsert_task_library: {
        Args: { task: Json }
        Returns: string
      }
    }
    Enums: {
      chronotype: "lark" | "neutral" | "owl"
      event_access: "public" | "private" | "premium"
      event_registration_status: "confirmed" | "waitlisted" | "canceled"
      event_status: "draft" | "published" | "ongoing" | "completed" | "canceled"
      event_type: "virtual" | "in_person" | "hybrid" | "retreat"
      pillar: "breath" | "sleep" | "food" | "movement" | "focus" | "joy"
      plan_item_status: "pending" | "done" | "skipped" | "migrated"
      plan_source: "template" | "agent" | "hybrid"
      plan_status: "draft" | "active" | "completed" | "expired" | "abandoned"
      progress_event_type: "complete" | "skip" | "reschedule"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      chronotype: ["lark", "neutral", "owl"],
      event_access: ["public", "private", "premium"],
      event_registration_status: ["confirmed", "waitlisted", "canceled"],
      event_status: ["draft", "published", "ongoing", "completed", "canceled"],
      event_type: ["virtual", "in_person", "hybrid", "retreat"],
      pillar: ["breath", "sleep", "food", "movement", "focus", "joy"],
      plan_item_status: ["pending", "done", "skipped", "migrated"],
      plan_source: ["template", "agent", "hybrid"],
      plan_status: ["draft", "active", "completed", "expired", "abandoned"],
      progress_event_type: ["complete", "skip", "reschedule"],
    },
  },
} as const
