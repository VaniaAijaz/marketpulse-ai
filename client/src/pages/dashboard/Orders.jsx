import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrdersByShop, useUpdateOrderStatus, useOrderStats, useSimulatePayment } from '../../features/orders/orderHooks'
import useAuthStore from '../../store/useAuthStore'
import useUIStore from '../../store/useUIStore'
import useAppStore from '../../store/useAppStore'

// Analytics-matching color palette
const C = { blue: '#1390ff', purple: '#7c3aed', cyan: '#00d4ff', green: '#22c55e', amber: '#f59e0b', pink: '#f43f5e', teal: '#14b8a6', violet: '#8b5cf6' }

const STATUS_CFG = {
  pending:   { color: C.amber,  bg: C.amber  + '18', border: C.amber  + '40', icon: 'schedule',      label: 'Pending'   },
  confirmed: { color: C.blue,   bg: C.blue   + '18', border: C.blue   + '40', icon: 'verified',      label: 'Confirmed' },
  completed: { color: C.green,  bg: C.green  + '18', border: C.green  + '40', icon: 'check_circle',  label: 'Completed' },
  cancelled: { color: C.pink,   bg: C.pink   + '18', border: C.pink   + '40', icon: 'cancel',        label: 'Cancelled' },
  // legacy aliases
  delivered: { color: C.green,  bg: C.green  + '18', border: C.green  + '40', icon: 'check_circle',  label: 'Completed' },
}

// Valid next statuses per current status (mirrors state machine)
const NEXT_STATUSES = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  delivered: [],
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
      <span className="material-symbols-outlined text-[11px]">{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}

function OrderRow({ order, idx, onStatusChange, isUpdating, onSimulatePayment }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelInput, setShowCancelInput] = useState(false)
  const options = NEXT_STATUSES[order.status] || []

  const handleAction = (s) => {
    if (s === 'cancelled') {
      setShowCancelInput(true)
      setMenuOpen(false)
    } else {
      onStatusChange(order._id, s)
      setMenuOpen(false)
    }
  }

  const confirmCancel = () => {
    onStatusChange(order._id, 'cancelled', { reason: cancelReason })
    setShowCancelInput(false)
    setCancelReason('')
  }

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
        className="border-b transition-colors group"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <td className="px-5 py-4">
          <p className="text-[13px] text-white font-bold font-mono">#{order.orderNumber || order._id?.slice(-6)?.toUpperCase()}</p>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{new Date(order.createdAt).toLocaleString()}</p>
        </td>
        <td className="px-5 py-4 hidden md:table-cell">
          <p className="text-[12px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{order.customerPhone || '—'}</p>
        </td>
        <td className="px-5 py-4 hidden lg:table-cell">
          <p className="text-[11px] max-w-[180px] truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {(order.items || []).map(i => `${i.name} ×${i.qty || i.quantity}`).join(', ') || '—'}
          </p>
        </td>
        <td className="px-5 py-4 text-right">
          <span className="text-[14px] font-bold" style={{ color: C.green }}>
            Rs.{(order.pricing?.total ?? order.totalAmount)?.toLocaleString() || '0'}
          </span>
        </td>
        <td className="px-5 py-4 text-center">
          <StatusBadge status={order.status} />
        </td>
        <td className="px-5 py-4 text-center relative">
          {options.length > 0 ? (
            <div className="relative inline-block">
              <button onClick={() => setMenuOpen(o => !o)} disabled={isUpdating}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}>
                <span className="material-symbols-outlined text-[18px]">more_horiz</span>
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-8 z-20 rounded-xl p-1.5 shadow-2xl min-w-[165px]"
                    style={{ background: '#0d1b35', border: '1px solid rgba(255,255,255,0.12)' }}>
                    {order.status === 'pending' && order.payment?.status === 'pending' && (
                      <button onClick={() => { onSimulatePayment(order); setMenuOpen(false) }}
                        className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-bold transition-colors flex items-center gap-2"
                        style={{ color: C.blue }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
                        Pay & Simulate
                      </button>
                    )}
                    {options.map(s => {
                      const cfg = STATUS_CFG[s]
                      return (
                        <button key={s} onClick={() => handleAction(s)}
                          className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-2 capitalize"
                          style={{ color: cfg?.color || '#fff' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <span className="material-symbols-outlined text-[14px]">{cfg?.icon}</span>
                          Mark {cfg?.label}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
          )}
        </td>
      </motion.tr>

      {/* Inline cancel reason input */}
      <AnimatePresence>
        {showCancelInput && (
          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ background: C.pink + '08', borderBottom: `1px solid ${C.pink}20` }}>
            <td colSpan={6} className="px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[16px]" style={{ color: C.pink }}>cancel</span>
                <input value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                  placeholder="Cancellation reason (optional)..."
                  className="flex-1 px-3 py-1.5 rounded-lg text-[12px] text-white placeholder:text-white/20 focus:outline-none"
                  style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.pink}30` }}
                  onKeyDown={e => e.key === 'Enter' && confirmCancel()} />
                <button onClick={confirmCancel}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
                  style={{ color: C.pink, background: C.pink + '20', border: `1px solid ${C.pink}30` }}>
                  Confirm Cancel
                </button>
                <button onClick={() => setShowCancelInput(false)}
                  className="px-3 py-1.5 rounded-lg text-[11px] transition-colors"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>
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
  const activeShop = useAuthStore((s) => s.activeShop)
  const setActiveModal = useUIStore((s) => s.setActiveModal)
  const addEvent = useAppStore((s) => s.addEvent)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [simulatingOrder, setSimulatingOrder] = useState(null)

  const { data, isLoading } = useOrdersByShop(activeShop?._id, {
    page, limit: 12, status: statusFilter || undefined,
  })
  const { data: statsData } = useOrderStats(activeShop?._id)
  const updateStatusMutation = useUpdateOrderStatus()

  const orders = data?.data?.orders || []
  const pagination = data?.data?.pagination || {}
  const stats = statsData?.data || {}

  const handleStatusChange = (orderId, status, opts = {}) => {
    updateStatusMutation.mutate({ orderId, status, ...opts }, {
      onSuccess: () => addEvent({ type: 'shopping_cart', message: `Order #${orderId.slice(-6).toUpperCase()} marked as ${status}.` }),
    })
  }

  const kpis = [
    { label: 'Total Revenue',   value: `Rs.${(stats.totalRevenue || 0).toLocaleString()}`, icon: 'payments',      color: C.green  },
    { label: 'Total Orders',    value: stats.totalOrders  || 0,                             icon: 'shopping_bag',  color: C.blue   },
    { label: 'Pending',         value: stats.pendingOrders || 0,                            icon: 'schedule',      color: C.amber  },
    { label: 'Avg Order Value', value: `Rs.${Math.round(stats.avgOrderValue || 0).toLocaleString()}`, icon: 'analytics', color: C.purple },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="font-display text-[28px] font-black text-white tracking-tight">Order Ledger</h2>
          <p className="text-[12px] text-on-surface-variant mt-1">Transaction history across your network nodes</p>
        </div>
        <button
          onClick={() => setActiveModal('create-order')}
          className="bg-gradient-to-r from-primary to-secondary text-surface px-5 py-2.5 rounded-lg flex items-center gap-2 font-bold text-[12px] shadow-glow hover:shadow-[0_0_25px_rgba(0,212,255,0.5)] transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>Create Order
        </button>
      </div>

      {!activeShop ? (
        <div className="glass-panel rounded-2xl p-8 text-center border-tertiary/20">
          <span className="material-symbols-outlined text-[48px] text-tertiary mb-3 block">store</span>
          <p className="text-white font-bold text-[16px] mb-1">No Active Shop Selected</p>
          <p className="text-on-surface-variant text-[13px]">Select a shop node to view its transaction ledger.</p>
        </div>
      ) : (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpis.map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                whileHover={{ y: -3, scale: 1.02 }}
                className="rounded-2xl p-5 relative overflow-hidden cursor-default"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl" style={{ background: k.color + '30' }} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: k.color + '22' }}>
                      <span className="material-symbols-outlined text-[18px]" style={{ color: k.color }}>{k.icon}</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{k.label}</p>
                  <p className="font-display font-black text-[26px] text-white leading-none">{k.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { val: '',           label: 'All Orders' },
              { val: 'pending',    label: 'Pending'    },
              { val: 'confirmed',  label: 'Confirmed'  },
              { val: 'completed',  label: 'Completed'  },
              { val: 'cancelled',  label: 'Cancelled'  },
            ].map(({ val, label }) => {
              const cfg = STATUS_CFG[val]
              const active = statusFilter === val
              return (
                <button key={val} onClick={() => { setStatusFilter(val); setPage(1) }}
                  className="px-4 py-2 rounded-lg text-[11px] font-medium transition-all"
                  style={active
                    ? { color: cfg?.color || C.blue, background: (cfg?.color || C.blue) + '20', border: `1px solid ${(cfg?.color || C.blue)}40` }
                    : { color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {label}
                </button>
              )
            })}
          </div>

          {/* Orders Table */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Actions'].map((h, i) => (
                      <th key={h} className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider ${
                        i === 0 ? 'text-left' : i === 1 ? 'text-left hidden md:table-cell' : i === 2 ? 'text-left hidden lg:table-cell' : i === 3 ? 'text-right' : 'text-center'
                      }`} style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {[...Array(6)].map((_, j) => (
                          <td key={j} className="px-5 py-4"><div className="h-3 bg-white/5 rounded animate-pulse" /></td>
                        ))}
                      </tr>
                    ))
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-3">receipt_long</span>
                        <p className="text-on-surface-variant text-[13px]">No orders found. Create your first transaction.</p>
                      </td>
                    </tr>
                  ) : (
                    orders.map((order, i) => (
                      <OrderRow
                        key={order._id}
                        order={order}
                        idx={i}
                        onStatusChange={handleStatusChange}
                        isUpdating={updateStatusMutation.isPending}
                        onSimulatePayment={setSimulatingOrder}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/8">
                <span className="text-[11px] text-on-surface-variant">Page {pagination.page} of {pagination.pages}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded-lg text-[11px] bg-white/5 border border-white/10 text-on-surface-variant hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30">← Prev</button>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="px-3 py-1 rounded-lg text-[11px] bg-white/5 border border-white/10 text-on-surface-variant hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30">Next →</button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}

      {simulatingOrder && (
        <PaymentSimulationModal
          order={simulatingOrder}
          onClose={() => setSimulatingOrder(null)}
        />
      )}
    </div>
  )
}

// ─── Modal Backdrop Helper for Orders.jsx ──────────────────────────────
function ModalBackdrop({ onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.45 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#0e1115] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
        {children}
      </motion.div>
    </div>
  )
}

// ─── Payment Simulation Modal for existing orders ─────────────────────
function PaymentSimulationModal({ order, onClose }) {
  const addEvent = useAppStore((s) => s.addEvent)
  const simulatePaymentMutation = useSimulatePayment()

  const [gateway, setGateway] = useState('cod')
  const [forceFail, setForceFail] = useState(false)
  const [simulationState, setSimulationState] = useState('idle') // 'idle', 'processing', 'invoice', 'failed'
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [paymentResponseData, setPaymentResponseData] = useState(null)
  const [error, setError] = useState('')

  const steps = [
    { label: 'Sandbox Handshake', desc: `Connecting to mock ${gateway.toUpperCase()} secure network...` },
    { label: 'Account Verification', desc: 'Validating mock account balance and authorization tokens...' },
    { label: 'Generating Transaction Signature', desc: 'Signing transaction cryptographically and logging receipt...' },
    { label: 'AI Business Automation Triggers', desc: 'Running inventory, analytics sync, and invoice compilation...' }
  ]

  const runSimulation = () => {
    setSimulationState('processing')
    setCurrentStepIndex(0)
    setError('')

    let step = 0
    const interval = setInterval(() => {
      step += 1
      if (step < 3) {
        setCurrentStepIndex(step)
      } else {
        clearInterval(interval)
        setCurrentStepIndex(3)
        // Hit simulated payment API
        simulatePaymentMutation.mutate(
          { orderId: order._id, gateway, forceFail },
          {
            onSuccess: (res) => {
              if (res?.success) {
                if (res.data?.paymentResult === 'success') {
                  setPaymentResponseData(res.data)
                  setSimulationState('invoice')
                  addEvent({ 
                    type: 'shopping_cart', 
                    message: `Mock payment successful for order #${order.orderNumber || 'NEW'}` 
                  })
                } else {
                  setSimulationState('failed')
                  setError('Simulated Transaction Denied by Mock Gateway.')
                }
              } else {
                setSimulationState('failed')
                setError(res?.error || 'Simulated checkout failed.')
              }
            },
            onError: (err) => {
              setSimulationState('failed')
              setError(err.response?.data?.error || 'Failed to simulate payment checkout.')
            }
          }
        )
      }
    }, 900)
  }

  const handlePrintReceipt = () => {
    alert('Simulating PDF Receipt Generation and POS Print Job... Done!')
  }

  if (simulationState === 'processing') {
    const currentStep = steps[currentStepIndex]
    const pct = ((currentStepIndex + 1) / steps.length) * 100
    return (
      <ModalBackdrop onClose={() => {}}>
        <div className="text-center p-6 space-y-6">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-[#1390ff]/10 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-t-[#1390ff] animate-spin" />
            <span className="material-symbols-outlined text-[32px] text-[#1390ff]">account_balance_wallet</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-[18px] font-bold text-white uppercase tracking-wider font-sora">
              Payment Processing...
            </h3>
            <p className="text-[12px] text-white/50">
              Active Mode: <span className="font-bold text-[#1390ff] capitalize">{gateway} Simulation</span>
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
            <div className="bg-[#1390ff] h-full transition-all duration-500 rounded-full shadow-[0_0_15px_rgba(19,144,255,0.8)]" style={{ width: `${pct}%` }} />
          </div>

          {/* Current Step Description */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-left min-h-[90px] flex flex-col justify-center">
            <p className="text-[10px] text-[#1390ff] font-bold uppercase tracking-widest">{currentStep?.label}</p>
            <p className="text-[12px] text-white/80 mt-1 font-medium">{currentStep?.desc}</p>
          </div>

          {/* Step list details */}
          <div className="space-y-2.5 text-left border-t border-white/10 pt-4">
            {steps.map((st, idx) => {
              const isDone = idx < currentStepIndex
              const isActive = idx === currentStepIndex
              return (
                <div key={idx} className="flex items-center gap-3 transition-colors">
                  <span className={`material-symbols-outlined text-[16px] ${
                    isDone ? 'text-secondary' : isActive ? 'text-[#1390ff] animate-pulse' : 'text-white/20'
                  }`}>
                    {isDone ? 'check_circle' : 'pending'}
                  </span>
                  <span className={`text-[12px] font-semibold ${
                    isDone ? 'text-white/60' : isActive ? 'text-white font-bold' : 'text-white/30'
                  }`}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </ModalBackdrop>
    )
  }

  if (simulationState === 'failed') {
    return (
      <ModalBackdrop onClose={onClose}>
        <div className="text-center p-6 space-y-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
            <span className="material-symbols-outlined text-[36px]">error</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-[20px] font-extrabold text-white uppercase tracking-wider font-sora">
              Simulation Failed
            </h3>
            <p className="text-[12px] text-red-400 font-medium">
              {error || 'Transaction was declined by the mock gateway.'}
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-left space-y-2">
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Troubleshooting Option</p>
            <p className="text-[12px] text-white/70">
              The payment simulation was rejected. You can turn off <strong>Force Payment Failure</strong> or try another gateway mode.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={runSimulation}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[12px] font-bold uppercase transition-all"
            >
              Retry Simulation
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#1390ff] text-white text-[12px] font-bold uppercase shadow-[0_0_20px_rgba(19,144,255,0.45)] hover:bg-[#0f7bcc] transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </ModalBackdrop>
    )
  }

  if (simulationState === 'invoice') {
    const res = paymentResponseData
    const invoice = res?.invoice
    return (
      <ModalBackdrop onClose={onClose}>
        <div className="max-h-[75vh] overflow-y-auto p-1 space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center mx-auto text-secondary">
              <span className="material-symbols-outlined text-[24px]">task_alt</span>
            </div>
            <h3 className="text-[20px] font-black text-white uppercase tracking-wider font-sora">
              Payment Completed!
            </h3>
            <p className="text-[11px] text-secondary font-bold uppercase tracking-widest">
              AI Automations Triggered Successfully
            </p>
          </div>

          {/* Receipt Box - Thermal Paper design */}
          <div className="bg-white text-black p-5 rounded-2xl border border-neutral-200 shadow-xl space-y-4 font-mono text-[11px] relative overflow-hidden select-none">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-200 to-transparent" />
            
            <div className="text-center border-b border-dashed border-neutral-300 pb-3">
              <h4 className="font-extrabold text-[14px] uppercase tracking-wide">{invoice?.shop?.name}</h4>
              <p className="text-neutral-500 text-[10px] mt-0.5">{invoice?.shop?.address}</p>
              <p className="text-neutral-500 text-[10px]">{invoice?.shop?.phone}</p>
            </div>

            <div className="space-y-1">
              <p><span className="font-bold">Invoice No:</span> {invoice?.invoiceNumber}</p>
              <p><span className="font-bold">Date:</span> {new Date(invoice?.payment?.processedAt).toLocaleString()}</p>
              <p><span className="font-bold">Customer Name:</span> {invoice?.customer?.name}</p>
              <p><span className="font-bold">Customer Phone:</span> {invoice?.customer?.phone}</p>
            </div>

            {/* Items Table */}
            <div className="border-t border-b border-dashed border-neutral-300 py-3 space-y-1.5">
              <div className="flex justify-between font-bold text-neutral-800">
                <span className="w-1/2">Item Description</span>
                <span className="w-1/4 text-center">Qty × Price</span>
                <span className="w-1/4 text-right">Total</span>
              </div>
              {invoice?.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-neutral-600">
                  <span className="w-1/2 truncate">{item.name}</span>
                  <span className="w-1/4 text-center">{item.qty} × ${item.price.toFixed(2)}</span>
                  <span className="w-1/4 text-right">${item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-1 text-right">
              <p><span className="font-bold">Subtotal:</span> ${invoice?.pricing?.subtotal?.toFixed(2)}</p>
              {invoice?.pricing?.discount > 0 && <p className="text-red-600"><span className="font-bold">Discount:</span> -${invoice?.pricing?.discount?.toFixed(2)}</p>}
              {invoice?.pricing?.tax > 0 && <p><span className="font-bold">Tax:</span> +${invoice?.pricing?.tax?.toFixed(2)}</p>}
              <div className="flex justify-between font-extrabold text-[13px] text-black border-t border-dashed border-neutral-300 pt-2 mt-2">
                <span>TOTAL AMOUNT PAID</span>
                <span>${invoice?.pricing?.total?.toFixed(2)}</span>
              </div>
            </div>

            {/* Transaction Data */}
            <div className="border-t border-dashed border-neutral-300 pt-3 text-center text-neutral-500 text-[9px] space-y-0.5">
              <p className="uppercase font-bold text-neutral-700">Payment simulated via {invoice?.payment?.method}</p>
              <p className="font-mono">TXN: {invoice?.payment?.transactionId}</p>
              <p className="mt-1">THANK YOU FOR YOUR TRANSACTION!</p>
            </div>
          </div>

          {/* AI Automations Event Checklist */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3 text-left">
            <h4 className="text-[10px] text-white/40 uppercase tracking-widest font-bold">AI & System Automation logs</h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">inventory_2</span>
                <div>
                  <p className="text-[12px] font-bold text-white">📦 Stock Quantities Adjusted</p>
                  <p className="text-[10px] text-white/50">Inventory decremented dynamically. minimum level clamped.</p>
                  {res?.stockAlerts?.length > 0 && (
                    <div className="mt-1.5 p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-[9px]">
                      ⚠️ <strong>Low Stock Alert:</strong> {res.stockAlerts.map(a => `${a.name} (Stock: ${a.currentStock})`).join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">insights</span>
                <div>
                  <p className="text-[12px] font-bold text-white">📊 Analytics Ledger Recalculated</p>
                  <p className="text-[10px] text-white/50">Shop aggregates rebuilt. Today's stats updated on dashboard in real-time.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">trending_up</span>
                <div>
                  <p className="text-[12px] font-bold text-white">🤖 AI Demand Intelligence Updated</p>
                  <p className="text-[10px] text-white/50">Trend parsed. <em>{res?.demandInsights?.predictedNextDemand}</em></p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handlePrintReceipt}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[12px] font-bold uppercase transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">print</span> Print Slip
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#1390ff] text-white text-[12px] font-bold uppercase shadow-[0_0_20px_rgba(19,144,255,0.45)] hover:bg-[#0f7bcc] transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">done</span> Finish & Sync
            </button>
          </div>
        </div>
      </ModalBackdrop>
    )
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1390ff]/20 to-[#005eff]/20 flex items-center justify-center border border-[#1390ff]/30">
          <span className="material-symbols-outlined text-[#1390ff] text-[20px] font-bold">account_balance_wallet</span>
        </div>
        <div>
          <h2 className="text-[20px] font-extrabold text-white font-sora uppercase">Pay Order</h2>
          <p className="text-[11px] text-white/50">Simulate payment for Order #{order.orderNumber || order._id?.slice(-6)?.toUpperCase()}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Order specs */}
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 text-left">
          <p className="text-[12px] text-white/80"><span className="text-white/40">Customer:</span> <strong className="text-white font-bold">{order.customerName || 'Guest'}</strong> ({order.customerPhone || '—'})</p>
          <p className="text-[12px] text-white/80"><span className="text-white/40">Total Amount:</span> <strong className="text-[#1390ff] font-extrabold">${(order.pricing?.total ?? order.totalAmount)?.toFixed(2)}</strong></p>
          <p className="text-[11px] text-white/50 mt-2 truncate"><span className="text-white/30">Items:</span> {(order.items || []).map(i => `${i.name} ×${i.qty || i.quantity}`).join(', ')}</p>
        </div>

        {/* Payment Simulation Setup */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3 text-left">
          <label className="block text-[10px] text-white/40 uppercase tracking-widest font-bold">Select Simulated Gateway</label>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <select
                value={gateway}
                onChange={e => setGateway(e.target.value)}
                className="w-full p-3 rounded-xl text-[12px] bg-black border border-white/10 text-white outline-none focus:border-[#1390ff]"
              >
                <option value="cod">Mock COD (Cash Mode)</option>
                <option value="jazzcash">Mock JazzCash Gateway</option>
                <option value="easypaisa">Mock Easypaisa Gateway</option>
                <option value="stripe">Mock Stripe Card Mode</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-white/60 hover:text-white p-3 border border-white/10 rounded-xl hover:bg-white/5 transition-all h-[46px]">
                <input
                  type="checkbox"
                  checked={forceFail}
                  onChange={e => setForceFail(e.target.checked)}
                  className="rounded bg-black border-white/10 text-[#1390ff] focus:ring-0 focus:ring-offset-0"
                />
                Force Payment Failure
              </label>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={runSimulation}
          className="w-full py-3 rounded-xl bg-[#1390ff] text-white font-bold text-[13px] shadow-[0_0_20px_rgba(19,144,255,0.45)] hover:bg-[#0f7bcc] transition-all duration-300 uppercase tracking-wider flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">credit_card</span> Start Payment Simulation
        </button>
      </div>
    </ModalBackdrop>
  )
}
