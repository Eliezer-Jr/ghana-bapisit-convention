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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      application_documents: {
        Row: {
          application_id: string
          document_name: string
          document_type: string
          document_url: string
          id: string
          uploaded_at: string
        }
        Insert: {
          application_id: string
          document_name: string
          document_type: string
          document_url: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          application_id?: string
          document_name?: string
          document_type?: string
          document_url?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          admin_notes: string | null
          admission_level: Database["public"]["Enums"]["admission_level"]
          association: string
          association_notes: string | null
          association_reviewed_at: string | null
          association_reviewed_by: string | null
          church_name: string
          created_at: string
          date_of_birth: string
          email: string
          fellowship: string
          full_name: string
          gazette_paid: boolean | null
          gazette_receipt_number: string | null
          id: string
          interview_date: string | null
          interview_location: string | null
          interview_result: string | null
          local_notes: string | null
          local_reviewed_at: string | null
          local_reviewed_by: string | null
          marital_status: string | null
          mentor_contact: string | null
          mentor_name: string | null
          ministry_evaluation_paper: string | null
          payment_amount: number | null
          payment_date: string | null
          payment_receipt_number: string | null
          phone: string
          photo_url: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screening_date: string | null
          screening_result: string | null
          sector: string
          spouse_name: string | null
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string | null
          theological_institution: string | null
          theological_qualification: string | null
          updated_at: string
          user_id: string | null
          vision_statement: string | null
          vp_notes: string | null
          vp_reviewed_at: string | null
          vp_reviewed_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          admission_level: Database["public"]["Enums"]["admission_level"]
          association: string
          association_notes?: string | null
          association_reviewed_at?: string | null
          association_reviewed_by?: string | null
          church_name: string
          created_at?: string
          date_of_birth: string
          email: string
          fellowship: string
          full_name: string
          gazette_paid?: boolean | null
          gazette_receipt_number?: string | null
          id?: string
          interview_date?: string | null
          interview_location?: string | null
          interview_result?: string | null
          local_notes?: string | null
          local_reviewed_at?: string | null
          local_reviewed_by?: string | null
          marital_status?: string | null
          mentor_contact?: string | null
          mentor_name?: string | null
          ministry_evaluation_paper?: string | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_receipt_number?: string | null
          phone: string
          photo_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screening_date?: string | null
          screening_result?: string | null
          sector: string
          spouse_name?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          theological_institution?: string | null
          theological_qualification?: string | null
          updated_at?: string
          user_id?: string | null
          vision_statement?: string | null
          vp_notes?: string | null
          vp_reviewed_at?: string | null
          vp_reviewed_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          admission_level?: Database["public"]["Enums"]["admission_level"]
          association?: string
          association_notes?: string | null
          association_reviewed_at?: string | null
          association_reviewed_by?: string | null
          church_name?: string
          created_at?: string
          date_of_birth?: string
          email?: string
          fellowship?: string
          full_name?: string
          gazette_paid?: boolean | null
          gazette_receipt_number?: string | null
          id?: string
          interview_date?: string | null
          interview_location?: string | null
          interview_result?: string | null
          local_notes?: string | null
          local_reviewed_at?: string | null
          local_reviewed_by?: string | null
          marital_status?: string | null
          mentor_contact?: string | null
          mentor_name?: string | null
          ministry_evaluation_paper?: string | null
          payment_amount?: number | null
          payment_date?: string | null
          payment_receipt_number?: string | null
          phone?: string
          photo_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screening_date?: string | null
          screening_result?: string | null
          sector?: string
          spouse_name?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          submitted_at?: string | null
          theological_institution?: string | null
          theological_qualification?: string | null
          updated_at?: string
          user_id?: string | null
          vision_statement?: string | null
          vp_notes?: string | null
          vp_reviewed_at?: string | null
          vp_reviewed_by?: string | null
        }
        Relationships: []
      }
      approved_applicants: {
        Row: {
          application_id: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          phone_number: string
          used: boolean | null
        }
        Insert: {
          application_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          phone_number: string
          used?: boolean | null
        }
        Update: {
          application_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          phone_number?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "approved_applicants_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      convention_positions: {
        Row: {
          created_at: string
          id: string
          minister_id: string
          period_end: number | null
          period_start: number | null
          position: string
        }
        Insert: {
          created_at?: string
          id?: string
          minister_id: string
          period_end?: number | null
          period_start?: number | null
          position: string
        }
        Update: {
          created_at?: string
          id?: string
          minister_id?: string
          period_end?: number | null
          period_start?: number | null
          position?: string
        }
        Relationships: [
          {
            foreignKeyName: "convention_positions_minister_id_fkey"
            columns: ["minister_id"]
            isOneToOne: false
            referencedRelation: "minister_audit_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convention_positions_minister_id_fkey"
            columns: ["minister_id"]
            isOneToOne: false
            referencedRelation: "ministers"
            referencedColumns: ["id"]
          },
        ]
      }
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
            referencedRelation: "minister_audit_info"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "minister_audit_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_contacts_minister_id_fkey"
            columns: ["minister_id"]
            isOneToOne: false
            referencedRelation: "ministers"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          created_at: string
          error_message: string
          function_name: string | null
          id: string
          metadata: Json | null
          severity: string
          source: string
          stack_trace: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message: string
          function_name?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          source: string
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string
          function_name?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          source?: string
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      intake_invites: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          minister_email: string | null
          minister_full_name: string | null
          minister_phone: string | null
          revoked: boolean
          session_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          minister_email?: string | null
          minister_full_name?: string | null
          minister_phone?: string | null
          revoked?: boolean
          session_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          minister_email?: string | null
          minister_full_name?: string | null
          minister_phone?: string | null
          revoked?: boolean
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_invites_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "intake_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_sessions: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string
          id: string
          manually_closed: boolean
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at: string
          id?: string
          manually_closed?: boolean
          starts_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string
          id?: string
          manually_closed?: boolean
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      intake_submissions: {
        Row: {
          created_at: string
          id: string
          invite_id: string
          payload: Json
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          session_id: string
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_id: string
          payload?: Json
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_id?: string
          payload?: Json
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_id?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_submissions_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "intake_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_submissions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "intake_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      letter_signatures: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          name: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      letter_templates: {
        Row: {
          created_at: string
          font_family: string
          font_size_body: number
          font_size_title: number
          footer_text: string
          id: string
          letterhead_height: number
          logo_height: number
          logo_width: number
          organization_name: string
          organization_subtitle: string
          primary_color: string
          secondary_color: string
          template_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          font_family?: string
          font_size_body?: number
          font_size_title?: number
          footer_text?: string
          id?: string
          letterhead_height?: number
          logo_height?: number
          logo_width?: number
          organization_name?: string
          organization_subtitle?: string
          primary_color?: string
          secondary_color?: string
          template_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          font_family?: string
          font_size_body?: number
          font_size_title?: number
          footer_text?: string
          id?: string
          letterhead_height?: number
          logo_height?: number
          logo_width?: number
          organization_name?: string
          organization_subtitle?: string
          primary_color?: string
          secondary_color?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      minister_children: {
        Row: {
          child_name: string
          created_at: string
          date_of_birth: string | null
          id: string
          minister_id: string
        }
        Insert: {
          child_name: string
          created_at?: string
          date_of_birth?: string | null
          id?: string
          minister_id: string
        }
        Update: {
          child_name?: string
          created_at?: string
          date_of_birth?: string | null
          id?: string
          minister_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "minister_children_minister_id_fkey"
            columns: ["minister_id"]
            isOneToOne: false
            referencedRelation: "minister_audit_info"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "minister_audit_info"
            referencedColumns: ["id"]
          },
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
          created_by: string | null
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
          minister_id: string | null
          notes: string | null
          number_of_children: number | null
          ordination_year: number | null
          phone: string | null
          photo_url: string | null
          physical_folder_number: string | null
          position_at_church: string | null
          recognition_year: number | null
          role: string
          sector: string | null
          spouse_name: string | null
          spouse_occupation: string | null
          spouse_phone_number: string | null
          status: string
          titles: string | null
          updated_at: string
          updated_by: string | null
          whatsapp: string | null
          zone: string | null
        }
        Insert: {
          areas_of_ministry?: string[] | null
          association?: string | null
          church_address?: string | null
          created_at?: string
          created_by?: string | null
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
          minister_id?: string | null
          notes?: string | null
          number_of_children?: number | null
          ordination_year?: number | null
          phone?: string | null
          photo_url?: string | null
          physical_folder_number?: string | null
          position_at_church?: string | null
          recognition_year?: number | null
          role: string
          sector?: string | null
          spouse_name?: string | null
          spouse_occupation?: string | null
          spouse_phone_number?: string | null
          status?: string
          titles?: string | null
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
          zone?: string | null
        }
        Update: {
          areas_of_ministry?: string[] | null
          association?: string | null
          church_address?: string | null
          created_at?: string
          created_by?: string | null
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
          minister_id?: string | null
          notes?: string | null
          number_of_children?: number | null
          ordination_year?: number | null
          phone?: string | null
          photo_url?: string | null
          physical_folder_number?: string | null
          position_at_church?: string | null
          recognition_year?: number | null
          role?: string
          sector?: string | null
          spouse_name?: string | null
          spouse_occupation?: string | null
          spouse_phone_number?: string | null
          status?: string
          titles?: string | null
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      non_church_work: {
        Row: {
          created_at: string
          id: string
          job_title: string
          minister_id: string
          organization: string
          period_end: number | null
          period_start: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          job_title: string
          minister_id: string
          organization: string
          period_end?: number | null
          period_start?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          job_title?: string
          minister_id?: string
          organization?: string
          period_end?: number | null
          period_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "non_church_work_minister_id_fkey"
            columns: ["minister_id"]
            isOneToOne: false
            referencedRelation: "minister_audit_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "non_church_work_minister_id_fkey"
            columns: ["minister_id"]
            isOneToOne: false
            referencedRelation: "ministers"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_number_history: {
        Row: {
          approved_applicant_id: string
          changed_at: string
          changed_by: string
          id: string
          new_phone_number: string
          old_phone_number: string
          reason: string | null
        }
        Insert: {
          approved_applicant_id: string
          changed_at?: string
          changed_by: string
          id?: string
          new_phone_number: string
          old_phone_number: string
          reason?: string | null
        }
        Update: {
          approved_applicant_id?: string
          changed_at?: string
          changed_by?: string
          id?: string
          new_phone_number?: string
          old_phone_number?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_number_history_approved_applicant_id_fkey"
            columns: ["approved_applicant_id"]
            isOneToOne: false
            referencedRelation: "approved_applicants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved: boolean | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          updated_at: string | null
        }
        Insert: {
          approved?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          updated_at?: string | null
        }
        Update: {
          approved?: boolean | null
          avatar_url?: string | null
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
      minister_audit_info: {
        Row: {
          created_at: string | null
          created_by: string | null
          created_by_email: string | null
          created_by_name: string | null
          full_name: string | null
          id: string | null
          minister_id: string | null
          updated_at: string | null
          updated_by: string | null
          updated_by_email: string | null
          updated_by_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_minister_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      admission_level: "licensing" | "recognition" | "ordination"
      app_role:
        | "super_admin"
        | "admin"
        | "user"
        | "finance_manager"
        | "admission_reviewer"
        | "local_officer"
        | "association_head"
        | "vp_office"
      application_status:
        | "draft"
        | "submitted"
        | "local_screening"
        | "association_approved"
        | "vp_review"
        | "interview_scheduled"
        | "approved"
        | "rejected"
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
      admission_level: ["licensing", "recognition", "ordination"],
      app_role: [
        "super_admin",
        "admin",
        "user",
        "finance_manager",
        "admission_reviewer",
        "local_officer",
        "association_head",
        "vp_office",
      ],
      application_status: [
        "draft",
        "submitted",
        "local_screening",
        "association_approved",
        "vp_review",
        "interview_scheduled",
        "approved",
        "rejected",
      ],
    },
  },
} as const
