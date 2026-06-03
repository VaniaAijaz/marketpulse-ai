import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getShopsByOwner, getShopById, createShop, updateAISettings, updateWhatsAppStatus, updateShopPlan } from "./shopAPI";
import useAppStore from "../../store/useAppStore";
import useAuthStore from "../../store/useAuthStore";

export const useShopsByOwner = (ownerId) => {
  const setShops = useAppStore((state) => state.setShops);
  const activeShop = useAuthStore((state) => state.activeShop);
  const setActiveShop = useAuthStore((state) => state.setActiveShop);

  return useQuery({
    queryKey: ["shops", ownerId],
    queryFn: async () => {
      const response = await getShopsByOwner(ownerId);
      return response.data;
    },
    enabled: !!ownerId,
    onSuccess: (data) => {
      if (data.success && data.data) {
        setShops(data.data);
        // Default active shop pick if none selected
        if (data.data.length > 0 && !activeShop) {
          setActiveShop(data.data[0]);
        }
      }
    },
  });
};

export const useShopById = (shopId) => {
  return useQuery({
    queryKey: ["shop", shopId],
    queryFn: async () => {
      const response = await getShopById(shopId);
      return response.data;
    },
    enabled: !!shopId,
  });
};

export const useCreateShop = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (shopData) => {
      const response = await createShop(shopData);
      return response.data;
    },
    onSuccess: () => {
      if (user?._id) {
        queryClient.invalidateQueries({ queryKey: ["shops", user._id] });
      }
    },
  });
};

export const useUpdateAISettings = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const activeShop = useAuthStore((state) => state.activeShop);
  const setActiveShop = useAuthStore((state) => state.setActiveShop);

  return useMutation({
    mutationFn: async ({ shopId, aiSettings }) => {
      const response = await updateAISettings(shopId, aiSettings);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        queryClient.invalidateQueries({ queryKey: ["shop", data.data._id] });
        if (user?._id) {
          queryClient.invalidateQueries({ queryKey: ["shops", user._id] });
        }
        if (activeShop && activeShop._id === data.data._id) {
          setActiveShop(data.data);
        }
      }
    },
  });
};

export const useUpdateWhatsAppStatus = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const activeShop = useAuthStore((state) => state.activeShop);
  const setActiveShop = useAuthStore((state) => state.setActiveShop);

  return useMutation({
    mutationFn: async ({ shopId, connected, sessionId }) => {
      const response = await updateWhatsAppStatus(shopId, { connected, sessionId });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        queryClient.invalidateQueries({ queryKey: ["shop", data.data._id] });
        if (user?._id) {
          queryClient.invalidateQueries({ queryKey: ["shops", user._id] });
        }
        if (activeShop && activeShop._id === data.data._id) {
          setActiveShop(data.data);
        }
      }
    },
  });
};

export const useUpdateShopPlan = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const activeShop = useAuthStore((state) => state.activeShop);
  const setActiveShop = useAuthStore((state) => state.setActiveShop);

  return useMutation({
    mutationFn: async ({ shopId, plan }) => {
      const response = await updateShopPlan(shopId, { plan });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        queryClient.invalidateQueries({ queryKey: ["shop", data.data._id] });
        if (user?._id) {
          queryClient.invalidateQueries({ queryKey: ["shops", user._id] });
        }
        if (activeShop && activeShop._id === data.data._id) {
          setActiveShop(data.data);
        }
      }
    },
  });
};
