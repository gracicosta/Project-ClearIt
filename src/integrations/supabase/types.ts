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
      action_items: {
        Row: {
          created_at: string
          description: string
          due_date: string | null
          id: string
          meeting_id: string
          owner: string
          previous_id: string | null
          status: Database["public"]["Enums"]["action_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          meeting_id: string
          owner: string
          previous_id?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          meeting_id?: string
          owner?: string
          previous_id?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_items_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_items_previous_id_fkey"
            columns: ["previous_id"]
            isOneToOne: false
            referencedRelation: "action_items"
            referencedColumns: ["id"]
          },
        ]
      }
      competencies: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string
          id: string
          name: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          active: boolean
          cadence_days: number
          created_at: string
          email: string | null
          full_name: string
          id: string
          level: string | null
          manager_id: string
          notes: string | null
          position: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          cadence_days?: number
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          level?: string | null
          manager_id: string
          notes?: string | null
          position?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          cadence_days?: number
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          level?: string | null
          manager_id?: string
          notes?: string | null
          position?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          agreement: string
          behavior: string
          context: string
          created_at: string
          employee_id: string
          id: string
          impact: string
          listening_notes: string
          manager_id: string
          meeting_id: string | null
          self_feedback: string
          situation: string
          tone_flags: Json
          tone_score: number | null
          updated_at: string
        }
        Insert: {
          agreement?: string
          behavior: string
          context?: string
          created_at?: string
          employee_id: string
          id?: string
          impact: string
          listening_notes?: string
          manager_id: string
          meeting_id?: string | null
          self_feedback?: string
          situation: string
          tone_flags?: Json
          tone_score?: number | null
          updated_at?: string
        }
        Update: {
          agreement?: string
          behavior?: string
          context?: string
          created_at?: string
          employee_id?: string
          id?: string
          impact?: string
          listening_notes?: string
          manager_id?: string
          meeting_id?: string | null
          self_feedback?: string
          situation?: string
          tone_flags?: Json
          tone_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_feedbacks: {
        Row: {
          created_at: string
          id: string
          original_text: string
          sbi_extracted: Json | null
          suggestions: Json | null
          tone_analysis: Json | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_text: string
          sbi_extracted?: Json | null
          suggestions?: Json | null
          tone_analysis?: Json | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          id?: string
          original_text?: string
          sbi_extracted?: Json | null
          suggestions?: Json | null
          tone_analysis?: Json | null
          uploaded_by?: string
        }
        Relationships: []
      }
      meeting_blocks: {
        Row: {
          content: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["block_kind"]
          meeting_id: string
          order_index: number
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["block_kind"]
          meeting_id: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["block_kind"]
          meeting_id?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_blocks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          cadence_suggestion: string | null
          completed_at: string | null
          created_at: string
          duration_min: number | null
          employee_id: string
          hr_signal: string | null
          id: string
          manager_id: string
          next_meeting_at: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["meeting_status"]
          type: Database["public"]["Enums"]["meeting_type"]
          updated_at: string
        }
        Insert: {
          cadence_suggestion?: string | null
          completed_at?: string | null
          created_at?: string
          duration_min?: number | null
          employee_id: string
          hr_signal?: string | null
          id?: string
          manager_id: string
          next_meeting_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["meeting_status"]
          type?: Database["public"]["Enums"]["meeting_type"]
          updated_at?: string
        }
        Update: {
          cadence_suggestion?: string | null
          completed_at?: string | null
          created_at?: string
          duration_min?: number | null
          employee_id?: string
          hr_signal?: string | null
          id?: string
          manager_id?: string
          next_meeting_at?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["meeting_status"]
          type?: Database["public"]["Enums"]["meeting_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pdi_objectives: {
        Row: {
          actions: Json
          competency_id: string
          created_at: string
          deadline: string
          employee_id: string
          goal_description: string
          id: string
          manager_id: string
          manager_support: string
          status: Database["public"]["Enums"]["pdi_status"]
          updated_at: string
          verification_marker: string
        }
        Insert: {
          actions?: Json
          competency_id: string
          created_at?: string
          deadline: string
          employee_id: string
          goal_description: string
          id?: string
          manager_id: string
          manager_support: string
          status?: Database["public"]["Enums"]["pdi_status"]
          updated_at?: string
          verification_marker: string
        }
        Update: {
          actions?: Json
          competency_id?: string
          created_at?: string
          deadline?: string
          employee_id?: string
          goal_description?: string
          id?: string
          manager_id?: string
          manager_support?: string
          status?: Database["public"]["Enums"]["pdi_status"]
          updated_at?: string
          verification_marker?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdi_objectives_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdi_objectives_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          job_title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          job_title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          job_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recordings: {
        Row: {
          action_items: Json | null
          audio_mime: string | null
          audio_path: string | null
          created_at: string
          duration_seconds: number | null
          employee_id: string | null
          error_message: string | null
          id: string
          key_topics: Json | null
          kind: string
          linked_feedback_id: string | null
          linked_meeting_id: string | null
          manager_id: string
          sensitive_flags: Json | null
          source: string
          status: string
          suggested_blocks: Json | null
          suggested_sbi: Json | null
          summary: string | null
          title: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          audio_mime?: string | null
          audio_path?: string | null
          created_at?: string
          duration_seconds?: number | null
          employee_id?: string | null
          error_message?: string | null
          id?: string
          key_topics?: Json | null
          kind?: string
          linked_feedback_id?: string | null
          linked_meeting_id?: string | null
          manager_id: string
          sensitive_flags?: Json | null
          source?: string
          status?: string
          suggested_blocks?: Json | null
          suggested_sbi?: Json | null
          summary?: string | null
          title: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          audio_mime?: string | null
          audio_path?: string | null
          created_at?: string
          duration_seconds?: number | null
          employee_id?: string | null
          error_message?: string | null
          id?: string
          key_topics?: Json | null
          kind?: string
          linked_feedback_id?: string | null
          linked_meeting_id?: string | null
          manager_id?: string
          sensitive_flags?: Json | null
          source?: string
          status?: string
          suggested_blocks?: Json | null
          suggested_sbi?: Json | null
          summary?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recordings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordings_linked_feedback_id_fkey"
            columns: ["linked_feedback_id"]
            isOneToOne: false
            referencedRelation: "feedbacks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordings_linked_meeting_id_fkey"
            columns: ["linked_meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      sensitive_incidents: {
        Row: {
          created_at: string
          field: string
          id: string
          masked_snippet: string | null
          reason: string
          source_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          field: string
          id?: string
          masked_snippet?: string | null
          reason: string
          source_id?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          field?: string
          id?: string
          masked_snippet?: string | null
          reason?: string
          source_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      [_ in never]: never
    }
    Enums: {
      action_status: "open" | "in_progress" | "done" | "blocked"
      app_role: "manager" | "hr"
      block_kind:
        | "checkin"
        | "agenda"
        | "deliveries"
        | "development"
        | "agreements"
      meeting_status: "draft" | "scheduled" | "completed" | "canceled"
      meeting_type: "one_on_one" | "feedback"
      pdi_status: "active" | "completed" | "paused" | "canceled"
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
      action_status: ["open", "in_progress", "done", "blocked"],
      app_role: ["manager", "hr"],
      block_kind: [
        "checkin",
        "agenda",
        "deliveries",
        "development",
        "agreements",
      ],
      meeting_status: ["draft", "scheduled", "completed", "canceled"],
      meeting_type: ["one_on_one", "feedback"],
      pdi_status: ["active", "completed", "paused", "canceled"],
    },
  },
} as const
