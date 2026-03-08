// src/lib/api/client.ts
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost/banking-api/public/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  message?: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function buildHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  const token = getToken();
  // Still send Authorization header for environments that support it
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Appends ?_token=xxx to the URL.
 * This is the reliable fallback for nginx/cPanel hosts that strip
 * the Authorization header before PHP sees it.
 */
function appendToken(endpoint: string): string {
  const token = getToken();
  if (!token) return endpoint;
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${separator}_token=${encodeURIComponent(token)}`;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  let data: any;
  try {
    data = await response.json();
  } catch {
    return { success: false, error: 'Invalid server response' };
  }

  if (!response.ok) {
    return {
      success: false,
      error:   data.error   || 'An error occurred',
      errors:  data.errors,
      message: data.message,
    };
  }

  return {
    success: true,
    data:    data.data,
    message: data.message,
  };
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE}${appendToken(endpoint)}`;
    const response = await fetch(url, {
      ...options,
      headers: buildHeaders(options.headers as Record<string, string>),
    });
    return await handleResponse<T>(response);
  } catch (error) {
    console.error('API Request Error:', error);
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────

export const login = (email: string, password: string) =>
  apiRequest('/auth/login.php', {
    method: 'POST',
    body:   JSON.stringify({ email, password }),
  });

export const register = (userData: Record<string, unknown>) =>
  apiRequest('/auth/register.php', {
    method: 'POST',
    body:   JSON.stringify(userData),
  });

export const logout = () =>
  apiRequest('/auth/logout.php', { method: 'POST' });

export const getCurrentUser = () =>
  apiRequest('/user/profile.php', { method: 'GET' });

// ── Accounts ──────────────────────────────────────────────────────────────

export const getAccounts = () =>
  apiRequest('/accounts/list.php', { method: 'GET' });

// ── Transactions ──────────────────────────────────────────────────────────

export function getTransactions(accountId?: number, filters?: Record<string, unknown>) {
  const params = new URLSearchParams();
  if (accountId) params.append('account_id', accountId.toString());
  if (filters)
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    });
  return apiRequest(`/transactions/list.php?${params.toString()}`, { method: 'GET' });
}

// ── Cards ─────────────────────────────────────────────────────────────────

export const getCards = () =>
  apiRequest('/cards/list.php', { method: 'GET' });

export const lockCard = (cardId: number, lock: boolean) =>
  apiRequest('/cards/lock.php', {
    method: 'POST',
    body:   JSON.stringify({ card_id: cardId, lock }),
  });

export const updateCardSettings = (cardId: number, settings: Record<string, unknown>) =>
  apiRequest('/cards/settings.php', {
    method: 'POST',
    body:   JSON.stringify({ card_id: cardId, ...settings }),
  });

// ── Transfers ─────────────────────────────────────────────────────────────

export const initiateInternalTransfer = (data: {
  from_account_id: number;
  to_account_id:   number;
  amount:          number;
  note?:           string;
}) =>
  apiRequest('/transfer/internal.php', {
    method: 'POST',
    body:   JSON.stringify(data),
  });

export const initiateExternalTransfer = (data: {
  from_account_id: number;
  recipient_name:  string;
  recipient_bank:  string;
  routing_number?: string;
  account_number?: string;
  amount:          number;
  transfer_type:   'external' | 'wire';
  note?:           string;
}) =>
  apiRequest('/transfer/external.php', {
    method: 'POST',
    body:   JSON.stringify(data),
  });

// ── User profile / settings ───────────────────────────────────────────────

export const updateProfile = (data: Record<string, unknown>) =>
  apiRequest('/user/update_profile.php', {
    method: 'POST',
    body:   JSON.stringify(data),
  });

export const changePassword = (currentPassword: string, newPassword: string) =>
  apiRequest('/user/change_password.php', {
    method: 'POST',
    body:   JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });

// ── Admin ─────────────────────────────────────────────────────────────────

export const getAdminDashboard = () =>
  apiRequest('/admin/dashboard.php', { method: 'GET' });

export const getAllUsers = () =>
  apiRequest('/admin/users.php', { method: 'GET' });

export const getAdminUserDetail = (userId: number) =>
  apiRequest(`/admin/user_detail.php?user_id=${userId}`, { method: 'GET' });

export const createUser = (userData: Record<string, unknown>) =>
  apiRequest('/admin/create_user.php', {
    method: 'POST',
    body:   JSON.stringify(userData),
  });

export const updateUser = (userId: number, userData: Record<string, unknown>) =>
  apiRequest('/admin/user_update.php', {
    method: 'POST',
    body:   JSON.stringify({ user_id: userId, ...userData }),
  });

export const deleteUser = (userId: number) =>
  apiRequest('/admin/user_delete.php', {
    method: 'POST',
    body:   JSON.stringify({ user_id: userId }),
  });

export const adminBalanceAdjust = (data: {
  account_id:   number;
  mode:         'set' | 'adjust';
  amount:       number;
  description:  string;
  type:         'deposit' | 'withdrawal' | 'transfer' | 'payment' | 'fee';
  sender_name?: string;
  date?:        string;
}) =>
  apiRequest('/admin/balance_adjust.php', {
    method: 'POST',
    body:   JSON.stringify(data),
  });

export const getAdminCards = (userId?: number) =>
  apiRequest(`/admin/cards.php${userId ? `?user_id=${userId}` : ''}`, { method: 'GET' });

export const getAdminLogs = (type: 'admin' | 'security' | 'error', page = 1, limit = 50) =>
  apiRequest(`/admin/logs.php?type=${type}&page=${page}&limit=${limit}`, { method: 'GET' });

export const getAdminTransactions = (filters?: Record<string, unknown>) => {
  const params = new URLSearchParams();
  if (filters)
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
    });
  return apiRequest(`/admin/transactions.php?${params.toString()}`, { method: 'GET' });
};
