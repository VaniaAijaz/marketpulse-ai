import api from "../../lib/axios";

export const getTodayAnalytics  = (shopId)         => api.get(`/analytics/today/${shopId}`);
export const getAnalyticsRange  = (shopId, params)  => api.get(`/analytics/range/${shopId}`, { params });
export const getDashboardSummary = (shopId)         => api.get(`/analytics/summary/${shopId}`);
export const getKPIMetrics       = (shopId)         => api.get(`/analytics/kpi/${shopId}`);
export const regenerateAnalytics = (data)           => api.post('/analytics/regenerate', data);
export const getAnalyticsInsights = (shopId, forceAI = false) => api.post(`/analytics/insights/${shopId}`, { forceAI });
