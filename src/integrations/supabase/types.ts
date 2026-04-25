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
      companies: {
        Row: {
          created_at: string
          equity: number
          id: string
          name: string
          payment_day: string | null
          payment_value: number | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          equity?: number
          id?: string
          name: string
          payment_day?: string | null
          payment_value?: number | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          equity?: number
          id?: string
          name?: string
          payment_day?: string | null
          payment_value?: number | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_tasks: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          status: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          category: string
          created_at: string
          description: string
          due_date: string
          id: string
          installments_current: number | null
          installments_total: number | null
          is_recurring: boolean
          parent_expense_id: string | null
          status: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          due_date: string
          id?: string
          installments_current?: number | null
          installments_total?: number | null
          is_recurring?: boolean
          parent_expense_id?: string | null
          status: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          installments_current?: number | null
          installments_total?: number | null
          is_recurring?: boolean
          parent_expense_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      implementation_payments: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          paid_date: string
          service_id: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          paid_date?: string
          service_id: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          paid_date?: string
          service_id?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      maintenance_contracts: {
        Row: {
          client: string
          created_at: string
          id: string
          last_check: string | null
          monthly_value: number
          payment_day: number | null
          recurrence_start_date: string | null
          status: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          client: string
          created_at?: string
          id?: string
          last_check?: string | null
          monthly_value?: number
          payment_day?: number | null
          recurrence_start_date?: string | null
          status: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          client?: string
          created_at?: string
          id?: string
          last_check?: string | null
          monthly_value?: number
          payment_day?: number | null
          recurrence_start_date?: string | null
          status?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string
          client: string
          contract_end_date: string | null
          created_at: string
          daily_spend: number | null
          deadline: string | null
          discount_percentage: number | null
          discount_type: string | null
          has_contract: boolean | null
          id: string
          implementation_charged: number | null
          implementation_paid: number | null
          last_recharge_date: string | null
          last_recharge_value: number | null
          payment_day: number | null
          recurrence_period: string | null
          recurrence_start_date: string | null
          recurrence_value: number | null
          service_name: string
          status: string
          traffic_balance: number | null
          traffic_reload_day: number | null
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          category: string
          client: string
          contract_end_date?: string | null
          created_at?: string
          daily_spend?: number | null
          deadline?: string | null
          discount_percentage?: number | null
          discount_type?: string | null
          has_contract?: boolean | null
          id?: string
          implementation_charged?: number | null
          implementation_paid?: number | null
          last_recharge_date?: string | null
          last_recharge_value?: number | null
          payment_day?: number | null
          recurrence_period?: string | null
          recurrence_start_date?: string | null
          recurrence_value?: number | null
          service_name: string
          status: string
          traffic_balance?: number | null
          traffic_reload_day?: number | null
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          category?: string
          client?: string
          contract_end_date?: string | null
          created_at?: string
          daily_spend?: number | null
          deadline?: string | null
          discount_percentage?: number | null
          discount_type?: string | null
          has_contract?: boolean | null
          id?: string
          implementation_charged?: number | null
          implementation_paid?: number | null
          last_recharge_date?: string | null
          last_recharge_value?: number | null
          payment_day?: number | null
          recurrence_period?: string | null
          recurrence_start_date?: string | null
          recurrence_value?: number | null
          service_name?: string
          status?: string
          traffic_balance?: number | null
          traffic_reload_day?: number | null
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          client: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          position: number | null
          priority: string | null
          service_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number | null
          priority?: string | null
          service_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number | null
          priority?: string | null
          service_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      useful_links: {
        Row: {
          created_at: string
          id: string
          title: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          url?: string
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
