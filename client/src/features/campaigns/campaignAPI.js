import api from '../../lib/axios';

export const getCampaigns         = (shopId, params) => api.get(`/campaigns/${shopId}`, { params });
export const getSegmentCounts     = (shopId)         => api.get(`/campaigns/segment-counts/${shopId}`);
export const getCampaignAnalytics = (shopId)         => api.get(`/campaigns/analytics/${shopId}`);
export const getSmartSuggestions  = (shopId)         => api.get(`/campaigns/suggestions/${shopId}`);
export const getTemplates         = ()               => api.get('/campaigns/templates');
export const previewRecipients    = (data)           => api.post('/campaigns/preview', data);
export const aiGenerateMessage    = (data)           => api.post('/campaigns/ai-generate', data);
export const sendCampaign         = (data)           => api.post('/campaigns/send', data);
export const scheduleCampaign     = (data)           => api.post('/campaigns/schedule', data);
export const generateCoupon       = (data)           => api.post('/campaigns/coupon/generate', data);
