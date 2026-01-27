'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api'; 
import { endpoints } from '@/constants/endpoints';


export const useStorageAreas = () => {
    return useQuery({
      queryKey: ['storage-areas'],
      queryFn: () => api.get(endpoints.storageAreas).then(res => res.data),
    });
  };
  
  export const useCreateStorageArea = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: { name: string }) => api.post(endpoints.storageAreas, data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storage-areas'] }),
    });
  };
  
  export const useUpdateStorageArea = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        api.patch(endpoints.updateStorageArea(id), { name }),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storage-areas'] }),
    });
  };
  
  export const useToggleStorageArea = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => api.patch(endpoints.toggleStorageAreaStatus(id)),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storage-areas'] }),
    });
  };

  export const useStorageAreaApprovalRequests = (params: any) => {
    return useQuery({
      queryKey: ['storage-area-approval-requests', params],
      queryFn: () => api.get(endpoints.storageAreasApprovalRequests, { params }).then(res => res.data),
    });
  };

  export const useStorageAreaApproveRequests = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (itemIds: string[]) => api.post(endpoints.approveStorageAreas, { request_ids: itemIds }),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [ 'storage-area-approval-requests'] }),
    });
  };

  export const useStorageAreaRejectRequests = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (itemIds: string[]) => api.post(endpoints.rejectStorageAreas,  itemIds ),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storage-area-approval-requests'] }),
    });
  };


  export const useSalesChannels = () => {
    return useQuery({
      queryKey: ['sales-channels'],
      queryFn: () => api.get(endpoints.salesChannels).then(res => res.data),
    });
  };
  
  export const useCreateSalesChannel = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: { name: string }) => api.post(endpoints.salesChannels, data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-channels'] }),
    });
  };
  
  export const useUpdateSalesChannel = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        api.patch(endpoints.updateSalesChannel(id), { name }),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-channels'] }),
    });
  };
  
  export const useToggleSalesChannel = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => api.patch(endpoints.toggleSalesChannelStatus(id)),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-channels'] }),
    });
  };


  export const useSalesChannelApprovalRequests = (params: any) => {
    return useQuery({
      queryKey: ['sales-channel-approval-requests', params],
      queryFn: () => api.get(endpoints.salesChannelsApprovalRequests, { params }).then(res => res.data),
    });
  };

  export const useSalesChannelApproveRequests = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (itemIds: string[]) => api.post(endpoints.approveSalesChannels, { request_ids: itemIds }),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: [ 'sales-channel-approval-requests'] }),
    });
  };

  export const useSalesChannelRejectRequests = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (itemIds: string[]) => api.post(endpoints.rejectSalesChannels,  itemIds ),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales-channel-approval-requests'] }),
    });
  };
