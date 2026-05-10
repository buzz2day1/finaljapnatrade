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
      active_bets: {
        Row: {
          amount: number
          candle_key: string
          coin_symbol: string
          created_at: string
          direction: string
          entry_price: number
          exit_price: number | null
          id: string
          pnl: number | null
          result_direction: string | null
          return_rate: number
          settled_at: string | null
          status: string
          timeframe: number
          user_id: string
        }
        Insert: {
          amount: number
          candle_key: string
          coin_symbol: string
          created_at?: string
          direction: string
          entry_price: number
          exit_price?: number | null
          id?: string
          pnl?: number | null
          result_direction?: string | null
          return_rate?: number
          settled_at?: string | null
          status?: string
          timeframe: number
          user_id: string
        }
        Update: {
          amount?: number
          candle_key?: string
          coin_symbol?: string
          created_at?: string
          direction?: string
          entry_price?: number
          exit_price?: number | null
          id?: string
          pnl?: number | null
          result_direction?: string | null
          return_rate?: number
          settled_at?: string | null
          status?: string
          timeframe?: number
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action_type: string
          admin_email: string | null
          admin_user_id: string
          after_state: Json | null
          before_state: Json | null
          chain_sequence: number | null
          checksum: string | null
          created_at: string
          id: string
          ip_address: string | null
          prev_hash: string | null
          reason: string | null
          request_id: string | null
          target_id: string | null
          target_table: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_email?: string | null
          admin_user_id: string
          after_state?: Json | null
          before_state?: Json | null
          chain_sequence?: number | null
          checksum?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          prev_hash?: string | null
          reason?: string | null
          request_id?: string | null
          target_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_email?: string | null
          admin_user_id?: string
          after_state?: Json | null
          before_state?: Json | null
          chain_sequence?: number | null
          checksum?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          prev_hash?: string | null
          reason?: string | null
          request_id?: string | null
          target_id?: string | null
          target_table?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      candle_bet_aggregates: {
        Row: {
          bet_count: number
          candle_end_time: number
          candle_key: string
          coin_symbol: string
          created_at: string
          id: string
          is_settled: boolean
          result_direction: string | null
          settled_at: string | null
          timeframe: number
          total_down_bets: number
          total_up_bets: number
          updated_at: string
        }
        Insert: {
          bet_count?: number
          candle_end_time: number
          candle_key: string
          coin_symbol: string
          created_at?: string
          id?: string
          is_settled?: boolean
          result_direction?: string | null
          settled_at?: string | null
          timeframe: number
          total_down_bets?: number
          total_up_bets?: number
          updated_at?: string
        }
        Update: {
          bet_count?: number
          candle_end_time?: number
          candle_key?: string
          coin_symbol?: string
          created_at?: string
          id?: string
          is_settled?: boolean
          result_direction?: string | null
          settled_at?: string | null
          timeframe?: number
          total_down_bets?: number
          total_up_bets?: number
          updated_at?: string
        }
        Relationships: []
      }
      daily_referral_earnings: {
        Row: {
          created_at: string | null
          date: string
          deposit_commission: number | null
          id: string
          new_signups: number | null
          referrer_id: string
          total_earnings: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string
          deposit_commission?: number | null
          id?: string
          new_signups?: number | null
          referrer_id: string
          total_earnings?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          deposit_commission?: number | null
          id?: string
          new_signups?: number | null
          referrer_id?: string
          total_earnings?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_referral_earnings_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_audit_log: {
        Row: {
          after_balance: number
          amount: number
          before_balance: number
          chain_sequence: number | null
          checksum: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          prev_hash: string | null
          profile_id: string | null
          request_id: string | null
          source_id: string | null
          source_table: string | null
          type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          after_balance: number
          amount: number
          before_balance: number
          chain_sequence?: number | null
          checksum?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          prev_hash?: string | null
          profile_id?: string | null
          request_id?: string | null
          source_id?: string | null
          source_table?: string | null
          type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          after_balance?: number
          amount?: number
          before_balance?: number
          chain_sequence?: number | null
          checksum?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          prev_hash?: string | null
          profile_id?: string | null
          request_id?: string | null
          source_id?: string | null
          source_table?: string | null
          type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_audit_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      honeypot_triggers: {
        Row: {
          action_taken: string | null
          endpoint_hit: string
          id: string
          ip_address: string
          request_data: Json | null
          triggered_at: string | null
          user_agent: string | null
        }
        Insert: {
          action_taken?: string | null
          endpoint_hit: string
          id?: string
          ip_address: string
          request_data?: Json | null
          triggered_at?: string | null
          user_agent?: string | null
        }
        Update: {
          action_taken?: string | null
          endpoint_hit?: string
          id?: string
          ip_address?: string
          request_data?: Json | null
          triggered_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          idempotency_key: string
          operation_type: string
          request_hash: string | null
          result: Json | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          idempotency_key: string
          operation_type: string
          request_hash?: string | null
          result?: Json | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          idempotency_key?: string
          operation_type?: string
          request_hash?: string | null
          result?: Json | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      incident_snapshots: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string | null
          exported_at: string | null
          exported_by: string | null
          id: string
          incident_id: string
          is_exported: boolean
          snapshot_data: Json
          snapshot_type: string
          target_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at?: string | null
          exported_at?: string | null
          exported_by?: string | null
          id?: string
          incident_id: string
          is_exported?: boolean
          snapshot_data: Json
          snapshot_type: string
          target_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string | null
          exported_at?: string | null
          exported_by?: string | null
          id?: string
          incident_id?: string
          is_exported?: boolean
          snapshot_data?: Json
          snapshot_type?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      ip_blocklist: {
        Row: {
          block_type: string
          blocked_at: string | null
          blocked_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: string
          ip_range_end: unknown
          ip_range_start: unknown
          is_active: boolean
          reason: string
        }
        Insert: {
          block_type?: string
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address: string
          ip_range_end?: unknown
          ip_range_start?: unknown
          is_active?: boolean
          reason: string
        }
        Update: {
          block_type?: string
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string
          ip_range_end?: unknown
          ip_range_start?: unknown
          is_active?: boolean
          reason?: string
        }
        Relationships: []
      }
      login_history: {
        Row: {
          city: string | null
          country_code: string | null
          created_at: string | null
          device_fingerprint: string | null
          failure_reason: string | null
          id: string
          ip_address: string
          is_suspicious: boolean
          latitude: number | null
          login_successful: boolean
          longitude: number | null
          suspicion_reason: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          failure_reason?: string | null
          id?: string
          ip_address: string
          is_suspicious?: boolean
          latitude?: number | null
          login_successful?: boolean
          longitude?: number | null
          suspicion_reason?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: string
          is_suspicious?: boolean
          latitude?: number | null
          login_successful?: boolean
          longitude?: number | null
          suspicion_reason?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number
          blocked: boolean
          created_at: string
          freeze_level: string | null
          frozen: boolean
          frozen_at: string | null
          frozen_by: string | null
          frozen_reason: string | null
          id: string
          name: string
          referral_code: string | null
          referral_earnings: number
          referred_by: string | null
          tier_bonuses_paid: Json | null
          total_bet: number
          total_deposit: number
          updated_at: string
          user_id: string
          withdrawal_wallet_address: string | null
        }
        Insert: {
          avatar_url?: string | null
          balance?: number
          blocked?: boolean
          created_at?: string
          freeze_level?: string | null
          frozen?: boolean
          frozen_at?: string | null
          frozen_by?: string | null
          frozen_reason?: string | null
          id?: string
          name: string
          referral_code?: string | null
          referral_earnings?: number
          referred_by?: string | null
          tier_bonuses_paid?: Json | null
          total_bet?: number
          total_deposit?: number
          updated_at?: string
          user_id: string
          withdrawal_wallet_address?: string | null
        }
        Update: {
          avatar_url?: string | null
          balance?: number
          blocked?: boolean
          created_at?: string
          freeze_level?: string | null
          frozen?: boolean
          frozen_at?: string | null
          frozen_by?: string | null
          frozen_reason?: string | null
          id?: string
          name?: string
          referral_code?: string | null
          referral_earnings?: number
          referred_by?: string | null
          tier_bonuses_paid?: Json | null
          total_bet?: number
          total_deposit?: number
          updated_at?: string
          user_id?: string
          withdrawal_wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_events: {
        Row: {
          abuse_score: number | null
          action_type: string
          blocked_until: string | null
          count: number
          created_at: string
          id: string
          identifier: string
          identifier_type: string
          is_blocked: boolean
          limit_max: number
          window_seconds: number
          window_start: string
        }
        Insert: {
          abuse_score?: number | null
          action_type: string
          blocked_until?: string | null
          count?: number
          created_at?: string
          id?: string
          identifier: string
          identifier_type: string
          is_blocked?: boolean
          limit_max: number
          window_seconds: number
          window_start?: string
        }
        Update: {
          abuse_score?: number | null
          action_type?: string
          blocked_until?: string | null
          count?: number
          created_at?: string
          id?: string
          identifier?: string
          identifier_type?: string
          is_blocked?: boolean
          limit_max?: number
          window_seconds?: number
          window_start?: string
        }
        Relationships: []
      }
      recovery_checkpoints: {
        Row: {
          checkpoint_name: string
          checkpoint_type: string
          checksum: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          row_counts: Json
          tables_included: string[]
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          checkpoint_name: string
          checkpoint_type: string
          checksum?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          row_counts?: Json
          tables_included: string[]
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          checkpoint_name?: string
          checkpoint_type?: string
          checksum?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          row_counts?: Json
          tables_included?: string[]
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      referral_tiers: {
        Row: {
          commission_percentage: number
          created_at: string | null
          id: number
          max_referrals: number | null
          min_referrals: number
          one_time_bonus: number
          tier_level: number
        }
        Insert: {
          commission_percentage: number
          created_at?: string | null
          id?: number
          max_referrals?: number | null
          min_referrals: number
          one_time_bonus?: number
          tier_level: number
        }
        Update: {
          commission_percentage?: number
          created_at?: string | null
          id?: number
          max_referrals?: number | null
          min_referrals?: number
          one_time_bonus?: number
          tier_level?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
          signup_bonus_paid: boolean
          total_earnings: number
        }
        Insert: {
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
          signup_bonus_paid?: boolean
          total_earnings?: number
        }
        Update: {
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
          signup_bonus_paid?: boolean
          total_earnings?: number
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      request_signatures: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          signature_hash: string
          timestamp_used: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          signature_hash: string
          timestamp_used: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          signature_hash?: string
          timestamp_used?: number
          user_id?: string | null
        }
        Relationships: []
      }
      rpc_allowlist: {
        Row: {
          created_at: string | null
          description: string | null
          function_name: string
          id: string
          is_enabled: boolean
          rate_limit_per_minute: number | null
          requires_admin: boolean
          requires_auth: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          function_name: string
          id?: string
          is_enabled?: boolean
          rate_limit_per_minute?: number | null
          requires_admin?: boolean
          requires_auth?: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          function_name?: string
          id?: string
          is_enabled?: boolean
          rate_limit_per_minute?: number | null
          requires_admin?: boolean
          requires_auth?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          event_data: Json
          event_type: string
          handled: boolean
          handled_at: string | null
          handled_by: string | null
          id: string
          ip_address: string | null
          request_id: string | null
          severity: string
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json
          event_type: string
          handled?: boolean
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          ip_address?: string | null
          request_id?: string | null
          severity?: string
          source: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json
          event_type?: string
          handled?: boolean
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          ip_address?: string | null
          request_id?: string | null
          severity?: string
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_keys: {
        Row: {
          compromised_at: string | null
          compromised_reason: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean
          is_compromised: boolean
          key_name: string
          key_purpose: string
          key_version: number
          last_rotated_at: string | null
          metadata: Json | null
          rotation_due_at: string | null
        }
        Insert: {
          compromised_at?: string | null
          compromised_reason?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_compromised?: boolean
          key_name: string
          key_purpose: string
          key_version?: number
          last_rotated_at?: string | null
          metadata?: Json | null
          rotation_due_at?: string | null
        }
        Update: {
          compromised_at?: string | null
          compromised_reason?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_compromised?: boolean
          key_name?: string
          key_purpose?: string
          key_version?: number
          last_rotated_at?: string | null
          metadata?: Json | null
          rotation_due_at?: string | null
        }
        Relationships: []
      }
      trade_velocity: {
        Row: {
          avg_bet_size: number | null
          created_at: string | null
          id: string
          loss_count: number
          max_bet_size: number | null
          pattern_flags: Json | null
          total_volume: number
          trade_count: number
          user_id: string
          velocity_score: number | null
          win_count: number
          win_rate: number | null
          window_end: string
          window_start: string
        }
        Insert: {
          avg_bet_size?: number | null
          created_at?: string | null
          id?: string
          loss_count?: number
          max_bet_size?: number | null
          pattern_flags?: Json | null
          total_volume?: number
          trade_count?: number
          user_id: string
          velocity_score?: number | null
          win_count?: number
          win_rate?: number | null
          window_end: string
          window_start: string
        }
        Update: {
          avg_bet_size?: number | null
          created_at?: string | null
          id?: string
          loss_count?: number
          max_bet_size?: number | null
          pattern_flags?: Json | null
          total_volume?: number
          trade_count?: number
          user_id?: string
          velocity_score?: number | null
          win_count?: number
          win_rate?: number | null
          window_end?: string
          window_start?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          amount: number
          closed_at: string | null
          coin_name: string
          coin_symbol: string
          created_at: string
          direction: string
          entry_price: number
          exit_price: number | null
          id: string
          pnl: number | null
          result: string | null
          return_rate: number
          timeframe: number
          user_id: string
        }
        Insert: {
          amount: number
          closed_at?: string | null
          coin_name: string
          coin_symbol: string
          created_at?: string
          direction: string
          entry_price: number
          exit_price?: number | null
          id?: string
          pnl?: number | null
          result?: string | null
          return_rate: number
          timeframe: number
          user_id: string
        }
        Update: {
          amount?: number
          closed_at?: string | null
          coin_name?: string
          coin_symbol?: string
          created_at?: string
          direction?: string
          entry_price?: number
          exit_price?: number | null
          id?: string
          pnl?: number | null
          result?: string | null
          return_rate?: number
          timeframe?: number
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          coin: string | null
          created_at: string
          id: string
          status: string
          type: string
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount: number
          coin?: string | null
          created_at?: string
          id?: string
          status?: string
          type: string
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          coin?: string | null
          created_at?: string
          id?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_security_profile: {
        Row: {
          created_at: string | null
          id: string
          investigation_notes: string | null
          investigation_started_at: string | null
          last_risk_update: string | null
          risk_factors: Json | null
          risk_level: string
          risk_score: number
          shadow_banned: boolean
          shadow_banned_at: string | null
          shadow_banned_reason: string | null
          under_investigation: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          investigation_notes?: string | null
          investigation_started_at?: string | null
          last_risk_update?: string | null
          risk_factors?: Json | null
          risk_level?: string
          risk_score?: number
          shadow_banned?: boolean
          shadow_banned_at?: string | null
          shadow_banned_reason?: string | null
          under_investigation?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          investigation_notes?: string | null
          investigation_started_at?: string | null
          last_risk_update?: string | null
          risk_factors?: Json | null
          risk_level?: string
          risk_score?: number
          shadow_banned?: boolean
          shadow_banned_at?: string | null
          shadow_banned_reason?: string | null
          under_investigation?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_wallet_data: {
        Row: {
          created_at: string
          id: string
          last_wallet_change: string | null
          updated_at: string
          user_id: string
          wallet_locked: boolean
          wallet_locked_at: string | null
          withdrawal_wallet_address: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_wallet_change?: string | null
          updated_at?: string
          user_id: string
          wallet_locked?: boolean
          wallet_locked_at?: string | null
          withdrawal_wallet_address?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_wallet_change?: string | null
          updated_at?: string
          user_id?: string
          wallet_locked?: boolean
          wallet_locked_at?: string | null
          withdrawal_wallet_address?: string | null
        }
        Relationships: []
      }
      webhook_archive: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string
          headers: Json | null
          id: string
          idempotency_key: string | null
          ip_address: string | null
          payload: Json
          processed_at: string | null
          processing_status: string | null
          provider: string
          received_at: string | null
          signature: string | null
          signature_verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type: string
          headers?: Json | null
          id?: string
          idempotency_key?: string | null
          ip_address?: string | null
          payload: Json
          processed_at?: string | null
          processing_status?: string | null
          provider: string
          received_at?: string | null
          signature?: string | null
          signature_verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          headers?: Json | null
          id?: string
          idempotency_key?: string | null
          ip_address?: string | null
          payload?: Json
          processed_at?: string | null
          processing_status?: string | null
          provider?: string
          received_at?: string | null
          signature?: string | null
          signature_verified?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_user_wallet: { Args: { p_user_id: string }; Returns: Json }
      analyze_trade_velocity: {
        Args: { p_user_id: string; p_window_hours?: number }
        Returns: Json
      }
      block_ip: {
        Args: {
          p_admin_id?: string
          p_block_type?: string
          p_expires_hours?: number
          p_ip_address: string
          p_reason: string
        }
        Returns: Json
      }
      check_idempotency: {
        Args: {
          p_key: string
          p_operation: string
          p_request_hash?: string
          p_user_id?: string
        }
        Returns: Json
      }
      check_operation_allowed: { Args: { p_operation: string }; Returns: Json }
      check_payout_circuit_breaker: {
        Args: { p_amount: number }
        Returns: Json
      }
      check_rate_limit: {
        Args: {
          p_action: string
          p_identifier: string
          p_identifier_type: string
          p_limit_max: number
          p_window_seconds: number
        }
        Returns: Json
      }
      cleanup_expired_idempotency: { Args: never; Returns: number }
      cleanup_expired_signatures: { Args: never; Returns: number }
      complete_idempotency: {
        Args: {
          p_key: string
          p_operation: string
          p_result?: Json
          p_status: string
        }
        Returns: undefined
      }
      compromise_key: {
        Args: { p_admin_id: string; p_key_name: string; p_reason: string }
        Returns: Json
      }
      create_forensic_snapshot: {
        Args: { p_admin_id: string; p_incident_id: string; p_user_id: string }
        Returns: Json
      }
      create_recovery_checkpoint: {
        Args: {
          p_admin_id: string
          p_checkpoint_name: string
          p_checkpoint_type: string
          p_notes?: string
        }
        Returns: Json
      }
      export_user_data: {
        Args: { p_admin_id: string; p_user_id: string }
        Returns: Json
      }
      freeze_account: {
        Args: {
          p_admin_id: string
          p_freeze_level: string
          p_reason: string
          p_user_id: string
        }
        Returns: Json
      }
      generate_referral_code: { Args: never; Returns: string }
      get_bet_result: { Args: { p_bet_id: string }; Returns: Json }
      get_candle_aggregates: { Args: { p_candle_key: string }; Returns: Json }
      get_user_financial_summary: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      get_user_pending_bet: { Args: { p_candle_key: string }; Returns: Json }
      get_user_referral_stats: { Args: never; Returns: Json }
      get_user_wallet_data: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_ip_blocked: { Args: { p_ip_address: string }; Returns: Json }
      log_admin_action: {
        Args: {
          p_action_type: string
          p_admin_user_id: string
          p_after_state?: Json
          p_before_state?: Json
          p_ip_address?: string
          p_reason?: string
          p_request_id?: string
          p_target_id?: string
          p_target_table?: string
          p_target_user_id?: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_event_data: Json
          p_event_type: string
          p_ip_address?: string
          p_request_id?: string
          p_severity: string
          p_source: string
          p_user_id?: string
        }
        Returns: string
      }
      mutate_balance: {
        Args: {
          p_amount: number
          p_metadata?: Json
          p_request_id?: string
          p_source_id?: string
          p_source_table?: string
          p_type: string
          p_user_id: string
        }
        Returns: Json
      }
      place_bet: {
        Args: {
          p_amount: number
          p_candle_end_time: number
          p_coin_symbol: string
          p_direction: string
          p_entry_price: number
          p_return_rate?: number
          p_timeframe: number
        }
        Returns: Json
      }
      process_referral_commission: {
        Args: { p_deposit_amount: number; p_referred_profile_id: string }
        Returns: Json
      }
      record_login: {
        Args: {
          p_city?: string
          p_country_code?: string
          p_device_fingerprint?: string
          p_failure_reason?: string
          p_ip_address: string
          p_latitude?: number
          p_login_successful?: boolean
          p_longitude?: number
          p_user_agent?: string
          p_user_id: string
        }
        Returns: Json
      }
      save_withdrawal_wallet: {
        Args: { p_wallet_address: string }
        Returns: Json
      }
      settle_candle: {
        Args: { p_candle_key: string; p_exit_price: number }
        Returns: Json
      }
      shadow_ban_user: {
        Args: { p_admin_id: string; p_reason: string; p_user_id: string }
        Returns: Json
      }
      start_investigation: {
        Args: { p_admin_id: string; p_notes: string; p_user_id: string }
        Returns: Json
      }
      validate_rpc_call: {
        Args: { p_function_name: string; p_user_id?: string }
        Returns: Json
      }
      verify_audit_chain: {
        Args: { p_limit?: number; p_table: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
