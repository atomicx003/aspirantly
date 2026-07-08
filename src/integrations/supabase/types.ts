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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chapter_links: {
        Row: {
          chapter_key: string
          created_at: string
          id: string
          kind: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          chapter_key: string
          created_at?: string
          id?: string
          kind: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          chapter_key?: string
          created_at?: string
          id?: string
          kind?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      chapter_progress: {
        Row: {
          chapter_key: string
          dpp_done: boolean
          id: string
          theory_done: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_key: string
          dpp_done?: boolean
          id?: string
          theory_done?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_key?: string
          dpp_done?: boolean
          id?: string
          theory_done?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chapter_resources: {
        Row: {
          chapter_key: string
          notes_url: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          chapter_key: string
          notes_url?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          chapter_key?: string
          notes_url?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      custom_chapters: {
        Row: {
          chapter_key: string
          cls: string
          created_at: string
          id: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          chapter_key: string
          cls?: string
          created_at?: string
          id?: string
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          chapter_key?: string
          cls?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      doubt_answers: {
        Row: {
          body: string
          created_at: string
          doubt_id: string
          id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          doubt_id: string
          id?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          doubt_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doubt_answers_doubt_id_fkey"
            columns: ["doubt_id"]
            isOneToOne: false
            referencedRelation: "doubts"
            referencedColumns: ["id"]
          },
        ]
      }
      doubts: {
        Row: {
          body: string
          chapter: string | null
          created_at: string
          id: string
          image_url: string | null
          resolved: boolean
          subject: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          chapter?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          resolved?: boolean
          subject?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          chapter?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          resolved?: boolean
          subject?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      mistakes: {
        Row: {
          chapter: string | null
          content: string
          created_at: string
          id: string
          subject: string
          tag: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter?: string | null
          content: string
          created_at?: string
          id?: string
          subject?: string
          tag?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter?: string | null
          content?: string
          created_at?: string
          id?: string
          subject?: string
          tag?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mock_tests: {
        Row: {
          created_at: string
          id: string
          marks_obtained: number
          name: string
          test_date: string
          total_marks: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          marks_obtained: number
          name: string
          test_date: string
          total_marks: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          marks_obtained?: number
          name?: string
          test_date?: string
          total_marks?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          target_exam: string
          theme: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
          target_exam?: string
          theme?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          target_exam?: string
          theme?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          mode: string
          studied_on: string
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds: number
          id?: string
          mode?: string
          studied_on?: string
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          mode?: string
          studied_on?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          created_at: string
          done: boolean
          id: string
          priority: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          priority?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          priority?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_leaderboard: {
        Args: { period: string }
        Returns: {
          display_name: string
          total_seconds: number
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
