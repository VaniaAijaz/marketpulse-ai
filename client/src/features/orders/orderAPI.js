import api from "../../lib/axios";

export const createOrder = (data) => api.post("/orders", data);
export const simulatePayment = (id, data) => api.post(`/orders/${id}/simulate-payment`, data);
export const getOrdersByShop = (shopId, params) => api.get(`/orders/shop/${shopId}`, { params });
export const updateOrderStatus = (id, status, opts = {}) => api.patch(`/orders/${id}/status`, { status, ...opts });
export const getOrderStats = (shopId) => api.get(`/orders/stats/${shopId}`);
