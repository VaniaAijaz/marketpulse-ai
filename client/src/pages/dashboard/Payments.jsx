import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrdersByShop, useSimulatePayment } from '../../features/orders/orderHooks'
import useAuthStore from '../../store/useAuthStore'
import useAppStore from '../../store/useAppStore'

/* ─── Design tokens ─────────────────────────────────────── */
const F = "'Inter','Segoe UI',system-ui,sans-serif"
const BG   = '#2C2C2C'
const CARD = '#000000'

const C = {
  blue:    '#3b82f6',
  violet:  '#8b5cf6',
  emerald: '#10b981',
  cyan:    '#06b6d4',
  rose:    '#f43f5e',
  amber:   '#f59e0b',
  slate:   '#6b7280',
}

const GATEWAY_CFG = {
  cash:      { label: 'Cash / COD',        icon: 'payments',               color: C.emerald },
  cod:       { label: 'Cash / COD',        icon: 'payments',               color: C.emerald },
  card:      { label: 'Card / Stripe',     icon: 'credit_card',            color: C.blue    },
  stripe:    { label: 'Card / Stripe',     icon: 'credit_card',            color: C.blue    },
  jazzcash:  { label: 'JazzCash',          icon: 'phone_android',          color: C.rose    },
  easypaisa: { label: 'Easypaisa',         icon: 'account_balance_wallet', color: C.cyan    },
  bank:      { label: 'Bank Transfer',     icon: 'account_balance',        color: C.violet  },
  credit:    { label: 'Store Credit',      icon: 'loyalty',                color: C.amber   },
}

const STATUS_CFG = {
  paid:     { color: C.emerald, label: 'Paid',     icon: 'check_circle'          },
  pending:  { color: C.amber,   label: 'Pending',  icon: 'schedule'              },
  failed:   { color: C.rose,    label: 'Failed',   icon: 'cancel'                },
  refunded: { color: C.slate,   label: 'Refunded', icon: 'settings_backup_restore'},
}

/* ─── Shared input style ────────────────────────────────── */
const inp = {
  width: '100%', padding: '9px 12px', borderRadius: '6px',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', fontFamily: F, fontSize: '13px', outline: 'none',
  boxSizing: 'border-box',
}

/* ─── Status badge ──────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '4px', fontFamily: F,
      fontSize: '10px', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
      color: cfg.color,
      background: cfg.color + '18',
      border: `1px solid ${cfg.color}35`,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}

/* ─── Animated counter ──────────────────────────────────── */
function Counter({ value, prefix = '', decimals = 0, color, size = 26 }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const end = value
    if (start === end) { setDisplay(end); return }
    const duration = 900
    const step = (end - start) / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setDisplay(end); clearInterval(timer) }
      else setDisplay(start)
    }, 16)
    return () => clearInterval(timer)
  }, [value])
  return (
    <span style={{ color, fontFamily: F, fontWeight: 800, fontSize: `${size}px`, lineHeight: 1 }}>
      {prefix}{decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString()}
    </span>
  )
}

/* ─── Mini sparkline ────────────────────────────────────── */
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1)
  const w = 72, h = 24
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ')
  return (
    <svg width={w} height={h} style={{ opacity: 0.55 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Gateway donut ─────────────────────────────────────── */
function GatewayDonut({ splits, total }) {
  const entries = Object.entries(splits).filter(([, v]) => v > 0)
  if (!entries.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
      <p style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>No data yet</p>
    </div>
  )
  const size = 120, cx = 60, cy = 60, r = 44, stroke = 12
  const circ = 2 * Math.PI * r
  let offset = 0
  const segs = entries.map(([key, val]) => {
    const pct = val / total
    const dash = pct * circ
    const seg = { key, val, pct, dash, offset, color: GATEWAY_CFG[key]?.color || C.blue }
    offset += dash
    return seg
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        {segs.map(s => (
          <circle key={s.key} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke} strokeLinecap="butt"
            strokeDasharray={`${s.dash - 1.5} ${circ - s.dash + 1.5}`}
            strokeDashoffset={-s.offset} />
        ))}
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {segs.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
              <span style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>{GATEWAY_CFG[s.key]?.label || s.key}</span>
            </div>
            <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 700, color: s.color }}>{(s.pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Live ticker ───────────────────────────────────────── */
function LiveTicker({ orders }) {
  const paid = orders.filter(o => o.payment?.status === 'paid').slice(0, 8)
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (paid.length < 2) return
    const t = setInterval(() => setIdx(i => (i + 1) % paid.length), 3000)
    return () => clearInterval(t)
  }, [paid.length])
  if (!paid.length) return null
  const o = paid[idx]
  return (
    <AnimatePresence mode="wait">
      <motion.div key={idx}
        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 12px', borderRadius: '6px', fontFamily: F,
          background: C.emerald + '10', border: `1px solid ${C.emerald}25`,
        }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: C.emerald, animation: 'pulse 2s infinite', flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: '12px', color: C.emerald }}>+Rs.{(o.pricing?.total || 0).toLocaleString()}</span>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>· {o.customerName || 'Customer'} · {GATEWAY_CFG[o.payment?.method]?.label || 'Cash'}</span>
      </motion.div>
    </AnimatePresence>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function Payments() {
  const activeShop = useAuthStore(s => s.activeShop)
  const addEvent   = useAppStore(s => s.addEvent)
  const [filterStatus, setFilterStatus] = useState('')
  const [simulatingOrder, setSimulatingOrder] = useState(null)

  const { data, isLoading } = useOrdersByShop(activeShop?._id, { page: 1, limit: 100 })
  const orders = data?.data?.orders || []

  /* ── Derived stats ── */
  const paid     = orders.filter(o => o.payment?.status === 'paid')
  const pending  = orders.filter(o => o.payment?.status === 'pending')
  const failed   = orders.filter(o => o.payment?.status === 'failed')
  const refunded = orders.filter(o => o.payment?.status === 'refunded')

  const totalCollected = paid.reduce((s, o) => s + (o.pricing?.total || 0), 0)
  const pendingAmount  = pending.reduce((s, o) => s + (o.pricing?.total || 0), 0)
  const avgTxn         = paid.length ? totalCollected / paid.length : 0
  const digitalOrders  = orders.filter(o => o.payment?.method && !['cash','cod'].includes(o.payment.method))
  const successRate    = digitalOrders.length ? (digitalOrders.filter(o => o.payment?.status === 'paid').length / digitalOrders.length) * 100 : 100

  const gatewaySplits = orders.reduce((acc, o) => {
    const m = o.payment?.method || 'cash'
    acc[m] = (acc[m] || 0) + (o.pricing?.total || 0)
    return acc
  }, {})
  const totalAll = Object.values(gatewaySplits).reduce((s, v) => s + v, 0) || 1

  const sparkData = paid.slice(-7).map(o => o.pricing?.total || 0)

  const filtered = filterStatus ? orders.filter(o => o.payment?.status === filterStatus) : orders

  const kpis = [
    { label: 'Total Collected', value: totalCollected, prefix: 'Rs.', color: C.emerald, icon: 'payments',        spark: sparkData },
    { label: 'Pending Amount',  value: pendingAmount,  prefix: 'Rs.', color: C.amber,   icon: 'hourglass_empty', spark: null },
    { label: 'Avg Transaction', value: avgTxn,         prefix: 'Rs.', color: C.blue,    icon: 'analytics',       spark: null },
    { label: 'Digital Success', value: successRate,    prefix: '',    color: C.cyan,    icon: 'speed',           spark: null, suffix: '%' },
  ]

  const filterTabs = [
    { status: '',         label: 'All',      count: orders.length,   color: C.blue    },
    { status: 'paid',     label: 'Paid',     count: paid.length,     color: C.emerald },
    { status: 'pending',  label: 'Pending',  count: pending.length,  color: C.amber   },
    { status: 'failed',   label: 'Failed',   count: failed.length,   color: C.rose    },
    { status: 'refunded', label: 'Refunded', count: refunded.length, color: C.slate   },
  ]

  /* ── Health bars ── */
  const healthBars = [
    { label: 'Collection Rate',  value: orders.length ? (paid.length / orders.length) * 100 : 0,          color: C.emerald },
    { label: 'Digital Adoption', value: orders.length ? (digitalOrders.length / orders.length) * 100 : 0, color: C.blue    },
    { label: 'Failure Rate',     value: orders.length ? (failed.length / orders.length) * 100 : 0,        color: C.rose    },
  ]

  return (
    <div style={{ fontFamily: F, color: '#fff', minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontFamily: F, fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Payments Hub</h2>
          <p style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
            Transaction channels, gateway splits, and checkout metrics
          </p>
        </div>
        <LiveTicker orders={orders} />
      </div>

      {!activeShop ? (
        <div style={{ background: CARD, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '60px 20px', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '44px', color: C.blue, display: 'block', marginBottom: '12px' }}>credit_card</span>
          <p style={{ fontFamily: F, fontWeight: 600, fontSize: '15px', color: '#fff', marginBottom: '6px' }}>No Active Shop Selected</p>
          <p style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Select a shop to view payment logs.</p>
        </div>
      ) : (
        <>
          {/* ── KPI strip ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
            {kpis.map((k, i) => (
              <motion.div key={k.label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                whileHover={{ y: -2 }}
                style={{ background: CARD, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: k.color + '18', filter: 'blur(20px)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: k.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: k.color }}>{k.icon}</span>
                    </div>
                    {k.spark && <Sparkline data={k.spark} color={k.color} />}
                  </div>
                  <p style={{ fontFamily: F, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{k.label}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                    <Counter value={k.value} prefix={k.prefix} color={k.color} size={22} />
                    {k.suffix && <span style={{ fontFamily: F, fontWeight: 800, fontSize: '22px', color: k.color }}>{k.suffix}</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Filter tabs ── */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {filterTabs.map(tab => {
              const active = filterStatus === tab.status
              return (
                <button key={tab.status} onClick={() => setFilterStatus(tab.status)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '5px 12px', borderRadius: '4px', fontFamily: F,
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                    color:      active ? tab.color : 'rgba(255,255,255,0.45)',
                    background: active ? tab.color + '18' : 'rgba(255,255,255,0.04)',
                    border:     active ? `1px solid ${tab.color}35` : '1px solid rgba(255,255,255,0.08)',
                  }}>
                  <span style={{
                    width: '18px', height: '18px', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: F, fontSize: '10px', fontWeight: 700,
                    background: tab.color + '22', color: tab.color,
                  }}>{tab.count}</span>
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* ── Main grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', alignItems: 'start' }}>

            {/* ── Transaction table ── */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: CARD, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: F, fontWeight: 600, fontSize: '13px', color: '#fff' }}>Transaction Ledger</span>
                <span style={{
                  fontFamily: F, fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                  color: C.cyan, background: C.cyan + '15', border: `1px solid ${C.cyan}30`,
                }}>{filtered.length} records</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['TXN ID', 'Order', 'Customer', 'Method', 'Amount', 'Status', ''].map((h, i) => (
                        <th key={i} style={{
                          padding: '10px 14px', fontFamily: F, fontSize: '9px', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.28)',
                          textAlign: i >= 4 ? 'right' : 'left',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? [...Array(6)].map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {[...Array(7)].map((_, j) => (
                          <td key={j} style={{ padding: '12px 14px' }}>
                            <div style={{ height: '12px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.5s ease infinite' }} />
                          </td>
                        ))}
                      </tr>
                    )) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '48px 14px', textAlign: 'center' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'rgba(255,255,255,0.1)', display: 'block', marginBottom: '10px' }}>credit_card_off</span>
                          <p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>No transactions yet</p>
                        </td>
                      </tr>
                    ) : filtered.map((order, idx) => {
                      const gCfg = GATEWAY_CFG[order.payment?.method] || GATEWAY_CFG.cash
                      return (
                        <motion.tr key={order._id}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.015 }}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'default' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '11px 14px' }}>
                            {order.payment?.transactionId
                              ? <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{order.payment.transactionId.slice(4, 16)}…</span>
                              : <span style={{ color: 'rgba(255,255,255,0.15)', fontFamily: F, fontSize: '12px' }}>—</span>}
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: '#fff' }}>
                              #{order.orderNumber?.slice(-6) || order._id?.slice(-6).toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{order.customerName || '—'}</span>
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '13px', color: gCfg.color }}>{gCfg.icon}</span>
                              <span style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{gCfg.label}</span>
                            </div>
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                            <span style={{ fontFamily: F, fontWeight: 700, fontSize: '13px', color: STATUS_CFG[order.payment?.status]?.color || C.amber }}>
                              Rs.{(order.pricing?.total || 0).toLocaleString()}
                            </span>
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                            <StatusBadge status={order.payment?.status} />
                          </td>
                          <td style={{ padding: '11px 14px', textAlign: 'right' }}>
                            {order.payment?.status === 'pending' ? (
                              <button onClick={() => setSimulatingOrder(order)}
                                style={{
                                  padding: '4px 12px', borderRadius: '4px', fontFamily: F, fontSize: '11px', fontWeight: 600,
                                  background: C.blue, color: '#fff', border: 'none', cursor: 'pointer',
                                  boxShadow: `0 0 10px ${C.blue}40`,
                                }}>Pay</button>
                            ) : <span style={{ color: 'rgba(255,255,255,0.15)', fontFamily: F, fontSize: '12px' }}>—</span>}
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* ── Right panel ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Gateway donut */}
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                style={{ background: CARD, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '16px' }}>
                <p style={{ fontFamily: F, fontWeight: 600, fontSize: '12px', color: '#fff', marginBottom: '14px' }}>Gateway Split</p>
                <GatewayDonut splits={gatewaySplits} total={totalAll} />
              </motion.div>

              {/* Payment health */}
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }}
                style={{ background: CARD, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '16px' }}>
                <p style={{ fontFamily: F, fontWeight: 600, fontSize: '12px', color: '#fff', marginBottom: '14px' }}>Payment Health</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {healthBars.map(m => (
                    <div key={m.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>{m.label}</span>
                        <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 700, color: m.color }}>{m.value.toFixed(1)}%</span>
                      </div>
                      <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)' }}>
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${Math.min(m.value, 100)}%` }}
                          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.4 }}
                          style={{ height: '4px', borderRadius: '2px', background: m.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Quick stats grid */}
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                style={{ background: CARD, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '16px' }}>
                <p style={{ fontFamily: F, fontWeight: 600, fontSize: '12px', color: '#fff', marginBottom: '12px' }}>Quick Stats</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Paid',     value: paid.length,     color: C.emerald },
                    { label: 'Pending',  value: pending.length,  color: C.amber   },
                    { label: 'Failed',   value: failed.length,   color: C.rose    },
                    { label: 'Refunded', value: refunded.length, color: C.slate   },
                  ].map(s => (
                    <div key={s.label} style={{
                      padding: '12px', borderRadius: '4px', textAlign: 'center',
                      background: s.color + '0e', border: `1px solid ${s.color}22`,
                    }}>
                      <p style={{ fontFamily: F, fontWeight: 800, fontSize: '22px', color: s.color, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontFamily: F, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Top transactions */}
              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.38 }}
                style={{ background: CARD, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '16px' }}>
                <p style={{ fontFamily: F, fontWeight: 600, fontSize: '12px', color: '#fff', marginBottom: '12px' }}>Top Transactions</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {paid.sort((a, b) => (b.pricing?.total || 0) - (a.pricing?.total || 0)).slice(0, 5).map((o, i) => (
                    <div key={o._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: F, fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', width: '14px' }}>#{i + 1}</span>
                        <div>
                          <p style={{ fontFamily: F, fontSize: '11px', color: '#fff', lineHeight: 1 }}>{o.customerName || 'Customer'}</p>
                          <p style={{ fontFamily: F, fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                            {GATEWAY_CFG[o.payment?.method]?.label || 'Cash'}
                          </p>
                        </div>
                      </div>
                      <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 700, color: C.emerald }}>Rs.{(o.pricing?.total || 0).toLocaleString()}</span>
                    </div>
                  ))}
                  {paid.length === 0 && (
                    <p style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '12px 0' }}>No paid orders yet</p>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {simulatingOrder && (
          <PaymentModal order={simulatingOrder} onClose={() => setSimulatingOrder(null)} addEvent={addEvent} />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   PAYMENT MODAL — shadcn styled
══════════════════════════════════════════════════════════ */
function Backdrop({ onClose, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
        style={{
          background: '#111111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
          padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}>
        {children}
      </motion.div>
    </motion.div>
  )
}

function PaymentModal({ order, onClose, addEvent }) {
  const simulateMutation = useSimulatePayment()
  const [gateway, setGateway]   = useState('cash')
  const [forceFail, setForceFail] = useState(false)
  const [state, setState]       = useState('idle')
  const [stepIdx, setStepIdx]   = useState(0)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')

  const steps = [
    { label: 'Sandbox Handshake',      icon: 'handshake',    desc: `Connecting to mock ${gateway.toUpperCase()} network...` },
    { label: 'Account Verification',   icon: 'verified_user', desc: 'Validating tokens and balance...' },
    { label: 'Transaction Signature',  icon: 'key',           desc: 'Signing transaction...' },
    { label: 'Syncing Automations',    icon: 'auto_awesome',  desc: 'Updating inventory & analytics...' },
  ]

  const run = () => {
    setState('processing'); setStepIdx(0); setError('')
    let s = 0
    const iv = setInterval(() => {
      s++
      if (s < 3) { setStepIdx(s) }
      else {
        clearInterval(iv); setStepIdx(3)
        simulateMutation.mutate({ orderId: order._id, gateway, forceFail }, {
          onSuccess: res => {
            if (res?.success && res.data?.paymentResult === 'success') {
              setResult(res.data); setState('success')
              addEvent({ type: 'shopping_cart', message: `Payment confirmed: Order #${order.orderNumber}` })
            } else { setState('failed'); setError('Transaction declined by mock gateway.') }
          },
          onError: err => { setState('failed'); setError(err.response?.data?.error || 'Payment failed.') },
        })
      }
    }, 850)
  }

  /* ── Processing ── */
  if (state === 'processing') {
    const pct = ((stepIdx + 1) / steps.length) * 100
    return (
      <Backdrop onClose={() => {}}>
        <div style={{ textAlign: 'center', fontFamily: F }}>
          {/* spinner */}
          <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 20px' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${C.blue}20` }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid transparent`, borderTopColor: C.blue, animation: 'spin 0.9s linear infinite' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px', color: C.blue }}>account_balance_wallet</span>
            </div>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Processing…</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
            Mode: <span style={{ color: C.blue, fontWeight: 700 }}>{gateway.toUpperCase()}</span>
          </p>
          {/* progress bar */}
          <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)', margin: '18px 0', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '2px', background: C.blue, width: `${pct}%`, transition: 'width 0.5s ease', boxShadow: `0 0 10px ${C.blue}` }} />
          </div>
          {/* steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
            {steps.map((st, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: i < stepIdx ? C.emerald : i === stepIdx ? C.blue : 'rgba(255,255,255,0.15)' }}>
                  {i < stepIdx ? 'check_circle' : st.icon}
                </span>
                <span style={{ fontSize: '12px', color: i < stepIdx ? 'rgba(255,255,255,0.45)' : i === stepIdx ? '#fff' : 'rgba(255,255,255,0.2)' }}>
                  {i === stepIdx ? st.desc : st.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Backdrop>
    )
  }

  /* ── Failed ── */
  if (state === 'failed') return (
    <Backdrop onClose={onClose}>
      <div style={{ textAlign: 'center', fontFamily: F }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: C.rose + '15', border: `1px solid ${C.rose}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px', color: C.rose }}>error</span>
        </div>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Transaction Failed</p>
        <p style={{ fontSize: '12px', color: C.rose, marginTop: '6px' }}>{error}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
          <button onClick={run} style={{ padding: '10px', borderRadius: '6px', fontFamily: F, fontSize: '12px', fontWeight: 600, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}>Retry</button>
          <button onClick={onClose} style={{ padding: '10px', borderRadius: '6px', fontFamily: F, fontSize: '12px', fontWeight: 600, background: C.blue, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: `0 0 14px ${C.blue}50` }}>Close</button>
        </div>
      </div>
    </Backdrop>
  )

  /* ── Success / Invoice ── */
  if (state === 'success') {
    const inv = result?.invoice
    return (
      <Backdrop onClose={onClose}>
        <div style={{ maxHeight: '78vh', overflowY: 'auto', fontFamily: F }}>
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: C.emerald + '20', border: `1px solid ${C.emerald}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: C.emerald }}>task_alt</span>
            </div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>Payment Complete</p>
            <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.emerald, marginTop: '4px' }}>All automations triggered</p>
          </div>

          {/* Thermal receipt */}
          <div style={{ background: '#fff', color: '#111', borderRadius: '6px', padding: '18px', fontFamily: 'monospace', fontSize: '11px' }}>
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #ccc', paddingBottom: '10px', marginBottom: '10px' }}>
              <p style={{ fontWeight: 800, fontSize: '13px', textTransform: 'uppercase' }}>{inv?.shop?.name}</p>
              <p style={{ color: '#666', fontSize: '10px' }}>{inv?.shop?.phone}</p>
            </div>
            <div style={{ marginBottom: '10px', lineHeight: 1.6 }}>
              <p><b>Invoice:</b> {inv?.invoiceNumber}</p>
              <p><b>Date:</b> {inv?.payment?.processedAt ? new Date(inv.payment.processedAt).toLocaleString() : '—'}</p>
              <p><b>Customer:</b> {inv?.customer?.name} · {inv?.customer?.phone}</p>
            </div>
            <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '8px 0', marginBottom: '8px' }}>
              {inv?.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#444', marginBottom: '3px' }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                  <span style={{ margin: '0 8px' }}>{item.qty}×Rs.{item.price}</span>
                  <span style={{ fontWeight: 700 }}>Rs.{item.total}</span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'right', lineHeight: 1.7 }}>
              <p><b>Subtotal:</b> Rs.{inv?.pricing?.subtotal}</p>
              <p style={{ fontWeight: 800, fontSize: '13px', borderTop: '1px dashed #ccc', paddingTop: '6px', marginTop: '4px' }}>
                TOTAL: Rs.{inv?.pricing?.total}
              </p>
            </div>
            <div style={{ textAlign: 'center', marginTop: '10px', color: '#888', fontSize: '10px' }}>
              <p>Gateway: {inv?.payment?.gateway?.toUpperCase()}</p>
              <p>TXN: {inv?.payment?.transactionId}</p>
              <p style={{ marginTop: '6px', fontStyle: 'italic' }}>Thank you for your purchase!</p>
            </div>
          </div>

          <button onClick={onClose} style={{
            width: '100%', padding: '11px', marginTop: '16px', borderRadius: '6px',
            fontFamily: F, fontSize: '13px', fontWeight: 600,
            background: C.emerald, color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: `0 0 14px ${C.emerald}50`,
          }}>Done</button>
        </div>
      </Backdrop>
    )
  }

  /* ── Idle — gateway selector ── */
  return (
    <Backdrop onClose={onClose}>
      <div style={{ fontFamily: F }}>
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Simulate Payment</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
              Order #{order.orderNumber?.slice(-6) || order._id?.slice(-6).toUpperCase()} · Rs.{(order.pricing?.total || 0).toLocaleString()}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* Gateway grid */}
        <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.35)', marginBottom: '10px' }}>Select Gateway</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '18px' }}>
          {Object.entries(GATEWAY_CFG).filter(([k]) => !['cod','stripe'].includes(k)).map(([key, cfg]) => {
            const active = gateway === key
            return (
              <button key={key} onClick={() => setGateway(key)} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '6px',
                fontFamily: F, fontSize: '12px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
                color:      active ? cfg.color : 'rgba(255,255,255,0.55)',
                background: active ? cfg.color + '15' : 'rgba(255,255,255,0.04)',
                border:     active ? `1px solid ${cfg.color}40` : '1px solid rgba(255,255,255,0.08)',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: active ? cfg.color : 'rgba(255,255,255,0.3)' }}>{cfg.icon}</span>
                {cfg.label}
              </button>
            )
          })}
        </div>

        {/* Force fail toggle */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '6px',
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          cursor: 'pointer', marginBottom: '18px',
        }}>
          <input type="checkbox" checked={forceFail} onChange={e => setForceFail(e.target.checked)}
            style={{ accentColor: C.rose, width: '14px', height: '14px' }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: F }}>Force Failure (test declined flow)</span>
        </label>

        {/* Amount preview */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px', borderRadius: '6px', marginBottom: '18px',
          background: C.blue + '0a', border: `1px solid ${C.blue}20`,
        }}>
          <span style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>Total Amount</span>
          <span style={{ fontFamily: F, fontSize: '20px', fontWeight: 800, color: C.blue }}>Rs.{(order.pricing?.total || 0).toLocaleString()}</span>
        </div>

        {/* Confirm button */}
        <button onClick={run} style={{
          width: '100%', padding: '12px', borderRadius: '6px', fontFamily: F, fontSize: '13px', fontWeight: 600,
          background: C.blue, color: '#fff', border: 'none', cursor: 'pointer',
          boxShadow: `0 0 16px ${C.blue}45`, transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
          onMouseLeave={e => e.currentTarget.style.background = C.blue}>
          Confirm & Process — Rs.{(order.pricing?.total || 0).toLocaleString()} →
        </button>
      </div>
    </Backdrop>
  )
}
