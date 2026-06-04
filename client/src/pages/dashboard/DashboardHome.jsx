import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts'
import useAuthStore from '../../store/useAuthStore'
import useAppStore from '../../store/useAppStore'
import useUIStore from '../../store/useUIStore'
import ShopsTacticalMap from '../../components/dashboard/ShopsTacticalMap'
import { useDashboardSummary } from '../../features/analytics/analyticsHooks'
import { useOrderStats } from '../../features/orders/orderHooks'
import { useLatestRecommendations, useGenerateMessage } from '../../features/ai/aiHooks'
import { useShopsByOwner } from '../../features/shops/shopHooks'
import { useCustomersByShop } from '../../features/customers/customerHooks'
import { useInventorySummary } from '../../features/products/productHooks'

const P = {
  card: '#000000', border: 'rgba(255,255,255,0.08)',
  text: '#ffffff', muted: 'rgba(255,255,255,0.5)', dim: 'rgba(255,255,255,0.25)',
  blue: '#3b82f6', indigo: '#6366f1', violet: '#8b5cf6', emerald: '#10b981',
  slate: '#94a3b8', rose: '#f43f5e', amber: '#f59e0b', cyan: '#06b6d4',
}
const FONT = "'Inter','Segoe UI',system-ui,sans-serif"
const R = '6px', R2 = '10px'

const Card = ({ children, style = {}, className = '' }) => (
  <div className={className} style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: R2, padding: '20px', fontFamily: FONT, ...style }}>
    {children}
  </div>
)

// ── Tooltip ───────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#050505', border: `1px solid ${P.border}`, borderRadius: R, padding: '10px 14px', fontFamily: FONT, boxShadow: '0 8px 24px rgba(0,0,0,.7)' }}>
      <p style={{ fontSize: '10px', color: P.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', margin: '0 0 5px' }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: p.stroke || p.color, marginBottom: '2px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: p.stroke || p.color }} />
          {p.name}: {typeof p.value === 'number' && p.value > 999 ? 'Rs.' + p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  )
}

// ── KPI card ──────────────────────────────────────────────
function KPI({ label, value, icon, color, change, loading, delay = 0 }) {
  const up = change >= 0
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: R2, padding: '18px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -8, right: -8, width: 50, height: 50, borderRadius: '50%', background: color + '18', filter: 'blur(18px)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: R, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color }}>{icon}</span>
          </div>
          {change !== undefined && !loading && (
            <span style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: (up ? P.emerald : P.rose) + '18', color: up ? P.emerald : P.rose }}>
              {up ? '↑' : '↓'} {Math.abs(change)}%
            </span>
          )}
        </div>
        <p style={{ fontFamily: FONT, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: P.dim, margin: '0 0 4px' }}>{label}</p>
        {loading
          ? <div style={{ height: '28px', width: '80px', borderRadius: R, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
          : <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: '24px', color: P.text, margin: 0, lineHeight: 1 }}>{value}</p>}
      </div>
    </motion.div>
  )
}

// ── Competitor Benchmark ──────────────────────────────────
// Uses AI to generate market context + shows radar vs industry averages
function CompetitorBenchmark({ shopId, shopName, businessType, stats, inventory, customers }) {
  const genMsg    = useGenerateMessage()
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(false)
  const [asked, setAsked]     = useState(false)

  // Industry benchmark estimates for Pakistani retail (per week)
  const BIZ_BENCHMARKS = {
    grocery:     { avgRevenue: 25000, avgOrders: 40, avgCustomers: 30, retention: 65, growth: 8  },
    clothing:    { avgRevenue: 35000, avgOrders: 20, avgCustomers: 15, retention: 45, growth: 5  },
    pharmacy:    { avgRevenue: 20000, avgOrders: 50, avgCustomers: 40, retention: 70, growth: 4  },
    restaurant:  { avgRevenue: 40000, avgOrders: 80, avgCustomers: 60, retention: 50, growth: 10 },
    electronics: { avgRevenue: 60000, avgOrders: 10, avgCustomers: 8,  retention: 35, growth: 6  },
    other:       { avgRevenue: 20000, avgOrders: 25, avgCustomers: 20, retention: 50, growth: 5  },
  }

  const bench = BIZ_BENCHMARKS[businessType] || BIZ_BENCHMARKS.other
  const myRevenue  = stats.totalRevenue  || 0
  const myOrders   = stats.totalOrders   || 0
  const myCustomers = customers || 0
  const myStock    = inventory?.inStockCount || 0

  // Scores 0–100 vs industry
  const score = (my, avg) => avg > 0 ? Math.min(Math.round((my / avg) * 100), 150) : 0

  const radarData = [
    { metric: 'Revenue',   mine: Math.min(score(myRevenue, bench.avgRevenue), 100),   industry: 100 },
    { metric: 'Orders',    mine: Math.min(score(myOrders, bench.avgOrders), 100),     industry: 100 },
    { metric: 'Customers', mine: Math.min(score(myCustomers, bench.avgCustomers), 100), industry: 100 },
    { metric: 'Stock',     mine: Math.min(score(myStock, 20), 100),                  industry: 100 },
    { metric: 'Growth',    mine: bench.growth * 8,                                    industry: 100 },
  ]

  const overallScore = Math.round(radarData.reduce((s, d) => s + d.mine, 0) / radarData.length)
  const scoreColor   = overallScore >= 75 ? P.emerald : overallScore >= 50 ? P.amber : P.rose
  const scoreLabel   = overallScore >= 75 ? 'Above Average' : overallScore >= 50 ? 'Average' : 'Below Average'

  const fetchInsight = async () => {
    if (asked || !shopId) return
    setLoading(true); setAsked(true)
    const prompt = `You are a retail market analyst for Pakistani small businesses.

Shop: ${shopName} (${businessType})
My weekly stats: Revenue Rs.${myRevenue}, Orders ${myOrders}, Customers ${myCustomers}
Industry average (${businessType}): Revenue Rs.${bench.avgRevenue}/week, Orders ${bench.avgOrders}/week

Score vs competitors: ${overallScore}/100 (${scoreLabel})

Give 2 sentences in Hinglish about:
1. Where this shop stands vs competition
2. One specific action to beat competitors

Be direct and practical. Max 60 words total.`
    try {
      const res = await genMsg.mutateAsync({ shopId, prompt })
      setInsight(res?.message || null)
    } catch { setInsight(null) }
    setLoading(false)
  }

  useEffect(() => { if (shopId && stats.totalOrders > 0) fetchInsight() }, [shopId])

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '14px', color: P.text, margin: 0 }}>Market Position</p>
          <p style={{ fontFamily: FONT, fontSize: '11px', color: P.muted, margin: '3px 0 0' }}>vs {businessType} industry average</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: '22px', color: scoreColor, margin: 0, lineHeight: 1 }}>{overallScore}</p>
          <p style={{ fontFamily: FONT, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: scoreColor, margin: '2px 0 0' }}>{scoreLabel}</p>
        </div>
      </div>

      {/* Radar chart */}
      <div style={{ height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: P.dim, fontSize: 9, fontFamily: FONT }} />
            <Radar name="Industry Avg" dataKey="industry" stroke="rgba(255,255,255,0.15)" fill="rgba(255,255,255,0.05)" strokeWidth={1} />
            <Radar name="My Shop" dataKey="mine" stroke={scoreColor} fill={scoreColor + '20'} strokeWidth={2} dot={{ r: 3, fill: scoreColor }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '12px' }}>
        {[{ l: 'My Shop', c: scoreColor }, { l: 'Industry Avg', c: 'rgba(255,255,255,0.3)' }].map(s => (
          <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '3px', borderRadius: '2px', background: s.c }} />
            <span style={{ fontFamily: FONT, fontSize: '10px', color: P.dim }}>{s.l}</span>
          </div>
        ))}
      </div>

      {/* AI insight */}
      {(loading || insight) && (
        <div style={{ padding: '10px 12px', borderRadius: R, background: scoreColor + '0a', border: `1px solid ${scoreColor}20` }}>
          {loading
            ? <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                {[0,.15,.3].map((d,i) => <span key={i} className="animate-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%', background: scoreColor, display: 'inline-block', animationDelay: `${d}s` }} />)}
              </div>
            : <p style={{ fontFamily: FONT, fontSize: '11px', color: P.muted, margin: 0, lineHeight: 1.6 }}>{insight}</p>
          }
        </div>
      )}

      {/* Score bars */}
      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {radarData.map(d => (
          <div key={d.metric}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontSize: '10px', marginBottom: '3px' }}>
              <span style={{ color: P.dim }}>{d.metric}</span>
              <span style={{ color: d.mine >= 100 ? P.emerald : d.mine >= 70 ? P.amber : P.rose, fontWeight: 700 }}>{d.mine}%</span>
            </div>
            <div style={{ position: 'relative', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)' }}>
              {/* Industry baseline */}
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', borderRadius: '2px', background: 'rgba(255,255,255,0.1)' }} />
              {/* My score */}
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(d.mine, 100)}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{ position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: '2px',
                  background: d.mine >= 100 ? P.emerald : d.mine >= 70 ? P.amber : P.rose }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Recent Activity ───────────────────────────────────────
function ActivityFeed({ events }) {
  const ICONS = { person_add: 'person_add', shopping_cart: 'shopping_cart', warning: 'warning', smart_toy: 'smart_toy' }
  const COLORS = { person_add: P.emerald, shopping_cart: P.blue, warning: P.rose, smart_toy: P.amber }

  return (
    <Card style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '13px', color: P.text, margin: 0 }}>Recent Activity</p>
        <span style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: P.amber + '18', color: P.amber }}>{events.length} events</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: '32px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'rgba(255,255,255,0.08)', display: 'block', marginBottom: '8px' }}>notifications_none</span>
            <p style={{ fontFamily: FONT, fontSize: '11px', color: P.dim, margin: 0 }}>No activity yet</p>
          </div>
        ) : events.map(ev => {
          const icon = ICONS[ev.type] || 'circle'
          const col  = COLORS[ev.type] || P.slate
          return (
            <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '9px 10px', borderRadius: R, background: 'rgba(255,255,255,0.03)', border: `1px solid ${P.border}` }}>
              <div style={{ width: '28px', height: '28px', borderRadius: R, background: col + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px', color: col }}>{icon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: FONT, fontSize: '11px', color: P.text, margin: '0 0 2px', lineHeight: 1.4 }}>{ev.message}</p>
                <p style={{ fontFamily: FONT, fontSize: '9px', color: P.dim, margin: 0 }}>{ev.time}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function DashboardHome() {
  const navigate      = useNavigate()
  const user          = useAuthStore((s) => s.user)
  const activeShop    = useAuthStore((s) => s.activeShop)
  const events        = useAppStore((s) => s.events)
  const setActiveModal = useUIStore((s) => s.setActiveModal)

  const { data: shopsRes, isLoading: shopsMapLoading } = useShopsByOwner(user?._id)
  const mapShops = shopsRes?.data || []
  const { data: summaryData, isLoading: summaryLoading } = useDashboardSummary(activeShop?._id)
  const { data: statsData,   isLoading: statsLoading }   = useOrderStats(activeShop?._id)
  const { data: aiRecRes }     = useLatestRecommendations(activeShop?._id)
  const { data: customersData } = useCustomersByShop(activeShop?._id, { limit: 1 })
  const { data: inventoryData } = useInventorySummary(activeShop?._id)

  const summaryArr    = Array.isArray(summaryData?.data) ? summaryData.data : []
  const stats         = statsData?.data || {}
  const latestRec     = aiRecRes?.data
  const totalCustomers = summaryData?.totalCustomers ?? customersData?.data?.pagination?.total ?? 0
  const inventory     = inventoryData?.data || {}
  const isLoading     = summaryLoading || statsLoading

  // Chart data
  const chartData = summaryArr.length > 0
    ? summaryArr.map(d => ({
        day:     new Date(d.date).toLocaleDateString('en', { weekday: 'short' }),
        revenue: d.revenue || 0,
        orders:  d.orders  || 0,
      }))
    : [{ day: 'Mon', revenue: 0, orders: 0 }, { day: 'Tue', revenue: 0, orders: 0 },
       { day: 'Wed', revenue: 0, orders: 0 }, { day: 'Thu', revenue: 0, orders: 0 },
       { day: 'Fri', revenue: 0, orders: 0 }, { day: 'Sat', revenue: 0, orders: 0 },
       { day: 'Sun', revenue: 0, orders: 0 }]

  const totalRevenue = summaryArr.reduce((s, d) => s + (d.revenue || 0), 0)

  // Greeting
  const hr = new Date().getHours()
  const greeting = hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening'
  const today = new Date().toLocaleDateString('en-PK', { weekday: 'long', month: 'long', day: 'numeric' })

  // KPI cards
  const KPI_CARDS = [
    { label: 'Total Revenue',  value: stats.totalRevenue ? `Rs.${Number(stats.totalRevenue).toLocaleString()}` : totalRevenue ? `Rs.${totalRevenue.toLocaleString()}` : 'Rs.0', icon: 'payments',     color: P.blue,    change: undefined },
    { label: 'Total Orders',   value: (stats.totalOrders ?? 0).toLocaleString(),                                                                                                  icon: 'shopping_bag', color: P.violet,  change: undefined },
    { label: 'Customers',      value: totalCustomers.toLocaleString(),                                                                                                            icon: 'group',        color: P.emerald, change: undefined },
    { label: 'Pending Orders', value: (stats.pendingOrders ?? 0).toLocaleString(),                                                                                                icon: 'schedule',     color: P.amber,   change: undefined },
    { label: 'AI Confidence',  value: latestRec?.confidenceScore ? `${latestRec.confidenceScore}%` : '—',                                                                         icon: 'psychology',   color: P.cyan,    change: undefined },
  ]

  // AI Recommendations panel
  const recs = latestRec?.recommendations?.length
    ? latestRec.recommendations.slice(0, 3).map(r => ({
        title: r.productName, desc: r.reason, icon: 'auto_awesome', color: P.amber,
        action: 'View Shop', onClick: () => navigate(`/dashboard/shops/${activeShop?._id}`),
      }))
    : [
        { title: 'Get AI Recommendations', desc: 'Run analysis on weather, nearby places, and inventory.', icon: 'auto_awesome', color: P.blue, onClick: () => navigate(`/dashboard/shops/${activeShop?._id}`) },
        { title: 'Update Inventory',        desc: 'Keep stock updated so AI gives better suggestions.', icon: 'inventory_2',   color: P.cyan, onClick: () => navigate(`/dashboard/shops/${activeShop?._id}/inventory`) },
      ]

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 600, color: P.cyan, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '.1em' }}>
            {greeting} · {today}
          </p>
          <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: '24px', color: P.text, margin: 0 }}>Business Overview</h2>
          {activeShop && (
            <p style={{ fontFamily: FONT, fontSize: '12px', color: P.muted, margin: '4px 0 0' }}>
              <span style={{ color: P.blue, fontWeight: 600 }}>{activeShop.name}</span> · {activeShop.businessType}
            </p>
          )}
        </div>
        <button onClick={() => navigate('/dashboard/ai-agent')}
          style={{ fontFamily: FONT, fontWeight: 500, fontSize: '12px', padding: '7px 14px', borderRadius: R, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>psychology</span>
          AI Assistant
        </button>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '12px' }}>
        {KPI_CARDS.map((k, i) => <KPI key={k.label} {...k} loading={isLoading} delay={i * .06} />)}
      </div>

      {/* ── Row 1: Revenue chart + AI Recs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', alignItems: 'stretch' }}>
        {/* Revenue area chart */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '14px', color: P.text, margin: 0 }}>Revenue & Orders</p>
              <p style={{ fontFamily: FONT, fontSize: '11px', color: P.muted, margin: '3px 0 0' }}>This week</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: FONT, fontSize: '10px', color: P.dim, margin: 0 }}>7-day total</p>
              <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: '17px', color: P.blue, margin: 0 }}>Rs.{(stats.totalRevenue || totalRevenue).toLocaleString()}</p>
            </div>
          </div>
          <div style={{ height: '220px' }}>
            {chartData.every(d => d.revenue === 0) ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '36px', color: 'rgba(255,255,255,0.08)' }}>show_chart</span>
                <p style={{ fontFamily: FONT, fontSize: '12px', color: P.dim, margin: 0 }}>Create orders to see trends</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={P.blue} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={P.blue} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: P.dim, fontSize: 9, fontFamily: FONT }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: P.dim, fontSize: 9, fontFamily: FONT }} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue (Rs.)" stroke={P.blue} strokeWidth={2} fill="url(#dashRev)" dot={false} activeDot={{ r: 4, fill: P.blue }} />
                  <Area type="monotone" dataKey="orders"  name="Orders"        stroke={P.violet} strokeWidth={1.5} fill="none"            dot={false} activeDot={{ r: 3, fill: P.violet }} strokeDasharray="4 3" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
            {[{ l: 'Revenue', c: P.blue }, { l: 'Orders', c: P.violet, dash: true }].map(s => (
              <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '14px', height: '2px', background: s.c, borderRadius: '2px', borderBottom: s.dash ? `2px dashed ${s.c}` : 'none' }} />
                <span style={{ fontFamily: FONT, fontSize: '10px', color: P.dim }}>{s.l}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* AI Recommendations */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: P.amber }}>auto_awesome</span>
            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '13px', color: P.text, margin: 0 }}>AI Picks</p>
            {latestRec?.confidenceScore && (
              <span style={{ fontFamily: FONT, fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: P.emerald + '18', color: P.emerald, marginLeft: 'auto' }}>
                {latestRec.confidenceScore}% conf
              </span>
            )}
          </div>
          {latestRec?.insight && (
            <div style={{ padding: '8px 10px', borderRadius: R, background: P.blue + '0a', border: `1px solid ${P.blue}20`, marginBottom: '10px' }}>
              <p style={{ fontFamily: FONT, fontSize: '11px', color: P.muted, margin: 0, lineHeight: 1.5 }}>{latestRec.insight}</p>
            </div>
          )}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
            {recs.map((r, i) => (
              <button key={i} onClick={r.onClick}
                style={{ fontFamily: FONT, textAlign: 'left', padding: '10px 12px', borderRadius: R, cursor: 'pointer', transition: 'border-color .15s', background: 'rgba(255,255,255,0.03)', border: `1px solid ${P.border}`, width: '100%' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = r.color + '50'}
                onMouseLeave={e => e.currentTarget.style.borderColor = P.border}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px', color: r.color }}>{r.icon}</span>
                  <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '12px', color: P.text, margin: 0 }}>{r.title}</p>
                </div>
                <p style={{ fontFamily: FONT, fontSize: '10px', color: P.dim, margin: 0, lineHeight: 1.4 }}>{r.desc}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row 2: Competitor Benchmark + Activity feed ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', alignItems: 'start' }}>
        <CompetitorBenchmark
          shopId={activeShop?._id}
          shopName={activeShop?.name || ''}
          businessType={activeShop?.businessType || 'other'}
          stats={stats}
          inventory={inventory}
          customers={totalCustomers}
        />
        <ActivityFeed events={events} />
      </div>

      {/* ── Row 3: Quick Actions ── */}
      <Card>
        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '13px', color: P.text, margin: '0 0 12px' }}>Quick Actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '8px' }}>
          {[
            { label: 'Create Order',    icon: 'add_shopping_cart', color: P.blue,    onClick: () => setActiveModal('create-order') },
            { label: 'View Analytics',  icon: 'bar_chart',         color: P.violet,  onClick: () => navigate('/dashboard/analytics') },
            { label: 'Inventory',       icon: 'inventory_2',       color: P.cyan,    onClick: () => navigate(activeShop ? `/dashboard/shops/${activeShop._id}/inventory` : '/dashboard/inventory') },
            { label: 'WhatsApp',        icon: 'forum',             color: P.emerald, onClick: () => navigate('/dashboard/whatsapp') },
            { label: 'Customers',       icon: 'group',             color: P.amber,   onClick: () => navigate('/dashboard/users') },
            { label: 'Orders',          icon: 'receipt_long',      color: P.rose,    onClick: () => navigate('/dashboard/orders') },
          ].map(a => (
            <button key={a.label} onClick={a.onClick}
              style={{ fontFamily: FONT, fontWeight: 600, fontSize: '12px', padding: '12px 10px', borderRadius: R, cursor: 'pointer', transition: 'all .15s', background: 'rgba(255,255,255,0.03)', border: `1px solid ${P.border}`, color: P.muted, display: 'flex', alignItems: 'center', gap: '8px' }}
              onMouseEnter={e => { e.currentTarget.style.background = a.color + '12'; e.currentTarget.style.borderColor = a.color + '40'; e.currentTarget.style.color = a.color }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.muted }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Row 4: Tactical Map ── */}
      <div>
        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '13px', color: P.text, margin: '0 0 12px' }}>
          Shop & Nearby Area Map
        </p>
        <div className="grid grid-cols-12 gap-5">
          <ShopsTacticalMap shops={mapShops} isLoading={shopsMapLoading} />
        </div>
      </div>

    </div>
  )
}
