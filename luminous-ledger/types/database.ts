export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          onboarding_complete: boolean
          onboarding_step: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      plaid_items: {
        Row: {
          id: string
          user_id: string
          plaid_item_id: string
          access_token: string
          institution_id: string
          institution_name: string
          status: 'active' | 'error' | 'disconnected'
          cursor: string | null
          last_synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['plaid_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['plaid_items']['Insert']>
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          plaid_item_id: string
          plaid_account_id: string
          name: string
          official_name: string | null
          type: string
          subtype: string | null
          mask: string | null
          currency_code: string
          current_balance: number | null
          available_balance: number | null
          is_selected: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['accounts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          plaid_transaction_id: string
          amount: number
          currency_code: string
          name: string
          merchant_name: string | null
          category_id: string | null
          plaid_category: string[] | null
          transaction_date: string
          authorized_date: string | null
          pending: boolean
          is_recurring: boolean
          recurring_stream_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
      budget_categories: {
        Row: {
          id: string
          user_id: string | null
          name: string
          icon: string | null
          color: string | null
          is_income: boolean
          is_system: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['budget_categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['budget_categories']['Insert']>
      }
      budget_limits: {
        Row: {
          id: string
          user_id: string
          category_id: string
          monthly_limit: number
          daily_limit: number | null
          period: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['budget_limits']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['budget_limits']['Insert']>
      }
      recurring_streams: {
        Row: {
          id: string
          user_id: string
          plaid_stream_id: string | null
          merchant_name: string
          category_id: string | null
          average_amount: number
          frequency: 'weekly' | 'biweekly' | 'monthly' | 'semi_monthly' | 'annually'
          last_date: string | null
          next_expected_date: string | null
          is_active: boolean
          stream_type: 'expense' | 'income'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['recurring_streams']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['recurring_streams']['Insert']>
      }
      savings_goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_amount: number | null
          current_amount: number
          allocation_pct: number
          last_quick_select: number | null
          allocation_locked: boolean
          locked_at: string | null
          priority: number
          color: string | null
          is_active: boolean
          target_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['savings_goals']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['savings_goals']['Insert']>
      }
      investment_allocations: {
        Row: {
          id: string
          user_id: string
          allocation_pct: number
          risk_profile: 'conservative' | 'moderate' | 'aggressive'
          allocation_locked: boolean
          locked_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['investment_allocations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['investment_allocations']['Insert']>
      }
      allocation_transfers: {
        Row: {
          id: string
          user_id: string
          type: 'auto_allocation' | 'interest' | 'manual' | 'investment'
          amount: number
          description: string | null
          related_goal_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['allocation_transfers']['Row'], 'id' | 'created_at'>
        Update: never
      }
      api_keys: {
        Row: {
          id: string
          key: string
          key_prefix: string
          email: string
          user_id: string | null
          name: string | null
          requests_used: number
          requests_limit: number
          is_active: boolean
          last_used_at: string | null
          created_at: string
          expires_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['api_keys']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['api_keys']['Insert']>
      }
      usage_logs: {
        Row: {
          id: string
          api_key_id: string
          endpoint: string
          method: string
          status_code: number
          response_time_ms: number | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['usage_logs']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
  }
}

// Convenience row types
export type UserRow               = Database['public']['Tables']['users']['Row']
export type PlaidItemRow          = Database['public']['Tables']['plaid_items']['Row']
export type AccountRow            = Database['public']['Tables']['accounts']['Row']
export type TransactionRow        = Database['public']['Tables']['transactions']['Row']
export type BudgetCategoryRow     = Database['public']['Tables']['budget_categories']['Row']
export type BudgetLimitRow        = Database['public']['Tables']['budget_limits']['Row']
export type RecurringStreamRow    = Database['public']['Tables']['recurring_streams']['Row']
export type SavingsGoalRow        = Database['public']['Tables']['savings_goals']['Row']
export type InvestmentAllocationRow = Database['public']['Tables']['investment_allocations']['Row']
export type AllocationTransferRow = Database['public']['Tables']['allocation_transfers']['Row']
export type ApiKeyRow             = Database['public']['Tables']['api_keys']['Row']
export type UsageLogRow           = Database['public']['Tables']['usage_logs']['Row']
