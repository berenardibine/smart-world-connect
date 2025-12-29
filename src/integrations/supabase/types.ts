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
    PostgrestVersion: "14.1"
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
      ads: {
        Row: {
          bg_color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          font_size: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link: string | null
          priority: number | null
          start_date: string
          text_color: string | null
          title: string
          type: string
        }
        Insert: {
          bg_color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          font_size?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link?: string | null
          priority?: number | null
          start_date?: string
          text_color?: string | null
          title: string
          type: string
        }
        Update: {
          bg_color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          font_size?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link?: string | null
          priority?: number | null
          start_date?: string
          text_color?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      ai_manager_reports: {
        Row: {
          content: string
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          report_type: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          report_type: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          report_type?: string
          title?: string
        }
        Relationships: []
      }
      ai_suggestions: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          seller_id: string | null
          suggestion_type: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          seller_id?: string | null
          suggestion_type: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          seller_id?: string | null
          suggestion_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          product_id: string | null
          rating: number | null
          seller_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          product_id?: string | null
          rating?: number | null
          seller_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          product_id?: string | null
          rating?: number | null
          seller_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          allow_member_messaging: boolean | null
          cover_image: string | null
          created_at: string
          description: string | null
          id: string
          is_pinned_by_admin: boolean | null
          is_public: boolean | null
          join_approval_required: boolean | null
          logo_image: string | null
          member_count: number | null
          name: string
          posting_permission: string | null
          rules: string[] | null
          seller_id: string
          updated_at: string
        }
        Insert: {
          allow_member_messaging?: boolean | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_pinned_by_admin?: boolean | null
          is_public?: boolean | null
          join_approval_required?: boolean | null
          logo_image?: string | null
          member_count?: number | null
          name: string
          posting_permission?: string | null
          rules?: string[] | null
          seller_id: string
          updated_at?: string
        }
        Update: {
          allow_member_messaging?: boolean | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_pinned_by_admin?: boolean | null
          is_public?: boolean | null
          join_approval_required?: boolean | null
          logo_image?: string | null
          member_count?: number | null
          name?: string
          posting_permission?: string | null
          rules?: string[] | null
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communities_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
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
      community_messages: {
        Row: {
          community_id: string
          content: string
          created_at: string
          id: string
          is_deleted: boolean | null
          sender_id: string
        }
        Insert: {
          community_id: string
          content: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          sender_id: string
        }
        Update: {
          community_id?: string
          content?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          comments_count: number | null
          community_id: string
          content: string
          created_at: string
          id: string
          images: string[] | null
          is_pinned: boolean | null
          likes_count: number | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_id: string
          comments_count?: number | null
          community_id: string
          content: string
          created_at?: string
          id?: string
          images?: string[] | null
          is_pinned?: boolean | null
          likes_count?: number | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_id?: string
          comments_count?: number | null
          community_id?: string
          content?: string
          created_at?: string
          id?: string
          images?: string[] | null
          is_pinned?: boolean | null
          likes_count?: number | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
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
      districts: {
        Row: {
          created_at: string | null
          id: string
          name: string
          province_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          province_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          province_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_posts: {
        Row: {
          author_id: string
          category: string
          content: string | null
          cover_image: string | null
          created_at: string
          description: string
          duration_minutes: number | null
          id: string
          is_free: boolean | null
          is_published: boolean | null
          title: string
          updated_at: string
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          author_id: string
          category: string
          content?: string | null
          cover_image?: string | null
          created_at?: string
          description: string
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          title: string
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string
          category?: string
          content?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          title?: string
          updated_at?: string
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      link_analytics: {
        Row: {
          created_at: string
          event: string
          id: string
          product_id: string
          referrer: string | null
          source: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event?: string
          id?: string
          product_id: string
          referrer?: string | null
          source?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          product_id?: string
          referrer?: string | null
          source?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_analytics: {
        Row: {
          clicks: number | null
          conversion_score: number | null
          conversions: number | null
          created_at: string | null
          date: string | null
          id: string
          impressions: number | null
          post_id: string | null
          seller_id: string | null
        }
        Insert: {
          clicks?: number | null
          conversion_score?: number | null
          conversions?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          impressions?: number | null
          post_id?: string | null
          seller_id?: string | null
        }
        Update: {
          clicks?: number | null
          conversion_score?: number | null
          conversions?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          impressions?: number | null
          post_id?: string | null
          seller_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "marketing_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_analytics_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_analytics_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_posts: {
        Row: {
          admin_id: string
          clicks: number | null
          content: string
          conversion_score: number | null
          created_at: string
          duration: string | null
          end_date: string | null
          id: string
          images: string[] | null
          impressions: number | null
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          post_type: string
          product_id: string | null
          seller_id: string | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string
          video_url: string | null
          views: number | null
        }
        Insert: {
          admin_id: string
          clicks?: number | null
          content: string
          conversion_score?: number | null
          created_at?: string
          duration?: string | null
          end_date?: string | null
          id?: string
          images?: string[] | null
          impressions?: number | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          post_type?: string
          product_id?: string | null
          seller_id?: string | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
          views?: number | null
        }
        Update: {
          admin_id?: string
          clicks?: number | null
          content?: string
          conversion_score?: number | null
          created_at?: string
          duration?: string | null
          end_date?: string | null
          id?: string
          images?: string[] | null
          impressions?: number | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          post_type?: string
          product_id?: string | null
          seller_id?: string | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_posts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_posts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_posts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      notification_badges: {
        Row: {
          badge_type: string
          count: number | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badge_type: string
          count?: number | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badge_type?: string
          count?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          expire_date: string | null
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
          expire_date?: string | null
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
          expire_date?: string | null
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
      product_analytics: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          type: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          type: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          type?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
          contact_call: string | null
          contact_whatsapp: string | null
          created_at: string | null
          description: string
          discount: number | null
          discount_expiry: string | null
          id: string
          images: string[]
          impressions: number | null
          is_negotiable: boolean | null
          likes: number | null
          location: string | null
          price: number
          quantity: number
          rental_rate_type: string | null
          seller_id: string
          share_count: number | null
          shop_id: string | null
          status: string | null
          title: string
          updated_at: string | null
          video_url: string | null
          views: number | null
        }
        Insert: {
          category?: string | null
          contact_call?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          description: string
          discount?: number | null
          discount_expiry?: string | null
          id?: string
          images: string[]
          impressions?: number | null
          is_negotiable?: boolean | null
          likes?: number | null
          location?: string | null
          price: number
          quantity: number
          rental_rate_type?: string | null
          seller_id: string
          share_count?: number | null
          shop_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
          views?: number | null
        }
        Update: {
          category?: string | null
          contact_call?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          description?: string
          discount?: number | null
          discount_expiry?: string | null
          id?: string
          images?: string[]
          impressions?: number | null
          is_negotiable?: boolean | null
          likes?: number | null
          location?: string | null
          price?: number
          quantity?: number
          rental_rate_type?: string | null
          seller_id?: string
          share_count?: number | null
          shop_id?: string | null
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
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
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
          district_id: string | null
          email: string
          full_name: string
          id: string
          id_back_photo: string | null
          id_front_photo: string | null
          identity_verified: boolean | null
          installed_at: string | null
          installed_pwa: boolean | null
          last_active: string | null
          location: string | null
          phone_number: string | null
          profile_image: string | null
          province_id: string | null
          rating: number | null
          rating_count: number | null
          referral_code: string | null
          referred_by: string | null
          sector_id: string | null
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
          district_id?: string | null
          email: string
          full_name: string
          id: string
          id_back_photo?: string | null
          id_front_photo?: string | null
          identity_verified?: boolean | null
          installed_at?: string | null
          installed_pwa?: boolean | null
          last_active?: string | null
          location?: string | null
          phone_number?: string | null
          profile_image?: string | null
          province_id?: string | null
          rating?: number | null
          rating_count?: number | null
          referral_code?: string | null
          referred_by?: string | null
          sector_id?: string | null
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
          district_id?: string | null
          email?: string
          full_name?: string
          id?: string
          id_back_photo?: string | null
          id_front_photo?: string | null
          identity_verified?: boolean | null
          installed_at?: string | null
          installed_pwa?: boolean | null
          last_active?: string | null
          location?: string | null
          phone_number?: string | null
          profile_image?: string | null
          province_id?: string | null
          rating?: number | null
          rating_count?: number | null
          referral_code?: string | null
          referred_by?: string | null
          sector_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_type?: string
          verification_notes?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      provinces: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pwa_installs_log: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pwa_installs_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pwa_installs_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_logs: {
        Row: {
          created_at: string | null
          detected_by: string | null
          id: string
          reason: string | null
          referral_code: string
          referral_id: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          detected_by?: string | null
          id?: string
          reason?: string | null
          referral_code: string
          referral_id?: string | null
          status: string
        }
        Update: {
          created_at?: string | null
          detected_by?: string | null
          id?: string
          reason?: string | null
          referral_code?: string
          referral_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_logs_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          is_seller_referral: boolean | null
          is_valid: boolean | null
          referral_code: string
          referred_user_id: string | null
          referrer_id: string | null
          status: string | null
          validated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_seller_referral?: boolean | null
          is_valid?: boolean | null
          referral_code: string
          referred_user_id?: string | null
          referrer_id?: string | null
          status?: string | null
          validated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_seller_referral?: boolean | null
          is_valid?: boolean | null
          referral_code?: string
          referred_user_id?: string | null
          referrer_id?: string | null
          status?: string | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_tasks: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          created_by: string | null
          description: string
          expires_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          requirement_count: number | null
          requires_evidence: boolean | null
          reward_coins: number
          reward_points: number
          task_type: string
          title: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          requirement_count?: number | null
          requires_evidence?: boolean | null
          reward_coins?: number
          reward_points?: number
          task_type: string
          title: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          requirement_count?: number | null
          requires_evidence?: boolean | null
          reward_coins?: number
          reward_points?: number
          task_type?: string
          title?: string
        }
        Relationships: []
      }
      sectors: {
        Row: {
          created_at: string | null
          district_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          district_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          district_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sectors_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
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
      shops: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          district_id: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          province_id: string | null
          sector_id: string | null
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          province_id?: string | null
          sector_id?: string | null
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          province_id?: string | null
          sector_id?: string | null
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shops_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shops_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shops_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shops_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shops_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_browsing_history: {
        Row: {
          id: string
          product_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_browsing_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rewards: {
        Row: {
          badge: string | null
          coins: number | null
          id: string
          last_login_date: string | null
          level: number | null
          points: number | null
          streak_days: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          badge?: string | null
          coins?: number | null
          id?: string
          last_login_date?: string | null
          level?: number | null
          points?: number | null
          streak_days?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          badge?: string | null
          coins?: number | null
          id?: string
          last_login_date?: string | null
          level?: number | null
          points?: number | null
          streak_days?: number | null
          updated_at?: string
          user_id?: string
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
      user_task_progress: {
        Row: {
          claimed: boolean | null
          claimed_at: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string
          evidence_text: string | null
          evidence_url: string | null
          id: string
          progress: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          claimed?: boolean | null
          claimed_at?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          evidence_text?: string | null
          evidence_url?: string | null
          id?: string
          progress?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          claimed?: boolean | null
          claimed_at?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          evidence_text?: string | null
          evidence_url?: string | null
          id?: string
          progress?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_task_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "reward_tasks"
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
      calculate_engagement_score: {
        Args: { p_clicks: number; p_impressions: number }
        Returns: number
      }
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
      expire_marketing_posts: { Args: never; Returns: undefined }
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
      process_referral: {
        Args: { p_referral_code: string; p_referred_user_id: string }
        Returns: Json
      }
      record_user_action: {
        Args: { _action_type: string; _user_id: string }
        Returns: undefined
      }
      reset_monthly_activity: { Args: never; Returns: undefined }
      validate_referral_code: {
        Args: { p_referral_code: string }
        Returns: Json
      }
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
