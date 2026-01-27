'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api'; 
import { endpoints } from '@/constants/endpoints';


export const useDailyProductionSummary = (channelId: string, params: { days?: number; from?: string; to?: string }) => {
    return useQuery({
      queryKey: ['daily-production', channelId, params],
      queryFn: () => api.get(endpoints.dailyProductions(channelId), { params }).then(res => res.data),
      enabled: !!channelId,
    });
  };

  export const useDailyProductionItems = (date: string, channelId:string) => {
    return useQuery({
      queryKey: ['daily-production-items', channelId],
      queryFn: () => api.get(endpoints.dailyProductionItems(date, channelId)).then(res => res.data),
    });
  };
  
  export const useUpsertDailyProduction = (channelId:string) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: { date: string; entries: any[] }) =>
        api.post(endpoints.dailyProductions(channelId), payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['daily-production-items'] });
      },
    });
  };

  export const useDailyProductionApprovalRequests = (channelId:string, params: any) => {
    return useQuery({
      queryKey: ['daily-production-approval-requests', params],
      queryFn: () => api.get(endpoints.dailyProductionApprovalRequests(channelId), { params }).then(res => res.data),
    });
  };
  
  export const useApproveDailyProductionRequests = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({channelId, requestIds}:{channelId:string, requestIds: string[]}) =>
        api.post(endpoints.approveDailyProduction(channelId), { request_ids: requestIds }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['daily-production-approval-requests'] });
        queryClient.invalidateQueries({ queryKey: ['daily-production'] });
      },
    });
  };
  
  export const useRejectDailyProductionRequests = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ channelId, request_ids, reason }: { channelId:string,request_ids: string[]; reason: string }) =>
        api.post(endpoints.rejectDailyProduction(channelId), { request_ids, reason }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['daily-production-approval-requests'] });
      },
    });
  };