// src/lib/types/index.ts
// Central type definitions for Trust Banque frontend.
// Keep this file as the single source of truth — do not define these elsewhere.

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: 'user' | 'admin';
  created_at: string;
  verified: boolean;
  status?: string;
  profile_picture?: string | null;
  profile_picture_url?: string | null;
}

export interface Account {
  id: number;
  user_id: number;
  account_number: string;
  routing_number: string;
  account_type: 'checking' | 'savings' | 'credit';
  balance: number;
  available_balance: number;
  status: 'active' | 'frozen' | 'closed';
  opened_date: string;
  nickname?: string;
}

export interface Transaction {
  id: number;
  account_id: number;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'fee';
  category?: string;
  description: string;
  merchant?: string;
  date?: string;           // legacy field from mock data
  created_at?: string;     // actual DB field
  status: 'pending' | 'completed' | 'failed';
  balance_after: number;
  reference_number?: string;
}

export interface Card {
  id: number;
  account_id: number;
  card_number_masked: string;
  card_type: 'debit' | 'credit';
  card_network: 'visa' | 'mastercard';
  expiry_date: string;
  cardholder_name: string;
  status: 'active' | 'locked' | 'reported_lost';
  daily_limit: number;
  monthly_limit: number;
  // Extra fields joined from accounts table
  account_nickname?: string;
  account_type?: string;
  account_number?: string;
  account_balance?: number;
}

export interface Transfer {
  id: number;
  from_account: string;
  to_account: string;
  to_name: string;
  amount: number;
  type: 'internal' | 'external' | 'wire';
  status: 'pending' | 'completed' | 'failed';
  scheduled_date?: string;
  created_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
