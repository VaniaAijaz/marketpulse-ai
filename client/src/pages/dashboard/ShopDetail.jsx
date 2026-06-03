import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useShopById } from '../../features/shops/shopHooks'
import {
  useLatestRecommendations,
  useGenerateRecommendations,
  useUpdateRecommendationStatus,
  useAiLimit,
} from '../../features/ai/aiHooks'
import { useOrderStats } from '../../features/orders/orderHooks'
import { useInventorySummary, useLowStockProducts } from '../../features/products/productHooks'
import { useCustomersByShop } from '../../features/customers/customerHooks'
import useAuthStore from '../../store/useAuthStore'

const C = { blue: '#1390ff', purple: '#7c3aed', cyan: '#00d4ff', green: '#22c55e', amber: '#f59e0b', pink: '#f43f5e', teal: '#14b8a6', violet: '#8b5cf6' }

// ── Weather Widget ────────────────────────────────────────
function WeatherWidget({ rec }) {
  if (!rec?.weather) return null
  const { weather, weatherContext, location } = rec

  const CONDITIONS = {
    clear:        { icon: 'wb_sunny',          gradient: `${C.amber}, #ff6b00`,  bg: C.amber  },
    clouds:       { icon: 'cloud',             gradient: `#64748b, #94a3b8`,     bg: '#64748b'},
    rain:         { icon: 'rainy',             gradient: `${C.blue}, ${C.teal}`, bg: C.blue   },
    drizzle:      { icon: 'grain',             gradient: `${C.blue}, ${C.cyan}`, bg: C.blue   },
    thunderstorm: { icon: 'thunderstorm',      gradient: `${C.purple}, #1e1b4b`, bg: C.purple },
    snow:         { icon: 'ac_unit',           gradient: `${C.cyan}, #e0f2fe`,   bg: C.cyan   },
    mist:         { icon: 'foggy',             gradient: `#6b7280, #9ca3af`,     bg: '#6b7280'},
    haze:         { icon: 'foggy',             gradient: `#92400e, ${C.amber}`,  bg: C.amber  },
    default:      { icon: 'partly_cloudy_day', gradient: `${C.blue}, ${C.cyan}`, bg: C.blue   },
  }

  const cond = CONDITIONS[weather.condition?.toLowerCase()] || CONDITIONS.default
  const tempColor = weather.temp > 38 ? '#ff4500' : weather.temp > 30 ? C.amber : weather.temp < 15 ? C.blue : C.cyan

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden h-full relative"
      style={{ background: '#0a1628', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Gradient background glow */}
      <div className="absolute inset-0 opacity-20"
        style={{ background: `radial-gradient(ellipse at top right, ${cond.bg}60 0%, transparent 65%)` }} />

      <div className="relative z-10 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: cond.bg + '25', border: `1px solid ${cond.bg}40` }}>
              <span className="material-symbols-outlined text-[15px]" style={{ color: cond.bg }}>wb_sunny</span>
            </div>
            <h3 className="font-bold text-white text-[13px]">Weather Context</h3>
          </div>
          {location?.city && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
              style={{ color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              📍 {location.city}
            </span>
          )}
        </div>

        {/* Main temp display */}
        <div className="flex items-center gap-5 mb-5">
          {/* Big icon */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${cond.bg}25, ${cond.bg}10)`, border: `1px solid ${cond.bg}30` }}>
              <span className="material-symbols-outlined text-[44px]" style={{ color: cond.bg }}>{cond.icon}</span>
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-2xl animate-pulse opacity-30"
              style={{ border: `2px solid ${cond.bg}` }} />
          </div>

          {/* Temperature */}
          <div>
            <div className="flex items-start gap-1">
              <span className="font-display font-black leading-none" style={{ fontSize: '56px', color: tempColor, lineHeight: 1 }}>
                {weather.temp}
              </span>
              <span className="font-bold text-[22px] mt-2" style={{ color: tempColor }}>°C</span>
            </div>
            <p className="text-[13px] font-semibold capitalize mt-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {weather.description || weather.condition}
            </p>
            {/* Temp feel indicator */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full" style={{
                  width: `${Math.min(Math.max((weather.temp / 50) * 100, 5), 100)}%`,
                  background: `linear-gradient(90deg, ${C.blue}, ${C.cyan}, ${C.amber}, #ff4500)`
                }} />
              </div>
              <span className="text-[9px] font-semibold" style={{ color: tempColor }}>
                {weather.temp > 38 ? 'Extreme Heat' : weather.temp > 30 ? 'Hot' : weather.temp > 20 ? 'Warm' : weather.temp > 10 ? 'Cool' : 'Cold'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: 'Humidity', value: weather.humidity != null ? `${weather.humidity}%` : '—', icon: 'water_drop', color: C.blue  },
            { label: 'Wind',     value: weather.windSpeed != null ? `${weather.windSpeed} km/h` : '—', icon: 'air', color: C.teal },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2.5 p-3 rounded-xl"
              style={{ background: s.color + '0d', border: `1px solid ${s.color}20` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: s.color + '20' }}>
                <span className="material-symbols-outlined text-[16px]" style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
                <p className="font-bold text-[14px] text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* AI suggestion */}
        {weatherContext?.suggestion && (
          <div className="p-3 rounded-xl flex items-start gap-2.5"
            style={{ background: `linear-gradient(135deg, ${C.blue}0d, ${C.purple}0d)`, border: `1px solid ${C.blue}25` }}>
            <span className="material-symbols-outlined text-[15px] flex-shrink-0 mt-0.5" style={{ color: C.cyan }}>tips_and_updates</span>
            <p className="text-[11px] text-white leading-relaxed">{weatherContext.suggestion}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Nearby Places Widget ──────────────────────────────────
function NearbyWidget({ nearbyPlaces }) {
  if (!nearbyPlaces) return null
  const places = [
    { key: 'office',     label: 'Offices',      icon: 'business',         color: C.blue   },
    { key: 'school',     label: 'Schools',      icon: 'school',           color: C.cyan   },
    { key: 'university', label: 'Universities', icon: 'account_balance',  color: C.purple },
    { key: 'restaurant', label: 'Restaurants',  icon: 'restaurant',       color: C.amber  },
    { key: 'hospital',   label: 'Hospitals',    icon: 'local_hospital',   color: C.pink   },
    { key: 'shop',       label: 'Shops',        icon: 'storefront',       color: C.teal   },
  ]
  const maxVal = Math.max(...places.map(p => nearbyPlaces[p.key] ?? 0), 1)

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      className="rounded-2xl p-5 h-full"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.blue + '20' }}>
            <span className="material-symbols-outlined text-[15px]" style={{ color: C.blue }}>location_on</span>
          </div>
          <h3 className="font-bold text-white text-[13px]">Nearby Area (1km)</h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)' }}>Overpass API</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {places.map(p => {
          const val = nearbyPlaces[p.key] ?? 0
          const pct = (val / maxVal) * 100
          return (
            <div key={p.key} className="flex flex-col items-center p-3 rounded-xl transition-colors"
              style={{ background: p.color + '0d', border: `1px solid ${p.color}20` }}
              onMouseEnter={e => e.currentTarget.style.background = p.color + '18'}
              onMouseLeave={e => e.currentTarget.style.background = p.color + '0d'}>
              <span className="material-symbols-outlined text-[20px] mb-1" style={{ color: p.color }}>{p.icon}</span>
              <span className="font-display font-black text-[22px] text-white leading-none">{val}</span>
              <span className="text-[9px] mt-1 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.label}</span>
              <div className="w-full mt-2 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: p.color }} />
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Recommendation Cards ──────────────────────────────────
function RecommendationCards({ rec, logId, shopId }) {
  const updateStatus = useUpdateRecommendationStatus()
  if (!rec?.recommendations?.length) return null

  const STATUS_CFG = {
    pending:   { label: 'Pending',   color: 'rgba(255,255,255,0.4)',  bg: 'rgba(255,255,255,0.06)',  border: 'rgba(255,255,255,0.1)'  },
    displayed: { label: 'Displayed', color: C.cyan,                   bg: C.cyan   + '15',           border: C.cyan   + '30'          },
    acted:     { label: 'Done ✓',    color: C.green,                  bg: C.green  + '15',           border: C.green  + '30'          },
    dismissed: { label: 'Dismissed', color: C.pink,                   bg: C.pink   + '10',           border: C.pink   + '25'          },
  }

  const RANK_COLORS = [C.amber, C.blue, C.teal]

  const handleStatus = (productId, status) =>
    updateStatus.mutate({ logId, productId, status, shopId })

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.purple + '25' }}>
            <span className="material-symbols-outlined text-[15px]" style={{ color: C.purple }}>auto_awesome</span>
          </div>
          <h3 className="font-bold text-white text-[13px]">AI Recommendations</h3>
        </div>
        {rec.confidenceScore && (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
            style={{ color: C.green, background: C.green + '15', border: `1px solid ${C.green}30` }}>
            {rec.confidenceScore}% confidence
          </span>
        )}
      </div>

      <div className="space-y-3">
        {rec.recommendations.map((r, i) => {
          const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending
          const pid = r.productId?._id || r.productId || r.productName
          const rankColor = RANK_COLORS[i] || C.blue
          return (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
              className="p-4 rounded-xl transition-colors"
              style={{ background: rankColor + '08', border: `1px solid ${rankColor}20` }}
              onMouseEnter={e => e.currentTarget.style.background = rankColor + '12'}
              onMouseLeave={e => e.currentTarget.style.background = rankColor + '08'}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-[15px]"
                    style={{ background: rankColor + '25', color: rankColor, border: `1px solid ${rankColor}30` }}>{i + 1}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white text-[13px] truncate">{r.productName}</p>
                    <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'rgba(255,255,255,0.45)' }}>{r.reason}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ color: C.green, background: C.green + '15', border: `1px solid ${C.green}30` }}>{r.expectedUplift}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                    </div>
                  </div>
                </div>
                {r.status === 'pending' && (
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button onClick={() => handleStatus(pid, 'displayed')} disabled={updateStatus.isPending}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors whitespace-nowrap"
                      style={{ color: C.cyan, background: C.cyan + '15', border: `1px solid ${C.cyan}30` }}>
                      Displayed
                    </button>
                    <button onClick={() => handleStatus(pid, 'acted')} disabled={updateStatus.isPending}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors whitespace-nowrap"
                      style={{ color: C.green, background: C.green + '15', border: `1px solid ${C.green}30` }}>
                      Done ✓
                    </button>
                  </div>
                )}
                {r.status === 'displayed' && (
                  <button onClick={() => handleStatus(pid, 'acted')} disabled={updateStatus.isPending}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold flex-shrink-0 transition-colors"
                    style={{ color: C.green, background: C.green + '15', border: `1px solid ${C.green}30` }}>
                    Done ✓
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Shop Performance Scorecard — vertical bar chart ──────
function ShopScorecard({ shopId }) {
  const { data: statsData }    = useOrderStats(shopId)
  const { data: summaryData }  = useInventorySummary(shopId)
  const { data: lowStockData } = useLowStockProducts(shopId)
  const { data: customersData } = useCustomersByShop(shopId, { limit: 100 })
  const { data: recData }      = useLatestRecommendations(shopId)
  const navigate = useNavigate()

  const stats    = statsData?.data   || {}
  const summary  = summaryData?.data || {}
  const lowStock = lowStockData?.data || []
  const customers = customersData?.data?.customers || []
  const rec      = recData?.data

  // Same calculations
  const scores = {
    revenue:   stats.totalRevenue > 0 ? Math.min(stats.totalRevenue / 10000 * 30, 30) : 0,
    inventory: summary.inStockCount > 0 ? Math.min((summary.inStockCount / Math.max(summary.total, 1)) * 25, 25) : 0,
    customers: customers.length > 0 ? Math.min(customers.length / 20 * 20, 20) : 0,
    ai:        rec?.confidenceScore ? (rec.confidenceScore / 100) * 15 : 0,
    lowStock:  lowStock.length === 0 ? 10 : Math.max(10 - lowStock.length * 2, 0),
  }
  const healthScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0))
  const healthColor = healthScore >= 75 ? C.green : healthScore >= 50 ? C.amber : C.pink
  const healthLabel = healthScore >= 75 ? 'Excellent' : healthScore >= 50 ? 'Good' : 'Needs Attention'

  const segmentCounts = customers.reduce((acc, c) => { acc[c.segment] = (acc[c.segment] || 0) + 1; return acc }, {})
  const segmentData = [
    { label: 'VIP',      count: segmentCounts.vip      || 0, color: C.amber  },
    { label: 'Regular',  count: segmentCounts.regular  || 0, color: C.teal   },
    { label: 'Active',   count: segmentCounts.active   || 0, color: C.green  },
    { label: 'New',      count: segmentCounts.new      || 0, color: C.blue   },
    { label: 'Inactive', count: segmentCounts.inactive || 0, color: '#6b7280'},
  ].filter(s => s.count > 0)
  const totalCustomers = segmentData.reduce((a, s) => a + s.count, 0) || 1

  // Bar chart data — each bar = one score factor
  const bars = [
    { label: 'Revenue',   val: Math.round(scores.revenue),   max: 30, color: C.cyan,   colorDark: C.blue   },
    { label: 'Inventory', val: Math.round(scores.inventory), max: 25, color: C.cyan,   colorDark: C.blue   },
    { label: 'Customers', val: Math.round(scores.customers), max: 20, color: '#00cfff', colorDark: C.blue  },
    { label: 'AI',        val: Math.round(scores.ai),        max: 15, color: C.cyan,   colorDark: C.blue   },
    { label: 'Stock',     val: Math.round(scores.lowStock),  max: 10, color: '#00e5ff', colorDark: C.blue  },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.blue + '20' }}>
          <span className="material-symbols-outlined text-[15px]" style={{ color: C.blue }}>insights</span>
        </div>
        <h3 className="font-bold text-white text-[13px]">Shop Performance</h3>
        <div className="ml-auto flex items-center gap-2">
          <span className="font-display font-black text-[22px]" style={{ color: healthColor }}>{healthScore}</span>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ color: healthColor, background: healthColor + '18', border: `1px solid ${healthColor}35` }}>
            {healthLabel}
          </span>
        </div>
      </div>

      {/* Vertical bar chart */}
      <div className="flex items-end justify-center gap-4 mb-2 px-2" style={{ height: '140px' }}>
        {bars.map((b, i) => {
          const pct = b.max > 0 ? (b.val / b.max) * 100 : 0
          const barH = Math.max(pct, 4)
          return (
            <div key={b.label} className="flex flex-col items-center gap-1.5" style={{ width: '36px' }}>
              {/* Value label on top */}
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.08 }}
                className="text-[10px] font-black" style={{ color: b.color }}>
                {b.val}
              </motion.span>
              {/* Bar track */}
              <div className="flex-1 flex items-end rounded-lg overflow-hidden relative w-full"
                style={{ background: 'rgba(255,255,255,0.04)', minHeight: '100px' }}>
                <motion.div
                  className="w-full rounded-lg relative overflow-hidden"
                  initial={{ height: 0 }}
                  animate={{ height: `${barH}%` }}
                  transition={{ duration: 0.9, delay: 0.2 + i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{ minHeight: '6px' }}>
                  <div className="absolute inset-0 rounded-lg"
                    style={{ background: `linear-gradient(180deg, ${b.color} 0%, ${b.color}bb 45%, ${b.colorDark} 100%)` }} />
                  <div className="absolute inset-0 rounded-lg opacity-30"
                    style={{ boxShadow: `0 0 10px ${b.color}` }} />
                </motion.div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bar labels */}
      <div className="flex justify-center gap-4 px-2 mb-5">
        {bars.map(b => (
          <div key={b.label} className="text-center" style={{ width: '36px' }}>
            <p className="text-[8px] font-semibold uppercase tracking-wider truncate"
              style={{ color: 'rgba(255,255,255,0.35)' }}>{b.label}</p>
          </div>
        ))}
      </div>

      {/* Customer segments */}
      {segmentData.length > 0 && (
        <div className="mb-4">
          <p className="text-[9px] font-bold uppercase tracking-wider mb-2"
            style={{ color: 'rgba(255,255,255,0.35)' }}>Customer Segments</p>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
            {segmentData.map(s => (
              <motion.div key={s.label}
                initial={{ width: 0 }} animate={{ width: `${(s.count / totalCustomers) * 100}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="h-full rounded-full" style={{ background: s.color }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {segmentData.map(s => (
              <div key={s.label} className="flex items-center gap-1 text-[9px]">
                <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
                <span className="font-bold" style={{ color: s.color }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="mb-3 p-3 rounded-xl flex items-center gap-2.5 cursor-pointer"
          style={{ background: C.amber + '0d', border: `1px solid ${C.amber}25` }}
          onClick={() => navigate(`/dashboard/shops/${shopId}/inventory`)}>
          <span className="material-symbols-outlined text-[15px]" style={{ color: C.amber }}>warning</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-white">{lowStock.length} item{lowStock.length > 1 ? 's' : ''} running low</p>
            <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{lowStock.map(p => p.name).join(', ')}</p>
          </div>
          <span className="text-[10px] font-bold shrink-0" style={{ color: C.amber }}>Restock →</span>
        </div>
      )}

      {/* AI Confidence */}
      {rec?.confidenceScore && (
        <div className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: C.purple + '0d', border: `1px solid ${C.purple}20` }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: C.purple + '20' }}>
            <span className="material-symbols-outlined text-[13px]" style={{ color: C.purple }}>psychology</span>
          </div>
          <p className="text-[11px] font-semibold text-white flex-1">AI Confidence</p>
          <div className="flex items-center gap-2">
            <div className="w-28 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div className="h-full rounded-full"
                initial={{ width: 0 }} animate={{ width: `${rec.confidenceScore}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ background: `linear-gradient(90deg, ${C.purple}, ${C.violet})` }} />
            </div>
            <span className="font-black text-[13px]" style={{ color: C.purple }}>{rec.confidenceScore}%</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}


// ── Shop Info Panel — always visible at bottom ───────────
function ShopInfoPanel({ shop, aiActive, aiUsedToday, aiLimit }) {
  const BIZ_ICONS = {
    grocery: 'local_grocery_store', clothing: 'checkroom', pharmacy: 'local_pharmacy',
    restaurant: 'restaurant', electronics: 'devices', other: 'storefront',
  }
  const BIZ_COLORS = {
    grocery: C.green, clothing: C.purple, pharmacy: C.teal,
    restaurant: C.amber, electronics: C.blue, other: '#94a3b8',
  }
  const bizColor = BIZ_COLORS[shop.businessType] || '#94a3b8'
  const bizIcon  = BIZ_ICONS[shop.businessType]  || 'storefront'

  const lat = shop.location?.coordinates?.[1]
  const lng = shop.location?.coordinates?.[0]
  const mapsUrl = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="mt-6 rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Header bar */}
      <div className="px-6 py-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: bizColor + '08' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: bizColor + '20', border: `1px solid ${bizColor}30` }}>
          <span className="material-symbols-outlined text-[18px]" style={{ color: bizColor }}>{bizIcon}</span>
        </div>
        <div>
          <h3 className="font-bold text-white text-[14px]">Shop Information</h3>
          <p className="text-[10px] capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>{shop.businessType} · {shop.plan || 'free'} plan</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {shop.whatsapp?.connected && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg"
              style={{ color: C.green, background: C.green + '15', border: `1px solid ${C.green}30` }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.green }} />
              WhatsApp Live
            </span>
          )}
          {aiActive && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg"
              style={{ color: C.blue, background: C.blue + '15', border: `1px solid ${C.blue}30` }}>
              <span className="material-symbols-outlined text-[11px]">psychology</span>
              AI Running
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Column 1 — Identity */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-3"
              style={{ color: 'rgba(255,255,255,0.3)' }}>Identity</p>
            <div className="space-y-3">
              {[
                { label: 'Shop Name',     value: shop.name,                icon: 'storefront',   color: bizColor  },
                { label: 'Business Type', value: shop.businessType,        icon: bizIcon,         color: bizColor, cap: true },
                { label: 'Plan',          value: shop.plan || 'Free',      icon: 'workspace_premium', color: C.amber, cap: true },
                { label: 'Shop ID',       value: '#' + (shop._id?.slice(-8).toUpperCase() || '—'), icon: 'tag', color: C.cyan, mono: true },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: row.color + '18' }}>
                    <span className="material-symbols-outlined text-[13px]" style={{ color: row.color }}>{row.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>{row.label}</p>
                    <p className={`text-[12px] font-semibold text-white truncate ${row.mono ? 'font-mono' : ''} ${row.cap ? 'capitalize' : ''}`}>{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2 — Location & Timeline */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-3"
              style={{ color: 'rgba(255,255,255,0.3)' }}>Location & Timeline</p>
            <div className="space-y-3">
              {[
                { label: 'Latitude',  value: lat ? lat.toFixed(6) : '—', icon: 'my_location',  color: C.blue,  mono: true },
                { label: 'Longitude', value: lng ? lng.toFixed(6) : '—', icon: 'explore',      color: C.teal,  mono: true },
                { label: 'Registered', value: new Date(shop.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' }), icon: 'calendar_today', color: C.purple },
                { label: 'Last Updated', value: new Date(shop.updatedAt || shop.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' }), icon: 'update', color: C.violet },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: row.color + '18' }}>
                    <span className="material-symbols-outlined text-[13px]" style={{ color: row.color }}>{row.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>{row.label}</p>
                    <p className={`text-[12px] font-semibold text-white truncate ${row.mono ? 'font-mono' : ''}`}>{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3 — Integrations + Map link */}
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-3"
              style={{ color: 'rgba(255,255,255,0.3)' }}>Integrations & Settings</p>
            <div className="space-y-3">
              {/* WhatsApp */}
              <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: (shop.whatsapp?.connected ? C.green : '#6b7280') + '18' }}>
                    <span className="material-symbols-outlined text-[13px]"
                      style={{ color: shop.whatsapp?.connected ? C.green : '#6b7280' }}>forum</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>WhatsApp</p>
                    <p className="text-[12px] font-semibold" style={{ color: shop.whatsapp?.connected ? C.green : '#6b7280' }}>
                      {shop.whatsapp?.connected ? 'Connected' : 'Not Connected'}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full" style={{ background: shop.whatsapp?.connected ? C.green : '#6b7280' }} />
                </div>
              </div>

              {/* AI Agent */}
              <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: (aiActive ? C.blue : '#6b7280') + '18' }}>
                    <span className="material-symbols-outlined text-[13px]"
                      style={{ color: aiActive ? C.blue : '#6b7280' }}>psychology</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>AI Agent</p>
                    <p className="text-[12px] font-semibold" style={{ color: aiActive ? C.blue : '#6b7280' }}>
                      {aiActive
                        ? `Running · ${aiUsedToday} call${aiUsedToday !== 1 ? 's' : ''} today`
                        : 'No AI calls yet today'}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full" style={{ background: aiActive ? C.blue : '#6b7280' }} />
                </div>
              </div>

              {/* Map link */}
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{ background: C.teal + '0d', border: `1px solid ${C.teal}25`, textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.teal + '18'}
                  onMouseLeave={e => e.currentTarget.style.background = C.teal + '0d'}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: C.teal + '25' }}>
                    <span className="material-symbols-outlined text-[13px]" style={{ color: C.teal }}>map</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Location</p>
                    <p className="text-[12px] font-semibold" style={{ color: C.teal }}>View on Google Maps ↗</p>
                  </div>
                </a>
              )}

              {/* AI daily usage bar */}
              {aiLimit > 0 && (
                <div className="p-3 rounded-xl" style={{ background: C.blue + '0d', border: `1px solid ${C.blue}20` }}>
                  <div className="flex justify-between text-[9px] mb-1.5">
                    <span className="font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Today's AI Usage</span>
                    <span className="font-bold" style={{ color: C.blue }}>{aiUsedToday} / {aiLimit}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min((aiUsedToday / aiLimit) * 100, 100)}%`,
                        background: aiUsedToday / aiLimit > 0.8
                          ? `linear-gradient(90deg, ${C.amber}, ${C.pink})`
                          : `linear-gradient(90deg, ${C.blue}, ${C.purple})`
                      }} />
                  </div>
                  <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {aiLimit - aiUsedToday} calls remaining · resets at midnight
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function ShopDetail() {
  const { shopId }  = useParams()
  const navigate    = useNavigate()
  const setActiveShop = useAuthStore((s) => s.setActiveShop)

  const { data: shopData, isLoading: shopLoading } = useShopById(shopId)
  const { data: recData,  isLoading: recLoading  } = useLatestRecommendations(shopId)
  const { data: aiLimitData } = useAiLimit(shopId)
  const generateRec = useGenerateRecommendations()

  const shop        = shopData?.data
  const rec         = recData?.data
  const aiLimitInfo = aiLimitData?.data || {}
  const aiUsedToday = aiLimitInfo.usedToday ?? 0
  const aiLimit     = aiLimitInfo.limit     ?? 50
  // AI is "active" if it has been used today OR ever has logs
  const aiActive    = aiUsedToday > 0

  if (shopLoading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="rounded-2xl h-32 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
    </div>
  )

  if (!shop) return (
    <div className="rounded-2xl p-16 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <span className="material-symbols-outlined text-[48px] block mb-3" style={{ color: 'rgba(255,255,255,0.1)' }}>store_mall_directory</span>
      <p className="text-white font-bold text-[16px]">Shop not found</p>
      <button onClick={() => navigate('/dashboard/shops')} className="mt-4 text-[12px] transition-colors" style={{ color: C.cyan }}>
        ← Back to My Shops
      </button>
    </div>
  )

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard/shops')}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}>
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h2 className="font-display text-[26px] font-black text-white tracking-tight">{shop.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[12px] capitalize" style={{ color: 'rgba(255,255,255,0.45)' }}>{shop.businessType}</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                style={{ color: C.amber, border: `1px solid ${C.amber}30` }}>{shop.plan || 'free'}</span>
              {shop.whatsapp?.connected && (
                <span className="flex items-center gap-1 text-[10px]" style={{ color: C.green }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.green }} />WA Live
                </span>
              )}            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveShop(shop)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-medium transition-all"
            style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = C.cyan + '40' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}>
            <span className="material-symbols-outlined text-[15px]">check_circle</span>Set as Active
          </button>
          <button onClick={() => navigate(`/dashboard/shops/${shopId}/inventory`)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-medium transition-all"
            style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = C.blue + '40' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}>
            <span className="material-symbols-outlined text-[15px]">inventory_2</span>Manage Inventory
          </button>
          <button onClick={() => generateRec.mutate(shopId)} disabled={generateRec.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-[12px] text-white transition-all active:scale-95 disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, boxShadow: `0 0 20px ${C.blue}35` }}>
            <span className={`material-symbols-outlined text-[15px] ${generateRec.isPending ? 'animate-spin' : ''}`}>
              {generateRec.isPending ? 'autorenew' : 'auto_awesome'}
            </span>
            {generateRec.isPending ? 'Analyzing...' : 'Get AI Recommendations'}
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {generateRec.isError && (
        <div className="mb-4 p-3 rounded-xl flex items-center gap-2 text-[12px]"
          style={{ background: C.pink + '10', border: `1px solid ${C.pink}25`, color: C.pink }}>
          <span className="material-symbols-outlined text-[16px]">error</span>
          {generateRec.error?.response?.data?.error || generateRec.error?.message || 'Failed to generate recommendations'}
          {generateRec.error?.response?.data?.data && (
            <button onClick={() => navigate(`/dashboard/shops/${shopId}/inventory`)}
              className="ml-auto text-[11px] font-bold" style={{ color: C.cyan }}>
              → Update inventory
            </button>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {!recLoading && !rec && !generateRec.isPending && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-2xl p-12 text-center mb-6"
          style={{ background: `linear-gradient(135deg, ${C.blue}08, ${C.purple}08)`, border: `1px solid ${C.blue}20` }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: `linear-gradient(135deg, ${C.blue}25, ${C.purple}25)`, border: `1px solid ${C.blue}30` }}>
            <span className="material-symbols-outlined text-[32px]" style={{ color: C.cyan }}>auto_awesome</span>
          </div>
          <p className="text-white font-bold text-[17px] mb-1">No recommendations yet</p>
          <p className="text-[13px] mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Analyze weather, nearby places, and your inventory to get AI-powered product recommendations.
          </p>
          <button onClick={() => generateRec.mutate(shopId)}
            className="px-6 py-2.5 rounded-xl font-bold text-[12px] text-white transition-all active:scale-95"
            style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, boxShadow: `0 0 20px ${C.blue}35` }}>
            Analyze My Shop Now
          </button>
        </motion.div>
      )}

      {/* ── Loading skeleton ── */}
      {(recLoading || generateRec.isPending) && (
        <div className="space-y-4 mb-6">
          {[1,2].map(i => <div key={i} className="rounded-2xl h-40 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
        </div>
      )}

      {/* ── Content ── */}
      {rec && !generateRec.isPending && (
        <>
          {/* Insight banner */}
          {rec.insight && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-4 rounded-xl flex items-start gap-3"
              style={{ background: `linear-gradient(135deg, ${C.blue}0d, ${C.purple}0d)`, border: `1px solid ${C.blue}25` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: C.cyan + '20' }}>
                <span className="material-symbols-outlined text-[16px]" style={{ color: C.cyan }}>lightbulb</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: C.cyan }}>Today's Business Insight</p>
                <p className="text-[13px] text-white font-medium">{rec.insight}</p>
              </div>
              {rec.dominantCustomers?.length > 0 && (
                <div className="flex gap-1.5 flex-wrap justify-end flex-shrink-0">
                  {rec.dominantCustomers.map(c => (
                    <span key={c} className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>{c}</span>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Weather + Nearby */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <WeatherWidget rec={rec} />
            <NearbyWidget nearbyPlaces={rec.nearbyPlaces} />
          </div>

          {/* Recommendations + Scorecard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <RecommendationCards rec={rec} logId={rec._id || recData?.data?._id} shopId={shopId} />
            <ShopScorecard shopId={shopId} />
          </div>

          <p className="text-[10px] text-right mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Last analyzed: {rec.generatedAt ? new Date(rec.generatedAt).toLocaleString() : '—'}
          </p>
        </>
      )}

      {/* ── Shop Info — always visible ── */}
      <ShopInfoPanel shop={shop} aiActive={aiActive} aiUsedToday={aiUsedToday} aiLimit={aiLimit} />
    </div>
  )
}
