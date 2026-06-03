import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrdersByShop, useSimulatePayment } from '../../features/orders/orderHooks'
import useAuthStore from '../../store/useAuthStore'
import useAppStore from '../../store/useAppStore'

// Analytics-matching palette
const C = { blue: '#1390ff', purple: '#7c3aed', cyan: '#00d4ff', green: '#22c55e', amber: '#f59e0b', pink: '#f43f5e', teal: '#14b8a6', violet: '#8b5cf6' }

const GATEWAY_CFG = {
  cash:      { label: 'Cash / COD',       icon: 'payments',              color: C.green  },
  card:      { label: 'Card / Stripe',     icon: 'credit_card',           color: C.blue   },
  jazzcash:  { label: 'JazzCash',          icon: 'phone_android',         color: C.pink   },
  easypaisa: { label: 'Easypaisa',         icon: 'account_balance_wallet', color: C.teal  },
  bank:      { label: 'Bank Transfer',     icon: 'account_balance',       color: C.purple },
  credit:    { label: 'Store Credit',      icon: 'loyalty',               color: C.amber  },
}

const PAY_STATUS_CFG = {
  paid:     { color: C.green,  bg: C.green  + '18', border: C.green  + '40', icon: 'check_circle',          label: 'Paid'     },
  pending:  { color: C.amber,  bg: C.amber  + '18', border: C.amber  + '40', icon: 'schedule',              label: 'Pending'  },
  failed:   { color: C.pink,   bg: C.pink   + '18', border: C.pink   + '40', icon: 'cancel',                label: 'Failed'   },
  refunded: { color: '#6b7280',bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', icon: 'settings_backup_restore', label: 'Refunded' },
}

function PayBadge({ status }) {
  const cfg = PAY_STATUS_CFG[status] || PAY_STATUS_CFG.pending
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
      <span className="material-symbols-outlined text-[11px]">{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}

// ── Animated counter ──────────────────────────────────────
function Counter({ value, prefix = '', decimals = 0, color }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
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
    <span style={{ color }} className="font-display font-black text-[26px] leading-none">
      {prefix}{decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString()}
    </span>
  )
}

// ── Mini sparkline SVG ────────────────────────────────────
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1)
  const w = 80, h = 28
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ')
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Gateway donut ring ────────────────────────────────────
function GatewayRing({ splits, total }) {
  const entries = Object.entries(splits).filter(([, v]) => v > 0)
  if (!entries.length) return (
    <div className="flex items-center justify-center h-[140px]">
      <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No data yet</p>
    </div>
  )
  const size = 140, cx = 70, cy = 70, r = 52, stroke = 14
  const circ = 2 * Math.PI * r
  let offset = 0
  const segments = entries.map(([key, val]) => {
    const pct = val / total
    const dash = pct * circ
    const seg = { key, val, pct, dash, offset, color: GATEWAY_CFG[key]?.color || C.blue }
    offset += dash
    return seg
  })
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        {segments.map(s => (
          <circle key={s.key} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${s.dash - 2} ${circ - s.dash + 2}`}
            strokeDashoffset={-s.offset}
            style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        ))}
      </svg>
      <div className="space-y-1.5 flex-1">
        {segments.map(s => (
          <div key={s.key} className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>{GATEWAY_CFG[s.key]?.label || s.key}</span>
            </div>
            <span className="font-bold" style={{ color: s.color }}>{(s.pct * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Live ticker ───────────────────────────────────────────
function LiveTicker({ orders }) {
  const paid = orders.filter(o => o.payment?.status === 'paid').slice(0, 8)
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (paid.length < 2) return
    const t = setInterval(() => setIdx(i => (i + 1) % paid.length), 2800)
    return () => clearInterval(t)
  }, [paid.length])
  if (!paid.length) return null
  const o = paid[idx]
  return (
    <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px]"
      style={{ background: C.green + '10', border: `1px solid ${C.green}25` }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.green }} />
      <span style={{ color: C.green }} className="font-bold">+Rs.{(o.pricing?.total || 0).toLocaleString()}</span>
      <span style={{ color: 'rgba(255,255,255,0.4)' }}>· {o.customerName || 'Customer'} · {GATEWAY_CFG[o.payment?.method]?.label || 'Cash'}</span>
    </motion.div>
  )
}

export default function Payments() {
  const activeShop = useAuthStore((s) => s.activeShop)
  const addEvent   = useAppStore((s) => s.addEvent)
  const [page, setPage]                   = useState(1)
  const [filterStatus, setFilterStatus]   = useState('')
  const [simulatingOrder, setSimulatingOrder] = useState(null)

  const { data, isLoading } = useOrdersByShop(activeShop?._id, { page, limit: 50 })
  const orders = data?.data?.orders || []

  // ── Derived stats ─────────────────────────────────────
  const paid      = orders.filter(o => o.payment?.status === 'paid')
  const pending   = orders.filter(o => o.payment?.status === 'pending')
  const failed    = orders.filter(o => o.payment?.status === 'failed')
  const refunded  = orders.filter(o => o.payment?.status === 'refunded')

  const totalCollected   = paid.reduce((s, o) => s + (o.pricing?.total || 0), 0)
  const pendingAmount    = pending.reduce((s, o) => s + (o.pricing?.total || 0), 0)
  const avgTxn           = paid.length ? totalCollected / paid.length : 0

  const digitalOrders    = orders.filter(o => o.payment?.method && o.payment.method !== 'cash')
  const digitalPaid      = digitalOrders.filter(o => o.payment?.status === 'paid').length
  const successRate       = digitalOrders.length ? (digitalPaid / digitalOrders.length) * 100 : 100

  const gatewaySplits    = orders.reduce((acc, o) => {
    const m = o.payment?.method || 'cash'
    acc[m] = (acc[m] || 0) + (o.pricing?.total || 0)
    return acc
  }, {})
  const totalAll = Object.values(gatewaySplits).reduce((s, v) => s + v, 0) || 1

  // Sparkline data — last 7 paid orders amounts
  const sparkData = paid.slice(-7).map(o => o.pricing?.total || 0)

  // Filtered rows
  const filtered = filterStatus
    ? orders.filter(o => o.payment?.status === filterStatus)
    : orders

  const kpis = [
    { label: 'Total Collected',   value: totalCollected, prefix: 'Rs.', color: C.green,  icon: 'payments',        spark: sparkData },
    { label: 'Pending Amount',    value: pendingAmount,  prefix: 'Rs.', color: C.amber,  icon: 'hourglass_empty', spark: null },
    { label: 'Avg Transaction',   value: avgTxn,         prefix: 'Rs.', color: C.blue,   icon: 'analytics',       spark: null },
    { label: 'Digital Success',   value: successRate,    prefix: '',    color: C.teal,   icon: 'speed',           spark: null, suffix: '%' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[28px] font-black text-white tracking-tight">Payments Hub</h2>
          <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Transaction channels, gateway splits, and checkout metrics
          </p>
        </div>
        <AnimatePresence mode="wait">
          <LiveTicker orders={orders} />
        </AnimatePresence>
      </div>

      {!activeShop ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="material-symbols-outlined text-[48px] block mb-3" style={{ color: C.blue }}>credit_card</span>
          <p className="text-white font-bold text-[16px] mb-1">No Active Shop Selected</p>
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Select a shop to view payment logs.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                whileHover={{ y: -3, scale: 1.02 }}
                className="rounded-2xl p-5 relative overflow-hidden cursor-default"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl" style={{ background: k.color + '28' }} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: k.color + '22' }}>
                      <span className="material-symbols-outlined text-[18px]" style={{ color: k.color }}>{k.icon}</span>
                    </div>
                    {k.spark && <Sparkline data={k.spark} color={k.color} />}
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{k.label}</p>
                  <Counter value={k.value} prefix={k.prefix} decimals={0} color={k.color} />
                  {k.suffix && <span className="font-display font-black text-[26px] leading-none" style={{ color: k.color }}>{k.suffix}</span>}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Status pills summary */}
          <div className="flex gap-3 flex-wrap">
            {[
              { status: '',         label: 'All',      count: orders.length,   color: C.blue   },
              { status: 'paid',     label: 'Paid',     count: paid.length,     color: C.green  },
              { status: 'pending',  label: 'Pending',  count: pending.length,  color: C.amber  },
              { status: 'failed',   label: 'Failed',   count: failed.length,   color: C.pink   },
              { status: 'refunded', label: 'Refunded', count: refunded.length, color: '#6b7280'},
            ].map(p => (
              <button key={p.status} onClick={() => setFilterStatus(p.status)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                style={filterStatus === p.status
                  ? { color: p.color, background: p.color + '20', border: `1px solid ${p.color}40` }
                  : { color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{ background: p.color + '25', color: p.color }}>{p.count}</span>
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Transaction Table */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h3 className="font-bold text-white text-[14px]">Transaction Ledger</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold"
                  style={{ color: C.cyan, background: C.cyan + '15', border: `1px solid ${C.cyan}30` }}>
                  {filtered.length} records
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['TXN ID', 'Order', 'Customer', 'Method', 'Amount', 'Status', ''].map((h, i) => (
                        <th key={i} className={`px-4 py-3 text-[9px] font-bold uppercase tracking-wider ${i >= 4 ? 'text-right' : 'text-left'} ${i === 2 ? 'hidden md:table-cell' : ''}`}
                          style={{ color: 'rgba(255,255,255,0.25)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? [...Array(5)].map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {[...Array(7)].map((_, j) => (
                          <td key={j} className="px-4 py-3.5"><div className="h-3 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} /></td>
                        ))}
                      </tr>
                    )) : filtered.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-14 text-center">
                        <span className="material-symbols-outlined text-[44px] block mb-3" style={{ color: 'rgba(255,255,255,0.1)' }}>credit_card_off</span>
                        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No transactions yet.</p>
                      </td></tr>
                    ) : filtered.map((order, idx) => {
                      const gCfg = GATEWAY_CFG[order.payment?.method] || GATEWAY_CFG.cash
                      const sCfg = PAY_STATUS_CFG[order.payment?.status] || PAY_STATUS_CFG.pending
                      return (
                        <motion.tr key={order._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                          className="transition-colors"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td className="px-4 py-3.5">
                            {order.payment?.transactionId
                              ? <span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{order.payment.transactionId.slice(4, 16)}…</span>
                              : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-mono font-bold text-[12px] text-white">#{order.orderNumber?.slice(-6) || order._id?.slice(-6).toUpperCase()}</span>
                          </td>
                          <td className="px-4 py-3.5 hidden md:table-cell">
                            <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{order.customerName || '—'}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[13px]" style={{ color: gCfg.color }}>{gCfg.icon}</span>
                              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{gCfg.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="font-bold text-[13px]" style={{ color: sCfg.color }}>
                              Rs.{(order.pricing?.total || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right"><PayBadge status={order.payment?.status} /></td>
                          <td className="px-4 py-3.5 text-right">
                            {order.payment?.status === 'pending' ? (
                              <button onClick={() => setSimulatingOrder(order)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                                style={{ color: '#fff', background: C.blue, boxShadow: `0 0 12px ${C.blue}50` }}>
                                Pay
                              </button>
                            ) : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>}
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Right panel */}
            <div className="space-y-4">
              {/* Gateway donut */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="font-bold text-white text-[13px] mb-4">Gateway Split</h3>
                <GatewayRing splits={gatewaySplits} total={totalAll} />
              </motion.div>

              {/* Payment health */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className="rounded-2xl p-5"
                style={{ background: `linear-gradient(135deg, ${C.blue}0a, ${C.purple}0a)`, border: `1px solid ${C.blue}20` }}>
                <h3 className="font-bold text-white text-[13px] mb-4">Payment Health</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Collection Rate', value: orders.length ? (paid.length / orders.length) * 100 : 0, color: C.green },
                    { label: 'Digital Adoption', value: orders.length ? (digitalOrders.length / orders.length) * 100 : 0, color: C.blue },
                    { label: 'Failure Rate', value: orders.length ? (failed.length / orders.length) * 100 : 0, color: C.pink },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>{m.label}</span>
                        <span className="font-bold" style={{ color: m.color }}>{m.value.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(m.value, 100)}%` }}
                          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.4 }}
                          className="h-1.5 rounded-full" style={{ background: m.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Quick stats */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="font-bold text-white text-[13px] mb-3">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Paid Orders',    value: paid.length,     color: C.green  },
                    { label: 'Pending',        value: pending.length,  color: C.amber  },
                    { label: 'Failed',         value: failed.length,   color: C.pink   },
                    { label: 'Refunded',       value: refunded.length, color: '#6b7280'},
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-3 text-center"
                      style={{ background: s.color + '10', border: `1px solid ${s.color}20` }}>
                      <p className="font-black text-[20px]" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[9px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                    </div>
                  ))}
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

// ── Payment Modal ─────────────────────────────────────────
function PaymentModal({ order, onClose, addEvent }) {
  const simulateMutation = useSimulatePayment()
  const [gateway, setGateway]   = useState('cash')
  const [forceFail, setForceFail] = useState(false)
  const [state, setState]       = useState('idle')
  const [stepIdx, setStepIdx]   = useState(0)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')

  const steps = [
    { label: 'Sandbox Handshake',            icon: 'handshake',             desc: `Connecting to mock ${gateway.toUpperCase()} network...` },
    { label: 'Account Verification',         icon: 'verified_user',         desc: 'Validating account balance and auth tokens...' },
    { label: 'Transaction Signature',        icon: 'key',                   desc: 'Signing transaction cryptographically...' },
    { label: 'AI Automation Triggers',       icon: 'auto_awesome',          desc: 'Syncing inventory, analytics, and invoice...' },
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
          onSuccess: (res) => {
            if (res?.success && res.data?.paymentResult === 'success') {
              setResult(res.data); setState('success')
              addEvent({ type: 'shopping_cart', message: `Payment confirmed: Order #${order.orderNumber}` })
            } else { setState('failed'); setError('Transaction declined by mock gateway.') }
          },
          onError: (err) => { setState('failed'); setError(err.response?.data?.error || 'Payment failed.') },
        })
      }
    }, 850)
  }

  // Processing screen
  if (state === 'processing') {
    const pct = ((stepIdx + 1) / steps.length) * 100
    return (
      <Backdrop onClose={() => {}}>
        <div className="text-center space-y-5 p-2">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 animate-pulse" style={{ borderColor: C.blue + '20' }} />
            <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: C.blue }} />
            <span className="material-symbols-outlined text-[28px]" style={{ color: C.blue }}>account_balance_wallet</span>
          </div>
          <div>
            <p className="font-bold text-white text-[17px] uppercase tracking-wider">Processing...</p>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Mode: <span className="font-bold" style={{ color: C.blue }}>{gateway.toUpperCase()}</span>
            </p>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: C.blue, boxShadow: `0 0 12px ${C.blue}` }} />
          </div>
          <div className="space-y-2 text-left">
            {steps.map((st, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[15px]" style={{ color: i < stepIdx ? C.green : i === stepIdx ? C.blue : 'rgba(255,255,255,0.15)' }}>
                  {i < stepIdx ? 'check_circle' : st.icon}
                </span>
                <span className="text-[12px]" style={{ color: i < stepIdx ? 'rgba(255,255,255,0.5)' : i === stepIdx ? '#fff' : 'rgba(255,255,255,0.2)' }}>
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Backdrop>
    )
  }

  // Failed screen
  if (state === 'failed') return (
    <Backdrop onClose={onClose}>
      <div className="text-center space-y-5 p-2">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: C.pink + '15', border: `1px solid ${C.pink}30` }}>
          <span className="material-symbols-outlined text-[32px]" style={{ color: C.pink }}>error</span>
        </div>
        <div>
          <p className="font-black text-white text-[18px] uppercase">Transaction Failed</p>
          <p className="text-[12px] mt-1" style={{ color: C.pink }}>{error}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={run} className="py-2.5 rounded-xl text-[12px] font-bold transition-all" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}>Retry</button>
          <button onClick={onClose} className="py-2.5 rounded-xl text-[12px] font-bold transition-all" style={{ background: C.blue, color: '#fff', boxShadow: `0 0 16px ${C.blue}50` }}>Close</button>
        </div>
      </div>
    </Backdrop>
  )

  // Success / Invoice screen
  if (state === 'success') {
    const inv = result?.invoice
    return (
      <Backdrop onClose={onClose}>
        <div className="max-h-[78vh] overflow-y-auto space-y-4 p-1">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ background: C.green + '20', border: `1px solid ${C.green}40` }}>
              <span className="material-symbols-outlined text-[24px]" style={{ color: C.green }}>task_alt</span>
            </div>
            <p className="font-black text-white text-[18px] uppercase">Payment Complete</p>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.green }}>All automations triggered</p>
          </div>

          {/* Thermal receipt */}
          <div className="bg-white text-black rounded-2xl p-5 font-mono text-[11px] space-y-3 shadow-xl">
            <div className="text-center border-b border-dashed border-neutral-300 pb-3">
              <p className="font-extrabold text-[14px] uppercase">{inv?.shop?.name}</p>
              <p className="text-neutral-500 text-[10px]">{inv?.shop?.phone}</p>
            </div>
            <div className="space-y-0.5">
              <p><b>Invoice:</b> {inv?.invoiceNumber}</p>
              <p><b>Date:</b> {new Date(inv?.payment?.processedAt).toLocaleString()}</p>
              <p><b>Customer:</b> {inv?.customer?.name} · {inv?.customer?.phone}</p>
            </div>
            <div className="border-t border-b border-dashed border-neutral-300 py-2 space-y-1">
              {inv?.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-neutral-600">
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="mx-2">{item.qty}×Rs.{item.price}</span>
                  <span className="font-bold">Rs.{item.total}</span>
                </div>
              ))}
            </div>
            <div className="text-right space-y-0.5">
              <p><b>Subtotal:</b> Rs.{inv?.pricing?.subtotal}</p>
              <p className="font-extrabold text-[13px] border-t border-dashed border-neutral-300 pt-1 mt-1">
                TOTAL: Rs.{inv?.pricing?.total}
              </p>
            </div>
            <div className="text-center text-neutral-400 text-[9px] border-t border-dashed border-neutral-300 pt-2">
              <p className="font-bold text-neutral-600 uppercase">via {inv?.payment?.method}</p>
              <p>TXN: {inv?.payment?.transactionId}</p>
            </div>
          </div>

          {/* Automation log */}
          <div className="rounded-xl p-4 space-y-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>System Automations</p>
            {[
              { icon: 'inventory_2', text: 'Stock decremented', color: C.green },
              { icon: 'insights',    text: 'Analytics updated', color: C.blue  },
              { icon: 'auto_awesome',text: 'AI demand parsed',  color: C.purple},
            ].map(a => (
              <div key={a.text} className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px]" style={{ color: a.color }}>{a.icon}</span>
                <span className="text-[12px] text-white">{a.text}</span>
                <span className="material-symbols-outlined text-[13px] ml-auto" style={{ color: C.green }}>check</span>
              </div>
            ))}
            {result?.stockAlerts?.length > 0 && (
              <div className="rounded-lg p-2 text-[10px]" style={{ background: C.pink + '10', border: `1px solid ${C.pink}25`, color: C.pink }}>
                Low stock: {result.stockAlerts.map(a => a.name).join(', ')}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => alert('PDF receipt generation...')}
              className="py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff' }}>
              <span className="material-symbols-outlined text-[15px]">print</span> Print
            </button>
            <button onClick={onClose}
              className="py-2.5 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all"
              style={{ background: C.blue, color: '#fff', boxShadow: `0 0 16px ${C.blue}50` }}>
              <span className="material-symbols-outlined text-[15px]">done</span> Done
            </button>
          </div>
        </div>
      </Backdrop>
    )
  }

  // Idle / gateway selector
  return (
    <Backdrop onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.blue + '20', border: `1px solid ${C.blue}30` }}>
            <span className="material-symbols-outlined text-[20px]" style={{ color: C.blue }}>account_balance_wallet</span>
          </div>
          <div>
            <p className="font-black text-white text-[17px] uppercase">Pay Order</p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>#{order.orderNumber} · Rs.{order.pricing?.total?.toLocaleString()}</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Select Gateway</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(GATEWAY_CFG).map(([key, cfg]) => (
              <button key={key} onClick={() => setGateway(key)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all"
                style={gateway === key
                  ? { color: cfg.color, background: cfg.color + '20', border: `1px solid ${cfg.color}40` }
                  : { color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="material-symbols-outlined text-[15px]">{cfg.icon}</span>
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl" style={{ background: C.pink + '08', border: `1px solid ${C.pink}20` }}>
          <div onClick={() => setForceFail(f => !f)}
            className="w-10 h-5 rounded-full relative transition-all"
            style={{ background: forceFail ? C.pink : 'rgba(255,255,255,0.1)' }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
              style={{ left: forceFail ? '22px' : '2px' }} />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-white">Force Failure</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Simulate a declined transaction</p>
          </div>
        </label>

        <button onClick={run}
          className="w-full py-3 rounded-xl font-black text-[13px] uppercase tracking-wider transition-all"
          style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, color: '#fff', boxShadow: `0 0 20px ${C.blue}40` }}>
          Run Simulation
        </button>
      </div>
    </Backdrop>
  )
}

function Backdrop({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 15, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }} transition={{ type: 'spring', duration: 0.4 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl p-6 relative"
        style={{ background: '#0d1b35', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}>
            <span className="material-symbols-outlined text-[17px]">close</span>
          </button>
        )}
        {children}
      </motion.div>
    </div>
  )
}
