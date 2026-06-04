import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useCustomersByShop, useInactiveCustomers, useTopCustomers,
  useAddCustomerTag, useToggleBlockCustomer, useBackfillCustomerStats,
} from '../../features/customers/customerHooks'
import useAuthStore from '../../store/useAuthStore'

const P = {
  card: '#000000', border: 'rgba(255,255,255,0.08)',
  text: '#ffffff', muted: 'rgba(255,255,255,0.5)', dim: 'rgba(255,255,255,0.25)',
  blue: '#3b82f6', indigo: '#6366f1', violet: '#8b5cf6', emerald: '#10b981',
  slate: '#94a3b8', rose: '#f43f5e', amber: '#f59e0b', cyan: '#06b6d4',
}
const FONT = "'Inter','Segoe UI',system-ui,sans-serif"
const R = '6px', R2 = '8px'

const SEG_CFG = {
  vip:      { color: P.amber,   icon: 'workspace_premium' },
  regular:  { color: P.cyan,    icon: 'repeat'            },
  active:   { color: P.emerald, icon: 'trending_up'       },
  new:      { color: P.blue,    icon: 'person_add'        },
  inactive: { color: P.slate,   icon: 'schedule'          },
  blocked:  { color: P.rose,    icon: 'block'             },
}

const SEGMENTS = ['', 'vip', 'active', 'regular', 'new', 'inactive', 'blocked']

function SegBadge({ segment }) {
  const cfg = SEG_CFG[segment] || SEG_CFG.new
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: FONT, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', padding: '2px 8px', borderRadius: '4px', color: cfg.color, background: cfg.color + '18', border: `1px solid ${cfg.color}30` }}>
      {segment || 'new'}
    </span>
  )
}

// ── Customer Detail Drawer ────────────────────────────────
function CustomerDrawer({ customer, onClose }) {
  const [tag, setTag]         = useState('')
  const addTagMut             = useAddCustomerTag()
  const blockMut              = useToggleBlockCustomer()
  const cfg                   = SEG_CFG[customer.segment] || SEG_CFG.new
  const initials              = (customer.name || customer.phone || '?').slice(0, 2).toUpperCase()
  const totalSpent            = customer.stats?.totalSpent   || 0
  const totalOrders           = customer.stats?.totalOrders  || 0
  const avgOrder              = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0

  const handleAddTag = () => {
    if (!tag.trim()) return
    addTagMut.mutate({ customerId: customer._id, tag: tag.trim() }, { onSuccess: () => setTag('') })
  }

  const Row = ({ l, v, mono = false }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${P.border}` }}>
      <span style={{ fontFamily: FONT, fontSize: '11px', color: P.muted }}>{l}</span>
      <span style={{ fontFamily: mono ? "'Courier New',monospace" : FONT, fontSize: '11px', fontWeight: 600, color: P.text }}>{v}</span>
    </div>
  )

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      style={{ position: 'fixed', right: 0, top: 0, height: '100%', width: '360px', background: '#050505', borderLeft: `1px solid ${P.border}`, zIndex: 50, display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 60px rgba(0,0,0,.7)', fontFamily: FONT }}>

      {/* Header */}
      <div style={{ padding: '20px', borderBottom: `1px solid ${P.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: R2, background: customer.isBlocked ? P.rose + '25' : P.blue + '25', border: `1px solid ${customer.isBlocked ? P.rose : P.blue}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, fontSize: '15px', color: customer.isBlocked ? P.rose : P.blue, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '15px', color: P.text, margin: 0 }}>{customer.name || 'Unknown'}</p>
            <p style={{ fontFamily: "'Courier New',monospace", fontSize: '11px', color: P.cyan, margin: '3px 0' }}>{customer.phone}</p>
            <SegBadge segment={customer.segment} />
          </div>
        </div>
        <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: R, background: 'none', border: `1px solid ${P.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: P.muted }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = P.text }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = P.muted }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { l: 'Total Spent',  v: `Rs.${totalSpent.toLocaleString()}`,  c: P.emerald },
            { l: 'Orders',       v: totalOrders,                           c: P.blue    },
            { l: 'Avg Order',    v: `Rs.${avgOrder.toLocaleString()}`,     c: P.violet  },
            { l: 'Visits',       v: customer.stats?.visitCount || totalOrders, c: P.amber },
          ].map(s => (
            <div key={s.l} style={{ background: P.card, border: `1px solid ${s.c}20`, borderRadius: R, padding: '12px' }}>
              <p style={{ fontFamily: FONT, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: P.dim, margin: '0 0 4px' }}>{s.l}</p>
              <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: '18px', color: s.c, margin: 0, lineHeight: 1 }}>{s.v}</p>
            </div>
          ))}
        </div>

        {/* Spend progress */}
        {totalSpent > 0 && (
          <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: R, padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontSize: '10px', marginBottom: '6px' }}>
              <span style={{ color: P.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em' }}>Spend vs VIP</span>
              <span style={{ color: P.emerald, fontWeight: 700 }}>Rs.{totalSpent.toLocaleString()} / 5,000</span>
            </div>
            <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((totalSpent / 5000) * 100, 100)}%` }}
                transition={{ duration: 0.8 }}
                style={{ height: '100%', borderRadius: '2px', background: `linear-gradient(90deg, ${P.blue}, ${P.emerald})` }} />
            </div>
          </div>
        )}

        {/* Info */}
        <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: R, padding: '12px' }}>
          <Row l="Phone"      v={customer.phone} mono />
          {customer.email && <Row l="Email"   v={customer.email} />}
          {customer.firstVisit && <Row l="First Visit" v={new Date(customer.firstVisit).toLocaleDateString()} />}
          {customer.lastVisit  && <Row l="Last Seen"   v={new Date(customer.lastVisit).toLocaleDateString()} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontFamily: FONT, fontSize: '11px', color: P.muted }}>WhatsApp</span>
            <span style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 600, color: customer.whatsappOptIn ? P.emerald : P.slate }}>
              {customer.whatsappOptIn ? 'Opted In' : 'Opted Out'}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: R, padding: '12px' }}>
          <p style={{ fontFamily: FONT, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: P.dim, margin: '0 0 8px' }}>Tags</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px', minHeight: '20px' }}>
            {(customer.tags || []).length === 0
              ? <span style={{ fontFamily: FONT, fontSize: '11px', color: P.dim, fontStyle: 'italic' }}>No tags yet</span>
              : customer.tags.map(t => (
                  <span key={t} style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', color: P.cyan, background: P.cyan + '12', border: `1px solid ${P.cyan}25` }}>{t}</span>
                ))
            }
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input value={tag} onChange={e => setTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTag()}
              placeholder="Add tag..."
              style={{ flex: 1, fontFamily: FONT, fontSize: '12px', padding: '7px 10px', borderRadius: R, background: 'rgba(255,255,255,0.04)', border: `1px solid ${P.border}`, color: P.text, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = P.blue + '70'}
              onBlur={e => e.target.style.borderColor = P.border} />
            <button onClick={handleAddTag} disabled={addTagMut.isPending}
              style={{ fontFamily: FONT, fontWeight: 700, fontSize: '11px', padding: '7px 14px', borderRadius: R, background: P.blue + '18', border: `1px solid ${P.blue}30`, color: P.blue, cursor: 'pointer' }}>
              Add
            </button>
          </div>
        </div>

        {/* Block */}
        <div style={{ background: customer.isBlocked ? P.rose + '08' : P.card, border: `1px solid ${customer.isBlocked ? P.rose + '25' : P.border}`, borderRadius: R, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: '12px', color: P.text, margin: '0 0 2px' }}>
              {customer.isBlocked ? 'Customer Blocked' : 'Block Customer'}
            </p>
            <p style={{ fontFamily: FONT, fontSize: '10px', color: P.muted, margin: 0 }}>
              {customer.isBlocked ? (customer.blockReason || 'No reason given') : 'Prevent further interactions'}
            </p>
          </div>
          <button onClick={() => blockMut.mutate(customer._id)} disabled={blockMut.isPending}
            style={{ fontFamily: FONT, fontWeight: 700, fontSize: '11px', padding: '6px 14px', borderRadius: R, cursor: 'pointer', transition: 'all .12s',
              color: customer.isBlocked ? P.emerald : P.rose,
              background: (customer.isBlocked ? P.emerald : P.rose) + '15',
              border: `1px solid ${(customer.isBlocked ? P.emerald : P.rose)}30` }}>
            {blockMut.isPending ? '...' : customer.isBlocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function Users() {
  const activeShop = useAuthStore((s) => s.activeShop)
  const [search, setSearch]   = useState('')
  const [segment, setSegment] = useState('')
  const [page, setPage]       = useState(1)
  const [selected, setSelected] = useState(null)
  const [synced, setSynced]   = useState(false)

  const { data, isLoading }     = useCustomersByShop(activeShop?._id, { page, limit: 15, segment: segment || undefined, search: search || undefined })
  const { data: topData }       = useTopCustomers(activeShop?._id, 3)
  const { data: inactiveData }  = useInactiveCustomers(activeShop?._id)
  const backfillMut             = useBackfillCustomerStats()

  const customers     = data?.data?.customers   || []
  const pagination    = data?.data?.pagination  || {}
  const topCustomers  = topData?.data           || []
  const inactiveCount = inactiveData?.count      || 0
  const waOptIn       = customers.filter(c => c.whatsappOptIn).length

  if (!activeShop) return (
    <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: FONT }}>
      <span className="material-symbols-outlined" style={{ fontSize: '44px', color: 'rgba(255,255,255,0.08)', display: 'block', marginBottom: '12px' }}>group</span>
      <p style={{ fontWeight: 700, fontSize: '16px', color: P.text, margin: '0 0 5px' }}>No Active Shop</p>
      <p style={{ fontSize: '13px', color: P.muted, margin: 0 }}>Select a shop to view customers.</p>
    </div>
  )

  return (
    <div style={{ fontFamily: FONT, position: 'relative' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: '24px', color: P.text, margin: 0 }}>Customer Registry</h2>
          <p style={{ fontFamily: FONT, fontSize: '12px', color: P.muted, margin: '4px 0 0' }}>
            {pagination.total ?? 0} customers · {activeShop.name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {synced && (
            <span style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 500, padding: '5px 10px', borderRadius: R, color: P.emerald, background: 'transparent', border: `1px solid ${P.emerald}35`, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>check_circle</span>
              Synced
            </span>
          )}
          <button
            onClick={() => backfillMut.mutate(activeShop._id, { onSuccess: () => setSynced(true) })}
            disabled={backfillMut.isPending}
            style={{ fontFamily: FONT, fontWeight: 500, fontSize: '12px', padding: '7px 14px', borderRadius: R, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.18)', cursor: backfillMut.isPending ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all .15s' }}
            onMouseEnter={e => { if (!backfillMut.isPending) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; e.currentTarget.style.color = '#fff' } }}
            onMouseLeave={e => { if (!backfillMut.isPending) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' } }}>
            <span className={`material-symbols-outlined ${backfillMut.isPending ? 'animate-spin' : ''}`} style={{ fontSize: '14px' }}>
              {backfillMut.isPending ? 'autorenew' : 'sync'}
            </span>
            {backfillMut.isPending ? 'Syncing...' : 'Sync Stats'}
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { l: 'Total',        v: pagination.total || 0, c: P.blue,    icon: 'group'              },
          { l: 'VIP',          v: customers.filter(c => c.segment === 'vip').length, c: P.amber, icon: 'workspace_premium' },
          { l: 'Inactive',     v: inactiveCount,         c: P.rose,    icon: 'schedule'           },
          { l: 'WhatsApp',     v: waOptIn,               c: '#25D366', icon: 'forum'              },
        ].map((k, i) => (
          <motion.div key={k.l} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .06 }}
            style={{ background: P.card, border: `1px solid ${k.c}18`, borderRadius: R2, padding: '14px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -6, right: -6, width: 44, height: 44, borderRadius: '50%', background: k.c + '18', filter: 'blur(14px)' }} />
            <div style={{ width: '30px', height: '30px', borderRadius: R, background: k.c + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: k.c }}>{k.icon}</span>
            </div>
            <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: '22px', color: k.c, margin: 0, lineHeight: 1 }}>{k.v}</p>
            <p style={{ fontFamily: FONT, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: P.dim, margin: '3px 0 0' }}>{k.l}</p>
          </motion.div>
        ))}
      </div>

      {/* Top spenders */}
      {topCustomers.length > 0 && (
        <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: R2, padding: '14px', marginBottom: '16px' }}>
          <p style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 700, color: P.muted, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '.1em' }}>Top Spenders</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {topCustomers.map((c, i) => {
              const RANK_CLR = [P.amber, P.slate, P.cyan]
              return (
                <button key={c._id} onClick={() => setSelected(c)}
                  style={{ fontFamily: FONT, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: R, background: 'rgba(255,255,255,0.04)', border: `1px solid ${P.border}`, cursor: 'pointer', transition: 'border-color .12s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = RANK_CLR[i] + '50'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = P.border}>
                  <span style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 800, color: RANK_CLR[i] }}>#{i + 1}</span>
                  <span style={{ fontFamily: FONT, fontSize: '12px', fontWeight: 600, color: P.text }}>{c.name || 'Guest'}</span>
                  <span style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 700, color: P.emerald }}>Rs.{(c.stats?.totalSpent || 0).toLocaleString()}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', color: P.dim, pointerEvents: 'none' }}>search</span>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name, phone, or tag..."
            style={{ width: '100%', fontFamily: FONT, fontSize: '12px', padding: '8px 12px 8px 34px', borderRadius: R, background: P.card, border: `1px solid ${P.border}`, color: P.text, outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = P.blue + '60'}
            onBlur={e => e.target.style.borderColor = P.border} />
        </div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {SEGMENTS.map(s => {
            const col = s ? (SEG_CFG[s]?.color || P.blue) : P.blue
            const active = segment === s
            return (
              <button key={s} onClick={() => { setSegment(s); setPage(1) }}
                style={{ fontFamily: FONT, fontWeight: 600, fontSize: '11px', padding: '7px 12px', borderRadius: R, cursor: 'pointer', transition: 'all .12s', textTransform: 'capitalize',
                  background: active ? col + '18' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? col + '40' : P.border}`,
                  color: active ? col : P.muted }}>
                {s || 'All'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: R2, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${P.border}`, background: 'rgba(255,255,255,0.02)' }}>
                {['Customer', 'Phone', 'Segment', 'Total Spent', 'Orders', 'Last Visit'].map((h, i) => (
                  <th key={h} style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.09em', color: P.dim, padding: '12px 16px', textAlign: i >= 3 ? 'right' : 'left' }}
                    className={i === 1 ? 'hidden md:table-cell' : i === 2 ? 'hidden lg:table-cell' : i === 3 ? 'hidden lg:table-cell' : i === 5 ? 'hidden xl:table-cell' : ''}>
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
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '56px 24px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'rgba(255,255,255,0.08)', display: 'block', marginBottom: '10px' }}>group</span>
                    <p style={{ fontFamily: FONT, fontSize: '13px', color: P.dim, margin: 0 }}>No customers found.</p>
                  </td>
                </tr>
              ) : customers.map((c, i) => {
                const initials = (c.name || c.phone || '?').slice(0, 2).toUpperCase()
                const spent  = c.stats?.totalSpent  || 0
                const orders = c.stats?.totalOrders || 0
                return (
                  <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * .025 }}
                    onClick={() => setSelected(c)}
                    style={{ borderBottom: `1px solid ${P.border}`, cursor: 'pointer', transition: 'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: R, background: c.isBlocked ? P.rose + '20' : P.blue + '20', border: `1px solid ${c.isBlocked ? P.rose : P.blue}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, fontSize: '11px', color: c.isBlocked ? P.rose : P.blue, flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div>
                          <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: '13px', color: P.text, margin: 0 }}>{c.name || 'Unnamed'}</p>
                          {c.email && <p style={{ fontFamily: FONT, fontSize: '10px', color: P.dim, margin: '1px 0 0' }}>{c.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }} className="hidden md:table-cell">
                      <span style={{ fontFamily: "'Courier New',monospace", fontSize: '11px', color: P.muted }}>{c.phone}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }} className="hidden lg:table-cell">
                      <SegBadge segment={c.segment} />
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }} className="hidden lg:table-cell">
                      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: '12px', color: spent > 0 ? P.emerald : P.dim }}>
                        Rs.{spent.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: '12px', color: orders > 0 ? P.blue : P.dim }}>{orders}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }} className="hidden xl:table-cell">
                      <span style={{ fontFamily: FONT, fontSize: '11px', color: P.dim }}>
                        {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : '—'}
                      </span>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {customers.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: `1px solid ${P.border}` }}>
            <span style={{ fontFamily: FONT, fontSize: '11px', color: P.dim }}>
              {pagination.total} customers · {waOptIn} on WhatsApp
            </span>
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ fontFamily: FONT, fontSize: '11px', padding: '5px 12px', borderRadius: R, background: 'rgba(255,255,255,0.04)', border: `1px solid ${P.border}`, color: P.muted, cursor: 'pointer', opacity: page === 1 ? .3 : 1 }}>
                  ← Prev
                </button>
                <span style={{ fontFamily: FONT, fontSize: '11px', color: P.dim, padding: '0 8px' }}>{page}/{pagination.pages}</span>
                <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                  style={{ fontFamily: FONT, fontSize: '11px', padding: '5px 12px', borderRadius: R, background: 'rgba(255,255,255,0.04)', border: `1px solid ${P.border}`, color: P.muted, cursor: 'pointer', opacity: page === pagination.pages ? .3 : 1 }}>
                  Next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 40 }} />
            <CustomerDrawer customer={selected} onClose={() => setSelected(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
