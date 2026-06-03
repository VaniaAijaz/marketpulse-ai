import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import useUIStore from '../../store/useUIStore'
import useAuthStore from '../../store/useAuthStore'
import useAppStore from '../../store/useAppStore'
import { useUpsertCustomer } from '../../features/customers/customerHooks'
import { useCreateOrder, useSimulatePayment } from '../../features/orders/orderHooks'
import { useUpdateShopPlan } from '../../features/shops/shopHooks'
import { useProductsByShop } from '../../features/products/productHooks'
import { useBootstrapShop } from '../../hooks/useBootstrapShop'

// ─── Modal Backdrop ────────────────────────────────────────────────────
function ModalBackdrop({ onClose, children }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-black/90 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_30px_80px_rgba(0,0,0,0.8)] border border-white/10 relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Add Shop Modal ─────────────────────────────────────────────────────
function AddShopModal({ onClose }) {
  const user = useAuthStore((s) => s.user)
  const activeShop = useAuthStore((s) => s.activeShop)
  const hasShop = Boolean(user?.shopId || activeShop)

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="text-center py-4">
        <span className="material-symbols-outlined text-[40px] text-[#1390ff]/50 block mb-3 animate-pulse">store</span>
        <h2 className="font-display text-[20px] font-black text-white uppercase tracking-wider font-sora mb-2">
          {hasShop ? 'One shop per account' : 'Register via Sign Up'}
        </h2>
        <p className="text-[12px] text-white/50 mb-6 leading-relaxed">
          {hasShop && activeShop?.name ? (
            <>You manage <span className="text-[#1390ff] font-bold">{activeShop.name}</span>. Each email can only register one shop.</>
          ) : (
            'Create your account and shop at Register — pick city, area, and map location (no manual coordinates).'
          )}
        </p>
        <button 
          type="button" 
          onClick={onClose} 
          className="px-6 py-2.5 rounded-xl border border-[#1390ff]/30 text-[#1390ff] hover:bg-[#1390ff]/10 text-[12px] font-bold uppercase tracking-wider transition-all"
        >
          Close
        </button>
      </div>
    </ModalBackdrop>
  )
}

// ─── Add Customer Modal ──────────────────────────────────────────────────
function AddCustomerModal({ onClose }) {
  const activeShop = useAuthStore((s) => s.activeShop)
  const addEvent = useAppStore((s) => s.addEvent)
  const upsertMutation = useUpsertCustomer()
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.phone) { setError('Phone is required'); return }
    if (!activeShop?._id) { setError('No active shop selected'); return }
    upsertMutation.mutate(
      { ...form, shopId: activeShop._id },
      {
        onSuccess: (data) => {
          if (data?.success) {
            addEvent({ type: 'person_add', message: `Customer "${form.name || form.phone}" registered to ${activeShop.name}.` })
            onClose()
          }
        },
        onError: (err) => setError(err.response?.data?.error || 'Failed to register customer'),
      }
    )
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1390ff]/20 to-[#005eff]/20 flex items-center justify-center border border-[#1390ff]/30">
          <span className="material-symbols-outlined text-[#1390ff] text-[20px] font-bold">person_add</span>
        </div>
        <div>
          <h2 className="text-[20px] font-extrabold text-white font-sora uppercase">Add Customer</h2>
          <p className="text-[11px] text-white/50">Add a new customer to your shop</p>
        </div>
      </div>
      {error && <div className="mb-4 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-[12px] font-medium flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-red-400">error</span>{error}</div>}
      {!activeShop && <div className="mb-4 p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[11px]">⚠ No active shop selected. Select a shop from your profile first.</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1.5">Full Name</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Alex Chen" className="w-full p-3.5 rounded-xl text-[13px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-[#1390ff] focus:ring-1 focus:ring-[#1390ff] transition-all outline-none" />
        </div>
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1.5">Phone Identity <span className="text-red-400">*</span></label>
          <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+92 300 1234567" className="w-full p-3.5 rounded-xl text-[13px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-[#1390ff] focus:ring-1 focus:ring-[#1390ff] transition-all outline-none" />
        </div>
        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1.5">Email (Optional)</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="alex@company.com" className="w-full p-3.5 rounded-xl text-[13px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-[#1390ff] focus:ring-1 focus:ring-[#1390ff] transition-all outline-none" />
        </div>
        <button type="submit" disabled={upsertMutation.isPending || !activeShop} className="w-full py-3 rounded-xl bg-[#1390ff] text-white font-bold text-[14px] shadow-[0_0_20px_rgba(19,144,255,0.45)] hover:shadow-[0_0_30px_rgba(19,144,255,0.65)] hover:bg-[#0f7bcc] transition-all duration-300 active:scale-[0.98] mt-2 uppercase tracking-wider disabled:opacity-50">
          {upsertMutation.isPending ? 'Saving...' : 'Add Customer →'}
        </button>
      </form>
    </ModalBackdrop>
  )
}

// ─── Create Order Modal ──────────────────────────────────────────────────
function CreateOrderModal({ onClose }) {
  const activeShop = useAuthStore((s) => s.activeShop)
  const addEvent = useAppStore((s) => s.addEvent)
  const createOrderMutation = useCreateOrder()
  const simulatePaymentMutation = useSimulatePayment()
  const { data: productsData } = useProductsByShop(activeShop?._id)
  const products = productsData?.data?.products || []

  const [items, setItems] = useState([{ productId: '', name: '', price: 0, quantity: 1 }])
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  // Payment simulation states
  const [gateway, setGateway] = useState('cod')
  const [forceFail, setForceFail] = useState(false)
  const [simulationState, setSimulationState] = useState('idle') // 'idle', 'processing', 'invoice', 'failed'
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [paymentResponseData, setPaymentResponseData] = useState(null)
  const [createdOrderId, setCreatedOrderId] = useState(null)

  const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0)

  const addItem = () => setItems(p => [...p, { productId: '', name: '', price: 0, quantity: 1 }])
  const removeItem = (idx) => setItems(p => p.filter((_, i) => i !== idx))
  const updateItem = (idx, field, val) => setItems(p => p.map((item, i) => {
    if (i !== idx) return item
    if (field === 'productId') {
      const prod = products.find(p => p._id === val)
      return { ...item, productId: val, name: prod?.name || '', price: prod?.pricing?.sellingPrice || prod?.price || 0 }
    }
    return { ...item, [field]: field === 'quantity' ? parseInt(val) || 1 : val }
  }))

  const steps = [
    { label: 'Sandbox Handshake', desc: `Connecting to mock ${gateway.toUpperCase()} secure network...` },
    { label: 'Account Verification', desc: 'Validating mock account balance and authorization tokens...' },
    { label: 'Generating Transaction Signature', desc: 'Signing transaction cryptographically and logging receipt...' },
    { label: 'AI Business Automation Triggers', desc: 'Running inventory, analytics sync, and invoice compilation...' }
  ]

  const runSimulation = (orderId) => {
    setCreatedOrderId(orderId)
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
          { orderId, gateway, forceFail },
          {
            onSuccess: (res) => {
              if (res?.success) {
                if (res.data?.paymentResult === 'success') {
                  setPaymentResponseData(res.data)
                  setSimulationState('invoice')
                  addEvent({ 
                    type: 'shopping_cart', 
                    message: `Mock payment successful. Transaction ID: ${res.data.order?.payment?.transactionId}` 
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!activeShop?._id) { setError('No active shop selected'); return }
    if (!customerPhone.trim()) { setError('Customer phone number is required'); return }
    if (items.some(i => !i.name)) { setError('All items must have a product selected'); return }

    createOrderMutation.mutate(
      {
        shopId: activeShop._id,
        customerPhone: customerPhone.trim(),
        customerName: customerName.trim() || undefined,
        customerEmail: customerEmail.trim() || undefined,
        items: items.map(i => ({ productId: i.productId || undefined, name: i.name, price: i.price, qty: i.quantity })),
        pricing: { subtotal: total, total, discount: 0, tax: 0 },
        notes,
      },
      {
        onSuccess: (data) => {
          if (data?.success && data.data?._id) {
            addEvent({ type: 'shopping_cart', message: `Order #${data.data?.orderNumber || 'NEW'} placed as pending.` })
            runSimulation(data.data._id)
          }
        },
        onError: (err) => setError(err.response?.data?.error || 'Failed to create order'),
      }
    )
  }

  const handlePrintReceipt = () => {
    alert('Simulating PDF Receipt Generation and POS Print Job... Done!')
  }

  if (simulationState === 'processing') {
    const currentStep = steps[currentStepIndex]
    const pct = ((currentStepIndex + 1) / steps.length) * 100
    return (
      <ModalBackdrop onClose={() => {}}>
        <div className="text-center p-6 space-y-6 max-w-md w-full">
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
        <div className="text-center p-6 space-y-6 max-w-md w-full">
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
              onClick={() => runSimulation(createdOrderId)}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[12px] font-bold uppercase transition-all"
            >
              Retry Simulation
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#1390ff] text-white text-[12px] font-bold uppercase shadow-[0_0_20px_rgba(19,144,255,0.45)] hover:bg-[#0f7bcc] transition-all"
            >
              Exit to Ledger
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
        <div className="max-h-[85vh] overflow-y-auto w-full max-w-lg p-5 space-y-5">
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
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
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
          <span className="material-symbols-outlined text-[#1390ff] text-[20px] font-bold">shopping_cart_checkout</span>
        </div>
        <div>
          <h2 className="text-[20px] font-extrabold text-white font-sora uppercase">Create Order</h2>
          <p className="text-[11px] text-white/50">Log a new transaction to the ledger</p>
        </div>
      </div>
      {error && <div className="mb-3 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-[12px] font-medium flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-red-400">error</span>{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1.5">Customer Phone *</label>
            <input required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+92 300 0000000" className="w-full p-3.5 rounded-xl text-[13px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-[#1390ff] outline-none transition-all" />
          </div>
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1.5">Customer Name</label>
            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Ali Khan" className="w-full p-3.5 rounded-xl text-[13px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-[#1390ff] outline-none transition-all" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1.5">Customer Email (Optional)</label>
          <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="customer@email.com" className="w-full p-3.5 rounded-xl text-[13px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-[#1390ff] outline-none transition-all" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Order Items</label>
            <button type="button" onClick={addItem} className="text-[10px] text-[#1390ff] hover:text-white flex items-center gap-1 font-bold transition-colors uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px]">add</span>Add Item
            </button>
          </div>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2">
                <div className="flex gap-2">
                  {products.length > 0 ? (
                    <select
                      value={item.productId}
                      onChange={e => updateItem(idx, 'productId', e.target.value)}
                      className="flex-1 p-2 rounded-lg text-[12px] bg-black border border-white/10 text-white outline-none"
                    >
                      <option value="">Select product...</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name} (${p.pricing?.sellingPrice || p.price})</option>)}
                    </select>
                  ) : (
                    <input
                      value={item.name}
                      onChange={e => updateItem(idx, 'name', e.target.value)}
                      placeholder="Item name"
                      className="flex-1 p-2 rounded-lg text-[12px] bg-black/40 border border-white/10 text-white placeholder:text-white/20 outline-none"
                    />
                  )}
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-red-400 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-white/40 uppercase tracking-widest mb-1 block">Price ($)</label>
                    <input type="number" min="0" step="0.01" value={item.price} readOnly className="w-full p-2 rounded-lg text-[12px] bg-white/5 border border-white/5 text-white/50 font-mono outline-none cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-[9px] text-white/40 uppercase tracking-widest mb-1 block">Quantity</label>
                    <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="w-full p-2 rounded-lg text-[12px] bg-black/40 border border-white/10 text-white font-mono outline-none" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1.5">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Order notes..." className="w-full p-3.5 rounded-xl text-[13px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 resize-none focus:border-[#1390ff] outline-none transition-all" />
        </div>

        {/* Payment Simulation Setup */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
          <label className="block text-[10px] text-white/40 uppercase tracking-widest font-bold">Payment Setup & Simulation</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] text-white/40 uppercase tracking-widest mb-1 block">Simulated Gateway</label>
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
            <div className="flex flex-col justify-end">
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

        <div className="flex items-center justify-between p-3 bg-[#1390ff]/5 rounded-xl border border-[#1390ff]/20">
          <span className="text-[12px] text-white/60 font-semibold">Total Amount</span>
          <span className="text-[20px] font-display font-black text-[#1390ff]">${total.toFixed(2)}</span>
        </div>

        <button type="submit" disabled={createOrderMutation.isPending || !activeShop} className="w-full py-3 rounded-xl bg-[#1390ff] text-white font-bold text-[14px] shadow-[0_0_20px_rgba(19,144,255,0.45)] hover:shadow-[0_0_30px_rgba(19,144,255,0.65)] hover:bg-[#0f7bcc] transition-all duration-300 active:scale-[0.98] uppercase tracking-wider disabled:opacity-50">
          {createOrderMutation.isPending ? 'Creating order...' : `Place Order & Checkout — $${total.toFixed(2)} →`}
        </button>
      </form>
    </ModalBackdrop>
  )
}

// ─── Upgrade Plan Modal ──────────────────────────────────────────────────
const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$0',
    period: '/mo',
    color: 'outline',
    features: ['50 AI messages/day', '1 Shop node', 'Basic analytics', 'Community support'],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '$29',
    period: '/mo',
    color: 'primary',
    features: ['500 AI messages/day', '3 Shop nodes', 'Advanced analytics', 'WhatsApp integration', 'Priority support'],
    recommended: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$79',
    period: '/mo',
    color: 'secondary',
    features: ['Unlimited AI messages', 'Unlimited shops', 'Full analytics suite', 'Multi-agent AI workflows', 'Dedicated support'],
  },
]

function UpgradePlanModal({ onClose }) {
  const activeShop = useAuthStore((s) => s.activeShop)
  const updatePlanMutation = useUpdateShopPlan()
  const [selectedPlan, setSelectedPlan] = useState(activeShop?.plan || 'basic')
  const [error, setError] = useState('')

  const handleUpgrade = () => {
    if (!activeShop?._id) { setError('No active shop selected'); return }
    updatePlanMutation.mutate(
      { shopId: activeShop._id, plan: selectedPlan },
      {
        onSuccess: () => onClose(),
        onError: (err) => setError(err.response?.data?.error || 'Failed to upgrade plan'),
      }
    )
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1390ff]/20 to-[#005eff]/20 flex items-center justify-center border border-[#1390ff]/30">
          <span className="material-symbols-outlined text-[#1390ff] text-[20px] font-bold">rocket_launch</span>
        </div>
        <div>
          <h2 className="text-[20px] font-extrabold text-white font-sora uppercase">Upgrade AI</h2>
          <p className="text-[11px] text-white/50">Unlock advanced retail intelligence capabilities</p>
        </div>
      </div>
      {error && <div className="mb-4 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-[12px] font-medium flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-red-400">error</span>{error}</div>}
      <div className="space-y-3 mb-5">
        {plans.map(plan => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-all relative overflow-hidden ${
              selectedPlan === plan.id
                ? 'border-[#1390ff]/60 bg-[#1390ff]/10 shadow-[0_0_20px_rgba(19,144,255,0.2)]'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            {plan.recommended && (
              <span className="absolute top-2 right-2 text-[9px] bg-[#1390ff]/20 text-[#1390ff] border border-[#1390ff]/30 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider font-sora">Recommended</span>
            )}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPlan === plan.id ? 'border-[#1390ff]' : 'border-white/20'}`}>
                  {selectedPlan === plan.id && <div className="w-2 h-2 rounded-full bg-[#1390ff]" />}
                </div>
                <span className="font-bold text-[14px] text-white font-sora uppercase">{plan.name}</span>
              </div>
              <span className="font-display font-black text-[18px] text-white">{plan.price}<span className="text-[11px] text-white/40 font-normal">{plan.period}</span></span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {plan.features.map(f => (
                <div key={f} className="flex items-center gap-1 text-[10px] text-white/50">
                  <span className="material-symbols-outlined text-[#1390ff] text-[12px] font-bold">check_circle</span>{f}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={handleUpgrade}
        disabled={updatePlanMutation.isPending || selectedPlan === activeShop?.plan}
        className="w-full py-3 rounded-xl bg-[#1390ff] text-white font-bold text-[14px] shadow-[0_0_20px_rgba(19,144,255,0.45)] hover:shadow-[0_0_30px_rgba(19,144,255,0.65)] hover:bg-[#0f7bcc] transition-all duration-300 active:scale-[0.98] uppercase tracking-wider disabled:opacity-50"
      >
        {updatePlanMutation.isPending ? 'Activating...' : selectedPlan === activeShop?.plan ? 'Current Plan Active' : `Activate ${plans.find(p => p.id === selectedPlan)?.name} Plan →`}
      </button>
    </ModalBackdrop>
  )
}

// ─── Dashboard Layout ────────────────────────────────────────────────────
export default function DashboardLayout() {
  const activeModal = useUIStore((s) => s.activeModal)
  const setActiveModal = useUIStore((s) => s.setActiveModal)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const close = () => setActiveModal(null)
  useBootstrapShop()

  return (
    <div className="min-h-screen bg-[#030303] text-white flex relative overflow-hidden">
      {/* Background reflections for premium dark dashboard theme */}
      <div className="absolute bottom-0 left-0 w-[45vh] h-[45vh] bg-[#1390ff]/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[45vh] h-[45vh] bg-[#005eff]/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Mobile Sidebar Overlay Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={toggleSidebar} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <Sidebar />
      <div 
        className={`flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-[240px]' : 'lg:pl-[56px]'
        }`}
      >
        <Navbar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Modal Controller */}
      {activeModal === 'add-shop'      && <AddShopModal      onClose={close} />}
      {activeModal === 'add-customer'  && <AddCustomerModal  onClose={close} />}
      {activeModal === 'create-order'  && <CreateOrderModal  onClose={close} />}
      {activeModal === 'upgrade-plan'  && <UpgradePlanModal  onClose={close} />}
    </div>
  )
}
