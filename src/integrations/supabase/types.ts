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
      assignments: {
        Row: {
          class_id: string | null
          created_at: string
          done: boolean
          due_at: string | null
          id: string
          notes: string | null
          priority: string
          subject: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          done?: boolean
          due_at?: string | null
          id?: string
          notes?: string | null
          priority?: string
          subject?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          done?: boolean
          due_at?: string | null
          id?: string
          notes?: string | null
          priority?: string
          subject?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "tutor_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          color: string
          created_at: string
          day_of_week: number | null
          end_time: string | null
          id: string
          room: string | null
          start_time: string | null
          subject: string
          teacher: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          room?: string | null
          start_time?: string | null
          subject: string
          teacher?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          day_of_week?: number | null
          end_time?: string | null
          id?: string
          room?: string | null
          start_time?: string | null
          subject?: string
          teacher?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          class_id: string | null
          created_at: string
          exam_at: string
          id: string
          notes: string | null
          subject: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          exam_at: string
          id?: string
          notes?: string | null
          subject?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          exam_at?: string
          id?: string
          notes?: string | null
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          answer: string
          class_id: string | null
          created_at: string
          id: string
          question: string
          times_correct: number
          times_seen: number
          topic: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answer: string
          class_id?: string | null
          created_at?: string
          id?: string
          question: string
          times_correct?: number
          times_seen?: number
          topic?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string
          class_id?: string | null
          created_at?: string
          id?: string
          question?: string
          times_correct?: number
          times_seen?: number
          topic?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          category: string
          class_id: string | null
          created_at: string
          graded_at: string
          id: string
          max_score: number
          score: number
          title: string
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          category?: string
          class_id?: string | null
          created_at?: string
          graded_at?: string
          id?: string
          max_score?: number
          score: number
          title: string
          updated_at?: string
          user_id: string
          weight?: number
        }
        Update: {
          category?: string
          class_id?: string | null
          created_at?: string
          graded_at?: string
          id?: string
          max_score?: number
          score?: number
          title?: string
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "grades_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          class_id: string | null
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          class_id?: string | null
          content?: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          class_id?: string | null
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          classroom_connected: boolean
          created_at: string
          education_level: Database["public"]["Enums"]["education_level"] | null
          full_name: string
          grade_year: string | null
          id: string
          school_name: string | null
          updated_at: string
        }
        Insert: {
          classroom_connected?: boolean
          created_at?: string
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          full_name?: string
          grade_year?: string | null
          id: string
          school_name?: string | null
          updated_at?: string
        }
        Update: {
          classroom_connected?: boolean
          created_at?: string
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          full_name?: string
          grade_year?: string | null
          id?: string
          school_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      study_plan_sessions: {
        Row: {
          class_id: string | null
          created_at: string
          done: boolean
          focus: string | null
          id: string
          minutes: number
          start_at: string
          title: string
          user_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          done?: boolean
          focus?: string | null
          id?: string
          minutes?: number
          start_at: string
          title: string
          user_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          done?: boolean
          focus?: string | null
          id?: string
          minutes?: number
          start_at?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_plan_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          class_id: string | null
          created_at: string
          id: string
          minutes: number
          started_at: string
          user_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          id?: string
          minutes: number
          started_at?: string
          user_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          id?: string
          minutes?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_conversations: {
        Row: {
          class_id: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_conversations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      education_level: "high_school" | "university"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      education_level: ["high_school", "university"],
    },
  },
} as const
