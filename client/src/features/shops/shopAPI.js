import api from "../../lib/axios";

export const getShopsByOwner = (ownerId) => api.get(`/shop/owner/${ownerId}`);
export const getShopById = (id) => api.get(`/shop/${id}`);
export const createShop = (data) => api.post("/shop/create", data);
export const updateAISettings = (id, data) => api.patch(`/shop/${id}/ai-settings`, data);
export const updateWhatsAppStatus = (id, data) => api.patch(`/shop/${id}/whatsapp`, data);
export const updateShopPlan = (id, data) => api.patch(`/shop/${id}/plan`, data);
export const fetchNearbyShops = (lat, lng) => api.get(`/shop/nearby?latitude=${lat}&longitude=${lng}`);
