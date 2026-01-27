'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api'; 
import { endpoints } from '@/constants/endpoints';

export const useDailySalesSummary = (channelId: string, params: { days?: number; from?: string; to?: string }) => {
    return useQuery({
      queryKey: ['daily-sales-summary', channelId, params],
      queryFn: () => api.get(endpoints.dailySalesSummary(channelId), { params }).then(res => res.data),
      enabled: !!channelId,
    });
  };

// 1. Fetch list of sales transactions (filtered)
export const useSalesTransactions = (
  channelId: string,
  params: { days?: number; from?: string; to?: string }
) => {
  return useQuery({
    queryKey: ['sales-transactions', channelId, params],
    queryFn: async () => {
      const { data } = await api.get(endpoints.salesTransactions(channelId), { params });
      return data;
    },
    enabled: !!channelId,
  });
};

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data } = await api.get(endpoints.paymentMethods);
      return data; // expected: array of { code: string, name: string, ... }
    },
    staleTime: 1000 * 60 * 60, // 1 hour – payment methods rarely change
  });
};


export const useCustomers = (searchQuery: string) => {
  return useQuery({
    queryKey: ['customers', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const { data } = await api.get(endpoints.customersSearch, {
        params: { q: searchQuery, limit: 20 },
      });
      return data; // expected: array of { id, name, phone, kra_pin, ... }
    },
    enabled: searchQuery.trim().length >= 2, // prevent unnecessary calls
    staleTime: 1000 * 30, // 30 seconds
  });
};


export const useCreateSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post(endpoints.createSale(), payload);
      return data;
    },
    onSuccess: (data) => {
      // Optional: invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['daily-sales-summary'] });

    }
  });
};