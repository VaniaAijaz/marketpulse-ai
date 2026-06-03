import api from "../../lib/axios";

export const getProductsByShop = (shopId, params = {}) =>
  api.get(`/products/shop/${shopId}`, { params });

export const getInventorySummary = (shopId) => api.get(`/products/summary/${shopId}`);

export const getLowStockProducts = (shopId) => api.get(`/products/lowstock/${shopId}`);

export const getProductById = (id) => api.get(`/products/product/${id}`);

export const createProduct = (data) => api.post("/products/create", data);

export const updateProduct = (id, data) => api.put(`/products/${id}`, data);

export const updateProductStock = (id, quantity) =>
  api.patch(`/products/${id}/stock`, { quantity, operation: "set" });

export const deleteProduct = (id) => api.delete(`/products/${id}`);
