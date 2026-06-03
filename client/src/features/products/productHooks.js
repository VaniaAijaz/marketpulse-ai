import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../store/useAuthStore";
import {
  getProductsByShop,
  getInventorySummary,
  getLowStockProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
} from "./productAPI";

export const useProductsByShop = (shopId, params = {}) => {
  return useQuery({
    queryKey: ["products", shopId, params],
    queryFn: async () => {
      const response = await getProductsByShop(shopId, params);
      return response.data;
    },
    enabled: !!shopId,
  });
};

export const useInventorySummary = (shopId) => {
  return useQuery({
    queryKey: ["inventory-summary", shopId],
    queryFn: async () => {
      const response = await getInventorySummary(shopId);
      return response.data;
    },
    enabled: !!shopId,
    staleTime: 30 * 1000,
  });
};

export const useLowStockProducts = (shopId) => {
  return useQuery({
    queryKey: ["products-lowstock", shopId],
    queryFn: async () => {
      const response = await getLowStockProducts(shopId);
      return response.data;
    },
    enabled: !!shopId,
  });
};

export const useProductById = (id) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const response = await getProductById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

function invalidateInventoryQueries(queryClient, shopId) {
  if (!shopId) return;
  queryClient.invalidateQueries({ queryKey: ["products", shopId] });
  queryClient.invalidateQueries({ queryKey: ["products-lowstock", shopId] });
  queryClient.invalidateQueries({ queryKey: ["inventory-summary", shopId] });
  queryClient.invalidateQueries({ queryKey: ["shops"] });
  queryClient.invalidateQueries({ queryKey: ["ai-recommendations-latest", shopId] });
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productData) => {
      const response = await createProduct(productData);
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.data?.shopId) invalidateInventoryQueries(queryClient, data.data.shopId);
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const response = await updateProduct(id, data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.data?.shopId) {
        invalidateInventoryQueries(queryClient, data.data.shopId);
        queryClient.invalidateQueries({ queryKey: ["product", data.data._id] });
      }
    },
  });
};

export const useUpdateProductStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stock, shopId }) => {
      const response = await updateProductStock(id, stock);
      return { ...response.data, shopId };
    },
    onSuccess: (data) => {
      const sid = data?.data?.shopId || data?.shopId;
      invalidateInventoryQueries(queryClient, sid);
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async ({ id, shopId }) => {
      const response = await deleteProduct(id);
      return { ...response.data, shopId };
    },
    onSuccess: (data, vars) => {
      const sid = vars.shopId || data?.data?.shopId;
      invalidateInventoryQueries(queryClient, sid);
      if (user?._id) queryClient.invalidateQueries({ queryKey: ["shops", user._id] });
    },
  });
};
