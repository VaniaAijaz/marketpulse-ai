import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrdersByShop, useUpdateOrderStatus, useOrderStats, useSimulatePayment } from '../../features/orders/orderHooks'
import useAuthStore from '../../store/useAuthStore'
import useUIStore from '../../store/useUIStore'
import useAppStore from '../../store/useAppStore'

const P = {
  card: '#000000', border: 'rgba(255,255,255,0.08)',
  text: '#ffffff', muted: 'rgba(255,255,255,0.5)', dim: 'rgba(255,255,255,0.25)',
  blue: '#3b82f6', indigo: '#6366f1', violet: '#8b5cf6', emerald: '#10b981',
  slate: '#94a3b8', rose: '#f43f5e', amber: '#f59e0b', cyan: '#06b6d4',
}
const FONT = "'Inter','Segoe UI',system-ui,sans-serif"
const R = '6px', R2 = '8px'

const STATUS_CFG = {
  pending:   { color: P.amber,   icon: 'schedule',     label: 'Pending'   },
  confirmed: { color: P.blue,    icon: 'verified',     label: 'Confirmed' },
  completed: { color: P.emerald, icon: 'check_circle', label: 'Completed' },
  cancelled: { color: P.rose,    icon: 'cancel',       label: 'Cancelled' },
  delivered: { color: P.emerald, icon: 'check_circle', label: 'Completed' },
}
const NEXT = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [], cancelled: [], delivered: [],
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: FONT, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', padding: '3px 9px', borderRadius: '4px', color: cfg.color, background: cfg.color + '15', border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  )
}

function OrderRow({ order, idx, onStatusChange, isUpdating, onSimulatePayment }) {
  const [menuOpen, setMenuOpen]         = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancel, setShowCancel]     = useState(false)
  const options = NEXT[order.status] || []

  const handleAction = (s) => {
    if (s === 'cancelled') { setShowCancel(true); setMenuOpen(false) }
    else { onStatusChange(order._id, s); setMenuOpen(false) }
  }

  return (
    <>
      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * .025 }}
        style={{ borderBottom: `1px solid ${P.border}`, transition: 'background .1s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <td style={{ padding: '12px 16px' }}>
          <p style={{ fontFamily: "'Courier New',monospace", fontSize: '12px', fontWeight: 700, color: P.text, margin: 0 }}>
            #{order.orderNumber?.slice(-8) || order._id?.slice(-6)?.toUpperCase()}
          </p>
          <p style={{ fontFamily: FONT, fontSize: '10px', color: P.dim, margin: '2px 0 0' }}>
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </td>
        <td style={{ padding: '12px 16px' }} className="hidden md:table-cell">
          <p style={{ fontFamily: "'Courier New',monospace", fontSize: '11px', color: P.muted, margin: 0 }}>
            {order.customerPhone || '—'}
          </p>
          {order.customerName && <p style={{ fontFamily: FONT, fontSize: '10px', color: P.dim, margin: '2px 0 0' }}>{order.customerName}</p>}
        </td>
        <td style={{ padding: '12px 16px' }} className="hidden lg:table-cell">
          <p style={{ fontFamily: FONT, fontSize: '11px', color: P.muted, margin: 0, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {(order.items || []).map(i => `${i.name} ×${i.qty || i.quantity}`).join(', ') || '—'}
          </p>
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
          <span style={{ fontFamily: FONT, fontSize: '13px', fontWeight: 700, color: P.emerald }}>
            Rs.{(order.pricing?.total ?? order.totalAmount)?.toLocaleString() || '0'}
          </span>
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
          <StatusBadge status={order.status} />
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'center', position: 'relative' }}>
          {options.length > 0 ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button onClick={() => setMenuOpen(v => !v)} disabled={isUpdating}
                style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: R, background: 'none', border: `1px solid transparent`, cursor: 'pointer', color: P.muted, transition: 'all .12s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.text }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = P.muted }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>more_horiz</span>
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div initial={{ opacity: 0, scale: .95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .95 }}
                    style={{ position: 'absolute', right: 0, top: '32px', zIndex: 20, background: '#0a0a0a', border: `1px solid ${P.border}`, borderRadius: R2, padding: '4px', minWidth: '160px', boxShadow: '0 16px 40px rgba(0,0,0,.7)' }}>
                    {order.status === 'pending' && order.payment?.status === 'pending' && (
                      <button onClick={() => { onSimulatePayment(order); setMenuOpen(false) }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 10px', borderRadius: R, fontFamily: FONT, fontSize: '12px', fontWeight: 600, color: P.blue, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>account_balance_wallet</span>
                        Pay & Simulate
                      </button>
                    )}
                    {options.map(s => {
                      const cfg = STATUS_CFG[s]
                      return (
                        <button key={s} onClick={() => handleAction(s)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 10px', borderRadius: R, fontFamily: FONT, fontSize: '12px', fontWeight: 500, color: cfg?.color || P.text, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{cfg?.icon}</span>
                          Mark {cfg?.label}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <span style={{ fontFamily: FONT, fontSize: '11px', color: P.dim }}>—</span>
          )}
        </td>
      </motion.tr>

      {/* Cancel reason row */}
      <AnimatePresence>
        {showCancel && (
          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: P.rose + '06', borderBottom: `1px solid ${P.rose}15` }}>
            <td colSpan={6} style={{ padding: '10px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: P.rose }}>cancel</span>
                <input value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                  placeholder="Cancellation reason (optional)..."
                  style={{ flex: 1, fontFamily: FONT, fontSize: '12px', padding: '6px 10px', borderRadius: R, background: 'rgba(0,0,0,0.4)', border: `1px solid ${P.rose}25`, color: P.text, outline: 'none' }}
                  onKeyDown={e => e.key === 'Enter' && (onStatusChange(order._id, 'cancelled', { reason: cancelReason }), setShowCancel(false))} />
                <button onClick={() => { onStatusChange(order._id, 'cancelled', { reason: cancelReason }); setShowCancel(false) }}
                  style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 600, padding: '6px 12px', borderRadius: R, background: P.rose + '15', border: `1px solid ${P.rose}30`, color: P.rose, cursor: 'pointer' }}>
                  Confirm
                </button>
                <button onClick={() => setShowCancel(false)}
                  style={{ fontFamily: FONT, fontSize: '11px', padding: '6px 10px', borderRadius: R, background: 'none', border: 'none', color: P.dim, cursor: 'pointer' }}>
                  Dismiss
                </button>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  )
}

export default function Orders() {
  const activeShop     = useAuthStore((s) => s.activeShop)
  const setActiveModal = useUIStore((s) => s.setActiveModal)
  const addEvent       = useAppStore((s) => s.addEvent)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]                 = useState(1)
  const [simulatingOrder, setSimulatingOrder] = useState(null)

  const { data, isLoading }    = useOrdersByShop(activeShop?._id, { page, limit: 12, status: statusFilter || undefined })
  const { data: statsData }    = useOrderStats(activeShop?._id)
  const updateStatusMut        = useUpdateOrderStatus()

  const orders     = data?.data?.orders     || []
  const pagination = data?.data?.pagination || {}
  const stats      = statsData?.data        || {}

  const handleStatusChange = (orderId, status, opts = {}) => {
    updateStatusMut.mutate({ orderId, status, ...opts }, {
      onSuccess: () => addEvent({ type: 'shopping_cart', message: `Order marked as ${status}.` }),
    })
  }

  const KPIS = [
    { label: 'Revenue',   value: `Rs.${(stats.totalRevenue || 0).toLocaleString()}`, icon: 'payments',     color: P.emerald },
    { label: 'Orders',    value: stats.totalOrders   || 0,                           icon: 'shopping_bag', color: P.blue    },
    { label: 'Pending',   value: stats.pendingOrders || 0,                           icon: 'schedule',     color: P.amber   },
    { label: 'Avg Order', value: `Rs.${Math.round(stats.avgOrderValue || 0).toLocaleString()}`, icon: 'analytics', color: P.violet },
  ]

  const FILTERS = [
    { val: '',          label: 'All'       },
    { val: 'pending',   label: 'Pending'   },
    { val: 'confirmed', label: 'Confirmed' },
    { val: 'completed', label: 'Completed' },
    { val: 'cancelled', label: 'Cancelled' },
  ]

  if (!activeShop) return (
    <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: FONT }}>
      <span className="material-symbols-outlined" style={{ fontSize: '44px', color: 'rgba(255,255,255,0.08)', display: 'block', marginBottom: '12px' }}>receipt_long</span>
      <p style={{ fontWeight: 700, fontSize: '16px', color: P.text, margin: '0 0 5px' }}>No Active Shop</p>
      <p style={{ fontSize: '13px', color: P.muted, margin: 0 }}>Select a shop to view orders.</p>
    </div>
  )

  return (
    <div style={{ fontFamily: FONT }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: '24px', color: P.text, margin: 0 }}>Order Ledger</h2>
          <p style={{ fontFamily: FONT, fontSize: '12px', color: P.muted, margin: '4px 0 0' }}>
            {activeShop.name} — Transaction history
          </p>
        </div>
        <button onClick={() => setActiveModal('create-order')}
          style={{ fontFamily: FONT, fontWeight: 500, fontSize: '12px', padding: '7px 14px', borderRadius: R, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>add_shopping_cart</span>
          Create Order
        </button>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '10px', marginBottom: '20px' }}>
        {KPIS.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .06 }}
            style={{ background: P.card, border: `1px solid ${k.color}18`, borderRadius: R2, padding: '14px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -6, right: -6, width: 44, height: 44, borderRadius: '50%', background: k.color + '18', filter: 'blur(14px)' }} />
            <div style={{ width: '30px', height: '30px', borderRadius: R, background: k.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: k.color }}>{k.icon}</span>
            </div>
            <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: '22px', color: k.color, margin: 0, lineHeight: 1 }}>{k.value}</p>
            <p style={{ fontFamily: FONT, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: P.dim, margin: '3px 0 0' }}>{k.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {FILTERS.map(({ val, label }) => {
          const col   = val ? (STATUS_CFG[val]?.color || P.blue) : P.blue
          const active = statusFilter === val
          return (
            <button key={val} onClick={() => { setStatusFilter(val); setPage(1) }}
              style={{ fontFamily: FONT, fontWeight: 500, fontSize: '12px', padding: '7px 14px', borderRadius: R, cursor: 'pointer', transition: 'all .12s',
                background: active ? col + '15' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? col + '40' : P.border}`,
                color: active ? col : P.muted }}>
              {label}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: R2, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${P.border}`, background: 'rgba(255,255,255,0.02)' }}>
                {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Actions'].map((h, i) => (
                  <th key={h}
                    style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.09em', color: P.dim, padding: '12px 16px', textAlign: i >= 3 ? (i === 3 ? 'right' : 'center') : 'left' }}
                    className={i === 1 ? 'hidden md:table-cell' : i === 2 ? 'hidden lg:table-cell' : ''}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${P.border}` }}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} style={{ padding: '12px 16px' }}>
                        <div style={{ height: '12px', borderRadius: R, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '56px 24px', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'rgba(255,255,255,0.08)', display: 'block', marginBottom: '10px' }}>receipt_long</span>
                    <p style={{ fontFamily: FONT, fontSize: '13px', color: P.dim, margin: 0 }}>No orders found. Create your first transaction.</p>
                  </td>
                </tr>
              ) : orders.map((order, i) => (
                <OrderRow key={order._id} order={order} idx={i}
                  onStatusChange={handleStatusChange}
                  isUpdating={updateStatusMut.isPending}
                  onSimulatePayment={setSimulatingOrder} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: `1px solid ${P.border}` }}>
            <span style={{ fontFamily: FONT, fontSize: '11px', color: P.dim }}>
              Page {pagination.page} of {pagination.pages}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[{ l: '← Prev', d: page === 1, fn: () => setPage(p => Math.max(1, p - 1)) },
                { l: 'Next →', d: page === pagination.pages, fn: () => setPage(p => Math.min(pagination.pages, p + 1)) }
              ].map(b => (
                <button key={b.l} onClick={b.fn} disabled={b.d}
                  style={{ fontFamily: FONT, fontSize: '11px', padding: '5px 12px', borderRadius: R, background: 'rgba(255,255,255,0.04)', border: `1px solid ${P.border}`, color: P.muted, cursor: b.d ? 'not-allowed' : 'pointer', opacity: b.d ? .3 : 1 }}>
                  {b.l}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment simulation modal */}
      {simulatingOrder && (
        <PaymentModal order={simulatingOrder} onClose={() => setSimulatingOrder(null)} />
      )}
    </div>
  )
}

// ── Payment Simulation Modal ──────────────────────────────
function PaymentModal({ order, onClose }) {
  const addEvent    = useAppStore((s) => s.addEvent)
  const simMut      = useSimulatePayment()
  const [gateway, setGateway]   = useState('cod')
  const [forceFail, setForceFail] = useState(false)
  const [state, setState]       = useState('idle')
  const [stepIdx, setStepIdx]   = useState(0)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')

  const STEPS = [
    { l: 'Sandbox Handshake',       d: 'Connecting to mock gateway...'           },
    { l: 'Account Verification',    d: 'Validating authorization tokens...'      },
    { l: 'Transaction Signature',   d: 'Signing cryptographically...'            },
    { l: 'AI Automation Triggers',  d: 'Syncing inventory & analytics...'        },
  ]

  const run = () => {
    setState('processing'); setStepIdx(0); setError('')
    let s = 0
    const iv = setInterval(() => {
      s++
      if (s < 3) setStepIdx(s)
      else {
        clearInterval(iv); setStepIdx(3)
        simMut.mutate({ orderId: order._id, gateway, forceFail }, {
          onSuccess: (res) => {
            if (res?.success && res.data?.paymentResult === 'success') {
              setResult(res.data); setState('success')
              addEvent({ type: 'shopping_cart', message: `Payment confirmed #${order.orderNumber}` })
            } else { setState('failed'); setError('Transaction declined by mock gateway.') }
          },
          onError: (err) => { setState('failed'); setError(err.response?.data?.error || 'Failed.') },
        })
      }
    }, 900)
  }

  const Backdrop = ({ children, closeable = true }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={closeable ? onClose : undefined}>
      <motion.div initial={{ scale: .96, y: 12, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: .96, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '440px', background: '#080808', border: `1px solid ${P.border}`, borderRadius: R2, padding: '24px', boxShadow: '0 40px 80px rgba(0,0,0,.7)', fontFamily: FONT, position: 'relative' }}>
        {closeable && (
          <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', width: '26px', height: '26px', borderRadius: R, background: 'none', border: `1px solid ${P.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.muted }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = P.text }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = P.muted }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
          </button>
        )}
        {children}
      </motion.div>
    </div>
  )

  if (state === 'processing') {
    const pct = ((stepIdx + 1) / STEPS.length) * 100
    return (
      <Backdrop closeable={false}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${P.blue}`, borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
            <span className="material-symbols-outlined" style={{ fontSize: '26px', color: P.blue }}>account_balance_wallet</span>
          </div>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '16px', color: P.text, margin: '0 0 4px' }}>Processing Payment...</p>
          <p style={{ fontFamily: FONT, fontSize: '11px', color: P.muted, margin: '0 0 16px' }}>Mode: <span style={{ color: P.blue, fontWeight: 600 }}>{gateway.toUpperCase()}</span></p>
          <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.07)', marginBottom: '16px' }}>
            <div style={{ height: '100%', borderRadius: '2px', background: P.blue, width: `${pct}%`, transition: 'width .5s ease' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
            {STEPS.map((st, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: i < stepIdx ? P.emerald : i === stepIdx ? P.blue : P.dim }}>
                  {i < stepIdx ? 'check_circle' : 'pending'}
                </span>
                <span style={{ fontFamily: FONT, fontSize: '12px', color: i < stepIdx ? P.muted : i === stepIdx ? P.text : P.dim, fontWeight: i === stepIdx ? 600 : 400 }}>
                  {st.l}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Backdrop>
    )
  }

  if (state === 'failed') return (
    <Backdrop>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: P.rose + '15', border: `1px solid ${P.rose}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '26px', color: P.rose }}>error</span>
        </div>
        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '16px', color: P.text, margin: '0 0 6px' }}>Simulation Failed</p>
        <p style={{ fontFamily: FONT, fontSize: '12px', color: P.rose, margin: '0 0 16px' }}>{error}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button onClick={run} style={{ fontFamily: FONT, fontWeight: 600, fontSize: '12px', padding: '9px', borderRadius: R, background: 'rgba(255,255,255,0.06)', border: `1px solid ${P.border}`, color: P.text, cursor: 'pointer' }}>Retry</button>
          <button onClick={onClose} style={{ fontFamily: FONT, fontWeight: 600, fontSize: '12px', padding: '9px', borderRadius: R, background: P.blue, border: 'none', color: '#fff', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </Backdrop>
  )

  if (state === 'success') {
    const inv = result?.invoice
    return (
      <Backdrop>
        <div style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: P.emerald + '15', border: `1px solid ${P.emerald}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '22px', color: P.emerald }}>task_alt</span>
            </div>
            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '15px', color: P.text, margin: '0 0 3px' }}>Payment Completed</p>
            <p style={{ fontFamily: FONT, fontSize: '11px', color: P.emerald, margin: 0 }}>All automations triggered</p>
          </div>
          {/* Thermal receipt */}
          <div style={{ background: '#fff', borderRadius: R, padding: '16px', fontFamily: "'Courier New',monospace", fontSize: '11px', color: '#1a1a1a', marginBottom: '12px' }}>
            <p style={{ textAlign: 'center', fontWeight: 800, fontSize: '13px', margin: '0 0 4px' }}>{inv?.shop?.name}</p>
            <p style={{ textAlign: 'center', color: '#555', fontSize: '10px', margin: '0 0 10px' }}>{inv?.shop?.phone}</p>
            <div style={{ borderTop: '1px dashed #ccc', paddingTop: '8px', marginBottom: '8px' }}>
              <p style={{ margin: '0 0 3px' }}><b>Invoice:</b> {inv?.invoiceNumber}</p>
              <p style={{ margin: '0 0 3px' }}><b>Date:</b> {new Date(inv?.payment?.processedAt).toLocaleString()}</p>
              <p style={{ margin: 0 }}><b>Customer:</b> {inv?.customer?.name} · {inv?.customer?.phone}</p>
            </div>
            <div style={{ borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', padding: '8px 0', marginBottom: '8px' }}>
              {inv?.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                  <span style={{ marginLeft: '8px' }}>{item.qty}×Rs.{item.price} = Rs.{item.total}</span>
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'right', fontWeight: 800, fontSize: '13px', margin: 0 }}>TOTAL: Rs.{inv?.pricing?.total}</p>
            <p style={{ textAlign: 'center', color: '#777', fontSize: '9px', marginTop: '8px', borderTop: '1px dashed #ccc', paddingTop: '6px' }}>
              via {inv?.payment?.method?.toUpperCase()} · TXN: {inv?.payment?.transactionId}
            </p>
          </div>
          {result?.stockAlerts?.length > 0 && (
            <div style={{ padding: '10px', borderRadius: R, background: P.rose + '08', border: `1px solid ${P.rose}20`, marginBottom: '10px' }}>
              <p style={{ fontFamily: FONT, fontSize: '11px', color: P.rose, margin: 0 }}>
                ⚠ Low Stock: {result.stockAlerts.map(a => `${a.name} (${a.currentStock})`).join(', ')}
              </p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button onClick={() => alert('Print job sent!')} style={{ fontFamily: FONT, fontWeight: 500, fontSize: '12px', padding: '9px', borderRadius: R, background: 'rgba(255,255,255,0.06)', border: `1px solid ${P.border}`, color: P.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>print</span> Print
            </button>
            <button onClick={onClose} style={{ fontFamily: FONT, fontWeight: 600, fontSize: '12px', padding: '9px', borderRadius: R, background: P.blue, border: 'none', color: '#fff', cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      </Backdrop>
    )
  }

  // Idle — gateway selector
  return (
    <Backdrop>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: R, background: P.blue + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: P.blue }}>account_balance_wallet</span>
        </div>
        <div>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '14px', color: P.text, margin: 0 }}>Pay Order</p>
          <p style={{ fontFamily: FONT, fontSize: '11px', color: P.muted, margin: '2px 0 0' }}>#{order.orderNumber} · Rs.{order.pricing?.total?.toLocaleString()}</p>
        </div>
      </div>

      <p style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: P.dim, margin: '0 0 8px' }}>Select Gateway</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
        {[
          { id: 'cod',       label: 'Cash / COD',    icon: 'payments'               },
          { id: 'card',      label: 'Card',          icon: 'credit_card'            },
          { id: 'jazzcash',  label: 'JazzCash',      icon: 'phone_android'          },
          { id: 'easypaisa', label: 'Easypaisa',     icon: 'account_balance_wallet' },
        ].map(g => (
          <button key={g.id} onClick={() => setGateway(g.id)}
            style={{ fontFamily: FONT, fontWeight: 500, fontSize: '12px', padding: '9px 10px', borderRadius: R, cursor: 'pointer', transition: 'all .12s', display: 'flex', alignItems: 'center', gap: '7px', textAlign: 'left',
              background: gateway === g.id ? P.blue + '15' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${gateway === g.id ? P.blue + '45' : P.border}`,
              color: gateway === g.id ? P.blue : P.muted }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{g.icon}</span>
            {g.label}
          </button>
        ))}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '16px', padding: '10px', borderRadius: R, background: 'rgba(255,255,255,0.03)', border: `1px solid ${P.border}` }}>
        <div onClick={() => setForceFail(v => !v)}
          style={{ width: '36px', height: '20px', borderRadius: '10px', background: forceFail ? P.rose : 'rgba(255,255,255,0.12)', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: forceFail ? '18px' : '2px', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.4)' }} />
        </div>
        <div>
          <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: '12px', color: P.text, margin: 0 }}>Force Failure</p>
          <p style={{ fontFamily: FONT, fontSize: '10px', color: P.dim, margin: '1px 0 0' }}>Simulate a declined transaction</p>
        </div>
      </label>

      <button onClick={run}
        style={{ width: '100%', fontFamily: FONT, fontWeight: 700, fontSize: '13px', padding: '11px', borderRadius: R, background: P.blue, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: `0 0 16px ${P.blue}35` }}>
        Run Simulation
      </button>
    </Backdrop>
  )
}
