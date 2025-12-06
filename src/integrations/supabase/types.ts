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
      admin_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone_number: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone_number?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string | null
          id: string
          product_id: string | null
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          id?: string
          product_id?: string | null
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          id?: string
          product_id?: string | null
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_posts: {
        Row: {
          admin_id: string
          content: string
          created_at: string
          id: string
          images: string[] | null
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          post_type: string
          title: string
          updated_at: string
          video_url: string | null
          views: number | null
        }
        Insert: {
          admin_id: string
          content: string
          created_at?: string
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          post_type?: string
          title: string
          updated_at?: string
          video_url?: string | null
          views?: number | null
        }
        Update: {
          admin_id?: string
          content?: string
          created_at?: string
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          post_type?: string
          title?: string
          updated_at?: string
          video_url?: string | null
          views?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          delivered_at: string | null
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          apply_link: string | null
          company_name: string
          contact_email: string | null
          created_at: string
          description: string
          id: string
          images: string[] | null
          job_type: string
          location: string
          requirements: string | null
          salary: string | null
          seller_id: string
          status: string | null
          title: string
          updated_at: string
          video_url: string | null
          views: number | null
        }
        Insert: {
          apply_link?: string | null
          company_name: string
          contact_email?: string | null
          created_at?: string
          description: string
          id?: string
          images?: string[] | null
          job_type: string
          location: string
          requirements?: string | null
          salary?: string | null
          seller_id: string
          status?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
          views?: number | null
        }
        Update: {
          apply_link?: string | null
          company_name?: string
          contact_email?: string | null
          created_at?: string
          description?: string
          id?: string
          images?: string[] | null
          job_type?: string
          location?: string
          requirements?: string | null
          salary?: string | null
          seller_id?: string
          status?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          views?: number | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          can_edit_product: boolean
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          key: string
          name: string
          post_limit_monthly: number
          price_rwf: number
          updated_at: string | null
          updates_limit_monthly: number
        }
        Insert: {
          can_edit_product?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          name: string
          post_limit_monthly: number
          price_rwf: number
          updated_at?: string | null
          updates_limit_monthly: number
        }
        Update: {
          can_edit_product?: boolean
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          post_limit_monthly?: number
          price_rwf?: number
          updated_at?: string | null
          updates_limit_monthly?: number
        }
        Relationships: []
      }
      product_likes: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_likes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ratings: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          rating: number
          seller_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          rating: number
          seller_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          rating?: number
          seller_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ratings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ratings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ratings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string
          id: string
          images: string[]
          impressions: number | null
          likes: number | null
          location: string | null
          price: number
          quantity: number
          seller_id: string
          share_count: number | null
          status: string | null
          title: string
          updated_at: string | null
          video_url: string | null
          views: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          images: string[]
          impressions?: number | null
          likes?: number | null
          location?: string | null
          price: number
          quantity: number
          seller_id: string
          share_count?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          views?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          images?: string[]
          impressions?: number | null
          likes?: number | null
          location?: string | null
          price?: number
          quantity?: number
          seller_id?: string
          share_count?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          blocking_reason: string | null
          business_name: string | null
          call_number: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          id_back_photo: string | null
          id_front_photo: string | null
          identity_verified: boolean | null
          location: string | null
          phone_number: string | null
          profile_image: string | null
          rating: number | null
          rating_count: number | null
          referral_code: string | null
          status: string | null
          updated_at: string | null
          user_type: string
          verification_notes: string | null
          whatsapp_number: string | null
        }
        Insert: {
          bio?: string | null
          blocking_reason?: string | null
          business_name?: string | null
          call_number?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          id_back_photo?: string | null
          id_front_photo?: string | null
          identity_verified?: boolean | null
          location?: string | null
          phone_number?: string | null
          profile_image?: string | null
          rating?: number | null
          rating_count?: number | null
          referral_code?: string | null
          status?: string | null
          updated_at?: string | null
          user_type: string
          verification_notes?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          bio?: string | null
          blocking_reason?: string | null
          business_name?: string | null
          call_number?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          id_back_photo?: string | null
          id_front_photo?: string | null
          identity_verified?: boolean | null
          location?: string | null
          phone_number?: string | null
          profile_image?: string | null
          rating?: number | null
          rating_count?: number | null
          referral_code?: string | null
          status?: string | null
          updated_at?: string | null
          user_type?: string
          verification_notes?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      seller_activity: {
        Row: {
          created_at: string | null
          edits_this_month: number
          id: string
          last_reset_date: string
          posts_this_month: number
          updated_at: string | null
          updates_this_month: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          edits_this_month?: number
          id?: string
          last_reset_date?: string
          posts_this_month?: number
          updated_at?: string | null
          updates_this_month?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          edits_this_month?: number
          id?: string
          last_reset_date?: string
          posts_this_month?: number
          updated_at?: string | null
          updates_this_month?: number
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          site_description: string | null
          site_name: string | null
          twitter_url: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          site_description?: string | null
          site_name?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          site_description?: string | null
          site_name?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      subscription_requests: {
        Row: {
          admin_note: string | null
          amount_rwf: number
          created_at: string | null
          id: string
          message: string | null
          payment_reference: string | null
          phone_paid_to: string | null
          requested_plan_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount_rwf: number
          created_at?: string | null
          id?: string
          message?: string | null
          payment_reference?: string | null
          phone_paid_to?: string | null
          requested_plan_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount_rwf?: number
          created_at?: string | null
          id?: string
          message?: string | null
          payment_reference?: string | null
          phone_paid_to?: string | null
          requested_plan_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_requests_requested_plan_id_fkey"
            columns: ["requested_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      updates: {
        Row: {
          content: string
          created_at: string
          id: string
          images: string[] | null
          seller_id: string
          title: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          images?: string[] | null
          seller_id: string
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          images?: string[] | null
          seller_id?: string
          title?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "updates_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "updates_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      user_subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          plan_id: string
          started_at: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          bio: string | null
          business_name: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          location: string | null
          profile_image: string | null
          rating: number | null
          rating_count: number | null
          referral_code: string | null
          user_type: string | null
        }
        Insert: {
          bio?: string | null
          business_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          location?: string | null
          profile_image?: string | null
          rating?: number | null
          rating_count?: number | null
          referral_code?: string | null
          user_type?: string | null
        }
        Update: {
          bio?: string | null
          business_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          location?: string | null
          profile_image?: string | null
          rating?: number | null
          rating_count?: number | null
          referral_code?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_user_perform_action: {
        Args: { _action_type: string; _user_id: string }
        Returns: boolean
      }
      check_user_status: {
        Args: { user_uuid: string }
        Returns: {
          blocking_reason: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_opportunity_view: {
        Args: { opportunity_uuid: string }
        Returns: undefined
      }
      increment_product_view: {
        Args: { product_uuid: string }
        Returns: undefined
      }
      record_user_action: {
        Args: { _action_type: string; _user_id: string }
        Returns: undefined
      }
      reset_monthly_activity: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      product_category:
        | "Electronics"
        | "Fashion"
        | "Home & Garden"
        | "Sports & Outdoors"
        | "Toys & Games"
        | "Books"
        | "Automotive"
        | "Health & Beauty"
        | "Food & Beverages"
        | "Other"
        | "Agriculture Product"
        | "Equipment for Lent"
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
      app_role: ["admin", "moderator", "user"],
      product_category: [
        "Electronics",
        "Fashion",
        "Home & Garden",
        "Sports & Outdoors",
        "Toys & Games",
        "Books",
        "Automotive",
        "Health & Beauty",
        "Food & Beverages",
        "Other",
        "Agriculture Product",
        "Equipment for Lent",
      ],
    },
  },
} as const
