import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from 'recharts'
import {
  useDashboardSummary, useKPIMetrics, useAnalyticsInsights, useAnalyticsRange,
} from '../../features/analytics/analyticsHooks'
import { useOrderStats } from '../../features/orders/orderHooks'
import useAuthStore from '../../store/useAuthStore'

// ── Same shadcn-style palette ─────────────────────────────
const P = {
  card:    '#000000',
  border:  'rgba(255,255,255,0.08)',
  text:    '#ffffff',
  muted:   'rgba(255,255,255,0.5)',
  dim:     'rgba(255,255,255,0.25)',
  blue:    '#3b82f6',
  indigo:  '#6366f1',
  violet:  '#8b5cf6',
  emerald: '#10b981',
  slate:   '#94a3b8',
  rose:    '#f43f5e',
  amber:   '#f59e0b',
  cyan:    '#06b6d4',
}
const FONT = "'Inter','Segoe UI',system-ui,sans-serif"
const R    = '6px'
const R2   = '10px'

// ── Period config ─────────────────────────────────────────
const PERIODS = [
  { id: '7d',  label: '7 Days',  days: 7  },
  { id: '30d', label: '30 Days', days: 30 },
  { id: '90d', label: '90 Days', days: 90 },
]

function getDateRange(days) {
  const end   = new Date()
  const start = new Date(Date.now() - days * 86400000)
  return {
    start: start.toISOString().split('T')[0],
    end:   end.toISOString().split('T')[0],
  }
}

// ── Custom tooltip ────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0a0a0a', border: `1px solid ${P.border}`, borderRadius: R, padding: '10px 14px', fontFamily: FONT, minWidth: '130px', boxShadow: '0 8px 24px rgba(0,0,0,.6)' }}>
      <p style={{ fontSize: '10px', color: P.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 6px' }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: p.color || p.stroke || p.fill, marginBottom: '2px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: p.color || p.stroke || p.fill }} />
          {p.name}: {typeof p.value === 'number' && p.value > 999 ? 'Rs.' + p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  )
}

// ── Shared card ───────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: R2, padding: '20px', fontFamily: FONT, ...style }}>
    {children}
  </div>
)

// ── KPI card with trend indicator ────────────────────────
function KPICard({ label, value, change, icon, color, sub, loading, delay = 0 }) {
  const up   = change >= 0
  const clr  = change === 0 ? P.slate : up ? P.emerald : P.rose
  const size = 70, r2 = 24, circ = 2 * Math.PI * r2
  const pct  = Math.min(Math.abs(change) / 50, 1)

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: R2, padding: '18px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, borderRadius: '50%', background: color + '18', filter: 'blur(20px)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: R, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color }}>{icon}</span>
          </div>
          {change !== undefined && (
            <span style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: clr + '18', color: clr }}>
              {up ? '↑' : '↓'} {Math.abs(change)}%
            </span>
          )}
        </div>
        <p style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: P.dim, margin: '0 0 4px' }}>{label}</p>
        {loading
          ? <div style={{ height: '32px', width: '90px', borderRadius: R, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
          : <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: '26px', color: P.text, margin: 0, lineHeight: 1 }}>{value}</p>
        }
        {sub && <p style={{ fontFamily: FONT, fontSize: '10px', color: P.dim, margin: '4px 0 0' }}>{sub}</p>}
      </div>
    </motion.div>
  )
}

// ── Area Revenue Chart ────────────────────────────────────
function RevenueAreaChart({ data, loading, period }) {
  if (loading) return <div style={{ height: '240px', borderRadius: R2, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
  const total = data.reduce((s, d) => s + (d.revenue || 0), 0)
  const hasData = data.some(d => d.revenue > 0)

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '14px', color: P.text, margin: 0 }}>Revenue Trend</p>
          <p style={{ fontFamily: FONT, fontSize: '11px', color: P.muted, margin: '3px 0 0' }}>Last {period}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: FONT, fontSize: '10px', color: P.dim, margin: 0 }}>Total</p>
          <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: '18px', color: P.blue, margin: 0 }}>Rs.{total.toLocaleString()}</p>
        </div>
      </div>
      {!hasData ? (
        <div style={{ height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'rgba(255,255,255,0.08)' }}>show_chart</span>
          <p style={{ fontFamily: FONT, fontSize: '12px', color: P.dim, margin: 0 }}>No revenue data yet</p>
        </div>
      ) : (
        <div style={{ height: '180px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={P.blue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={P.blue} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: P.dim, fontSize: 9, fontFamily: FONT }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: P.dim, fontSize: 9, fontFamily: FONT }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue (Rs.)" stroke={P.blue} strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: P.blue }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

// ── Orders Bar Chart ──────────────────────────────────────
function OrdersBarChart({ data, loading, period }) {
  if (loading) return <div style={{ height: '240px', borderRadius: R2, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
  const total = data.reduce((s, d) => s + (d.orders || 0), 0)
  const hasData = data.some(d => d.orders > 0)

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '14px', color: P.text, margin: 0 }}>Orders</p>
          <p style={{ fontFamily: FONT, fontSize: '11px', color: P.muted, margin: '3px 0 0' }}>Last {period}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: FONT, fontSize: '10px', color: P.dim, margin: 0 }}>Total</p>
          <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: '18px', color: P.violet, margin: 0 }}>{total}</p>
        </div>
      </div>
      {!hasData ? (
        <div style={{ height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'rgba(255,255,255,0.08)' }}>bar_chart</span>
          <p style={{ fontFamily: FONT, fontSize: '12px', color: P.dim, margin: 0 }}>No orders yet</p>
        </div>
      ) : (
        <div style={{ height: '180px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 5, left: -20, bottom: 0 }} barSize={data.length > 14 ? 6 : 16}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: P.dim, fontSize: 9, fontFamily: FONT }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: P.dim, fontSize: 9, fontFamily: FONT }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="orders" name="Orders" radius={[3,3,0,0]}>
                {data.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? P.violet : P.indigo} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

// ── Top Products ──────────────────────────────────────────
function TopProductsPanel({ productSales, loading }) {
  if (loading) return <div style={{ height: '220px', borderRadius: R2, background: 'rgba(255,255,255,0.03)', animation: 'pulse 1.5s infinite' }} />
  const top = productSales.slice(0, 6)
  const maxVal = top[0]?.value || 1
  const BAR_COLORS = [P.blue, P.cyan, P.violet, P.emerald, P.amber, P.indigo]
  const MEDALS = ['🥇','🥈','🥉','4','5','6']

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '14px', color: P.text, margin: 0 }}>Top Products</p>
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: P.amber }}>emoji_events</span>
      </div>
      {!top.length ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'rgba(255,255,255,0.08)', display: 'block', marginBottom: '8px' }}>inventory_2</span>
          <p style={{ fontFamily: FONT, fontSize: '12px', color: P.dim, margin: 0 }}>No product sales yet</p>
        </div>
      ) : top.map((p, i) => {
        const pct = Math.round((p.value / maxVal) * 100)
        const col = BAR_COLORS[i]
        return (
          <div key={p.name} style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ fontSize: '13px', flexShrink: 0 }}>{MEDALS[i]}</span>
                <span style={{ fontFamily: FONT, fontSize: '12px', fontWeight: 600, color: P.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <span style={{ fontFamily: FONT, fontSize: '10px', color: P.dim }}>{p.qty} sold</span>
                <span style={{ fontFamily: FONT, fontSize: '12px', fontWeight: 700, color: col }}>Rs.{p.value.toLocaleString()}</span>
              </div>
            </div>
            <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: pct + '%' }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: '3px', background: col }} />
            </div>
          </div>
        )
      })}
    </Card>
  )
}

// ── Summary Stats Row ─────────────────────────────────────
function SummaryRow({ stats, kpi, loading }) {
  const items = [
    { l: 'Pending Orders', v: stats.pendingOrders ?? '—',                                             c: P.amber,   icon: 'schedule'       },
    { l: 'Avg Order Value', v: stats.avgOrderValue ? `Rs.${Math.round(stats.avgOrderValue)}` : '—',  c: P.cyan,    icon: 'analytics'      },
    { l: 'Cancel Rate',    v: stats.totalOrders > 0 ? `${((stats.cancelledOrders||0)/stats.totalOrders*100).toFixed(1)}%` : '0%', c: P.rose, icon: 'cancel' },
    { l: 'Delivery Rate',  v: kpi.deliveryRate?.today != null ? `${Number(kpi.deliveryRate.today).toFixed(0)}%` : '—', c: P.emerald, icon: 'local_shipping' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '10px' }}>
      {items.map((s, i) => (
        <motion.div key={s.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 + i * .06 }}
          style={{ background: P.card, border: `1px solid ${s.c}20`, borderRadius: R2, padding: '14px', textAlign: 'center' }}>
          {loading
            ? <div style={{ height: '28px', borderRadius: R, background: 'rgba(255,255,255,0.05)', margin: '0 auto 6px', width: '70px', animation: 'pulse 1.5s infinite' }} />
            : <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: '22px', color: s.c, margin: '0 0 4px', lineHeight: 1 }}>{s.v}</p>
          }
          <p style={{ fontFamily: FONT, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: P.dim, margin: 0 }}>{s.l}</p>
        </motion.div>
      ))}
    </div>
  )
}

// ── AI Insights Panel ─────────────────────────────────────
function AIInsightsPanel({ insights, loading, onRefresh }) {
  const [tab, setTab] = useState('insights')
  const TABS = [
    { id: 'insights',    label: 'Insights',    icon: 'lightbulb'   },
    { id: 'predictions', label: 'Forecast',    icon: 'trending_up' },
    { id: 'suggestions', label: 'Actions',     icon: 'task_alt'    },
    { id: 'alerts',      label: 'Alerts',      icon: 'warning'     },
  ]

  return (
    <Card style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${P.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: R, background: 'linear-gradient(135deg,rgba(59,130,246,.3),rgba(139,92,246,.3))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: P.cyan }}>auto_awesome</span>
            </div>
            <div>
              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '13px', color: P.text, margin: 0 }}>AI Business Intelligence</p>
              <p style={{ fontFamily: FONT, fontSize: '10px', color: P.muted, margin: '2px 0 0' }}>Gemini AI Analysis</p>
            </div>
          </div>
          <button onClick={onRefresh} disabled={loading}
            style={{ width: '30px', height: '30px', borderRadius: R, background: 'rgba(255,255,255,0.05)', border: `1px solid ${P.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: P.muted, opacity: loading ? .5 : 1 }}>
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`} style={{ fontSize: '15px' }}>{loading ? 'autorenew' : 'refresh'}</span>
          </button>
        </div>
        {insights?.summary && (
          <div style={{ padding: '10px 12px', borderRadius: R, background: P.cyan + '0d', border: `1px solid ${P.cyan}20` }}>
            <p style={{ fontFamily: FONT, fontSize: '11px', color: P.cyan, margin: 0, lineHeight: 1.6 }}>{insights.summary}</p>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${P.border}` }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, fontFamily: FONT, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', padding: '10px 4px', cursor: 'pointer', background: 'none', border: 'none', transition: 'all .15s',
              color: tab === t.id ? P.cyan : P.dim,
              borderBottom: tab === t.id ? `2px solid ${P.cyan}` : '2px solid transparent',
              marginBottom: '-1px' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '14px', minHeight: '220px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1,2,3].map(i => <div key={i} style={{ height: '52px', borderRadius: R, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : !insights ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', textAlign: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: P.cyan + '30' }}>auto_awesome</span>
            <p style={{ fontFamily: FONT, fontSize: '12px', color: P.muted, margin: 0 }}>Click Refresh to generate AI insights</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              {tab === 'insights' && (insights.insights || []).map((item, i) => {
                const col = item.type === 'positive' ? P.emerald : item.type === 'negative' ? P.rose : P.cyan
                return (
                  <div key={i} style={{ padding: '10px 12px', borderRadius: R, background: col + '0a', border: `1px solid ${col}20`, marginBottom: '8px' }}>
                    <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '12px', color: col, margin: '0 0 3px' }}>{item.title}</p>
                    <p style={{ fontFamily: FONT, fontSize: '11px', color: P.muted, margin: 0, lineHeight: 1.5 }}>{item.detail}</p>
                  </div>
                )
              })}
              {tab === 'predictions' && (insights.predictions || []).map((item, i) => {
                const dc = item.direction === 'up' ? P.emerald : item.direction === 'down' ? P.rose : P.slate
                return (
                  <div key={i} style={{ padding: '10px 12px', borderRadius: R, background: 'rgba(255,255,255,0.03)', border: `1px solid ${P.border}`, marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: '12px', color: P.text }}>{item.metric}</span>
                      <span style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 700, color: dc }}>{item.direction === 'up' ? '↑ Rising' : item.direction === 'down' ? '↓ Falling' : '→ Stable'} · {item.confidence}%</span>
                    </div>
                    <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)', marginBottom: '5px' }}>
                      <div style={{ height: '100%', borderRadius: '2px', background: dc, width: item.confidence + '%' }} />
                    </div>
                    <p style={{ fontFamily: FONT, fontSize: '10px', color: P.dim, margin: 0 }}>{item.detail}</p>
                  </div>
                )
              })}
              {tab === 'suggestions' && (insights.suggestions || []).map((item, i) => {
                const col = item.priority === 'high' ? P.rose : item.priority === 'medium' ? P.amber : P.blue
                return (
                  <div key={i} style={{ padding: '10px 12px', borderRadius: R, background: 'rgba(255,255,255,0.03)', border: `1px solid ${P.border}`, marginBottom: '8px', display: 'flex', gap: '10px' }}>
                    <span style={{ fontFamily: FONT, fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', padding: '3px 7px', borderRadius: '4px', background: col + '18', color: col, flexShrink: 0, alignSelf: 'flex-start', marginTop: '1px' }}>{item.priority}</span>
                    <div>
                      <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '12px', color: P.text, margin: '0 0 3px' }}>{item.action}</p>
                      <p style={{ fontFamily: FONT, fontSize: '10px', color: P.dim, margin: 0 }}>{item.reason}</p>
                    </div>
                  </div>
                )
              })}
              {tab === 'alerts' && (
                !(insights.alerts?.length) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '150px', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '32px', color: P.emerald + '50' }}>check_circle</span>
                    <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: '12px', color: P.emerald, margin: 0 }}>No alerts — all good</p>
                  </div>
                ) : (insights.alerts || []).map((alert, i) => {
                  const col = alert.severity === 'critical' ? P.rose : alert.severity === 'warning' ? P.amber : P.cyan
                  return (
                    <div key={i} style={{ padding: '10px 12px', borderRadius: R, background: col + '0a', border: `1px solid ${col}25`, marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '14px', color: col, flexShrink: 0, marginTop: '1px' }}>{alert.severity === 'critical' ? 'error' : 'warning'}</span>
                      <p style={{ fontFamily: FONT, fontSize: '11px', color: col, margin: 0, lineHeight: 1.5 }}>{alert.message}</p>
                    </div>
                  )
                })
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </Card>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function Analytics() {
  const activeShop = useAuthStore((s) => s.activeShop)
  const shopId     = activeShop?._id
  const [period, setPeriod] = useState('7d')

  const { days, label: periodLabel } = PERIODS.find(p => p.id === period) || PERIODS[0]
  const { start, end } = useMemo(() => getDateRange(days), [period])

  // Data hooks
  const { data: summaryData, isLoading: summaryLoading } = useDashboardSummary(shopId)
  const { data: kpiData,     isLoading: kpiLoading }     = useKPIMetrics(shopId)
  const { data: rangeData,   isLoading: rangeLoading }   = useAnalyticsRange(shopId, { start, end })
  const { data: statsData,   isLoading: statsLoading }   = useOrderStats(shopId)
  const insightsMut = useAnalyticsInsights()

  const summaryArr   = Array.isArray(summaryData?.data) ? summaryData.data : []
  const kpi          = kpiData?.data || {}
  const stats        = statsData?.data || {}
  const productSales = summaryData?.productSales || []

  // Build chart data from range or summary
  const rangeArr = rangeData?.data
  const chartData = useMemo(() => {
    const source = (Array.isArray(rangeArr) && rangeArr.length > 0) ? rangeArr : summaryArr
    return source.map(d => ({
      day:     new Date(d.date).toLocaleDateString('en', days > 14 ? { month: 'short', day: 'numeric' } : { weekday: 'short' }),
      revenue: d.sales?.totalRevenue || d.revenue || 0,
      orders:  d.sales?.totalOrders  || d.orders  || 0,
    }))
  }, [rangeArr, summaryArr, days])

  const isLoading = summaryLoading || kpiLoading
  const chartLoading = rangeLoading || summaryLoading

  const fmtChg = v => v != null ? Number(v) : 0

  const KPI_CARDS = [
    { label: 'Revenue',       value: kpi.revenue?.today      != null ? 'Rs.' + Number(kpi.revenue.today).toLocaleString()         : '—', change: fmtChg(kpi.revenue?.change),      icon: 'payments',       color: P.blue    },
    { label: 'Orders',        value: kpi.orders?.today        ?? '—',                                                                      change: fmtChg(kpi.orders?.change),       icon: 'shopping_bag',   color: P.violet  },
    { label: 'Delivery Rate', value: kpi.deliveryRate?.today  != null ? Number(kpi.deliveryRate.today).toFixed(0) + '%'             : '—', change: fmtChg(kpi.deliveryRate?.change), icon: 'local_shipping', color: P.emerald },
    { label: 'New Customers', value: kpi.newCustomers?.today  ?? '—',                                                                      change: fmtChg(kpi.newCustomers?.change), icon: 'person_add',     color: P.cyan    },
  ]

  if (!activeShop) return (
    <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: FONT }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'rgba(255,255,255,0.08)', display: 'block', marginBottom: '12px' }}>monitoring</span>
      <p style={{ fontWeight: 700, fontSize: '17px', color: P.text, margin: '0 0 6px' }}>No Shop Selected</p>
      <p style={{ fontSize: '13px', color: P.muted, margin: 0 }}>Select a shop to view analytics</p>
    </div>
  )

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: '24px', color: P.text, margin: 0 }}>Analytics</h2>
          <p style={{ fontFamily: FONT, fontSize: '12px', color: P.muted, margin: '4px 0 0' }}>
            {activeShop.name} — Business Intelligence
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Period selector */}
          <div style={{ display: 'flex', gap: '2px', padding: '3px', background: P.card, border: `1px solid ${P.border}`, borderRadius: R }}>
            {PERIODS.map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)}
                style={{ fontFamily: FONT, fontWeight: 600, fontSize: '11px', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', transition: 'all .15s', border: 'none',
                  background: period === p.id ? P.blue : 'transparent',
                  color: period === p.id ? '#fff' : P.muted }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* AI Insights button */}
          <button onClick={() => shopId && insightsMut.mutate({ shopId, forceAI: true })} disabled={insightsMut.isPending}
            style={{ fontFamily: FONT, fontWeight: 700, fontSize: '12px', padding: '8px 16px', borderRadius: R, background: P.blue, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: insightsMut.isPending ? .6 : 1 }}>
            <span className={`material-symbols-outlined ${insightsMut.isPending ? 'animate-spin' : ''}`} style={{ fontSize: '15px' }}>
              {insightsMut.isPending ? 'autorenew' : 'auto_awesome'}
            </span>
            {insightsMut.isPending ? 'Analyzing...' : 'AI Insights'}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '12px' }}>
        {KPI_CARDS.map((k, i) => <KPICard key={k.label} {...k} loading={isLoading} delay={i * .07} />)}
      </div>

      {/* ── Summary stats row ── */}
      <SummaryRow stats={stats} kpi={kpi} loading={isLoading || statsLoading} />

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="md:grid-cols-2">
        <RevenueAreaChart data={chartData} loading={chartLoading} period={periodLabel} />
        <OrdersBarChart   data={chartData} loading={chartLoading} period={periodLabel} />
      </div>

      {/* ── Bottom row: Top products + AI insights ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }} className="md:grid-cols-2">
        <TopProductsPanel productSales={productSales} loading={summaryLoading} />
        <AIInsightsPanel
          insights={insightsMut.data?.data || null}
          loading={insightsMut.isPending}
          onRefresh={() => shopId && insightsMut.mutate({ shopId, forceAI: true })}
        />
      </div>

    </div>
  )
}
