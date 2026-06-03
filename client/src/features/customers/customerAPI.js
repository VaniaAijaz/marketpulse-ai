import api from "../../lib/axios";

export const upsertCustomer = (data) => api.post("/customers/upsert", data);
export const getCustomersByShop = (shopId, params) => api.get(`/customers/${shopId}`, { params });
export const getInactiveCustomers = (shopId, params) => api.get(`/customers/inactive/${shopId}`, { params });
export const getTopCustomers = (shopId, params) => api.get(`/customers/top/${shopId}`, { params });
export const addCustomerTag = (id, tag) => api.post(`/customers/${id}/tag`, { tag });
export const toggleBlockCustomer = (id) => api.patch(`/customers/${id}/block`);
export const getCustomerById = (id) => api.get(`/customers/${id}`);
export const backfillCustomerStats = (shopId) => api.post(`/customers/backfill/${shopId}`);
