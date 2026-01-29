import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@/constants/endpoints';
import { api } from '@/lib/api';

// ── List roles ──────────────────────────────────────────────────────
export const useRoles = ({ params }: { params?: any }) => {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: async () => {
      const res = await api.get(endpoints.roles, { params });
      return res.data;
    },
  });
};

// Create
export const useCreateRole = () => {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: async (data: any) => {
        const { outlet_id, account_id, ...body } = data; 
  
        const res = await api.post(endpoints.roles, body, {
          params: { outlet_id, account_id },
        });
        return res.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles'] });
 
      },
      
    });
  };
  
  // Update (similar)
  export const useUpdateRole = () => {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
        const { outlet_id, account_id, ...body } = data;
  
        const res = await api.patch(`${endpoints.roles}/${id}`, body, {
          params: { outlet_id, account_id },
        });
        return res.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roles'] });
      }
    });
  };

// ── Optional: Toggle role active status ─────────────────────────────
export const useToggleRoleStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await api.patch(`${endpoints.roles}/${id}/toggle-status`, { is_active });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
   
  });
};