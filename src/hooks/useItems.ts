'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api'; 
import { endpoints } from '@/constants/endpoints';


// GET: List items (with optional filters)
export const useItems = ({ params, enabled = true } = {}) => {
  return useQuery({
    queryKey: ['items', params],
    queryFn: async () => {
      const { data } = await api.get(endpoints.items, { params });
      return data;
    },
    enabled,
  });
};

// GET: Single item by ID
export const useItem = (id: string) => {
  return useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const { data } = await api.get(`${endpoints.items}/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

// POST: Create single item
export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post(endpoints.items, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

// POST: Bulk create 10 items
export const useBulkCreateItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any[]) => {
      const { data } = await api.post(`${endpoints.items}`, payload );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      // Optional: invalidate related queries
      // queryClient.invalidateQueries({ queryKey: ['item-options'] });
    },
  });
};

export const useActivateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: 'active' | 'inactive' }) => {
      const { data } = await api.patch(`${endpoints.items}/${itemId}/status`, {
        status,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};


export const useItemLogs = (params: any) => {
  return useQuery({
    queryKey: ['item-logs', params],
    queryFn: () => api.get(endpoints.itemLogs, { params }).then(res => res.data),
  });
};

export const useItemOptions = () => {
    return useQuery({
      queryKey: ['item-options'],
      queryFn: async () => {
        const [
          productTypesRes,
          taxTypesRes,
        ] = await Promise.all([
          api.get(endpoints.getProductCodes),
          api.get(endpoints.getTaxTypes),
        ]);
  
        return {
          productTypes: productTypesRes.data?.data || [],
          taxTypes: taxTypesRes.data?.data || [],
        };
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };
  export const useApprovalRequests = (params: any) => {
    return useQuery({
      queryKey: ['approval-requests', params],
      queryFn: () => api.get(endpoints.itemApprovalRequests, { params }).then(res => res.data),
    });
  };

  export const useApproveRequests = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (itemIds: string[]) => api.post(endpoints.approveItems, { request_ids: itemIds }),
      onSuccess: () => {
        
        queryClient.invalidateQueries({ queryKey: ['item-selling-prices'] });
        queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      },
    });
  };

  export const useRejectRequests = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (itemIds: string[]) => api.post(endpoints.rejectItems,  itemIds ),
      onSuccess: () => {
        
        queryClient.invalidateQueries({ queryKey: ['item-selling-prices'] });
        queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      },
    });
  };


export const useBulkUpdateItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: any[]) => api.patch(endpoints.updateItems,  items ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
};

// GET: List uoms packaging and uoqs
  export const useUomOptions = () => {
    return useQuery({
      queryKey: ['uom-options'],
      queryFn: async () => {
        const [
          packagingUnitsRes,
          unitsOfQuantityRes,
        ] = await Promise.all([
          api.get(endpoints.getPackagingUnits),
          api.get(endpoints.getUnitsOfQuantity),
        ]);
  
        return {
          packagingUnits: packagingUnitsRes.data?.data || [],
          unitsOfQuantity: unitsOfQuantityRes.data?.data || [],
        };
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };



// GET: List of item uoms (uom centered)
export const useItemUomList = ({ params, enabled = true } = {}) => {
    return useQuery({
      queryKey: ['item-uoms-list', params],
      queryFn: async () => {
        const { data } = await api.get(endpoints.itemUomList, { params });
        return data;
      },
      enabled,
    });
  };
  
  // GET: List items  of item uoms to be used in form (item centered)
export const useItemForUoms = ({ params, enabled = true } = {}) => {
    return useQuery({
      queryKey: ['item-uoms-form', params],
      queryFn: async () => {
        const { data } = await api.get(endpoints.itemsForUoms, { params });
        return data;
      },
      enabled,
    });
  };
  
    
  export const useUpdateItemUoMs = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (payload: any[]) => api.patch(endpoints.upsertUoms, payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['items'] });
        queryClient.invalidateQueries({ queryKey: ['item-uoms-form'] });
      },
    });
  };


  export const useApproveUoMs = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (itemIds: string[]) => api.post(endpoints.approveUoms, { uom_ids: itemIds }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['items'] })
        queryClient.invalidateQueries({ queryKey: ['item-uoms-form'] });}
    });
  };

  export const useSellingPrices = ({ params, enabled = true } = {}) => {
    return useQuery({
      queryKey: ['item-selling-prices', params],
      queryFn: async () => {
        const { data } = await api.get(endpoints.sellingPrices, { params });
        return data;
      },
      enabled,
    });
  };

  

export const useBulkUpdateSellingPrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: any[]) => api.patch(endpoints.updateSellingPrices, updates),
    onSuccess: () => {
      
      queryClient.invalidateQueries({ queryKey: ['item-selling-prices'] });
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
    },
  });
};  