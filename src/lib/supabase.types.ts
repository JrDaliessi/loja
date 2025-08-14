export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: string
          name: string | null
          phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          role?: string
          name?: string | null
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: string
          name?: string | null
          phone?: string | null
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          parent_id: number | null
          position: number
        }
        Insert: {
          id?: number
          name: string
          slug: string
          parent_id?: number | null
          position?: number
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          parent_id?: number | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: number
          name: string
          slug: string
          description_md: string | null
          care_instructions_md: string | null
          category_id: number
          weight_g: number | null
          dimensions_json: Json | null
          is_active: boolean
        }
        Insert: {
          id?: number
          name: string
          slug: string
          description_md?: string | null
          care_instructions_md?: string | null
          category_id: number
          weight_g?: number | null
          dimensions_json?: Json | null
          is_active?: boolean
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description_md?: string | null
          care_instructions_md?: string | null
          category_id?: number
          weight_g?: number | null
          dimensions_json?: Json | null
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      carts: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          coupon_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          coupon_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          coupon_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      cart_items: {
        Row: {
          id: string
          cart_id: string
          variant_id: number
          quantity: number
          unit_price_snapshot: string
        }
        Insert: {
          id?: string
          cart_id: string
          variant_id: number
          quantity: number
          unit_price_snapshot: string
        }
        Update: {
          id?: string
          cart_id?: string
          variant_id?: number
          quantity?: number
          unit_price_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            referencedRelation: "carts"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          cart_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_items: string | null
          item_count: number
          starts_at: string | null
          ends_at: string | null
          scope: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          cart_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_items?: string | null
          item_count?: number
          starts_at?: string | null
          ends_at?: string | null
          scope?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          cart_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_items?: string | null
          item_count?: number
          starts_at?: string | null
          ends_at?: string | null
          scope?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_cart_id_fkey"
            columns: ["cart_id"]
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          id: number
          product_id: number
          user_id: string
          rating: number
          comment: string | null
          is_approved: boolean
          created_at: string
        }
        Insert: {
          id?: number
          product_id: number
          user_id: string
          rating: number
          comment?: string | null
          is_approved?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          product_id?: number
          user_id?: string
          rating?: number
          comment?: string | null
          is_approved?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
      order_status: 'created' | 'awaiting_payment' | 'paid' | 'separating' | 'shipped' | 'delivered' | 'canceled' | 'refunded'
      payment_method: 'pix' | 'card' | 'boleto'
      payment_status: 'pending' | 'approved' | 'rejected' | 'refunded' | 'expired'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
