export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
export type ProviderStatus = 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FAILED'
  | 'DISPUTED'
  | 'REFUND_REQUESTED'
  | 'REFUNDED';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          phone: string;
          full_name: string;
          role: UserRole;
          society_id: string | null;
          flat_number: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          phone: string;
          full_name: string;
          role?: UserRole;
          society_id?: string | null;
          flat_number?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          phone?: string;
          full_name?: string;
          role?: UserRole;
          society_id?: string | null;
          flat_number?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      societies: {
        Row: {
          id: string;
          community_id: string;
          name: string;
          address_line: string;
          locality: string | null;
          city: string;
          pincode: string;
          latitude: number;
          longitude: number;
          total_flats: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          name: string;
          address_line: string;
          locality?: string | null;
          city: string;
          pincode: string;
          latitude: number;
          longitude: number;
          total_flats?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address_line?: string;
          city?: string;
          total_flats?: number;
          is_active?: boolean;
        };
      };
      providers: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          category_id: string;
          status: ProviderStatus;
          rating: number;
          review_count: number;
          completed_orders: number;
          base_latitude: number | null;
          base_longitude: number | null;
          coverage_radius_km: number;
          is_vacation_mode: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          category_id: string;
          status?: ProviderStatus;
          rating?: number;
          review_count?: number;
          completed_orders?: number;
          base_latitude?: number | null;
          base_longitude?: number | null;
          coverage_radius_km?: number;
          is_vacation_mode?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_name?: string;
          status?: ProviderStatus;
          rating?: number;
          coverage_radius_km?: number;
          is_vacation_mode?: boolean;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          provider_id: string;
          service_id: string;
          society_id: string;
          status: OrderStatus;
          scheduled_date: string;
          scheduled_slot: string;
          subtotal: number;
          platform_fee: number;
          total_amount: number;
          provider_earnings: number;
          payment_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_id: string;
          provider_id: string;
          service_id: string;
          society_id: string;
          status?: OrderStatus;
          scheduled_date: string;
          scheduled_slot: string;
          subtotal: number;
          platform_fee: number;
          total_amount: number;
          provider_earnings: number;
          payment_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          status?: OrderStatus;
          payment_status?: string;
          updated_at?: string;
        };
      };
      job_requests: {
        Row: {
          id: string;
          job_number: string;
          society_id: string;
          resident_id: string;
          service_type_id: string;
          status: string;
          scheduled_date: string;
          scheduled_slot: string;
          locked_subtotal: number;
          total_resident_price: number;
          door_otp: string;
          claimed_by_provider_id: string | null;
          claimed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_number: string;
          society_id: string;
          resident_id: string;
          service_type_id: string;
          status?: string;
          scheduled_date: string;
          scheduled_slot: string;
          locked_subtotal: number;
          total_resident_price: number;
          door_otp: string;
          claimed_by_provider_id?: string | null;
          claimed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          status?: string;
          claimed_by_provider_id?: string | null;
          claimed_at?: string | null;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          thread_id: string | null;
          order_id: string;
          sender_id: string;
          sender_role: string;
          content: string;
          filtered: boolean;
          filter_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id?: string | null;
          order_id: string;
          sender_id: string;
          sender_role: string;
          content: string;
          filtered?: boolean;
          filter_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          filtered?: boolean;
          content?: string;
        };
      };
      wallet_balances: {
        Row: {
          id: string;
          resident_id: string;
          credit_balance: number;
          lifetime_earned: number;
          streak_count: number;
          currency: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resident_id: string;
          credit_balance?: number;
          lifetime_earned?: number;
          streak_count?: number;
          currency?: string;
          updated_at?: string;
        };
        Update: {
          credit_balance?: number;
          lifetime_earned?: number;
          streak_count?: number;
          updated_at?: string;
        };
      };
      wallet_transactions: {
        Row: {
          id: string;
          resident_id: string;
          order_id: string | null;
          type: string;
          amount: number;
          balance_after: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          resident_id: string;
          order_id?: string | null;
          type: string;
          amount: number;
          balance_after: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
        };
      };
      consent_documents: {
        Row: {
          id: string;
          slug: string;
          version: string;
          title: string;
          content_markdown: string;
          is_active: boolean;
          effective_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          version: string;
          title: string;
          content_markdown: string;
          is_active?: boolean;
          effective_date?: string;
          created_at?: string;
        };
        Update: {
          is_active?: boolean;
          title?: string;
          content_markdown?: string;
        };
      };
      user_consents: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          version: string;
          ip_address: string | null;
          user_agent: string | null;
          consented_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id: string;
          version: string;
          ip_address?: string | null;
          user_agent?: string | null;
          consented_at?: string;
        };
        Update: {
          id?: string;
        };
      };
      service_addons: {
        Row: {
          id: string;
          service_id: string;
          name: string;
          description: string | null;
          price: number;
          max_quantity: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          name: string;
          description?: string | null;
          price: number;
          max_quantity?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          price?: number;
          is_active?: boolean;
        };
      };
      order_addon_requests: {
        Row: {
          id: string;
          order_id: string;
          provider_id: string;
          addon_title: string;
          amount: number;
          status: 'PENDING' | 'APPROVED' | 'REJECTED';
          requested_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          provider_id: string;
          addon_title: string;
          amount: number;
          status?: 'PENDING' | 'APPROVED' | 'REJECTED';
          requested_at?: string;
          responded_at?: string | null;
        };
        Update: {
          status?: 'PENDING' | 'APPROVED' | 'REJECTED';
          responded_at?: string | null;
        };
      };
    };
    Functions: {
      claim_job_request: {
        Args: {
          p_job_id: string;
          p_provider_id: string;
        };
        Returns: {
          success: boolean;
          job_id: string;
          provider_id: string;
          status: string;
        };
      };
      verify_job_otp: {
        Args: {
          p_job_id: string;
          p_otp_type: string;
          p_otp_code: string;
        };
        Returns: {
          success: boolean;
          new_status: string;
        };
      };
      cancel_booking: {
        Args: {
          p_booking_id: string;
          p_actor_id: string;
          p_reason: string;
        };
        Returns: {
          success: boolean;
          status: string;
        };
      };
    };
  };
}
