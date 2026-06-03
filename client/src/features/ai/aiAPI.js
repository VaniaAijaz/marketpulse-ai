import api from "../../lib/axios";

// Message generation
export const generateMessage = (data) => api.post("/ai/generate-message", data);

// Recommendations
export const generateRecommendations = (data) => api.post("/ai/recommendations", data);
export const getLatestRecommendations = (shopId) => api.get(`/ai/recommendations/${shopId}`);
export const getRecommendationHistory = (shopId, limit = 10) => api.get(`/ai/recommendations/${shopId}/history`, { params: { limit } });
export const updateRecommendationStatus = (logId, productId, status) => api.patch(`/ai/recommendations/${logId}/status`, { productId, status });

// WhatsApp message generation
export const generateWhatsAppMessage = (data) => api.post("/ai/whatsapp-message", data);

// Usage & logs
export const getAiLimit  = (shopId) => api.get(`/ai/limit/${shopId}`);
export const getAiStats  = (shopId) => api.get(`/ai/stats/${shopId}`);
export const getAiLogs   = (shopId) => api.get(`/ai/logs/${shopId}`);
export const getAiCost   = (shopId) => api.get(`/ai/cost/${shopId}`);

// ── Copilot (new) ─────────────────────────────────────────
export const copilotChat   = (data)   => api.post('/ai/copilot/chat',   data);
export const copilotReport = (data)   => api.post('/ai/copilot/report', data);
export const copilotAdvise = (data)   => api.post('/ai/copilot/advise', data);
export const copilotAlerts = (shopId) => api.get(`/ai/copilot/alerts/${shopId}`);
