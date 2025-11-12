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
      analyses: {
        Row: {
          address: Json
          area_m2: number
          assumptions: Json | null
          bedrooms: number | null
          created_at: string | null
          estimated_market_value: number | null
          estimated_rent_monthly: number | null
          geo: unknown
          id: string
          metrics: Json | null
          price: number
          source_url: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          verdict: Database["public"]["Enums"]["verdict_type"] | null
        }
        Insert: {
          address: Json
          area_m2: number
          assumptions?: Json | null
          bedrooms?: number | null
          created_at?: string | null
          estimated_market_value?: number | null
          estimated_rent_monthly?: number | null
          geo?: unknown
          id?: string
          metrics?: Json | null
          price: number
          source_url?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          verdict?: Database["public"]["Enums"]["verdict_type"] | null
        }
        Update: {
          address?: Json
          area_m2?: number
          assumptions?: Json | null
          bedrooms?: number | null
          created_at?: string | null
          estimated_market_value?: number | null
          estimated_rent_monthly?: number | null
          geo?: unknown
          id?: string
          metrics?: Json | null
          price?: number
          source_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          verdict?: Database["public"]["Enums"]["verdict_type"] | null
        }
        Relationships: []
      }
      comps_rentals: {
        Row: {
          address: Json
          area_m2: number
          captured_at: string | null
          geo: unknown
          id: string
          rent_monthly: number
          rent_per_m2: number | null
          source: string | null
        }
        Insert: {
          address: Json
          area_m2: number
          captured_at?: string | null
          geo?: unknown
          id?: string
          rent_monthly: number
          rent_per_m2?: number | null
          source?: string | null
        }
        Update: {
          address?: Json
          area_m2?: number
          captured_at?: string | null
          geo?: unknown
          id?: string
          rent_monthly?: number
          rent_per_m2?: number | null
          source?: string | null
        }
        Relationships: []
      }
      comps_sales: {
        Row: {
          address: Json
          area_m2: number
          captured_at: string | null
          geo: unknown
          id: string
          price: number
          price_per_m2: number | null
          source: string | null
        }
        Insert: {
          address: Json
          area_m2: number
          captured_at?: string | null
          geo?: unknown
          id?: string
          price: number
          price_per_m2?: number | null
          source?: string | null
        }
        Update: {
          address?: Json
          area_m2?: number
          captured_at?: string | null
          geo?: unknown
          id?: string
          price?: number
          price_per_m2?: number | null
          source?: string | null
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
      verdict_type: "good" | "fair" | "overpriced"
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
      verdict_type: ["good", "fair", "overpriced"],
    },
  },
} as const
