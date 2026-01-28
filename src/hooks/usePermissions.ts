import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@/constants/endpoints';
import { api } from '@/lib/api';

// ── List permissions ────────────────────────────────────────────────
export const usePermissions = ({ params }: { params?: any }) => {
  return useQuery({
    queryKey: ['permissions', params],
    queryFn: async () => {
      const res = await api.get(endpoints.permissions, { params });
      return res.data;
    },
  });
};

// ── Create permission ───────────────────────────────────────────────
export const useCreatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(endpoints.permissions, [data]);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    }
  });
};

// ── Update permission ───────────────────────────────────────────────
export const useUpdatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(endpoints.permissions, [data]);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    }
  });
};

// ── Toggle active status ────────────────────────────────────────────
export const useTogglePermissionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await api.patch(`${endpoints.permissions}/${id}/toggle-status`, { is_active });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    }
  });
};