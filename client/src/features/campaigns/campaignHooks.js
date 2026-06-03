import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCampaigns, getSegmentCounts, getCampaignAnalytics, getSmartSuggestions,
  getTemplates, previewRecipients, aiGenerateMessage, sendCampaign,
  scheduleCampaign, generateCoupon,
} from './campaignAPI';

export const useCampaigns = (shopId, params = {}) =>
  useQuery({ queryKey: ['campaigns', shopId, params], queryFn: () => getCampaigns(shopId, params).then(r => r.data), enabled: !!shopId });

export const useSegmentCounts = (shopId) =>
  useQuery({ queryKey: ['segment-counts', shopId], queryFn: () => getSegmentCounts(shopId).then(r => r.data), enabled: !!shopId, staleTime: 60_000 });

export const useCampaignAnalytics = (shopId) =>
  useQuery({ queryKey: ['campaign-analytics', shopId], queryFn: () => getCampaignAnalytics(shopId).then(r => r.data), enabled: !!shopId, staleTime: 30_000 });

export const useSmartSuggestions = (shopId) =>
  useQuery({ queryKey: ['campaign-suggestions', shopId], queryFn: () => getSmartSuggestions(shopId).then(r => r.data), enabled: !!shopId });

export const useTemplates = () =>
  useQuery({ queryKey: ['campaign-templates'], queryFn: () => getTemplates().then(r => r.data), staleTime: Infinity });

export const usePreviewRecipients = () =>
  useMutation({ mutationFn: previewRecipients });

export const useAiGenerateMessage = () =>
  useMutation({ mutationFn: (data) => aiGenerateMessage(data).then(r => r.data) });

export const useSendCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => sendCampaign(data).then(r => r.data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['campaigns', vars.shopId] });
      qc.invalidateQueries({ queryKey: ['campaign-analytics', vars.shopId] });
    },
  });
};

export const useScheduleCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => scheduleCampaign(data).then(r => r.data),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['campaigns', vars.shopId] }),
  });
};

export const useGenerateCoupon = () =>
  useMutation({ mutationFn: (data) => generateCoupon(data).then(r => r.data) });
