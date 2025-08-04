export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
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
      communities: {
        Row: {
          created_at: string | null
          id: string
          name: string
          settings: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string
          settings?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          settings?: Json | null
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          community_id: string
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          community_id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      content: {
        Row: {
          access: string | null
          community_id: string | null
          created_at: string | null
          id: string
          title: string
          type: string
          url: string | null
        }
        Insert: {
          access?: string | null
          community_id?: string | null
          created_at?: string | null
          id?: string
          title: string
          type: string
          url?: string | null
        }
        Update: {
          access?: string | null
          community_id?: string | null
          created_at?: string | null
          id?: string
          title?: string
          type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          event_id: string
          responded_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          responded_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          responded_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["event_registration_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["event_registration_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["event_registration_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          access: Database["public"]["Enums"]["event_access"]
          agenda: Json | null
          banner_image_url: string | null
          capacity: number | null
          community_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          details: Json | null
          end_time: string | null
          external_booking_url: string | null
          facilitators: Json | null
          host: string | null
          id: string
          location: string | null
          metadata: Json | null
          post_event_content: Json | null
          start_time: string
          status: Database["public"]["Enums"]["event_status"]
          tags: string[] | null
          timezone: string | null
          title: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at: string | null
          virtual_link: string | null
        }
        Insert: {
          access?: Database["public"]["Enums"]["event_access"]
          agenda?: Json | null
          banner_image_url?: string | null
          capacity?: number | null
          community_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          details?: Json | null
          end_time?: string | null
          external_booking_url?: string | null
          facilitators?: Json | null
          host?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          post_event_content?: Json | null
          start_time: string
          status?: Database["public"]["Enums"]["event_status"]
          tags?: string[] | null
          timezone?: string | null
          title: string
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string | null
          virtual_link?: string | null
        }
        Update: {
          access?: Database["public"]["Enums"]["event_access"]
          agenda?: Json | null
          banner_image_url?: string | null
          capacity?: number | null
          community_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          details?: Json | null
          end_time?: string | null
          external_booking_url?: string | null
          facilitators?: Json | null
          host?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          post_event_content?: Json | null
          start_time?: string
          status?: Database["public"]["Enums"]["event_status"]
          tags?: string[] | null
          timezone?: string | null
          title?: string
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string | null
          virtual_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          content: Json | null
          created_at: string | null
          facilitator_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          facilitator_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          facilitator_id?: string | null
          id?: string
          user_id?: string | null
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
      posts: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          space_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          space_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          space_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spaces: {
        Row: {
          community_id: string | null
          created_at: string | null
          id: string
          name: string
          visibility: string | null
        }
        Insert: {
          community_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          visibility?: string | null
        }
        Update: {
          community_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spaces_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
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
          id: string
          recovery_score: number | null
          subjective_input: Json | null
          suggestion: Json | null
          user_id: string | null
          wearable_data: Json | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          recovery_score?: number | null
          subjective_input?: Json | null
          suggestion?: Json | null
          user_id?: string | null
          wearable_data?: Json | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          recovery_score?: number | null
          subjective_input?: Json | null
          suggestion?: Json | null
          user_id?: string | null
          wearable_data?: Json | null
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
          recovery_goals?: Json | null
          role?: string
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      users_public: {
        Row: {
          joined_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          joined_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          joined_at?: string | null
          user_id?: string
          username?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_latest_metrics: {
        Args: { p_connection_id: string }
        Returns: {
          metric_type: string
          value: number
          unit: string
          ts: string
        }[]
      }
      is_admin: {
        Args: { p_uid: string }
        Returns: boolean
      }
      match_documents: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: string
          content: string
          metadata: Json
          embedding: string
          created_at: string
          distance: number
        }[]
      }
      match_documents_edge: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: string
          content: string
          metadata: Json
          distance: number
        }[]
      }
    }
    Enums: {
      event_access: "public" | "private" | "premium"
      event_registration_status: "confirmed" | "waitlisted" | "canceled"
      event_status: "draft" | "published" | "ongoing" | "completed" | "canceled"
      event_type: "virtual" | "in_person" | "hybrid" | "retreat"
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
      event_access: ["public", "private", "premium"],
      event_registration_status: ["confirmed", "waitlisted", "canceled"],
      event_status: ["draft", "published", "ongoing", "completed", "canceled"],
      event_type: ["virtual", "in_person", "hybrid", "retreat"],
    },
  },
} as const