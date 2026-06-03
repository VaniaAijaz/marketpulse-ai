import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { upsertCustomer, getCustomersByShop, getInactiveCustomers, getTopCustomers, addCustomerTag, toggleBlockCustomer, backfillCustomerStats } from "./customerAPI";

export const useCustomersByShop = (shopId, filters = {}) => {
  return useQuery({
    queryKey: ["customers", shopId, filters],
    queryFn: async () => {
      const response = await getCustomersByShop(shopId, filters);
      return response.data;
    },
    enabled: !!shopId,
  });
};

export const useUpsertCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerData) => {
      const response = await upsertCustomer(customerData);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        queryClient.invalidateQueries({ queryKey: ["customers", data.data.shopId] });
      }
    },
  });
};

export const useAddCustomerTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, tag }) => {
      const response = await addCustomerTag(customerId, tag);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        queryClient.invalidateQueries({ queryKey: ["customers", data.data.shopId] });
      }
    },
  });
};

export const useToggleBlockCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId) => {
      const response = await toggleBlockCustomer(customerId);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        queryClient.invalidateQueries({ queryKey: ["customers", data.data.shopId] });
      }
    },
  });
};

export const useInactiveCustomers = (shopId, filters = {}) => {
  return useQuery({
    queryKey: ["inactive-customers", shopId, filters],
    queryFn: async () => {
      const response = await getInactiveCustomers(shopId, filters);
      return response.data;
    },
    enabled: !!shopId,
  });
};

export const useTopCustomers = (shopId, filters = {}) => {
  return useQuery({
    queryKey: ["top-customers", shopId, filters],
    queryFn: async () => {
      const response = await getTopCustomers(shopId, filters);
      return response.data;
    },
    enabled: !!shopId,
  });
};

export const useBackfillCustomerStats = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shopId) => {
      const response = await backfillCustomerStats(shopId);
      return response.data;
    },
    onSuccess: (_, shopId) => {
      queryClient.invalidateQueries({ queryKey: ['customers', shopId] });
      queryClient.invalidateQueries({ queryKey: ['top-customers', shopId] });
      queryClient.invalidateQueries({ queryKey: ['inactive-customers', shopId] });
    },
  });
};
