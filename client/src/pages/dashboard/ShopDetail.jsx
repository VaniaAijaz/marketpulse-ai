import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useShopById } from '../../features/shops/shopHooks'
import {
  useLatestRecommendations,
  useGenerateRecommendations,
  useUpdateRecommendationStatus,
} from '../../features/ai/aiHooks'
import { useOrderStats } from '../../features/orders/orderHooks'
import { useInventorySummary, useLowStockProducts } from '../../features/products/productHooks'
import { useCustomersByShop } from '../../features/customers/customerHooks'
import useAuthStore from '../../store/useAuthStore'

/* ─── Design tokens ─────────────────────────────────────── */
const F    = "'Inter','Segoe UI',system-ui,sans-serif"
const CARD = '#000000'
const BG   = '#2C2C2C'

const C = {
  blue:    '#3b82f6',
  violet:  '#8b5cf6',
  emerald: '#10b981',
  cyan:    '#06b6d4',
  rose:    '#f43f5e',
  amber:   '#f59e0b',
  slate:   '#6b7280',
  indigo:  '#6366f1',
}

/* ══════════════════════════════════════════════════════════
   WEATHER WIDGET — shadcn ultra pro max
══════════════════════════════════════════════════════════ */
function WeatherWidget({ rec }) {
  if (!rec?.weather) return null
  const { weather, weatherContext, location } = rec

  const CONDITIONS = {
    clear:        { icon: 'wb_sunny',          accent: '#f59e0b', label: 'Clear Sky'     },
    clouds:       { icon: 'cloud',             accent: '#94a3b8', label: 'Cloudy'        },
    rain:         { icon: 'rainy',             accent: '#3b82f6', label: 'Rainy'         },
    drizzle:      { icon: 'grain',             accent: '#06b6d4', label: 'Drizzle'       },
    thunderstorm: { icon: 'thunderstorm',      accent: '#8b5cf6', label: 'Thunderstorm'  },
    snow:         { icon: 'ac_unit',           accent: '#bae6fd', label: 'Snow'          },
    mist:         { icon: 'foggy',             accent: '#94a3b8', label: 'Mist'          },
    haze:         { icon: 'foggy',             accent: '#f59e0b', label: 'Hazy'          },
    default:      { icon: 'partly_cloudy_day', accent: '#3b82f6', label: 'Partly Cloudy' },
  }

  const key  = weather.condition?.toLowerCase() || 'default'
  const cond = CONDITIONS[key] || CONDITIONS.default

  /* temp scale — muted, single accent per range */
  const tempMeta =
    weather.temp >= 42 ? { color: '#ef4444', label: 'Extreme Heat', tag: 'danger'  } :
    weather.temp >= 36 ? { color: '#f97316', label: 'Very Hot',     tag: 'hot'     } :
    weather.temp >= 30 ? { color: '#f59e0b', label: 'Hot',          tag: 'warm'    } :
    weather.temp >= 22 ? { color: '#10b981', label: 'Warm',         tag: 'good'    } :
    weather.temp >= 14 ? { color: '#06b6d4', label: 'Cool',         tag: 'cool'    } :
                         { color: '#93c5fd', label: 'Cold',          tag: 'cold'    }

  const heatPct = Math.min(Math.max((weather.temp / 50) * 100, 2), 100)

  /* 5-step tick marks */
  const ticks = [0, 10, 20, 30, 40, 50]

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: CARD, border: '1px solid rgba(255,255,255,0.09)', borderRadius: '6px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── header ── */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)' }}>{cond.icon}</span>
          <span style={{ fontFamily: F, fontWeight: 600, fontSize: '13px', color: '#fff' }}>Weather</span>
        </div>
        {location?.city && (
          <span style={{ fontFamily: F, fontSize: '10px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
            📍 {location.city}
          </span>
        )}
      </div>

      <div style={{ padding: '20px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* ── hero row: icon  |  temp + meta ── */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: '16px' }}>

          {/* condition tile */}
          <div style={{
            width: '80px', flexShrink: 0, borderRadius: '6px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
            padding: '14px 0',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: cond.accent }}>{cond.icon}</span>
            <span style={{ fontFamily: F, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 1.3, padding: '0 6px' }}>{cond.label}</span>
          </div>

          {/* temperature */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

            {/* big number */}
            <div style={{ display: 'flex', alignItems: 'flex-start', lineHeight: 1 }}>
              <span style={{
                fontFamily: F, fontWeight: 800, letterSpacing: '-3px',
                fontSize: '64px', lineHeight: '1',
                color: tempMeta.color,
              }}>{weather.temp}</span>
              <div style={{ marginTop: '8px', marginLeft: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                <span style={{ fontFamily: F, fontWeight: 700, fontSize: '22px', color: tempMeta.color, lineHeight: 1 }}>°</span>
                <span style={{ fontFamily: F, fontWeight: 500, fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1 }}>C</span>
              </div>
            </div>

            {/* condition description */}
            <p style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '4px', textTransform: 'capitalize', fontWeight: 400 }}>
              {weather.description || cond.label}
            </p>

            {/* feel tag — minimal badge */}
            <div style={{ marginTop: '8px' }}>
              <span style={{
                display: 'inline-block',
                fontFamily: F, fontSize: '10px', fontWeight: 600,
                color: tempMeta.color,
                background: tempMeta.color + '14',
                border: `1px solid ${tempMeta.color}28`,
                padding: '2px 9px', borderRadius: '4px',
                letterSpacing: '0.03em',
              }}>{tempMeta.label}</span>
            </div>
          </div>
        </div>

        {/* ── thermometer scale ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontFamily: F, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)' }}>Temperature Scale</span>
            <span style={{ fontFamily: F, fontSize: '10px', fontWeight: 600, color: tempMeta.color }}>{weather.temp}°C</span>
          </div>

          {/* track */}
          <div style={{ position: 'relative', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            {/* cold→hot gradient ghost */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#93c5fd 0%,#06b6d4 20%,#10b981 40%,#f59e0b 65%,#f97316 80%,#ef4444 100%)', opacity: 0.15, borderRadius: '3px' }} />
            <motion.div
              initial={{ width: 0 }} animate={{ width: `${heatPct}%` }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              style={{ height: '100%', borderRadius: '3px', background: tempMeta.color, opacity: 0.85 }}
            />
          </div>

          {/* tick labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            {ticks.map(t => (
              <span key={t} style={{ fontFamily: F, fontSize: '8px', color: 'rgba(255,255,255,0.18)' }}>{t}°</span>
            ))}
          </div>
        </div>

        {/* ── humidity + wind ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Humidity', value: weather.humidity   != null ? `${weather.humidity}%`          : '—', icon: 'water_drop' },
            { label: 'Wind',     value: weather.windSpeed  != null ? `${weather.windSpeed} km/h`      : '—', icon: 'air'        },
          ].map(s => (
            <div key={s.label} style={{
              padding: '10px 12px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'rgba(255,255,255,0.3)' }}>{s.icon}</span>
              <div>
                <p style={{ fontFamily: F, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.28)' }}>{s.label}</p>
                <p style={{ fontFamily: F, fontWeight: 600, fontSize: '13px', color: '#fff' }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── AI business tip ── */}
        {weatherContext?.suggestion && (
          <div style={{
            padding: '10px 13px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'flex-start', gap: '9px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', flexShrink: 0, marginTop: '1px' }}>tips_and_updates</span>
            <p style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>{weatherContext.suggestion}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════
   NEARBY WIDGET — shadcn stat-card grid
══════════════════════════════════════════════════════════ */
function NearbyWidget({ nearbyPlaces }) {
  if (!nearbyPlaces) return null

  const places = [
    { key: 'office',     label: 'Offices',      icon: 'business',        accent: '#3b82f6' },
    { key: 'school',     label: 'Schools',      icon: 'school',          accent: '#8b5cf6' },
    { key: 'university', label: 'Universities', icon: 'account_balance', accent: '#6366f1' },
    { key: 'restaurant', label: 'Restaurants',  icon: 'restaurant',      accent: '#f59e0b' },
    { key: 'hospital',   label: 'Hospitals',    icon: 'local_hospital',  accent: '#f43f5e' },
    { key: 'shop',       label: 'Shops',        icon: 'storefront',      accent: '#10b981' },
  ]

  const total = places.reduce((s, p) => s + (nearbyPlaces[p.key] ?? 0), 0)

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      style={{ background: CARD, border: '1px solid rgba(255,255,255,0.09)', borderRadius: '6px', height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)' }}>location_on</span>
          <span style={{ fontFamily: F, fontWeight: 600, fontSize: '13px', color: '#fff' }}>Nearby Area</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{total} places total</span>
          <span style={{ fontFamily: F, fontSize: '10px', color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px' }}>1 km</span>
        </div>
      </div>

      {/* 3×2 stat-card grid */}
      <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', flex: 1 }}>
        {places.map((p, i) => {
          const val = nearbyPlaces[p.key] ?? 0
          return (
            <motion.div key={p.key}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
              style={{
                padding: '12px 14px', borderRadius: '6px',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid rgba(255,255,255,0.07)`,
                display: 'flex', flexDirection: 'column', gap: '8px',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onHoverStart={() => {}}
              whileHover={{ background: 'rgba(255,255,255,0.055)', borderColor: p.accent + '30' }}>

              {/* icon + label row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '5px', background: p.accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px', color: p.accent }}>{p.icon}</span>
                </div>
                <span style={{ fontFamily: F, fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
              </div>

              {/* big number */}
              <span style={{
                fontFamily: F, fontWeight: 700, fontSize: '26px', lineHeight: 1,
                color: val > 0 ? '#fff' : 'rgba(255,255,255,0.18)',
              }}>{val}</span>

              {/* thin accent underline */}
              <div style={{ height: '2px', borderRadius: '1px', background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: val > 0 ? '100%' : '0%' }}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.06 }}
                  style={{ height: '100%', borderRadius: '1px', background: p.accent, opacity: val > 0 ? 0.7 : 0 }} />
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════
   RECOMMENDATION CARDS — left accent border style
══════════════════════════════════════════════════════════ */
function RecommendationCards({ rec, logId, shopId }) {
  const updateStatus = useUpdateRecommendationStatus()
  if (!rec?.recommendations?.length) return null

  /* per-rank accent — subtle, not loud */
  const RANK_ACCENT = ['#f59e0b', '#3b82f6', '#10b981']

  const STATUS_CFG = {
    pending:   { label: 'Pending',   color: 'rgba(255,255,255,0.3)',  bg: 'rgba(255,255,255,0.06)'  },
    displayed: { label: 'Displayed', color: '#3b82f6',                bg: 'rgba(59,130,246,0.12)'   },
    acted:     { label: 'Done',      color: '#10b981',                bg: 'rgba(16,185,129,0.12)'   },
    dismissed: { label: 'Dismissed', color: '#f43f5e',                bg: 'rgba(244,63,94,0.10)'    },
  }

  const handleStatus = (productId, status) =>
    updateStatus.mutate({ logId, productId, status, shopId })

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      style={{ background: CARD, border: '1px solid rgba(255,255,255,0.09)', borderRadius: '6px' }}>

      {/* header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)' }}>auto_awesome</span>
          <span style={{ fontFamily: F, fontWeight: 600, fontSize: '13px', color: '#fff' }}>AI Recommendations</span>
        </div>
        {rec.confidenceScore && (
          <span style={{ fontFamily: F, fontSize: '10px', fontWeight: 500, color: '#10b981', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', padding: '2px 8px', borderRadius: '4px' }}>
            {rec.confidenceScore}% confidence
          </span>
        )}
      </div>

      {/* cards */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rec.recommendations.map((r, i) => {
          const accent = RANK_ACCENT[i] || '#3b82f6'
          const cfg    = STATUS_CFG[r.status] || STATUS_CFG.pending
          const pid    = r.productId?._id || r.productId || r.productName
          return (
            <motion.div key={i}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 + i * 0.08 }}
              style={{
                display: 'flex', gap: '0',
                borderRadius: '6px', overflow: 'hidden',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                transition: 'background 0.15s',
              }}
              onHoverStart={() => {}}
              whileHover={{ background: 'rgba(255,255,255,0.04)' }}>

              {/* left accent bar */}
              <div style={{ width: '3px', background: accent, flexShrink: 0 }} />

              {/* content */}
              <div style={{ padding: '12px 14px', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* rank + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                      <span style={{ fontFamily: F, fontSize: '10px', fontWeight: 700, color: accent }}>#{i + 1}</span>
                      <p style={{ fontFamily: F, fontWeight: 600, fontSize: '13px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.productName}
                      </p>
                    </div>
                    {/* reason */}
                    <p style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: '8px' }}>{r.reason}</p>

                    {/* tags row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {/* uplift */}
                      {r.expectedUplift && (
                        <span style={{ fontFamily: F, fontSize: '10px', fontWeight: 500, color: accent, background: accent + '18', border: `1px solid ${accent}30`, padding: '1px 8px', borderRadius: '3px' }}>
                          {r.expectedUplift}
                        </span>
                      )}
                      {/* status */}
                      <span style={{ fontFamily: F, fontSize: '10px', fontWeight: 500, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30`, padding: '1px 8px', borderRadius: '3px' }}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* action buttons */}
                  {(r.status === 'pending' || r.status === 'displayed') && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                      {r.status === 'pending' && (
                        <button onClick={() => handleStatus(pid, 'displayed')} disabled={updateStatus.isPending}
                          style={{ padding: '4px 10px', borderRadius: '4px', fontFamily: F, fontSize: '10px', fontWeight: 500, cursor: 'pointer', color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap', transition: 'color 0.12s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>
                          Displayed
                        </button>
                      )}
                      <button onClick={() => handleStatus(pid, 'acted')} disabled={updateStatus.isPending}
                        style={{ padding: '4px 10px', borderRadius: '4px', fontFamily: F, fontSize: '10px', fontWeight: 500, cursor: 'pointer', color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', whiteSpace: 'nowrap' }}>
                        Done ✓
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════
   SHOP PERFORMANCE SCORECARD — clean shadcn style
══════════════════════════════════════════════════════════ */
function ShopScorecard({ shopId }) {
  const { data: statsData }     = useOrderStats(shopId)
  const { data: summaryData }   = useInventorySummary(shopId)
  const { data: lowStockData }  = useLowStockProducts(shopId)
  const { data: customersData } = useCustomersByShop(shopId, { limit: 100 })
  const { data: recData }       = useLatestRecommendations(shopId)
  const navigate = useNavigate()

  const stats     = statsData?.data    || {}
  const summary   = summaryData?.data  || {}
  const lowStock  = lowStockData?.data || []
  const customers = customersData?.data?.customers || []
  const rec       = recData?.data

  const scores = {
    revenue:   stats.totalRevenue > 0 ? Math.min(stats.totalRevenue / 10000 * 30, 30) : 0,
    inventory: summary.inStockCount > 0 ? Math.min((summary.inStockCount / Math.max(summary.total, 1)) * 25, 25) : 0,
    customers: customers.length > 0 ? Math.min(customers.length / 20 * 20, 20) : 0,
    ai:        rec?.confidenceScore ? (rec.confidenceScore / 100) * 15 : 0,
    lowStock:  lowStock.length === 0 ? 10 : Math.max(10 - lowStock.length * 2, 0),
  }
  const healthScore = Math.round(Object.values(scores).reduce((a, b) => a + b, 0))
  const healthColor = healthScore >= 75 ? C.emerald : healthScore >= 50 ? C.amber : C.rose
  const healthLabel = healthScore >= 75 ? 'Excellent' : healthScore >= 50 ? 'Good' : 'Needs Work'

  /* single-colour accent for all bars — clean, not rainbow */
  const rows = [
    { label: 'Revenue',   value: `Rs.${(stats.totalRevenue || 0).toLocaleString()}`, pct: (scores.revenue   / 30)  * 100, icon: 'payments'   },
    { label: 'Inventory', value: `${summary.inStockCount || 0} / ${summary.total || 0} in stock`, pct: (scores.inventory / 25) * 100, icon: 'inventory_2' },
    { label: 'Customers', value: `${customers.length} total`,                        pct: (scores.customers / 20)  * 100, icon: 'group'       },
    { label: 'AI Score',  value: rec?.confidenceScore ? `${rec.confidenceScore}%` : 'No data', pct: (scores.ai / 15) * 100, icon: 'psychology'  },
    { label: 'Stock Health', value: lowStock.length === 0 ? 'All stocked' : `${lowStock.length} low`, pct: (scores.lowStock / 10) * 100, icon: 'verified'   },
  ]

  const segmentCounts = customers.reduce((acc, c) => { acc[c.segment] = (acc[c.segment] || 0) + 1; return acc }, {})
  const segments = [
    { label: 'VIP',      count: segmentCounts.vip      || 0 },
    { label: 'Regular',  count: segmentCounts.regular  || 0 },
    { label: 'Active',   count: segmentCounts.active   || 0 },
    { label: 'New',      count: segmentCounts.new      || 0 },
    { label: 'Inactive', count: segmentCounts.inactive || 0 },
  ].filter(s => s.count > 0)

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      style={{ background: CARD, border: '1px solid rgba(255,255,255,0.09)', borderRadius: '6px' }}>

      {/* ── header ── */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)' }}>insights</span>
          <span style={{ fontFamily: F, fontWeight: 600, fontSize: '13px', color: '#fff' }}>Shop Performance</span>
        </div>
        {/* score dial */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* ring */}
          <svg width="42" height="42" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="21" cy="21" r="16" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
            <motion.circle cx="21" cy="21" r="16" fill="none"
              stroke={healthColor} strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 16}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - healthScore / 100) }}
              transition={{ duration: 1.2, ease: 'easeOut' }} />
          </svg>
          <div>
            <p style={{ fontFamily: F, fontWeight: 800, fontSize: '20px', color: '#fff', lineHeight: 1 }}>{healthScore}</p>
            <p style={{ fontFamily: F, fontSize: '9px', fontWeight: 600, color: healthColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{healthLabel}</p>
          </div>
        </div>
      </div>

      {/* ── metric rows ── */}
      <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {rows.map((row, i) => (
          <motion.div key={row.label}
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
            style={{ padding: '10px 0', borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '7px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>{row.icon}</span>
                <span style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{row.label}</span>
              </div>
              <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{row.value}</span>
            </div>
            {/* thin progress bar — one neutral colour */}
            <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${Math.min(row.pct, 100)}%` }}
                transition={{ duration: 0.9, delay: 0.25 + i * 0.08, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: '2px', background: 'rgba(255,255,255,0.35)' }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── customer segments compact ── */}
      {segments.length > 0 && (
        <div style={{ padding: '10px 18px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontFamily: F, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', marginBottom: '8px' }}>Customer Mix</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {segments.map(s => (
              <span key={s.label} style={{
                fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.55)',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)',
                padding: '3px 9px', borderRadius: '4px',
              }}>
                {s.label} <span style={{ color: '#fff', fontWeight: 600 }}>{s.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── low stock alert ── */}
      {lowStock.length > 0 && (
        <div onClick={() => navigate(`/dashboard/shops/${shopId}/inventory`)}
          style={{ margin: '0 14px 14px', padding: '10px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: C.amber }}>warning</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: F, fontSize: '11px', color: '#fff' }}>{lowStock.length} item{lowStock.length > 1 ? 's' : ''} low on stock</p>
            <p style={{ fontFamily: F, fontSize: '10px', color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>{lowStock.map(p => p.name).join(', ')}</p>
          </div>
          <span style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>Restock →</span>
        </div>
      )}
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════
   SHOP INFO PANEL
══════════════════════════════════════════════════════════ */
function ShopInfoPanel({ shop, aiActive }) {
  const BIZ_ICONS = {
    grocery: 'local_grocery_store', clothing: 'checkroom', pharmacy: 'local_pharmacy',
    restaurant: 'restaurant', electronics: 'devices', other: 'storefront',
  }
  const BIZ_COLORS = {
    grocery: C.emerald, clothing: C.violet, pharmacy: C.cyan,
    restaurant: C.amber, electronics: C.blue, other: C.slate,
  }
  const bizColor = BIZ_COLORS[shop.businessType] || C.slate
  const bizIcon  = BIZ_ICONS[shop.businessType]  || 'storefront'
  const lat = shop.location?.coordinates?.[1]
  const lng = shop.location?.coordinates?.[0]
  const mapsUrl = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null

  const Row = ({ label, value, icon, color, mono, cap }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: '13px', color }}>{icon}</span>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontFamily: F, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)' }}>{label}</p>
        <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: mono ? 'monospace' : F, textTransform: cap ? 'capitalize' : 'none' }}>{value}</p>
      </div>
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      style={{ background: CARD, border: '1px solid rgba(255,255,255,0.09)', borderRadius: '6px', overflow: 'hidden', marginTop: '16px' }}>

      {/* header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: '12px',
        background: bizColor + '08',
      }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '6px', background: bizColor + '20', border: `1px solid ${bizColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '17px', color: bizColor }}>{bizIcon}</span>
        </div>
        <div>
          <p style={{ fontFamily: F, fontWeight: 600, fontSize: '13px', color: '#fff' }}>Shop Information</p>
          <p style={{ fontFamily: F, fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize' }}>{shop.businessType}</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {shop.whatsapp?.connected && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: F, fontSize: '10px', fontWeight: 600, color: C.emerald, background: C.emerald + '15', border: `1px solid ${C.emerald}30`, padding: '4px 10px', borderRadius: '4px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.emerald }} />
              WhatsApp Live
            </span>
          )}
          {aiActive && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: F, fontSize: '10px', fontWeight: 600, color: C.blue, background: C.blue + '15', border: `1px solid ${C.blue}30`, padding: '4px 10px', borderRadius: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>psychology</span>
              AI Running
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
        {/* Column 1 — Identity */}
        <div>
          <p style={{ fontFamily: F, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: '10px' }}>Identity</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Row label="Shop Name"     value={shop.name}                icon="storefront"         color={bizColor} />
            <Row label="Business Type" value={shop.businessType}        icon={bizIcon}             color={bizColor} cap />
            <Row label="Shop ID"       value={'#' + (shop._id?.slice(-8).toUpperCase() || '—')} icon="tag" color={C.cyan} mono />
          </div>
        </div>

        {/* Column 2 — Location & Timeline */}
        <div>
          <p style={{ fontFamily: F, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: '10px' }}>Location & Timeline</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Row label="Latitude"     value={lat ? lat.toFixed(6) : '—'}  icon="my_location"    color={C.blue}   mono />
            <Row label="Longitude"    value={lng ? lng.toFixed(6) : '—'}  icon="explore"        color={C.cyan}   mono />
            <Row label="Registered"   value={new Date(shop.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })} icon="calendar_today" color={C.violet} />
            <Row label="Last Updated" value={new Date(shop.updatedAt || shop.createdAt).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })} icon="update" color={C.indigo} />
          </div>
        </div>

        {/* Column 3 — Integrations */}
        <div>
          <p style={{ fontFamily: F, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginBottom: '10px' }}>Integrations</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

            {/* WhatsApp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: (shop.whatsapp?.connected ? C.emerald : C.slate) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px', color: shop.whatsapp?.connected ? C.emerald : C.slate }}>forum</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: F, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)' }}>WhatsApp</p>
                <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 500, color: shop.whatsapp?.connected ? C.emerald : C.slate }}>
                  {shop.whatsapp?.connected ? 'Connected' : 'Not Connected'}
                </p>
              </div>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: shop.whatsapp?.connected ? C.emerald : C.slate }} />
            </div>

            {/* AI Agent */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: (aiActive ? C.blue : C.slate) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px', color: aiActive ? C.blue : C.slate }}>psychology</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: F, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)' }}>AI Agent</p>
                <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 500, color: aiActive ? C.blue : C.slate }}>
                  {aiActive ? 'Running' : 'Not active'}
                </p>
              </div>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: aiActive ? C.blue : C.slate }} />
            </div>

            {/* Maps link */}
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '6px', background: C.cyan + '0d', border: `1px solid ${C.cyan}25`, textDecoration: 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = C.cyan + '18'}
                onMouseLeave={e => e.currentTarget.style.background = C.cyan + '0d'}>
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: C.cyan + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px', color: C.cyan }}>map</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: F, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)' }}>Location</p>
                  <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 500, color: C.cyan }}>View on Google Maps ↗</p>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function ShopDetail() {
  const { shopId }    = useParams()
  const navigate      = useNavigate()
  const setActiveShop = useAuthStore(s => s.setActiveShop)

  const { data: shopData, isLoading: shopLoading } = useShopById(shopId)
  const { data: recData,  isLoading: recLoading  } = useLatestRecommendations(shopId)
  const generateRec = useGenerateRecommendations()

  const shop     = shopData?.data
  const rec      = recData?.data
  const aiActive = !!rec // AI active if recommendations exist

  if (shopLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: '120px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease infinite' }} />
      ))}
    </div>
  )

  if (!shop) return (
    <div style={{ background: CARD, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '60px 20px', textAlign: 'center' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '44px', color: 'rgba(255,255,255,0.1)', display: 'block', marginBottom: '10px' }}>store_mall_directory</span>
      <p style={{ fontFamily: F, fontWeight: 600, fontSize: '15px', color: '#fff' }}>Shop not found</p>
      <button onClick={() => navigate('/dashboard/shops')} style={{ fontFamily: F, fontSize: '12px', color: C.cyan, background: 'none', border: 'none', cursor: 'pointer', marginTop: '12px' }}>← Back to Shops</button>
    </div>
  )

  /* ── ghost button style ── */
  const ghostBtn = {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '7px 14px', borderRadius: '6px', fontFamily: F, fontSize: '12px',
    fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
    color: 'rgba(255,255,255,0.6)',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
  }

  return (
    <div style={{ fontFamily: F }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/dashboard/shops')}
            style={{ width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          </button>
          <div>
            <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: '22px', color: '#fff', margin: 0 }}>{shop.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
              <span style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{shop.businessType}</span>
              {shop.whatsapp?.connected && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: F, fontSize: '10px', color: C.emerald }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: C.emerald }} />WA Live
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveShop(shop)} style={ghostBtn}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>Set Active
          </button>
          <button onClick={() => navigate(`/dashboard/shops/${shopId}/inventory`)} style={ghostBtn}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>inventory_2</span>Inventory
          </button>
          <button onClick={() => generateRec.mutate(shopId)} disabled={generateRec.isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '6px',
              fontFamily: F, fontSize: '12px', fontWeight: 600, cursor: generateRec.isPending ? 'not-allowed' : 'pointer',
              background: C.blue, color: '#fff', border: 'none', opacity: generateRec.isPending ? 0.65 : 1,
              boxShadow: `0 0 16px ${C.blue}40`, transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!generateRec.isPending) e.currentTarget.style.background = '#2563eb' }}
            onMouseLeave={e => { if (!generateRec.isPending) e.currentTarget.style.background = C.blue }}>
            <span className={`material-symbols-outlined`} style={{ fontSize: '14px', animation: generateRec.isPending ? 'spin 1s linear infinite' : 'none' }}>
              {generateRec.isPending ? 'autorenew' : 'auto_awesome'}
            </span>
            {generateRec.isPending ? 'Analyzing…' : 'Get AI Recommendations'}
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {generateRec.isError && (
        <div style={{ padding: '10px 14px', borderRadius: '6px', background: C.rose + '10', border: `1px solid ${C.rose}25`, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: C.rose }}>error</span>
          <span style={{ fontFamily: F, fontSize: '12px', color: C.rose, flex: 1 }}>
            {generateRec.error?.response?.data?.error || generateRec.error?.message || 'Failed to generate recommendations'}
          </span>
          {generateRec.error?.response?.data?.data && (
            <button onClick={() => navigate(`/dashboard/shops/${shopId}/inventory`)}
              style={{ fontFamily: F, fontSize: '11px', fontWeight: 600, color: C.cyan, background: 'none', border: 'none', cursor: 'pointer' }}>
              → Update inventory
            </button>
          )}
        </div>
      )}

      {/* ── Empty state ── */}
      {!recLoading && !rec && !generateRec.isPending && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: CARD, border: `1px solid ${C.blue}20`, borderRadius: '6px', padding: '48px 20px', textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '6px', background: C.blue + '20', border: `1px solid ${C.blue}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: C.cyan }}>auto_awesome</span>
          </div>
          <p style={{ fontFamily: F, fontWeight: 700, fontSize: '16px', color: '#fff', marginBottom: '6px' }}>No recommendations yet</p>
          <p style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.38)', marginBottom: '18px' }}>
            Analyze weather, nearby places, and your inventory to get AI-powered product recommendations.
          </p>
          <button onClick={() => generateRec.mutate(shopId)}
            style={{ padding: '9px 22px', borderRadius: '6px', fontFamily: F, fontSize: '12px', fontWeight: 600, color: '#fff', background: C.blue, border: 'none', cursor: 'pointer', boxShadow: `0 0 16px ${C.blue}40` }}>
            Analyze My Shop Now
          </button>
        </motion.div>
      )}

      {/* ── Loading skeleton ── */}
      {(recLoading || generateRec.isPending) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {[1, 2].map(i => (
            <div key={i} style={{ height: '140px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease infinite' }} />
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {rec && !generateRec.isPending && (
        <>
          {/* Insight banner */}
          {rec.insight && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '12px 16px', borderRadius: '6px', background: C.blue + '0d', border: `1px solid ${C.blue}22`, display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: C.cyan + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: C.cyan }}>lightbulb</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: F, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.cyan, marginBottom: '3px' }}>Today's Business Insight</p>
                <p style={{ fontFamily: F, fontSize: '13px', color: '#fff' }}>{rec.insight}</p>
              </div>
              {rec.dominantCustomers?.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
                  {rec.dominantCustomers.map(c => (
                    <span key={c} style={{ fontFamily: F, fontSize: '10px', color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{c}</span>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Weather + Nearby */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <WeatherWidget rec={rec} />
            <NearbyWidget nearbyPlaces={rec.nearbyPlaces} />
          </div>

          {/* Recommendations + Scorecard */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <RecommendationCards rec={rec} logId={rec._id || recData?.data?._id} shopId={shopId} />
            <ShopScorecard shopId={shopId} />
          </div>

          <p style={{ fontFamily: F, fontSize: '10px', color: 'rgba(255,255,255,0.22)', textAlign: 'right', marginTop: '8px' }}>
            Last analyzed: {rec.generatedAt ? new Date(rec.generatedAt).toLocaleString() : '—'}
          </p>
        </>
      )}

      {/* ── Shop Info — always visible ── */}
      <ShopInfoPanel shop={shop} aiActive={aiActive} />
    </div>
  )
}
