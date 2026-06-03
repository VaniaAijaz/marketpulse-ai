import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  generateMessage,
  generateRecommendations,
  getLatestRecommendations,
  getRecommendationHistory,
  updateRecommendationStatus,
  generateWhatsAppMessage,
  getAiLimit,
  getAiStats,
  getAiLogs,
  getAiCost,
  copilotChat,
  copilotReport,
  copilotAdvise,
  copilotAlerts,
} from "./aiAPI";

// ── Message generation (generic) ─────────────────────────
export const useGenerateMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ shopId, prompt }) => {
      const res = await generateMessage({ shopId, prompt });
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["ai-limit", vars.shopId] });
      queryClient.invalidateQueries({ queryKey: ["ai-stats", vars.shopId] });
      queryClient.invalidateQueries({ queryKey: ["ai-logs",  vars.shopId] });
    },
  });
};

// ── WhatsApp context-aware message ───────────────────────
export const useGenerateWhatsAppMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await generateWhatsAppMessage(payload);
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["ai-limit", vars.shopId] });
      queryClient.invalidateQueries({ queryKey: ["ai-logs",  vars.shopId] });
    },
  });
};

// ── Generate recommendations (POST — triggers AI) ────────
export const useGenerateRecommendations = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shopId) => {
      const res = await generateRecommendations({ shopId });
      return res.data;
    },
    onSuccess: (_, shopId) => {
      queryClient.invalidateQueries({ queryKey: ["ai-recommendations-latest", shopId] });
      queryClient.invalidateQueries({ queryKey: ["ai-recommendations-history", shopId] });
      queryClient.invalidateQueries({ queryKey: ["ai-limit", shopId] });
      queryClient.invalidateQueries({ queryKey: ["ai-logs", shopId] });
      queryClient.invalidateQueries({ queryKey: ["shops"] });
    },
  });
};

// ── Latest recommendation (GET — cached) ─────────────────
export const useLatestRecommendations = (shopId) =>
  useQuery({
    queryKey: ["ai-recommendations-latest", shopId],
    queryFn: async () => {
      const res = await getLatestRecommendations(shopId);
      return res.data;
    },
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000, // 5 min
  });

// ── Recommendation history ────────────────────────────────
export const useRecommendationHistory = (shopId, limit = 10) =>
  useQuery({
    queryKey: ["ai-recommendations-history", shopId, limit],
    queryFn: async () => {
      const res = await getRecommendationHistory(shopId, limit);
      return res.data;
    },
    enabled: !!shopId,
  });

// ── Mark recommendation status ────────────────────────────
export const useUpdateRecommendationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ logId, productId, status, shopId }) => {
      const res = await updateRecommendationStatus(logId, productId, status);
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["ai-recommendations-latest",  vars.shopId] });
      queryClient.invalidateQueries({ queryKey: ["ai-recommendations-history", vars.shopId] });
    },
  });
};

// ── Usage & logs ──────────────────────────────────────────
export const useAiLimit = (shopId) =>
  useQuery({
    queryKey: ["ai-limit", shopId],
    queryFn: async () => { const r = await getAiLimit(shopId); return r.data; },
    enabled: !!shopId,
  });

export const useAiStats = (shopId) =>
  useQuery({
    queryKey: ["ai-stats", shopId],
    queryFn: async () => { const r = await getAiStats(shopId); return r.data; },
    enabled: !!shopId,
  });

export const useAiLogs = (shopId) =>
  useQuery({
    queryKey: ["ai-logs", shopId],
    queryFn: async () => { const r = await getAiLogs(shopId); return r.data; },
    enabled: !!shopId,
  });

export const useAiCost = (shopId) =>
  useQuery({
    queryKey: ["ai-cost", shopId],
    queryFn: async () => { const r = await getAiCost(shopId); return r.data; },
    enabled: !!shopId,
  });

// Legacy alias used in DashboardHome
export const useAiRecommendations = useLatestRecommendations;

// ── Copilot hooks ─────────────────────────────────────────
export const useCopilotChat = () =>
  useMutation({ mutationFn: (data) => copilotChat(data).then(r => r.data) });

export const useCopilotReport = () =>
  useMutation({ mutationFn: (data) => copilotReport(data).then(r => r.data) });

export const useCopilotAdvise = () =>
  useMutation({ mutationFn: (data) => copilotAdvise(data).then(r => r.data) });

export const useCopilotAlerts = (shopId) =>
  useQuery({
    queryKey: ['copilot-alerts', shopId],
    queryFn: () => copilotAlerts(shopId).then(r => r.data),
    enabled: !!shopId,
    staleTime: 2 * 60 * 1000, // refresh every 2 min
  });
