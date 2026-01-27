import { endpoints } from '@/constants/endpoints';
import { api } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ── Types ────────────────────────────────────────────────
type Account = {
  id: string;
  account_name: string;
  contact_phone: string;
  contact_email: string;
  kra_pin: string;
  industry: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  outlets_count?: number;
  status?: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

type AccountsResponse = {
  accounts: Account[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type CreateAccountPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  account_name: string;
  contact_phone: string;
  contact_email: string;
  kra_pin: string;
  industry: string;
  referrer_user_id: string | null;
  installer_user_id: string | null;
  outlet_name: string;
  outlet_phone: string;
  outlet_email: string;
};

type UpdateAccountPayload = Partial<CreateAccountPayload> & {
  id: string;
};

// ── API Base URL ─────────────────────────────────────────
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// ── Fetch Accounts ───────────────────────────────────────
async function fetchAccounts(params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AccountsResponse> {
  const queryParams = new URLSearchParams();

  if (params.status) queryParams.append('status', params.status);
  if (params.search) queryParams.append('search', params.search);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const response = await fetch(`${API_BASE_URL}/accounts?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch accounts');
  }

  return response.json();
}

// ── Create Account ───────────────────────────────────────
async function createAccount(payload: CreateAccountPayload): Promise<Account> {
  const response = await fetch(`${API_BASE_URL}/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create account');
  }

  return response.json();
}

// ── Update Account ───────────────────────────────────────
async function updateAccount(payload: UpdateAccountPayload): Promise<Account> {
  const { id, ...data } = payload;

  const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update account');
  }

  return response.json();
}

// ── Delete Account ───────────────────────────────────────
async function deleteAccount(accountId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/accounts/${accountId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete account');
  }
}

// ── Hooks ────────────────────────────────────────────────

/**
 * Fetch accounts with filters
 */
export function useAccounts(options?: {
  params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  };
}) {
  return useQuery<AccountsResponse>({
    queryKey: ['accounts', options?.params],
       queryFn: () => api.get(endpoints.listAccounts).then(res => res.data),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Get single account by ID
 */
export function useAccount(accountId: string) {
  return useQuery<Account>({
    queryKey: ['accounts', accountId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/accounts/${accountId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch account');
      }
      return response.json();
    },
    enabled: !!accountId,
  });
}

/**
 * Create new account
 */
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

/**
 * Update existing account
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAccount,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['accounts', data.id] });
    },
  });
}

/**
 * Delete account
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}