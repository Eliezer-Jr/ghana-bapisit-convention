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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      educational_qualifications: {
        Row: {
          created_at: string
          id: string
          institution: string | null
          minister_id: string
          qualification: string
          year_obtained: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          institution?: string | null
          minister_id: string
          qualification: string
          year_obtained?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          institution?: string | null
          minister_id?: string
          qualification?: string
          year_obtained?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "educational_qualifications_minister_id_fkey"
            columns: ["minister_id"]
            isOneToOne: false
            referencedRelation: "ministers"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          contact_name: string
          created_at: string
          id: string
          minister_id: string
          phone_number: string
          relationship: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          id?: string
          minister_id: string
          phone_number: string
          relationship: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          id?: string
          minister_id?: string
          phone_number?: string
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_minister_id_fkey"
            columns: ["minister_id"]
            isOneToOne: false
            referencedRelation: "ministers"
            referencedColumns: ["id"]
          },
        ]
      }
      minister_children: {
        Row: {
          child_name: string
          created_at: string
          id: string
          minister_id: string
        }
        Insert: {
          child_name: string
          created_at?: string
          id?: string
          minister_id: string
        }
        Update: {
          child_name?: string
          created_at?: string
          id?: string
          minister_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "minister_children_minister_id_fkey"
            columns: ["minister_id"]
            isOneToOne: false
            referencedRelation: "ministers"
            referencedColumns: ["id"]
          },
        ]
      }
      ministerial_history: {
        Row: {
          association: string | null
          church_name: string
          created_at: string
          id: string
          minister_id: string
          period_end: number | null
          period_start: number | null
          position: string
          sector: string | null
        }
        Insert: {
          association?: string | null
          church_name: string
          created_at?: string
          id?: string
          minister_id: string
          period_end?: number | null
          period_start?: number | null
          position: string
          sector?: string | null
        }
        Update: {
          association?: string | null
          church_name?: string
          created_at?: string
          id?: string
          minister_id?: string
          period_end?: number | null
          period_start?: number | null
          position?: string
          sector?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ministerial_history_minister_id_fkey"
            columns: ["minister_id"]
            isOneToOne: false
            referencedRelation: "ministers"
            referencedColumns: ["id"]
          },
        ]
      }
      ministers: {
        Row: {
          areas_of_ministry: string[] | null
          association: string | null
          church_address: string | null
          created_at: string
          current_church_name: string | null
          date_joined: string
          date_of_birth: string | null
          email: string | null
          fellowship: string | null
          full_name: string
          gps_address: string | null
          id: string
          licensing_year: number | null
          location: string | null
          marital_status: string | null
          marriage_type: string | null
          notes: string | null
          number_of_children: number | null
          ordination_year: number | null
          phone: string | null
          photo_url: string | null
          position_at_church: string | null
          recognition_year: number | null
          role: string
          sector: string | null
          spouse_name: string | null
          status: string
          titles: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          areas_of_ministry?: string[] | null
          association?: string | null
          church_address?: string | null
          created_at?: string
          current_church_name?: string | null
          date_joined?: string
          date_of_birth?: string | null
          email?: string | null
          fellowship?: string | null
          full_name: string
          gps_address?: string | null
          id?: string
          licensing_year?: number | null
          location?: string | null
          marital_status?: string | null
          marriage_type?: string | null
          notes?: string | null
          number_of_children?: number | null
          ordination_year?: number | null
          phone?: string | null
          photo_url?: string | null
          position_at_church?: string | null
          recognition_year?: number | null
          role: string
          sector?: string | null
          spouse_name?: string | null
          status?: string
          titles?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          areas_of_ministry?: string[] | null
          association?: string | null
          church_address?: string | null
          created_at?: string
          current_church_name?: string | null
          date_joined?: string
          date_of_birth?: string | null
          email?: string | null
          fellowship?: string | null
          full_name?: string
          gps_address?: string | null
          id?: string
          licensing_year?: number | null
          location?: string | null
          marital_status?: string | null
          marriage_type?: string | null
          notes?: string | null
          number_of_children?: number | null
          ordination_year?: number | null
          phone?: string | null
          photo_url?: string | null
          position_at_church?: string | null
          recognition_year?: number | null
          role?: string
          sector?: string | null
          spouse_name?: string | null
          status?: string
          titles?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved: boolean | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          approved?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          approved?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
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
      app_role: ["super_admin", "admin", "user"],
    },
  },
} as const
