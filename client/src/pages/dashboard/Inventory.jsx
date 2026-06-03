import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useProductsByShop, useInventorySummary, useLowStockProducts,
  useCreateProduct, useUpdateProduct, useUpdateProductStock, useDeleteProduct,
} from '../../features/products/productHooks'
import { useGenerateMessage, useLatestRecommendations } from '../../features/ai/aiHooks'
import { useShopById } from '../../features/shops/shopHooks'
import useAuthStore from '../../store/useAuthStore'
import { getProductCategories, getBusinessHint, CATEGORY_LABELS } from '../../lib/businessCatalog'

const CARD = '#000000'   // card color
const R    = '4px'       // border radius — sharp
const FONT = "'Inter', 'Segoe UI', system-ui, sans-serif"
const C = { blue: '#1390ff', cyan: '#00d4ff', green: '#22c55e', amber: '#f59e0b', pink: '#f43f5e', purple: '#7c3aed', teal: '#14b8a6' }

const CAT_ICONS = {
  food: 'fastfood', beverage: 'local_cafe', grocery: 'local_grocery_store',
  mobile: 'smartphone', clothing: 'checkroom', other: 'inventory_2',
}

// ── Low / Out Stock Notification Banner ──────────────────
function StockNotification({ lowStock, outOfStock }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || (lowStock.length === 0 && outOfStock.length === 0)) return null

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
        className="mb-4 overflow-hidden"
        style={{ border: `1px solid ${C.amber}35`, background: CARD, borderRadius: R, fontFamily: FONT }}>
        {/* Out of stock — critical */}
        {outOfStock.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: lowStock.length > 0 ? `1px solid rgba(255,255,255,0.06)` : 'none', background: C.pink + '10' }}>
            <div className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0 animate-pulse"
              style={{ background: C.pink + '25' }}>
              <span className="material-symbols-outlined text-[14px]" style={{ color: C.pink }}>report</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold" style={{ color: C.pink }}>
                {outOfStock.length} product{outOfStock.length > 1 ? 's' : ''} OUT OF STOCK
              </p>
              <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {outOfStock.map(p => p.name).join(' · ')}
              </p>
            </div>
          </div>
        )}
        {/* Low stock — warning */}
        {lowStock.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: C.amber + '08' }}>
            <div className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0"
              style={{ background: C.amber + '25' }}>
              <span className="material-symbols-outlined text-[14px]" style={{ color: C.amber }}>warning</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold" style={{ color: C.amber }}>
                {lowStock.length} product{lowStock.length > 1 ? 's' : ''} running low
              </p>
              <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {lowStock.map(p => `${p.name} (${p.stock?.quantity} left)`).join(' · ')}
              </p>
            </div>
            <button onClick={() => setDismissed(true)}
              className="w-6 h-6 flex items-center justify-center rounded shrink-0 transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// ── AI Product Suggestion Banner ──────────────────────────
function AiSuggestionBanner({ shopId, businessType }) {
  const generateMsg = useGenerateMessage()
  const { data: recData } = useLatestRecommendations(shopId)
  const [suggestion, setSuggestion] = useState(null)
  const [open, setOpen] = useState(false)

  const rec = recData?.data
  const topProducts = rec?.recommendations?.slice(0, 3) || []

  const handleAsk = () => {
    const prompt = `I run a ${businessType} shop in Pakistan (Karachi/Lahore area). It's currently summer season. Based on typical Pakistani customer demand, local buying habits, and what sells well in ${businessType} shops, suggest 6 specific products I should stock RIGHT NOW to maximize sales. These should be popular, fast-moving items that customers look for frequently. Give ONLY product names, one per line, no explanations, no numbers.`
    generateMsg.mutate({ shopId, prompt }, {
      onSuccess: (d) => { setSuggestion(d?.message || ''); setOpen(true) },
    })
  }

  return (
    <div className="mb-4 overflow-hidden" style={{ background: CARD, border: `1px solid ${C.blue}25`, borderRadius: R, fontFamily: FONT }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-8 h-8 rounded-sm flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${C.blue}30, ${C.purple}30)` }}>
          <span className="material-symbols-outlined text-[15px]" style={{ color: C.cyan }}>auto_awesome</span>
        </div>
        <div className="flex-1">
          <p className="text-[12px] font-bold text-white">AI Stock Advisor</p>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Aapki dukaan ke liye kya stock karna chahiye
          </p>
        </div>
        <button onClick={handleAsk} disabled={generateMsg.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-bold text-white transition-all disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})` }}>
          <span className={`material-symbols-outlined text-[13px] ${generateMsg.isPending ? 'animate-spin' : ''}`}>
            {generateMsg.isPending ? 'autorenew' : 'tips_and_updates'}
          </span>
          {generateMsg.isPending ? 'Soch raha hoon...' : 'Suggest karo'}
        </button>
      </div>

      {/* Suggestion result */}
      <AnimatePresence>
        {open && suggestion && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.cyan }}>
              Yeh products add karein aaj:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestion.split('\n').filter(l => l.trim()).map((line, i) => (
                <span key={i} className="text-[11px] font-medium px-2.5 py-1 rounded-sm"
                  style={{ color: C.cyan, background: C.cyan + '12', border: `1px solid ${C.cyan}25` }}>
                  {line.trim().replace(/^[-•*\d.]+\s*/, '')}
                </span>
              ))}
            </div>
            <button onClick={() => setOpen(false)}
              className="mt-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Latest AI recs mini preview */}
      {topProducts.length > 0 && !open && (
        <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap">
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Push today:</span>
          {topProducts.map((r, i) => (
            <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-sm"
              style={{ color: C.green, background: C.green + '12', border: `1px solid ${C.green}20` }}>
              {r.productName} {r.expectedUplift}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Inline Stock Edit ─────────────────────────────────────
function StockCell({ product, shopId }) {
  const updateStock = useUpdateProductStock()
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(product.stock?.quantity ?? 0)
  const qty   = product.stock?.quantity ?? 0
  const thresh = product.stock?.lowStockThreshold ?? 5
  const isOut = qty === 0
  const isLow = qty > 0 && qty <= thresh

  const handleSave = () =>
    updateStock.mutate({ id: product._id, stock: parseInt(val, 10) || 0, shopId },
      { onSuccess: () => setEditing(false) })

  if (editing) return (
    <div className="flex items-center gap-1">
      <input type="number" min="0" value={val} autoFocus
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
        className="w-14 px-1.5 py-1 rounded text-[12px] text-white font-mono text-center focus:outline-none"
        style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${C.cyan}50` }} />
      <button onClick={handleSave} disabled={updateStock.isPending}
        className="w-5 h-5 flex items-center justify-center rounded"
        style={{ background: C.green + '25', color: C.green }}>
        <span className="material-symbols-outlined text-[12px]">check</span>
      </button>
      <button onClick={() => setEditing(false)}
        className="w-5 h-5 flex items-center justify-center rounded"
        style={{ color: 'rgba(255,255,255,0.4)' }}>
        <span className="material-symbols-outlined text-[12px]">close</span>
      </button>
    </div>
  )

  return (
    <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 group">
      <span className="font-mono font-bold text-[13px]"
        style={{ color: isOut ? C.pink : isLow ? C.amber : 'white' }}>{qty}</span>
      {isOut && <span className="text-[8px] font-black px-1.5 py-0.5 rounded"
        style={{ color: C.pink, background: C.pink + '20' }}>OUT</span>}
      {isLow && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
        style={{ color: C.amber, background: C.amber + '18' }}>LOW</span>}
      <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-60 transition-opacity"
        style={{ color: 'rgba(255,255,255,0.5)' }}>edit</span>
    </button>
  )
}

// ── Product Modal ─────────────────────────────────────────
// ── Field wrapper — must be OUTSIDE modal to prevent focus loss on re-render ──
function Field({ label, children, span2 = false }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label style={{ display: 'block', fontFamily: FONT, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Product Modal ─────────────────────────────────────────
function ProductModal({ shopId, product, onClose, allowedCategories }) {
  const isEdit = !!product
  const createM = useCreateProduct()
  const updateM = useUpdateProduct()
  const defaultCat = allowedCategories.includes(product?.category) ? product?.category : allowedCategories[0] || 'other'
  const [form, setForm] = useState({
    name: product?.name || '', category: defaultCat,
    sellingPrice: product?.pricing?.sellingPrice || '',
    costPrice: product?.pricing?.costPrice || '',
    quantity: product?.stock?.quantity ?? '',
    lowStockThreshold: product?.stock?.lowStockThreshold ?? 5,
    description: product?.description || '',
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault(); setError('')
    if (!form.name || !form.sellingPrice) { setError('Naam aur selling price zaroori hai'); return }
    const payload = {
      shopId, name: form.name, category: form.category, description: form.description,
      pricing: { sellingPrice: parseFloat(form.sellingPrice), costPrice: parseFloat(form.costPrice) || 0 },
      stock: { quantity: parseInt(form.quantity) || 0, lowStockThreshold: parseInt(form.lowStockThreshold) || 5 },
    }
    const opts = { onSuccess: () => onClose(), onError: (err) => setError(err.response?.data?.error || 'Failed') }
    isEdit ? updateM.mutate({ id: product._id, ...payload }, opts) : createM.mutate(payload, opts)
  }

  const inputStyle = {
    background: '#111111',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: R,
    color: 'white',
    fontSize: '14px',
    padding: '12px 14px',
    width: '100%',
    fontFamily: FONT,
    outline: 'none',
  }
  const focusStyle = (e) => e.target.style.borderColor = C.blue + '80'
  const blurStyle  = (e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ scale: 0.96, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg relative"
        style={{ background: CARD, border: '1px solid rgba(255,255,255,0.1)', borderRadius: R, padding: '24px', boxShadow: '0 40px 80px rgba(0,0,0,0.8)', fontFamily: FONT }}>

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-sm transition-colors"
          style={{ color: 'rgba(255,255,255,0.35)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-sm flex items-center justify-center"
            style={{ background: C.blue + '20', border: `1px solid ${C.blue}30` }}>
            <span className="material-symbols-outlined text-[19px]" style={{ color: C.blue }}>{isEdit ? 'edit' : 'add_box'}</span>
          </div>
          <div>
            <h2 style={{ fontFamily: FONT, fontWeight: 700, color: 'white', fontSize: '17px', margin: 0 }}>{isEdit ? 'Product Update' : 'Naya Product Add Karo'}</h2>
            <p style={{ fontFamily: FONT, fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
              {isEdit ? 'Details update karein' : 'Inventory mein naya item add karein'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-sm flex gap-2 text-[11px]"
            style={{ background: C.pink + '12', border: `1px solid ${C.pink}30`, color: C.pink }}>
            <span className="material-symbols-outlined text-[14px]">error</span>{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Product Ka Naam *" span2>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Jaise: Pepsi 1.5L, Basmati Rice 5kg"
                style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
                className="placeholder:text-white/20 focus:outline-none" />
            </Field>

            <Field label="Category">
              <select value={form.category} onChange={e => set('category', e.target.value)}
                style={{ ...inputStyle, background: '#1a1a1a' }}
                className="focus:outline-none">
                {allowedCategories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
              </select>
            </Field>

            <Field label="Stock Miqdar (Units) *">
              <input type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)}
                placeholder="0" style={{ ...inputStyle, fontFamily: 'monospace' }}
                onFocus={focusStyle} onBlur={blurStyle} className="focus:outline-none" />
            </Field>

            <Field label="Selling Price (Rs.) *">
              <input type="number" min="0" step="0.01" value={form.sellingPrice} onChange={e => set('sellingPrice', e.target.value)}
                placeholder="0" style={{ ...inputStyle, fontFamily: 'monospace' }}
                onFocus={focusStyle} onBlur={blurStyle} className="focus:outline-none" />
            </Field>

            <Field label="Cost Price (Rs.)">
              <input type="number" min="0" step="0.01" value={form.costPrice} onChange={e => set('costPrice', e.target.value)}
                placeholder="0" style={{ ...inputStyle, fontFamily: 'monospace' }}
                onFocus={focusStyle} onBlur={blurStyle} className="focus:outline-none" />
            </Field>

            <Field label="Low Stock Alert (Units)">
              <input type="number" min="0" value={form.lowStockThreshold} onChange={e => set('lowStockThreshold', e.target.value)}
                style={{ ...inputStyle, fontFamily: 'monospace' }}
                onFocus={focusStyle} onBlur={blurStyle} className="focus:outline-none" />
            </Field>
          </div>

          <Field label="Description (Optional)">
            <input value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Chhoti si description..."
              style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}
              className="placeholder:text-white/20 focus:outline-none" />
          </Field>

          <button type="submit" disabled={createM.isPending || updateM.isPending}
            className="w-full py-3 font-bold text-[13px] text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, borderRadius: R, boxShadow: `0 0 20px ${C.blue}30` }}>
            {createM.isPending || updateM.isPending ? 'Save ho raha hai...' : isEdit ? 'Update Karo' : 'Inventory Mein Add Karo'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function Inventory() {
  const { shopId } = useParams()
  const navigate   = useNavigate()
  const { data: shopData }      = useShopById(shopId)
  const { data: productsData, isLoading } = useProductsByShop(shopId)
  const { data: summaryRes }    = useInventorySummary(shopId)
  const { data: lowStockData }  = useLowStockProducts(shopId)
  const deleteMutation = useDeleteProduct()

  const [modal, setModal]               = useState(null)
  const [search, setSearch]             = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const user         = useAuthStore((s) => s.user)
  const shop         = shopData?.data
  const businessType = shop?.businessType || user?.businessType || 'other'
  const allowedCats  = getProductCategories(businessType)
  const bizHint      = getBusinessHint(businessType)
  const allProducts  = productsData?.data?.products || []
  const lowStock     = lowStockData?.data || []
  const outOfStock   = allProducts.filter(p => (p.stock?.quantity ?? 0) === 0)
  const summary      = summaryRes?.data

  const filtered = allProducts.filter(p => {
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const mc = !categoryFilter || p.category === categoryFilter
    return ms && mc
  })

  const totalValue = filtered.reduce((s, p) => s + ((p.pricing?.sellingPrice || 0) * (p.stock?.quantity || 0)), 0)

  return (
    <div style={{ fontFamily: FONT, minHeight: '100vh' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/dashboard/shops/${shopId}`)}
            className="w-8 h-8 flex items-center justify-center transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)', borderRadius: R }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}>
            <span className="material-symbols-outlined text-[19px]">arrow_back</span>
          </button>
          <div>
            <h2 className="font-bold text-white tracking-tight" style={{ fontSize: '22px', fontFamily: FONT }}>Inventory</h2>
            <p className="mt-0.5" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: FONT }}>
              {shop?.name} · {allProducts.length} products
            </p>
          </div>
        </div>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 font-bold text-white transition-all active:scale-95"
          style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, borderRadius: R, padding: '10px 20px', fontSize: '13px', fontFamily: FONT, boxShadow: `0 0 16px ${C.blue}30` }}>
          <span className="material-symbols-outlined text-[15px]">add</span>
          Product Add Karo
        </button>
      </div>

      {/* Business hint */}
      {bizHint && (
        <div className="mb-4 flex items-center gap-2" style={{ padding: '10px 14px', background: C.teal + '0d', border: `1px solid ${C.teal}20`, borderRadius: R }}>
          <span className="material-symbols-outlined text-[14px]" style={{ color: C.teal }}>category</span>
          <span style={{ fontFamily: FONT, fontSize: '11px', color: C.teal, fontWeight: 600, textTransform: 'capitalize' }}>{businessType}</span>
          <span style={{ fontFamily: FONT, fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>— {bizHint}</span>
        </div>
      )}

      {/* Stock notifications */}
      <StockNotification lowStock={lowStock} outOfStock={outOfStock} />

      {/* AI Stock Advisor */}
      <AiSuggestionBanner shopId={shopId} businessType={businessType} />

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'In Stock',     value: summary.inStockCount,    color: C.green, icon: 'check_circle' },
            { label: 'Low Stock',    value: summary.lowStockCount,   color: C.amber, icon: 'warning'      },
            { label: 'Out of Stock', value: summary.outOfStockCount, color: C.pink,  icon: 'report'       },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-4"
              style={{ background: CARD, border: `1px solid ${s.color}25`, borderRadius: R, padding: '18px 20px' }}>
              <div className="flex items-center justify-center w-10 h-10 shrink-0"
                style={{ background: s.color + '18', borderRadius: R }}>
                <span className="material-symbols-outlined text-[18px]" style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div>
                <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: '26px', lineHeight: 1, color: s.color }}>{s.value}</p>
                <p style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px]"
            style={{ color: 'rgba(255,255,255,0.3)' }}>search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            style={{ background: CARD, border: '1px solid rgba(255,255,255,0.1)', borderRadius: R, padding: '10px 14px 10px 40px', color: 'white', fontSize: '13px', fontFamily: FONT, width: '100%', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = C.blue + '70'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['', ...allowedCats].map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              style={categoryFilter === c
                ? { color: C.cyan, background: C.cyan + '18', border: `1px solid ${C.cyan}40`, borderRadius: R, padding: '8px 14px', fontSize: '11px', fontFamily: FONT, fontWeight: 600 }
                : { color: 'rgba(255,255,255,0.45)', background: CARD, border: '1px solid rgba(255,255,255,0.1)', borderRadius: R, padding: '8px 14px', fontSize: '11px', fontFamily: FONT }}>
              {c ? (CATEGORY_LABELS[c] || c) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: CARD, border: '1px solid rgba(255,255,255,0.08)', borderRadius: R, overflow: 'hidden', fontFamily: FONT }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['Product', 'Category', 'Price (Rs.)', 'Stock', 'Cost', 'Actions'].map((h, i) => (
                  <th key={h}
                    style={{
                      fontFamily: FONT, fontSize: '10px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      color: 'rgba(255,255,255,0.35)', padding: '14px 16px',
                      textAlign: i === 0 ? 'left' : i === 2 ? 'right' : i === 3 ? 'center' : i === 4 ? 'right' : i === 5 ? 'center' : 'left',
                    }}
                    className={i === 1 ? 'hidden md:table-cell' : i === 4 ? 'hidden lg:table-cell' : ''}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 rounded" style={{ background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <span className="material-symbols-outlined text-[44px] block mb-3" style={{ color: 'rgba(255,255,255,0.08)' }}>inventory_2</span>
                    <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {allProducts.length === 0 ? 'Abhi koi product nahi. Pehla product add karein.' : 'Koi match nahi mila.'}
                    </p>
                    {allProducts.length === 0 && (
                      <button onClick={() => setModal('add')}
                        className="mt-3 px-4 py-2 text-[11px] font-bold text-white"
                        style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, borderRadius: R }}>
                        Pehla Product Add Karo
                      </button>
                    )}
                  </td>
                </tr>
              ) : filtered.map((p, i) => {
                const qty   = p.stock?.quantity ?? 0
                const isOut = qty === 0
                const isLow = qty > 0 && qty <= (p.stock?.lowStockThreshold ?? 5)
                return (
                  <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="group transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center shrink-0"
                          style={{ width: '32px', height: '32px', background: isOut ? C.pink + '18' : isLow ? C.amber + '18' : 'rgba(255,255,255,0.07)', borderRadius: R }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: isOut ? C.pink : isLow ? C.amber : 'rgba(255,255,255,0.4)' }}>
                            {CAT_ICONS[p.category] || 'inventory_2'}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontFamily: FONT, fontSize: '13px', fontWeight: 600, color: 'white', margin: 0 }}>{p.name}</p>
                          {p.description && (
                            <p style={{ fontFamily: FONT, fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }} className="hidden md:table-cell">
                      <span style={{ fontFamily: FONT, fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize' }}>{p.category}</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: '13px', color: C.green }}>
                        Rs.{(p.pricing?.sellingPrice || 0).toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <StockCell product={p} shopId={shopId} />
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }} className="hidden lg:table-cell">
                      <span style={{ fontFamily: "'Courier New', monospace", fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                        Rs.{(p.pricing?.costPrice || 0).toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModal(p)}
                          className="w-6 h-6 flex items-center justify-center rounded transition-colors"
                          style={{ color: 'rgba(255,255,255,0.4)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = C.blue + '20'; e.currentTarget.style.color = C.blue }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}>
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                        <button onClick={() => setConfirmDelete(p._id)}
                          className="w-6 h-6 flex items-center justify-center rounded transition-colors"
                          style={{ color: 'rgba(255,255,255,0.4)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = C.pink + '20'; e.currentTarget.style.color = C.pink }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}>
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center justify-between"
            style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', fontFamily: FONT, fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
            <span>{filtered.length} products</span>
            <span>Stock value: <span style={{ color: 'white', fontWeight: 700 }}>Rs.{totalValue.toLocaleString()}</span></span>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmDelete(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="max-w-sm w-full p-6"
              style={{ background: CARD, border: `1px solid ${C.pink}30`, borderRadius: R }}>
              <span className="material-symbols-outlined text-[32px] block mb-3" style={{ color: C.pink }}>delete_forever</span>
              <h3 className="font-bold text-white text-[15px] mb-1">Delete karein?</h3>
              <p className="text-[11px] mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>Yeh product hamesha ke liye remove ho jayega.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2 text-[12px] font-medium rounded-sm transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>Cancel</button>
                <button onClick={() => deleteMutation.mutate({ id: confirmDelete, shopId }, { onSuccess: () => setConfirmDelete(null) })}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-2 text-[12px] font-bold text-white rounded-sm disabled:opacity-50"
                  style={{ background: C.pink }}>
                  {deleteMutation.isPending ? 'Hata raha...' : 'Haan, Delete Karo'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modal && (
          <ProductModal shopId={shopId} product={modal === 'add' ? null : modal}
            allowedCategories={allowedCats} onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

