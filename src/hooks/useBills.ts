import { routes } from '@/constants/routes';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export const useBills = ({ params }) => {
  return useQuery({
    queryKey: ['bills', params],
    queryFn: () => api.get(routes.listBills, { params }).then(res => res.data),
    staleTime: 0, // optional: force fresh data
  });
};

export const useWaiters = () => {
  return useQuery({
    queryKey: ['waiters'],
    queryFn: () => api.get('/users/waiters').then(res => res.data),
  });
};

export const useCreateBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post(routes.createBill, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
};

export const useUpdateBill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.put(routes.updateBill(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
};

export const useAddPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ billId, method }) => api.post(routes.addBillPayment(billId), { method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
};

export const useVoidBill = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ billId }: { billId: string }) => api.post(routes.voidBill(billId)),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['bills'] });
     
      },
     
    });
  };