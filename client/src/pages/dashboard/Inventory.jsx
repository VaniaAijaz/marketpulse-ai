import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useProductsByShop, useInventorySummary, useLowStockProducts,
  useCreateProduct, useUpdateProduct, useUpdateProductStock, useDeleteProduct,
} from '../../features/products/productHooks'
import { useGenerateMessage, useLatestRecommendations } from '../../features/ai/aiHooks'
import { useShopById } from '../../features/shops/shopHooks'
import useAuthStore from '../../store/useAuthStore'
import useUIStore from '../../store/useUIStore'
import { getProductCategories, getBusinessHint, CATEGORY_LABELS } from '../../lib/businessCatalog'

/* ─── Design tokens ─────────────────────────────────────── */
const CARD = '#000000'
const R    = '6px'
const F    = "'Inter','Segoe UI',system-ui,sans-serif"
const C = {
  blue:    '#3b82f6',
  violet:  '#8b5cf6',
  emerald: '#10b981',
  cyan:    '#06b6d4',
  rose:    '#f43f5e',
  amber:   '#f59e0b',
  slate:   '#6b7280',
}

const CAT_ICONS = {
  food: 'fastfood', beverage: 'local_cafe', grocery: 'local_grocery_store',
  mobile: 'smartphone', clothing: 'checkroom', other: 'inventory_2',
}

/* ══════════════════════════════════════════════════════════
   STOCK ALERT POLLER — runs every 5 min, pushes to Navbar
══════════════════════════════════════════════════════════ */
function StockAlertPoller({ shopId, products }) {
  const addNotification = useUIStore(s => s.addNotification)
  const lastPush = useRef(0)
  const isFirstRun = useRef(true)

  useEffect(() => {
    const push = () => {
      if (!products?.length) return
      const now = Date.now()
      // allow first run immediately, then throttle to 5 min
      if (!isFirstRun.current && now - lastPush.current < 5 * 60 * 1000) return
      isFirstRun.current = false
      lastPush.current = now

      const out = products.filter(p => (p.stock?.quantity ?? 0) === 0)
      const low = products.filter(p => {
        const q = p.stock?.quantity ?? 0
        return q > 0 && q <= (p.stock?.lowStockThreshold ?? 5)
      })

      out.forEach(p => addNotification({
        id:   `out-${p._id}`,
        type: 'stock_out',
        text: `${p.name} — Out of Stock! Restock karein.`,
      }))
      low.forEach(p => addNotification({
        id:   `low-${p._id}`,
        type: 'stock_low',
        text: `${p.name} — Sirf ${p.stock?.quantity} units baqi hain.`,
      }))
    }

    push() // immediate on mount / products change
    const id = setInterval(push, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [products, addNotification])

  return null
}

/* ══════════════════════════════════════════════════════════
   STOCK NOTIFICATION BANNER (inline on inventory page)
══════════════════════════════════════════════════════════ */
function StockBanner({ lowStock, outOfStock }) {
  const [show, setShow] = useState(true)
  if (!show || (!lowStock.length && !outOfStock.length)) return null

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{ marginBottom: '14px', borderRadius: R, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', fontFamily: F }}>
      {outOfStock.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: C.rose + '0e', borderBottom: lowStock.length ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: C.rose, flexShrink: 0 }}>report</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, color: C.rose, margin: 0 }}>
              {outOfStock.length} product{outOfStock.length > 1 ? 's' : ''} out of stock
            </p>
            <p style={{ fontFamily: F, fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {outOfStock.map(p => p.name).join(' · ')}
            </p>
          </div>
        </div>
      )}
      {lowStock.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: C.amber + '08' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: C.amber, flexShrink: 0 }}>warning</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, color: C.amber, margin: 0 }}>
              {lowStock.length} product{lowStock.length > 1 ? 's' : ''} running low
            </p>
            <p style={{ fontFamily: F, fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lowStock.map(p => `${p.name} (${p.stock?.quantity} left)`).join(' · ')}
            </p>
          </div>
          <button onClick={() => setShow(false)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
          </button>
        </div>
      )}
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════
   AI STOCK ADVISOR — context-aware suggestions
══════════════════════════════════════════════════════════ */
function AiAdvisor({ shopId, businessType, products }) {
  const generateMsg = useGenerateMessage()
  const { data: recData } = useLatestRecommendations(shopId)
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  const rec         = recData?.data
  const topRec      = rec?.recommendations?.slice(0, 3) || []
  const outNames    = products.filter(p => (p.stock?.quantity ?? 0) === 0).map(p => p.name).slice(0, 5)
  const lowNames    = products.filter(p => { const q = p.stock?.quantity ?? 0; return q > 0 && q <= (p.stock?.lowStockThreshold ?? 5) }).map(p => p.name).slice(0, 5)
  const existNames  = products.map(p => p.name).join(', ')

  const handleAsk = () => {
    setError('')
    const contextLines = [
      `I run a ${businessType} shop in Pakistan.`,
      existNames ? `Current products: ${existNames}.` : '',
      outNames.length ? `Out of stock: ${outNames.join(', ')}.` : '',
      lowNames.length ? `Running low: ${lowNames.join(', ')}.` : '',
      `Based on Pakistani market demand, seasonal trends, and common ${businessType} shop buying patterns, suggest exactly 6 specific products I should add or restock RIGHT NOW to maximize sales.`,
      `Reply with ONLY product names, one per line. No explanations, no numbers, no bullets.`,
    ].filter(Boolean).join(' ')

    generateMsg.mutate({ shopId, prompt: contextLines }, {
      onSuccess: (d) => {
        const lines = (d?.message || '').split('\n').map(l => l.trim().replace(/^[-•*\d.]+\s*/, '')).filter(Boolean)
        setSuggestions(lines)
        setOpen(true)
      },
      onError: (err) => {
        const msg = err?.response?.data?.error || err?.message || 'Unknown error'
        setError(`AI error: ${msg}. Dobara try karein.`)
      },
    })
  }

  return (
    <div style={{ background: CARD, border: '1px solid rgba(255,255,255,0.09)', borderRadius: R, overflow: 'hidden', marginBottom: '14px', fontFamily: F }}>
      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: (open || topRec.length) ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: C.violet + '20', border: `1px solid ${C.violet}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: C.violet }}>auto_awesome</span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>AI Stock Advisor</p>
          <p style={{ fontFamily: F, fontSize: '10px', color: 'rgba(255,255,255,0.38)', margin: '2px 0 0' }}>
            Aapki dukaan ke liye kya stock karna chahiye
          </p>
        </div>
        <button onClick={handleAsk} disabled={generateMsg.isPending}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', borderRadius: '6px', fontFamily: F, fontSize: '11px', fontWeight: 600,
            background: C.violet, color: '#fff', border: 'none', cursor: generateMsg.isPending ? 'not-allowed' : 'pointer',
            opacity: generateMsg.isPending ? 0.6 : 1, transition: 'opacity 0.15s',
          }}>
          <span className={`material-symbols-outlined`} style={{ fontSize: '13px', animation: generateMsg.isPending ? 'spin 1s linear infinite' : 'none' }}>
            {generateMsg.isPending ? 'autorenew' : 'tips_and_updates'}
          </span>
          {generateMsg.isPending ? 'Soch raha hoon...' : 'Suggest karo'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '8px 16px', background: C.rose + '0d', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontFamily: F, fontSize: '11px', color: C.rose, margin: 0 }}>{error}</p>
        </div>
      )}

      {/* AI suggestion results */}
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ padding: '12px 16px', borderBottom: topRec.length ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <p style={{ fontFamily: F, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.violet, marginBottom: '8px' }}>
              Yeh products stock karein:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {suggestions.map((s, i) => (
                <span key={i} style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '4px', color: C.violet, background: C.violet + '12', border: `1px solid ${C.violet}25` }}>
                  {s}
                </span>
              ))}
            </div>
            <button onClick={() => setOpen(false)}
              style={{ fontFamily: F, fontSize: '10px', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '8px' }}>
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI rec previews from latest recommendations */}
      {topRec.length > 0 && !open && (
        <div style={{ padding: '8px 16px 10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: F, fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Push today:</span>
          {topRec.map((r, i) => (
            <span key={i} style={{ fontFamily: F, fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '3px', color: C.emerald, background: C.emerald + '12', border: `1px solid ${C.emerald}20` }}>
              {r.productName} {r.expectedUplift}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   INLINE STOCK EDIT CELL
══════════════════════════════════════════════════════════ */
function StockCell({ product, shopId }) {
  const updateStock = useUpdateProductStock()
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(product.stock?.quantity ?? 0)
  const qty    = product.stock?.quantity ?? 0
  const thresh = product.stock?.lowStockThreshold ?? 5
  const isOut  = qty === 0
  const isLow  = qty > 0 && qty <= thresh

  const handleSave = () =>
    updateStock.mutate({ id: product._id, stock: parseInt(val, 10) || 0, shopId },
      { onSuccess: () => setEditing(false) })

  if (editing) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <input type="number" min="0" value={val} autoFocus
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
        style={{ width: '52px', padding: '3px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', color: '#fff', textAlign: 'center', background: 'rgba(0,0,0,0.4)', border: `1px solid ${C.cyan}50`, outline: 'none' }} />
      <button onClick={handleSave} disabled={updateStock.isPending}
        style={{ width: '20px', height: '20px', borderRadius: '4px', background: C.emerald + '25', color: C.emerald, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>check</span>
      </button>
      <button onClick={() => setEditing(false)}
        style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'none', color: 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>close</span>
      </button>
    </div>
  )

  return (
    <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color: isOut ? C.rose : isLow ? C.amber : '#fff' }}>{qty}</span>
      {isOut && <span style={{ fontFamily: F, fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', padding: '1px 5px', borderRadius: '3px', color: C.rose, background: C.rose + '18' }}>OUT</span>}
      {isLow && <span style={{ fontFamily: F, fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', padding: '1px 5px', borderRadius: '3px', color: C.amber, background: C.amber + '15' }}>LOW</span>}
      <span className="material-symbols-outlined" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>edit</span>
    </button>
  )
}

/* ══════════════════════════════════════════════════════════
   FIELD WRAPPER (outside modal to prevent focus loss)
══════════════════════════════════════════════════════════ */
function Field({ label, children, span2 = false }) {
  return (
    <div style={span2 ? { gridColumn: 'span 2' } : {}}>
      <label style={{ display: 'block', fontFamily: F, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════
   PRODUCT MODAL
══════════════════════════════════════════════════════════ */
function ProductModal({ shopId, product, onClose, allowedCategories }) {
  const isEdit  = !!product
  const createM = useCreateProduct()
  const updateM = useUpdateProduct()
  const defCat  = allowedCategories.includes(product?.category) ? product?.category : allowedCategories[0] || 'other'

  const [form, setForm] = useState({
    name: product?.name || '', category: defCat,
    sellingPrice: product?.pricing?.sellingPrice || '',
    costPrice:    product?.pricing?.costPrice    || '',
    quantity:     product?.stock?.quantity       ?? '',
    lowStockThreshold: product?.stock?.lowStockThreshold ?? 5,
    description:  product?.description || '',
  })
  const [error, setError] = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const inp = {
    background: '#111', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '6px', color: '#fff', fontSize: '13px',
    padding: '10px 12px', width: '100%', fontFamily: F, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  }
  const focus = e => e.target.style.borderColor = C.blue + '60'
  const blur  = e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'

  const handleSubmit = (e) => {
    e.preventDefault(); setError('')
    if (!form.name || !form.sellingPrice) { setError('Naam aur selling price zaroori hai'); return }
    const payload = {
      shopId, name: form.name, category: form.category, description: form.description,
      pricing: { sellingPrice: parseFloat(form.sellingPrice), costPrice: parseFloat(form.costPrice) || 0 },
      stock: { quantity: parseInt(form.quantity) || 0, lowStockThreshold: parseInt(form.lowStockThreshold) || 5 },
    }
    const opts = { onSuccess: onClose, onError: err => setError(err.response?.data?.error || 'Failed') }
    isEdit ? updateM.mutate({ id: product._id, ...payload }, opts) : createM.mutate(payload, opts)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}>
      <motion.div initial={{ scale: 0.96, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96 }}
        onClick={e => e.stopPropagation()}
        style={{ background: CARD, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 40px 80px rgba(0,0,0,0.85)', fontFamily: F, position: 'relative' }}>

        {/* close */}
        <button onClick={onClose}
          style={{ position: 'absolute', top: '14px', right: '14px', width: '28px', height: '28px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
        </button>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: C.blue + '20', border: `1px solid ${C.blue}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '17px', color: C.blue }}>{isEdit ? 'edit' : 'add_box'}</span>
          </div>
          <div>
            <h2 style={{ fontFamily: F, fontWeight: 700, fontSize: '16px', color: '#fff', margin: 0 }}>
              {isEdit ? 'Product Update' : 'Naya Product Add Karo'}
            </h2>
            <p style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.38)', margin: '2px 0 0' }}>
              {isEdit ? 'Details update karein' : 'Inventory mein naya item add karein'}
            </p>
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '6px', background: C.rose + '10', border: `1px solid ${C.rose}28`, marginBottom: '14px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '13px', color: C.rose }}>error</span>
            <span style={{ fontFamily: F, fontSize: '11px', color: C.rose }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Product Ka Naam *" span2>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Jaise: Pepsi 1.5L, Basmati Rice 5kg"
              style={inp} onFocus={focus} onBlur={blur} />
          </Field>

          <Field label="Category">
            <select value={form.category} onChange={e => set('category', e.target.value)}
              style={{ ...inp, background: '#1a1a1a' }}>
              {allowedCategories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
            </select>
          </Field>

          <Field label="Stock (Units) *">
            <input type="number" min="0" value={form.quantity}
              onChange={e => set('quantity', e.target.value)}
              placeholder="0" style={{ ...inp, fontFamily: 'monospace' }}
              onFocus={focus} onBlur={blur} />
          </Field>

          <Field label="Selling Price (Rs.) *">
            <input type="number" min="0" step="0.01" value={form.sellingPrice}
              onChange={e => set('sellingPrice', e.target.value)}
              placeholder="0" style={{ ...inp, fontFamily: 'monospace' }}
              onFocus={focus} onBlur={blur} />
          </Field>

          <Field label="Cost Price (Rs.)">
            <input type="number" min="0" step="0.01" value={form.costPrice}
              onChange={e => set('costPrice', e.target.value)}
              placeholder="0" style={{ ...inp, fontFamily: 'monospace' }}
              onFocus={focus} onBlur={blur} />
          </Field>

          <Field label="Low Stock Alert (Units)">
            <input type="number" min="0" value={form.lowStockThreshold}
              onChange={e => set('lowStockThreshold', e.target.value)}
              style={{ ...inp, fontFamily: 'monospace' }}
              onFocus={focus} onBlur={blur} />
          </Field>

          <Field label="Description (Optional)" span2>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Chhoti si description..."
              style={inp} onFocus={focus} onBlur={blur} />
          </Field>

          {/* submit — span full */}
          <div style={{ gridColumn: 'span 2', marginTop: '4px' }}>
            <button type="submit" disabled={createM.isPending || updateM.isPending}
              style={{
                width: '100%', padding: '11px', borderRadius: '6px', fontFamily: F, fontSize: '13px', fontWeight: 600,
                background: C.blue, color: '#fff', border: 'none', cursor: 'pointer',
                opacity: createM.isPending || updateM.isPending ? 0.6 : 1,
                boxShadow: `0 0 16px ${C.blue}40`, transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
              onMouseLeave={e => e.currentTarget.style.background = C.blue}>
              {createM.isPending || updateM.isPending ? 'Save ho raha hai...' : isEdit ? 'Update Karo' : 'Inventory Mein Add Karo'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function Inventory() {
  const { shopId } = useParams()
  const navigate   = useNavigate()
  const user       = useAuthStore(s => s.user)

  const { data: shopData }                   = useShopById(shopId)
  const { data: productsData, isLoading }    = useProductsByShop(shopId)
  const { data: summaryRes }                 = useInventorySummary(shopId)
  const { data: lowStockData }               = useLowStockProducts(shopId)
  const deleteMutation                       = useDeleteProduct()

  const [modal, setModal]           = useState(null)
  const [search, setSearch]         = useState('')
  const [catFilter, setCatFilter]   = useState('')
  const [confirmDel, setConfirmDel] = useState(null)

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
    const mc = !catFilter || p.category === catFilter
    return ms && mc
  })

  const totalValue = filtered.reduce((s, p) => s + ((p.pricing?.sellingPrice || 0) * (p.stock?.quantity || 0)), 0)

  const kpis = [
    { label: 'In Stock',     value: summary?.inStockCount    ?? 0, color: C.emerald, icon: 'check_circle'  },
    { label: 'Low Stock',    value: summary?.lowStockCount   ?? 0, color: C.amber,   icon: 'warning'       },
    { label: 'Out of Stock', value: summary?.outOfStockCount ?? 0, color: C.rose,    icon: 'report'        },
    { label: 'Total Items',  value: allProducts.length,             color: C.blue,   icon: 'inventory_2'   },
  ]

  return (
    <div style={{ fontFamily: F }}>

      {/* Stock alert poller — invisible, runs every 5 min */}
      <StockAlertPoller shopId={shopId} products={allProducts} />

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => navigate(`/dashboard/shops/${shopId}`)}
            style={{ width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>arrow_back</span>
          </button>
          <div>
            <h2 style={{ fontFamily: F, fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Inventory</h2>
            <p style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.38)', marginTop: '3px' }}>
              {shop?.name} · {allProducts.length} products
            </p>
          </div>
        </div>
        <button onClick={() => setModal('add')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '6px', fontFamily: F, fontSize: '13px', fontWeight: 600, background: C.blue, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: `0 0 14px ${C.blue}40` }}
          onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
          onMouseLeave={e => e.currentTarget.style.background = C.blue}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>add</span>
          Product Add Karo
        </button>
      </div>

      {/* ── Business hint ── */}
      {bizHint && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', background: C.cyan + '0a', border: `1px solid ${C.cyan}18`, borderRadius: '6px', marginBottom: '14px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '13px', color: C.cyan }}>category</span>
          <span style={{ fontFamily: F, fontSize: '11px', color: C.cyan, fontWeight: 600, textTransform: 'capitalize' }}>{businessType}</span>
          <span style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.38)' }}>— {bizHint}</span>
        </div>
      )}

      {/* ── Stock notification banner ── */}
      <StockBanner lowStock={lowStock} outOfStock={outOfStock} />

      {/* ── AI Stock Advisor ── */}
      <AiAdvisor shopId={shopId} businessType={businessType} products={allProducts} />

      {/* ── KPI strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
        {kpis.map((k, i) => (
          <motion.div key={k.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{ background: CARD, border: `1px solid rgba(255,255,255,0.08)`, borderRadius: '6px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: k.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: k.color }}>{k.icon}</span>
            </div>
            <div>
              <p style={{ fontFamily: F, fontWeight: 800, fontSize: '24px', color: k.color, lineHeight: 1, margin: 0 }}>{k.value}</p>
              <p style={{ fontFamily: F, fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.38)', marginTop: '3px' }}>{k.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Search + filter ── */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', color: 'rgba(255,255,255,0.3)' }}>search</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '6px', fontFamily: F, fontSize: '12px', background: CARD, border: '1px solid rgba(255,255,255,0.09)', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = C.blue + '50'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'} />
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['', ...allowedCats].map(c => {
            const active = catFilter === c
            return (
              <button key={c} onClick={() => setCatFilter(c)}
                style={{ padding: '7px 12px', borderRadius: '6px', fontFamily: F, fontSize: '11px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s',
                  color: active ? C.cyan : 'rgba(255,255,255,0.45)',
                  background: active ? C.cyan + '15' : CARD,
                  border: active ? `1px solid ${C.cyan}35` : '1px solid rgba(255,255,255,0.09)',
                }}>
                {c ? (CATEGORY_LABELS[c] || c) : 'All'}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: CARD, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>
                {[
                  { h: 'Product',     align: 'left'  },
                  { h: 'Category',    align: 'left',  hide: 'md' },
                  { h: 'Price (Rs.)', align: 'right' },
                  { h: 'Stock',       align: 'center'},
                  { h: 'Cost',        align: 'right', hide: 'lg' },
                  { h: 'Actions',     align: 'center'},
                ].map(col => (
                  <th key={col.h}
                    className={col.hide === 'md' ? 'hidden md:table-cell' : col.hide === 'lg' ? 'hidden lg:table-cell' : ''}
                    style={{ padding: '12px 16px', fontFamily: F, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(255,255,255,0.3)', textAlign: col.align }}>
                    {col.h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div style={{ height: '12px', borderRadius: '3px', background: 'rgba(255,255,255,0.05)' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'rgba(255,255,255,0.08)', display: 'block', marginBottom: '10px' }}>inventory_2</span>
                    <p style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.28)', margin: 0 }}>
                      {allProducts.length === 0 ? 'Abhi koi product nahi. Pehla product add karein.' : 'Koi match nahi mila.'}
                    </p>
                    {allProducts.length === 0 && (
                      <button onClick={() => setModal('add')}
                        style={{ marginTop: '12px', padding: '8px 20px', borderRadius: '6px', fontFamily: F, fontSize: '11px', fontWeight: 600, background: C.blue, color: '#fff', border: 'none', cursor: 'pointer' }}>
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
                  <motion.tr key={p._id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                    {/* Product */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '6px', background: isOut ? C.rose + '18' : isLow ? C.amber + '15' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: isOut ? C.rose : isLow ? C.amber : 'rgba(255,255,255,0.4)' }}>
                            {CAT_ICONS[p.category] || 'inventory_2'}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontFamily: F, fontSize: '13px', fontWeight: 600, color: '#fff', margin: 0 }}>{p.name}</p>
                          {p.description && (
                            <p style={{ fontFamily: F, fontSize: '10px', color: 'rgba(255,255,255,0.32)', margin: '1px 0 0', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '13px 16px' }} className="hidden md:table-cell">
                      <span style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{p.category}</span>
                    </td>

                    {/* Price */}
                    <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color: C.emerald }}>
                        Rs.{(p.pricing?.sellingPrice || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Stock */}
                    <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                      <StockCell product={p} shopId={shopId} />
                    </td>

                    {/* Cost */}
                    <td style={{ padding: '13px 16px', textAlign: 'right' }} className="hidden lg:table-cell">
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.28)' }}>
                        Rs.{(p.pricing?.costPrice || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                      <div className="group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', opacity: 0, transition: 'opacity 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0}
                        ref={el => { if (el) { el.closest('tr').addEventListener('mouseenter', () => el.style.opacity = 1); el.closest('tr').addEventListener('mouseleave', () => el.style.opacity = 0) } }}>
                        <button onClick={() => setModal(p)}
                          style={{ width: '24px', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.background = C.blue + '20'; e.currentTarget.style.color = C.blue }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                        </button>
                        <button onClick={() => setConfirmDel(p._id)}
                          style={{ width: '24px', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.background = C.rose + '20'; e.currentTarget.style.color = C.rose }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* footer */}
        {filtered.length > 0 && (
          <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.32)' }}>
            <span>{filtered.length} products</span>
            <span>Stock value: <span style={{ color: '#fff', fontWeight: 700 }}>Rs.{totalValue.toLocaleString()}</span></span>
          </div>
        )}
      </div>

      {/* ── Delete confirm modal ── */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmDel(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              style={{ background: CARD, border: `1px solid ${C.rose}25`, borderRadius: '8px', padding: '24px', maxWidth: '360px', width: '100%', fontFamily: F }}>
              <span className="material-symbols-outlined" style={{ fontSize: '30px', color: C.rose, display: 'block', marginBottom: '10px' }}>delete_forever</span>
              <p style={{ fontFamily: F, fontWeight: 700, fontSize: '15px', color: '#fff', marginBottom: '6px' }}>Delete karein?</p>
              <p style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.38)', marginBottom: '20px' }}>Yeh product hamesha ke liye remove ho jayega.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setConfirmDel(null)}
                  style={{ flex: 1, padding: '9px', borderRadius: '6px', fontFamily: F, fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', background: 'none', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => deleteMutation.mutate({ id: confirmDel, shopId }, { onSuccess: () => setConfirmDel(null) })}
                  disabled={deleteMutation.isPending}
                  style={{ flex: 1, padding: '9px', borderRadius: '6px', fontFamily: F, fontSize: '12px', fontWeight: 700, color: '#fff', background: C.rose, border: 'none', cursor: 'pointer', opacity: deleteMutation.isPending ? 0.6 : 1 }}>
                  {deleteMutation.isPending ? 'Hata raha...' : 'Haan, Delete Karo'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add/Edit Modal ── */}
      <AnimatePresence>
        {modal && (
          <ProductModal
            shopId={shopId}
            product={modal === 'add' ? null : modal}
            allowedCategories={allowedCats}
            onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
