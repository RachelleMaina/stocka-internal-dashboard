'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api'; 
import { endpoints } from '@/constants/endpoints';

export const useItems = ({
    channelId,
    params,
    enabled = true,
  }: {
    channelId: string;
    params?: any;
    enabled?: boolean;
  }) => {
  
    return useQuery({
      queryKey: ['pos-items-selection', channelId, params],
      queryFn: async () => {
        const { data } = await api.get(endpoints.saleItemsSelection(channelId), { params });
        return data;
      },
      enabled: enabled && !!channelId, // Extra safety
    });
  };

  export const useSaleItems = ({
    channelId,
    params,
    enabled = true,
  }: {
    channelId: string;
    params?: any;
    enabled?: boolean;
  }) => {
    return useQuery({
      queryKey: ['pos-items', channelId, params],
      queryFn: () =>
        api.get(endpoints.saleItems(channelId), { params }).then((res) => res.data),
      enabled,
    });
  };
  
  export const useRemoveSaleItems = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ channelId, item_uom_option_ids }: { channelId: string; item_uom_option_ids: string[] }) =>
        api.post(endpoints.removeSaleItems(channelId), { item_uom_option_ids }),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['pos-items-selection', variables.channelId] });
      },
    });
  };

export const useAddSaleItems = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ channelId, items }: { channelId: string; items: any }) =>
        api.post(endpoints.addSaleItems(channelId),  items ),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['pos-items-selection', variables.channelId] });
        // Optionally invalidate catalogue if needed
      },
    });
  };

  export const useSaleItemsApprovalRequests = ({
    channelId,
    params,
  }: {
    channelId: string;
    params: {
      search?: string;
      page?: number;
      limit?: number;
      status?: 'pending' | 'approved' | 'rejected';
    };
  }) => {
    return useQuery({
      queryKey: ['sale-items-approval-requests', channelId, params],
      queryFn: async () => {
        const { data } = await api.get(endpoints.saleItemsApprovalRequests(channelId), {
          params,
        });
        return data;
      },
    });
  };


// 1. Bulk Approve Sales Item Requests
export const useApproveSalesItemsRequests = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      channelId, 
      requestIds 
    }: { 
      channelId: string; 
      requestIds: string[] 
    }) => {
      const { data } = await api.post(endpoints.approveSaleItems(channelId), {
     
        request_ids: requestIds,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      // No toast here – handled in component
      queryClient.invalidateQueries({ queryKey: ['sale-items-approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['sale-items-approval-requests', variables.channelId] });
      queryClient.invalidateQueries({ queryKey: ['pos-items', variables.channelId] });
    },
    onError: (error: any) => {
      
      console.error('Approve sales items failed:', error);
    },
  });
};

// 2. Bulk Reject Sales Item Requests
export const useRejectSalesItemsRequests = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      channelId, 
      request_ids, 
      reason 
    }: { 
      channelId: string; 
      request_ids: string[]; 
      reason: string 
    }) => {
      const { data } = await api.post('/approval-requests/sales-items/reject', {
        channel_id: channelId,
        request_ids,
        reason,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      
      queryClient.invalidateQueries({ queryKey: ['sale-items-approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['sale-items-approval-requests', variables.channelId] });
    },
    onError: (error: any) => {
      
      console.error('Reject sales items failed:', error);
    },
  });
};