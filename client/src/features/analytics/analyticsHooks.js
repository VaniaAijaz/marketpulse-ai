import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTodayAnalytics,
  getAnalyticsRange,
  getDashboardSummary,
  getKPIMetrics,
  regenerateAnalytics,
  getAnalyticsInsights,
} from "./analyticsAPI";

export const useTodayAnalytics = (shopId) =>
  useQuery({
    queryKey: ["analytics-today", shopId],
    queryFn: async () => { const r = await getTodayAnalytics(shopId); return r.data; },
    enabled: !!shopId,
  });

export const useAnalyticsRange = (shopId, filters = {}) =>
  useQuery({
    queryKey: ["analytics-range", shopId, filters],
    queryFn: async () => { const r = await getAnalyticsRange(shopId, filters); return r.data; },
    enabled: !!shopId && !!filters.start && !!filters.end,
  });

export const useDashboardSummary = (shopId) =>
  useQuery({
    queryKey: ['analytics-summary', shopId],
    queryFn: async () => { const r = await getDashboardSummary(shopId); return r.data; },
    enabled:         !!shopId,
    staleTime:       0,              // always re-fetch on focus
    refetchInterval: 30 * 1000,      // poll every 30 s
    refetchOnWindowFocus: true,
  });

export const useKPIMetrics = (shopId) =>
  useQuery({
    queryKey: ['analytics-kpi', shopId],
    queryFn: async () => { const r = await getKPIMetrics(shopId); return r.data; },
    enabled:         !!shopId,
    staleTime:       0,              // always re-fetch on focus
    refetchInterval: 30 * 1000,      // poll every 30 s — keeps KPI cards live
    refetchOnWindowFocus: true,
  });

export const useRegenerateAnalytics = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ shopId, date }) => {
      const r = await regenerateAnalytics({ shopId, date });
      return r.data;
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        queryClient.invalidateQueries({ queryKey: ["analytics-today",   data.data.shopId] });
        queryClient.invalidateQueries({ queryKey: ["analytics-summary", data.data.shopId] });
        queryClient.invalidateQueries({ queryKey: ["analytics-kpi",     data.data.shopId] });
      }
    },
  });
};

// AI insights â€” mutation so user can trigger on demand
// AI insights — manual only, never auto-triggered
// Pass forceAI=true to actually call Gemini
export const useAnalyticsInsights = () =>
  useMutation({
    mutationFn: async ({ shopId, forceAI = false }) => {
      const r = await getAnalyticsInsights(shopId, forceAI);
      return r.data;
    },
  });