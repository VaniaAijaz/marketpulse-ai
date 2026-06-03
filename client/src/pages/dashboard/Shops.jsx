import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useShopsByOwner, useUpdateAISettings } from '../../features/shops/shopHooks'
import { useLatestRecommendations, useGenerateRecommendations } from '../../features/ai/aiHooks'
import { useOrderStats } from '../../features/orders/orderHooks'
import {
  useProductsByShop, useInventorySummary, useLowStockProducts,
  useCreateProduct, useUpdateProduct, useUpdateProductStock, useDeleteProduct,
} from '../../features/products/productHooks'
import useAuthStore from '../../store/useAuthStore'
import { getProductCategories, getBusinessHint, CATEGORY_LABELS } from '../../lib/businessCatalog'

const C = { blue: '#1390ff', purple: '#7c3aed', cyan: '#00d4ff', green: '#22c55e', amber: '#f59e0b', pink: '#f43f5e', teal: '#14b8a6', violet: '#8b5cf6' }

const BIZ_CFG = {
  grocery:     { icon: 'local_grocery_store', color: C.green  },
  clothing:    { icon: 'checkroom',           color: C.purple },
  pharmacy:    { icon: 'local_pharmacy',      color: C.teal   },
  restaurant:  { icon: 'restaurant',          color: C.amber  },
  electronics: { icon: 'devices',             color: C.blue   },
  other:       { icon: 'storefront',          color: '#6b7280'},
}

const CAT_ICONS = {
  food: 'fastfood', beverage: 'local_cafe', grocery: 'local_grocery_store',
  mobile: 'smartphone', clothing: 'checkroom', other: 'inventory_2',
}

// ── Low Stock Alert Modal ─────────────────────────────────
function LowStockAlert({ products, shopId, onClose, onNavigate }) {
  if (!products.length) return null
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: '#0d1b35', border: `1px solid ${C.pink}40`, boxShadow: `0 0 60px ${C.pink}20` }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center animate-pulse"
            style={{ background: C.pink + '20', border: `1px solid ${C.pink}40` }}>
            <span className="material-symbols-outlined text-[24px]" style={{ color: C.pink }}>warning</span>
          </div>
          <div>
            <p className="font-black text-white text-[17px]">Low Stock Alert</p>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {products.length} product{products.length > 1 ? 's' : ''} need restocking
            </p>
          </div>
          <button onClick={onClose} className="ml-auto w-7 h-7 rounded-full flex items-center justify-center"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}>
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Product list */}
        <div className="space-y-2 mb-5 max-h-[240px] overflow-y-auto pr-1">
          {products.map((p, i) => {
            const qty   = p.stock?.quantity ?? 0
            const thresh = p.stock?.lowStockThreshold ?? 5
            const pct   = Math.min((qty / thresh) * 100, 100)
            const urgent = qty === 0
            return (
              <motion.div key={p._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="p-3 rounded-xl" style={{ background: urgent ? C.pink + '10' : C.amber + '08', border: `1px solid ${urgent ? C.pink : C.amber}25` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-semibold text-white text-[12px]">{p.name}</p>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ color: urgent ? C.pink : C.amber, background: (urgent ? C.pink : C.amber) + '20' }}>
                    {urgent ? 'OUT OF STOCK' : `${qty} left`}
                  </span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-1.5 rounded-full transition-all"
                    style={{ width: `${pct}%`, background: urgent ? C.pink : C.amber }} />
                </div>
                <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Threshold: {thresh} units
                </p>
              </motion.div>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose}
            className="py-2.5 rounded-xl text-[12px] font-bold transition-all"
            style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
            Dismiss
          </button>
          <button onClick={onNavigate}
            className="py-2.5 rounded-xl text-[12px] font-bold text-white transition-all"
            style={{ background: `linear-gradient(135deg, ${C.amber}, ${C.pink})`, boxShadow: `0 0 16px ${C.amber}30` }}>
            Restock Now →
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Inline Stock Cell ─────────────────────────────────────
function StockCell({ product, shopId }) {
  const updateStock = useUpdateProductStock()
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(product.stock?.quantity ?? 0)
  const qty   = product.stock?.quantity ?? 0
  const thresh = product.stock?.lowStockThreshold ?? 5
  const isLow  = qty <= thresh
  const isOut  = qty === 0

  const handleSave = () =>
    updateStock.mutate({ id: product._id, stock: parseInt(val, 10) || 0, shopId }, { onSuccess: () => setEditing(false) })

  if (editing) return (
    <div className="flex items-center gap-1">
      <input type="number" min="0" value={val} autoFocus
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
        className="w-16 p-1 rounded-lg text-[12px] text-white font-mono text-center focus:outline-none"
        style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${C.cyan}50` }} />
      <button onClick={handleSave} disabled={updateStock.isPending}
        className="w-6 h-6 flex items-center justify-center rounded-lg"
        style={{ background: C.green + '25', color: C.green }}>
        <span className="material-symbols-outlined text-[13px]">check</span>
      </button>
      <button onClick={() => setEditing(false)}
        className="w-6 h-6 flex items-center justify-center rounded-lg"
        style={{ color: 'rgba(255,255,255,0.4)' }}>
        <span className="material-symbols-outlined text-[13px]">close</span>
      </button>
    </div>
  )

  return (
    <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 group">
      <span className="font-mono font-bold text-[13px]" style={{ color: isOut ? C.pink : isLow ? C.amber : 'white' }}>
        {qty}
      </span>
      {isOut && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: C.pink, background: C.pink + '15' }}>Out</span>}
      {!isOut && isLow && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: C.amber, background: C.amber + '15' }}>Low</span>}
      <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'rgba(255,255,255,0.4)' }}>edit</span>
    </button>
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
    sellingPrice: product?.pricing?.sellingPrice || '', costPrice: product?.pricing?.costPrice || '',
    quantity: product?.stock?.quantity ?? '', lowStockThreshold: product?.stock?.lowStockThreshold ?? 5,
    description: product?.description || '',
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault(); setError('')
    if (!form.name || !form.sellingPrice) { setError('Name and selling price are required'); return }
    const payload = {
      shopId, name: form.name, category: form.category, description: form.description,
      pricing: { sellingPrice: parseFloat(form.sellingPrice), costPrice: parseFloat(form.costPrice) || 0 },
      stock: { quantity: parseInt(form.quantity) || 0, lowStockThreshold: parseInt(form.lowStockThreshold) || 5 },
    }
    const opts = { onSuccess: () => onClose(), onError: (err) => setError(err.response?.data?.error || 'Failed') }
    isEdit ? updateM.mutate({ id: product._id, ...payload }, opts) : createM.mutate(payload, opts)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose} className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl p-6 relative"
        style={{ background: '#0d1b35', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}>
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${C.blue}30, ${C.purple}30)`, border: `1px solid ${C.blue}30` }}>
            <span className="material-symbols-outlined text-[20px]" style={{ color: C.cyan }}>{isEdit ? 'edit' : 'add_box'}</span>
          </div>
          <div>
            <h2 className="font-bold text-white text-[17px]">{isEdit ? 'Edit Product' : 'Add Product'}</h2>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{isEdit ? 'Update details' : 'Add to inventory'}</p>
          </div>
        </div>
        {error && (
          <div className="mb-4 p-3 rounded-xl text-[11px] flex gap-2" style={{ background: C.pink + '10', border: `1px solid ${C.pink}25`, color: C.pink }}>
            <span className="material-symbols-outlined text-[14px]">error</span>{error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Product Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Pepsi 1.5L"
                className="w-full p-3 rounded-xl text-[13px] text-white placeholder:text-white/20 focus:outline-none"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => e.target.style.borderColor = C.blue + '80'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full p-3 rounded-xl text-[13px] text-white focus:outline-none"
                style={{ background: '#060e20', border: '1px solid rgba(255,255,255,0.1)' }}>
                {allowedCategories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Stock Qty *</label>
              <input type="number" min="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="0"
                className="w-full p-3 rounded-xl text-[13px] text-white font-mono focus:outline-none"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => e.target.style.borderColor = C.blue + '80'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Selling Price (Rs.) *</label>
              <input type="number" min="0" step="0.01" value={form.sellingPrice} onChange={e => set('sellingPrice', e.target.value)} placeholder="0"
                className="w-full p-3 rounded-xl text-[13px] text-white font-mono focus:outline-none"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => e.target.style.borderColor = C.blue + '80'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Cost Price (Rs.)</label>
              <input type="number" min="0" step="0.01" value={form.costPrice} onChange={e => set('costPrice', e.target.value)} placeholder="0"
                className="w-full p-3 rounded-xl text-[13px] text-white font-mono focus:outline-none"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => e.target.style.borderColor = C.blue + '80'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Low Stock Alert</label>
              <input type="number" min="0" value={form.lowStockThreshold} onChange={e => set('lowStockThreshold', e.target.value)}
                className="w-full p-3 rounded-xl text-[13px] text-white font-mono focus:outline-none"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => e.target.style.borderColor = C.blue + '80'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
          </div>
          <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Description (optional)"
            className="w-full p-3 rounded-xl text-[13px] text-white placeholder:text-white/20 focus:outline-none"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)' }}
            onFocus={e => e.target.style.borderColor = C.blue + '80'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
          <button type="submit" disabled={createM.isPending || updateM.isPending}
            className="w-full py-3 rounded-xl font-bold text-[12px] text-white transition-all active:scale-95 disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, boxShadow: `0 0 20px ${C.blue}30` }}>
            {createM.isPending || updateM.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add to Inventory'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ── Inventory Tab ─────────────────────────────────────────
function InventoryTab({ shop }) {
  const shopId = shop._id
  const { data: productsData, isLoading, refetch } = useProductsByShop(shopId)
  const { data: summaryRes } = useInventorySummary(shopId)
  const { data: lowStockRes } = useLowStockProducts(shopId)
  const deleteM = useDeleteProduct()
  const generateRec = useGenerateRecommendations()

  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [aiMsg, setAiMsg] = useState('')

  const businessType = shop.businessType || 'other'
  const allowedCats  = getProductCategories(businessType)
  const bizHint      = getBusinessHint(businessType)
  const allProducts  = productsData?.data?.products || []
  const lowStock     = lowStockRes?.data || []
  const summary      = summaryRes?.data

  const filtered = allProducts.filter(p => {
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const mc = !catFilter || p.category === catFilter
    return ms && mc
  })

  const totalValue = filtered.reduce((s, p) => s + ((p.pricing?.sellingPrice || 0) * (p.stock?.quantity || 0)), 0)

  const handleSync = async () => {
    setSyncing(true)
    await refetch()
    setTimeout(() => setSyncing(false), 800)
  }

  const handleRunAi = () => {
    setAiMsg('')
    generateRec.mutate(shopId, {
      onSuccess: () => setAiMsg('AI recommendations updated!'),
      onError: (err) => setAiMsg(err.response?.data?.error || 'AI failed'),
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Summary pills */}
        {summary && (
          <div className="flex gap-2 flex-wrap flex-1">
            {[
              { label: 'In Stock', value: summary.inStockCount, color: C.green  },
              { label: 'Low',      value: summary.lowStockCount, color: C.amber  },
              { label: 'Out',      value: summary.outOfStockCount, color: C.pink },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold"
                style={{ color: s.color, background: s.color + '15', border: `1px solid ${s.color}30` }}>
                <span className="font-black text-[13px]">{s.value}</span> {s.label}
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={handleSync}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all"
            style={{ color: C.cyan, background: C.cyan + '12', border: `1px solid ${C.cyan}30` }}>
            <span className={`material-symbols-outlined text-[14px] ${syncing ? 'animate-spin' : ''}`}>sync</span>
            {syncing ? 'Syncing...' : 'Sync'}
          </button>
          <button onClick={handleRunAi} disabled={!summary?.aiReady || generateRec.isPending}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all disabled:opacity-40"
            style={{ color: C.purple, background: C.purple + '15', border: `1px solid ${C.purple}30` }}>
            <span className={`material-symbols-outlined text-[14px] ${generateRec.isPending ? 'animate-spin' : ''}`}>auto_awesome</span>
            {generateRec.isPending ? 'Analyzing...' : 'Run AI'}
          </button>
          <button onClick={() => setModal('add')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold text-white transition-all"
            style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, boxShadow: `0 0 12px ${C.blue}25` }}>
            <span className="material-symbols-outlined text-[14px]">add</span>Add Product
          </button>
        </div>
      </div>

      {/* Business hint */}
      {bizHint && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-[11px]"
          style={{ background: C.teal + '0d', border: `1px solid ${C.teal}20` }}>
          <span className="material-symbols-outlined text-[14px]" style={{ color: C.teal }}>category</span>
          <span style={{ color: C.teal }} className="font-semibold capitalize">{businessType}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>— {bizHint}</span>
        </div>
      )}

      {/* AI msg */}
      {aiMsg && (
        <div className="p-3 rounded-xl text-[12px]"
          style={aiMsg.includes('updated') || aiMsg.includes('!')
            ? { background: C.green + '10', border: `1px solid ${C.green}25`, color: C.green }
            : { background: C.pink + '10', border: `1px solid ${C.pink}25`, color: C.pink }}>
          {aiMsg}
        </div>
      )}

      {/* Low stock banner */}
      {lowStock.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: C.amber + '0d', border: `1px solid ${C.amber}25` }}>
          <span className="material-symbols-outlined text-[18px]" style={{ color: C.amber }}>warning</span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-white">{lowStock.length} product{lowStock.length > 1 ? 's' : ''} running low</p>
            <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{lowStock.map(p => p.name).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px]" style={{ color: 'rgba(255,255,255,0.3)' }}>search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-[12px] text-white placeholder:text-white/20 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onFocus={e => e.target.style.borderColor = C.blue + '60'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setCatFilter('')}
            className="px-3 py-2 rounded-lg text-[10px] font-medium transition-all"
            style={!catFilter ? { color: C.cyan, background: C.cyan + '15', border: `1px solid ${C.cyan}30` } : { color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            All
          </button>
          {allowedCats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className="px-3 py-2 rounded-lg text-[10px] font-medium transition-all"
              style={catFilter === c ? { color: C.cyan, background: C.cyan + '15', border: `1px solid ${C.cyan}30` } : { color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {CATEGORY_LABELS[c] || c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Product', 'Category', 'Price', 'Stock', 'Cost', 'Actions'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-[9px] font-bold uppercase tracking-wider ${i === 0 ? 'text-left' : i < 2 ? 'text-left hidden md:table-cell' : i === 2 ? 'text-right' : i === 3 ? 'text-center' : i === 4 ? 'text-right hidden lg:table-cell' : 'text-center'}`}
                    style={{ color: 'rgba(255,255,255,0.25)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(4)].map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} /></td>)}
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center">
                  <span className="material-symbols-outlined text-[40px] block mb-2" style={{ color: 'rgba(255,255,255,0.1)' }}>inventory_2</span>
                  <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {allProducts.length === 0 ? 'No products yet.' : 'No matches.'}
                  </p>
                  {allProducts.length === 0 && (
                    <button onClick={() => setModal('add')} className="mt-3 px-4 py-2 rounded-xl text-[11px] font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})` }}>Add First Product</button>
                  )}
                </td></tr>
              ) : filtered.map((p, i) => (
                <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="transition-colors group" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span className="material-symbols-outlined text-[14px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{CAT_ICONS[p.category] || 'inventory_2'}</span>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-white">{p.name}</p>
                        {p.description && <p className="text-[10px] truncate max-w-[140px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{p.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-[11px] capitalize" style={{ color: 'rgba(255,255,255,0.45)' }}>{p.category}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono font-bold text-[12px]" style={{ color: C.green }}>Rs.{(p.pricing?.sellingPrice || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StockCell product={p} shopId={shopId} />
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Rs.{(p.pricing?.costPrice || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModal(p)} className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = C.blue + '20'; e.currentTarget.style.color = C.blue }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}>
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                      </button>
                      <button onClick={() => setConfirmDelete(p._id)} className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = C.pink + '20'; e.currentTarget.style.color = C.pink }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}>
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2.5 flex items-center justify-between text-[10px]"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
            <span>{filtered.length} products</span>
            <span>Stock value: <span className="text-white font-bold">Rs.{totalValue.toLocaleString()}</span></span>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmDelete(null)} className="fixed inset-0 z-[150] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="rounded-2xl p-6 max-w-sm w-full"
              style={{ background: '#0d1b35', border: `1px solid ${C.pink}30` }}>
              <span className="material-symbols-outlined text-[36px] block mb-3" style={{ color: C.pink }}>delete_forever</span>
              <h3 className="font-bold text-white text-[16px] mb-1">Delete Product?</h3>
              <p className="text-[12px] mb-5" style={{ color: 'rgba(255,255,255,0.4)' }}>This will permanently remove the product.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>Cancel</button>
                <button onClick={() => deleteM.mutate({ id: confirmDelete, shopId }, { onSuccess: () => setConfirmDelete(null) })}
                  disabled={deleteM.isPending} className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-white transition-colors disabled:opacity-50"
                  style={{ background: C.pink }}>
                  {deleteM.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal && (
          <ProductModal shopId={shopId} product={modal === 'add' ? null : modal}
            allowedCategories={allowedCats} onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────
function OverviewTab({ shop, onViewDetail }) {
  const shopId = shop._id
  const { data: statsData } = useOrderStats(shopId)
  const { data: recData }   = useLatestRecommendations(shopId)
  const { data: summaryRes } = useInventorySummary(shopId)
  const generateRec = useGenerateRecommendations()

  const stats   = statsData?.data || {}
  const rec     = recData?.data
  const summary = summaryRes?.data
  const bizCfg  = BIZ_CFG[shop.businessType] || BIZ_CFG.other

  const kpis = [
    { label: 'Revenue',   value: stats.totalRevenue  != null ? 'Rs.' + Number(stats.totalRevenue).toLocaleString() : '—', color: C.green,  icon: 'payments'      },
    { label: 'Orders',    value: stats.totalOrders   != null ? stats.totalOrders   : '—',                                 color: C.blue,   icon: 'shopping_bag'  },
    { label: 'Pending',   value: stats.pendingOrders != null ? stats.pendingOrders : '—',                                 color: C.amber,  icon: 'schedule'      },
    { label: 'AI Score',  value: rec?.confidenceScore ? rec.confidenceScore + '%'  : '—',                                 color: C.purple, icon: 'psychology'    },
    { label: 'In Stock',  value: summary?.inStockCount ?? '—',                                                            color: C.teal,   icon: 'inventory_2'   },
    { label: 'Low Stock', value: summary?.lowStockCount ?? '—',                                                           color: C.pink,   icon: 'warning'       },
  ]

  return (
    <div className="space-y-5">
      {/* KPI grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl p-3 relative overflow-hidden"
            style={{ background: k.color + '0d', border: `1px solid ${k.color}20` }}>
            <div className="absolute -right-2 -top-2 w-10 h-10 rounded-full blur-xl" style={{ background: k.color + '25' }} />
            <div className="relative z-10">
              <span className="material-symbols-outlined text-[14px] block mb-1" style={{ color: k.color }}>{k.icon}</span>
              <p className="font-black text-[16px] leading-none text-white">{k.value}</p>
              <p className="text-[9px] mt-1 font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>{k.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Shop info + AI insight side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shop info */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: bizCfg.color + '20', border: `1px solid ${bizCfg.color}30` }}>
              <span className="material-symbols-outlined text-[20px]" style={{ color: bizCfg.color }}>{bizCfg.icon}</span>
            </div>
            <div>
              <p className="font-bold text-white text-[15px]">{shop.name}</p>
              <p className="text-[11px] capitalize" style={{ color: 'rgba(255,255,255,0.45)' }}>{shop.businessType}</p>
            </div>
          </div>
          {[
            { label: 'Plan',     value: shop.plan || 'free', cap: true },
            { label: 'Location', value: `${shop.location?.coordinates?.[1] ?? '—'}, ${shop.location?.coordinates?.[0] ?? '—'}`, mono: true },
            { label: 'Joined',   value: new Date(shop.createdAt).toLocaleDateString() },
            { label: 'WhatsApp', value: shop.whatsapp?.connected ? 'Connected' : 'Offline', color: shop.whatsapp?.connected ? C.green : '#6b7280' },
            { label: 'AI Agent', value: shop.aiSettings?.enabled ? 'Active' : 'Inactive', color: shop.aiSettings?.enabled ? C.blue : '#6b7280' },
          ].map((row, i, arr) => (
            <div key={row.label} className="flex items-center justify-between py-2"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
              <span className={`text-[11px] font-medium ${row.mono ? 'font-mono' : ''} ${row.cap ? 'capitalize' : ''}`}
                style={{ color: row.color || 'white' }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* AI insight */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.purple + '25' }}>
                <span className="material-symbols-outlined text-[14px]" style={{ color: C.purple }}>auto_awesome</span>
              </div>
              <p className="font-bold text-white text-[13px]">AI Insights</p>
            </div>
            <button onClick={onViewDetail}
              className="text-[10px] font-bold flex items-center gap-1 transition-colors"
              style={{ color: C.cyan }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              Full View <span className="material-symbols-outlined text-[12px]">open_in_new</span>
            </button>
          </div>

          {!rec ? (
            <div className="text-center py-6">
              <span className="material-symbols-outlined text-[36px] block mb-2" style={{ color: 'rgba(255,255,255,0.1)' }}>auto_awesome</span>
              <p className="text-[12px] mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>No AI analysis yet</p>
              <button onClick={() => generateRec.mutate(shopId)} disabled={generateRec.isPending}
                className="px-4 py-2 rounded-xl text-[11px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})` }}>
                {generateRec.isPending ? 'Analyzing...' : 'Run Analysis'}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {rec.insight && (
                <div className="p-3 rounded-xl" style={{ background: C.blue + '0d', border: `1px solid ${C.blue}25` }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: C.blue }}>Today's Insight</p>
                  <p className="text-[12px] text-white">{rec.insight}</p>
                </div>
              )}
              {(rec.recommendations || []).slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] flex-shrink-0"
                    style={{ background: [C.amber, C.blue, C.teal][i] + '25', color: [C.amber, C.blue, C.teal][i] }}>{i+1}</div>
                  <p className="text-[11px] font-semibold text-white flex-1 truncate">{r.productName}</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ color: C.green, background: C.green + '15' }}>{r.expectedUplift}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Insights Tab (proper component — no hook-in-callback) ─
function InsightsTab({ shopId, onViewDetail }) {
  const { data: recData, isLoading } = useLatestRecommendations(shopId)
  const generateRec = useGenerateRecommendations()
  const rec = recData?.data

  if (isLoading) return <div className="h-32 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />

  if (!rec) return (
    <div className="text-center py-8">
      <span className="material-symbols-outlined text-[40px] block mb-2" style={{ color: 'rgba(255,255,255,0.1)' }}>auto_awesome</span>
      <p className="text-[12px] mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>No AI analysis yet</p>
      <button onClick={() => generateRec.mutate(shopId)} disabled={generateRec.isPending}
        className="px-4 py-2 rounded-xl text-[11px] font-bold text-white"
        style={{ background: `linear-gradient(135deg, ${C.blue}, ${C.purple})` }}>
        {generateRec.isPending ? 'Analyzing...' : 'Run Analysis'}
      </button>
    </div>
  )

  return (
    <div className="space-y-3">
      {rec.insight && (
        <div className="p-3 rounded-xl" style={{ background: C.blue + '0d', border: `1px solid ${C.blue}25` }}>
          <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: C.blue }}>Today's Insight</p>
          <p className="text-[12px] text-white">{rec.insight}</p>
        </div>
      )}
      {(rec.recommendations || []).map((r, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: [C.amber, C.blue, C.teal][i] + '08', border: `1px solid ${[C.amber, C.blue, C.teal][i]}20` }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[12px] flex-shrink-0"
            style={{ background: [C.amber, C.blue, C.teal][i] + '25', color: [C.amber, C.blue, C.teal][i] }}>{i+1}</div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-white truncate">{r.productName}</p>
            <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.reason}</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ color: C.green, background: C.green + '15' }}>{r.expectedUplift}</span>
        </div>
      ))}
      <button onClick={onViewDetail} className="w-full py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5"
        style={{ color: C.cyan, border: `1px solid ${C.cyan}25` }}>
        <span className="material-symbols-outlined text-[13px]">open_in_new</span>Full Analysis
      </button>
    </div>
  )
}

// ── Shop Card — clicks directly to full view ─────────────
function ShopCard({ shop, isActive, onSetActive, onViewDetail }) {
  const bizCfg  = BIZ_CFG[shop.businessType] || BIZ_CFG.other
  const { data: lowStockRes } = useLowStockProducts(shop._id)
  const { data: statsData }   = useOrderStats(shop._id)
  const { data: recData }     = useLatestRecommendations(shop._id)
  const lowStock = lowStockRes?.data || []
  const stats    = statsData?.data   || {}
  const rec      = recData?.data
  const [showAlert, setShowAlert] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (isActive && lowStock.length > 0) {
      const t = setTimeout(() => setShowAlert(true), 1200)
      return () => clearTimeout(t)
    }
  }, [isActive, lowStock.length])

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        onClick={onViewDetail}
        className="rounded-2xl p-5 cursor-pointer transition-all"
        style={{
          background: isActive ? `linear-gradient(135deg, ${C.blue}0a, ${C.purple}0a)` : 'rgba(255,255,255,0.025)',
          border: isActive ? `1px solid ${C.cyan}40` : '1px solid rgba(255,255,255,0.08)',
          boxShadow: isActive ? `0 0 30px ${C.cyan}10` : 'none',
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = C.blue + '30' }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>

        <div className="flex items-center justify-between">
          {/* Left: icon + name */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative flex-shrink-0"
              style={isActive
                ? { background: `linear-gradient(135deg, ${C.blue}35, ${C.purple}35)`, border: `1px solid ${C.cyan}40` }
                : { background: bizCfg.color + '15', border: `1px solid ${bizCfg.color}25` }}>
              <span className="material-symbols-outlined text-[26px]" style={{ color: isActive ? C.cyan : bizCfg.color }}>{bizCfg.icon}</span>
              {isActive && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 animate-pulse" style={{ background: C.green, borderColor: '#0a1628' }} />}
              {lowStock.length > 0 && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white border-2"
                  style={{ background: C.amber, borderColor: '#0a1628' }}>{lowStock.length}</div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-[17px]">{shop.name}</h3>
                {isActive && <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
                  style={{ color: C.cyan, background: C.cyan + '15', border: `1px solid ${C.cyan}30` }}>Active</span>}
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                  style={{ color: C.amber, border: `1px solid ${C.amber}30` }}>{shop.plan || 'free'}</span>
                {lowStock.length > 0 && (
                  <button onClick={e => { e.stopPropagation(); setShowAlert(true) }}
                    className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
                    style={{ color: C.amber, background: C.amber + '15', border: `1px solid ${C.amber}30` }}>
                    ⚠ {lowStock.length} Low Stock
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-[11px] capitalize" style={{ color: 'rgba(255,255,255,0.45)' }}>{shop.businessType}</span>
                {[
                  { ok: shop.whatsapp?.connected, label: 'WA', color: C.green },
                  { ok: shop.aiSettings?.enabled, label: 'AI', color: C.blue  },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-1 text-[10px]"
                    style={{ color: s.ok ? s.color : 'rgba(255,255,255,0.25)' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: s.ok ? s.color : 'rgba(255,255,255,0.2)' }} />
                    {s.label} {s.ok ? 'Live' : 'Off'}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: quick stats + arrow */}
          <div className="hidden md:flex items-center gap-6">
            {[
              { label: 'Revenue',  value: stats.totalRevenue != null ? 'Rs.' + Number(stats.totalRevenue).toLocaleString() : '—', color: C.green  },
              { label: 'Orders',   value: stats.totalOrders  ?? '—',                                                              color: C.blue   },
              { label: 'AI Score', value: rec?.confidenceScore ? rec.confidenceScore + '%' : '—',                                 color: C.purple },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="font-black text-[15px] leading-none" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] mt-1 font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</p>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2 ml-2">
              <button onClick={e => { e.stopPropagation(); onSetActive() }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                style={isActive
                  ? { color: C.green, background: C.green + '15', border: `1px solid ${C.green}30` }
                  : { color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {isActive ? '✓ Active' : 'Set Active'}
              </button>
              <span className="material-symbols-outlined text-[20px]" style={{ color: C.cyan }}>arrow_forward</span>
            </div>
          </div>
        </div>

        {/* Mobile: tap hint */}
        <div className="flex md:hidden items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex gap-4">
            {[
              { label: 'Revenue', value: stats.totalRevenue != null ? 'Rs.' + Number(stats.totalRevenue).toLocaleString() : '—', color: C.green },
              { label: 'Orders',  value: stats.totalOrders ?? '—', color: C.blue },
            ].map(s => (
              <div key={s.label}>
                <p className="font-black text-[14px]" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</p>
              </div>
            ))}
          </div>
          <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: C.cyan }}>
            Open <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </span>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAlert && lowStock.length > 0 && (
          <LowStockAlert products={lowStock} shopId={shop._id}
            onClose={() => setShowAlert(false)}
            onNavigate={() => { setShowAlert(false); navigate(`/dashboard/shops/${shop._id}/inventory`) }} />
        )}
      </AnimatePresence>
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function Shops() {
  const user          = useAuthStore((s) => s.user)
  const activeShop    = useAuthStore((s) => s.activeShop)
  const setActiveShop = useAuthStore((s) => s.setActiveShop)
  const navigate      = useNavigate()
  const { data, isLoading } = useShopsByOwner(user?._id)
  const shops = data?.data || []

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="font-display text-[28px] font-black text-white tracking-tight">My Shops</h2>
          <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {shops.length} shop{shops.length !== 1 ? 's' : ''} · tap to open full view
          </p>
        </div>
        {shops.length > 0 && (
          <div className="flex gap-2">
            {[
              { label: 'AI Active', count: shops.filter(s => s.aiSettings?.enabled).length, color: C.blue  },
              { label: 'WA Live',   count: shops.filter(s => s.whatsapp?.connected).length,  color: C.green },
            ].filter(p => p.count > 0).map(p => (
              <div key={p.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold"
                style={{ color: p.color, background: p.color + '15', border: `1px solid ${p.color}30` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />{p.count} {p.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
        </div>
      ) : shops.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="material-symbols-outlined text-[64px] block mb-4" style={{ color: C.blue + '40' }}>store</span>
          <p className="text-white font-bold text-[20px] mb-2">No Shops Added Yet</p>
          <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Register your shop during account creation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shops.map(shop => (
            <ShopCard key={shop._id} shop={shop}
              isActive={activeShop?._id === shop._id}
              onSetActive={() => setActiveShop(shop)}
              onViewDetail={() => { setActiveShop(shop); navigate(`/dashboard/shops/${shop._id}`) }} />
          ))}
        </div>
      )}
    </div>
  )
}
