import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrder, getOrdersByShop, updateOrderStatus, getOrderStats, simulatePayment } from "./orderAPI";

export const useOrdersByShop = (shopId, filters = {}) => {
  return useQuery({
    queryKey: ["orders", shopId, filters],
    queryFn: async () => {
      const response = await getOrdersByShop(shopId, filters);
      return response.data;
    },
    enabled: !!shopId,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData) => {
      const response = await createOrder(orderData);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        const shopId = data.data.shopId;
        queryClient.invalidateQueries({ queryKey: ['orders',            shopId] });
        queryClient.invalidateQueries({ queryKey: ['order-stats',       shopId] });
        queryClient.invalidateQueries({ queryKey: ['analytics-kpi',     shopId] });
        queryClient.invalidateQueries({ queryKey: ['analytics-summary', shopId] }); // ring chart + dashboard chart
      }
    },
  });
};

export const useSimulatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, gateway, forceFail }) => {
      const response = await simulatePayment(orderId, { gateway, forceFail });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data?.order) {
        const shopId = data.data.order.shopId;
        queryClient.invalidateQueries({ queryKey: ['orders',            shopId] });
        queryClient.invalidateQueries({ queryKey: ['order-stats',       shopId] });
        queryClient.invalidateQueries({ queryKey: ['analytics-kpi',     shopId] });
        queryClient.invalidateQueries({ queryKey: ['analytics-summary', shopId] }); // ring chart + dashboard chart
      }
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, reason }) => {
      const response = await updateOrderStatus(orderId, status, { reason });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        queryClient.invalidateQueries({ queryKey: ["orders", data.data.shopId] });
        queryClient.invalidateQueries({ queryKey: ["order-stats", data.data.shopId] });
      }
    },
  });
};

export const useOrderStats = (shopId) => {
  return useQuery({
    queryKey: ["order-stats", shopId],
    queryFn: async () => {
      const response = await getOrderStats(shopId);
      return response.data;
    },
    enabled: !!shopId,
  });
};
