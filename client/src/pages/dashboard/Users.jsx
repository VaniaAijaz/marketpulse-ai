import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCustomersByShop, useInactiveCustomers, useTopCustomers, useAddCustomerTag, useToggleBlockCustomer, useBackfillCustomerStats } from '../../features/customers/customerHooks'
import useAuthStore from '../../store/useAuthStore'

// Analytics-matching color palette
const C = { blue: '#1390ff', purple: '#7c3aed', cyan: '#00d4ff', green: '#22c55e', amber: '#f59e0b', pink: '#f43f5e', teal: '#14b8a6', violet: '#8b5cf6' }

const SEGMENT_CONFIG = {
  vip:      { color: C.amber,  bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  icon: 'workspace_premium' },
  regular:  { color: C.teal,   bg: 'rgba(20,184,166,0.12)',  border: 'rgba(20,184,166,0.3)',  icon: 'repeat' },
  active:   { color: C.green,  bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)',   icon: 'trending_up' },
  new:      { color: C.blue,   bg: 'rgba(19,144,255,0.12)',  border: 'rgba(19,144,255,0.3)',  icon: 'person_add' },
  inactive: { color: '#6b7280',bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', icon: 'schedule' },
  blocked:  { color: C.pink,   bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.3)',   icon: 'block' },
}

function SegmentBadge({ segment }) {
  const cfg = SEGMENT_CONFIG[segment] || SEGMENT_CONFIG.new
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border capitalize"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
      <span className="material-symbols-outlined text-[11px]">{cfg.icon}</span>
      {segment || 'new'}
    </span>
  )
}

function StatCard({ label, value, icon, color, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-xl p-4 relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full blur-xl" style={{ background: color + '30' }} />
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '22' }}>
            <span className="material-symbols-outlined text-[14px]" style={{ color }}>{icon}</span>
          </div>
          <span className="text-[9px] text-white/40 font-semibold uppercase tracking-wider">{label}</span>
        </div>
        <p className="font-display font-black text-[18px] text-white leading-none">{value}</p>
      </div>
    </motion.div>
  )
}

function CustomerDrawer({ customer, onClose }) {
  const [tag, setTag] = useState('')
  const addTagMutation = useAddCustomerTag()
  const blockMutation = useToggleBlockCustomer()

  const handleAddTag = () => {
    if (!tag.trim()) return
    addTagMutation.mutate({ customerId: customer._id, tag: tag.trim() }, { onSuccess: () => setTag('') })
  }

  const initials = (customer.name || customer.phone || '?').slice(0, 2).toUpperCase()
  const cfg = SEGMENT_CONFIG[customer.segment] || SEGMENT_CONFIG.new
  const totalSpent = customer.stats?.totalSpent || 0
  const totalOrders = customer.stats?.totalOrders || 0
  const avgOrder = customer.stats?.avgOrderValue || (totalOrders > 0 ? totalSpent / totalOrders : 0)

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed right-0 top-0 h-full w-full max-w-[400px] z-50 flex flex-col shadow-[-30px_0_80px_rgba(0,0,0,0.6)]"
      style={{ background: 'linear-gradient(180deg, #0d1b35 0%, #0a1628 100%)', borderLeft: '1px solid rgba(255,255,255,0.1)' }}
    >
      {/* Header */}
      <div className="p-6 flex items-start justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-[18px] text-white relative"
            style={{ background: customer.isBlocked ? 'rgba(244,63,94,0.3)' : `linear-gradient(135deg, ${C.blue}88, ${C.purple}88)`, border: `1px solid ${customer.isBlocked ? C.pink : C.blue}44` }}>
            {initials}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: cfg.color, border: '2px solid #0a1628' }}>
              <span className="material-symbols-outlined text-[9px] text-white">{cfg.icon}</span>
            </div>
          </div>
          <div>
            <p className="font-bold text-white text-[17px] leading-tight">{customer.name || 'Unknown'}</p>
            <p className="text-[12px] font-mono mt-0.5" style={{ color: C.cyan }}>{customer.phone}</p>
            <SegmentBadge segment={customer.segment} />
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total Spent" value={`Rs.${totalSpent.toLocaleString()}`} icon="payments" color={C.green} delay={0.05} />
          <StatCard label="Total Orders" value={totalOrders} icon="shopping_bag" color={C.blue} delay={0.1} />
          <StatCard label="Avg Order" value={`Rs.${Math.round(avgOrder).toLocaleString()}`} icon="analytics" color={C.purple} delay={0.15} />
          <StatCard label="Visit Count" value={customer.stats?.visitCount || totalOrders} icon="storefront" color={C.amber} delay={0.2} />
        </div>

        {/* Spend bar */}
        {totalSpent > 0 && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex justify-between text-[10px] text-white/40 mb-2">
              <span className="font-semibold uppercase tracking-wider">Spend Level</span>
              <span style={{ color: C.green }}>Rs.{totalSpent.toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((totalSpent / 5000) * 100, 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-2 rounded-full" style={{ background: `linear-gradient(90deg, ${C.blue}, ${C.green})` }} />
            </div>
            <p className="text-[9px] text-white/30 mt-1.5">VIP threshold: Rs.5,000</p>
          </div>
        )}

        {/* Contact */}
        {customer.email && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold mb-2">Contact</p>
            <div className="flex items-center gap-2 text-[12px] text-white/60">
              <span className="material-symbols-outlined text-[14px]" style={{ color: C.blue }}>email</span>
              {customer.email}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold mb-3">Tags</p>
          <div className="flex flex-wrap gap-1.5 mb-3 min-h-[24px]">
            {(customer.tags || []).length === 0
              ? <span className="text-[11px] text-white/30 italic">No tags yet</span>
              : customer.tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ color: C.cyan, background: C.cyan + '15', border: `1px solid ${C.cyan}30` }}>{t}</span>
                ))
            }
          </div>
          <div className="flex gap-2">
            <input value={tag} onChange={e => setTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTag()}
              placeholder="Add tag..."
              className="flex-1 px-3 py-1.5 rounded-lg text-[12px] text-white placeholder:text-white/20 focus:outline-none"
              style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid rgba(255,255,255,0.1)` }} />
            <button onClick={handleAddTag} disabled={addTagMutation.isPending}
              className="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors"
              style={{ background: C.blue + '22', color: C.blue, border: `1px solid ${C.blue}40` }}>
              Add
            </button>
          </div>
        </div>

        {/* Block toggle */}
        <div className="rounded-xl p-4" style={{ background: customer.isBlocked ? 'rgba(244,63,94,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${customer.isBlocked ? C.pink + '30' : 'rgba(255,255,255,0.08)'}` }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-white">{customer.isBlocked ? 'Customer Blocked' : 'Block Customer'}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{customer.isBlocked ? (customer.blockReason || 'No reason given') : 'Prevent further interactions'}</p>
            </div>
            <button onClick={() => blockMutation.mutate(customer._id)} disabled={blockMutation.isPending}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors"
              style={customer.isBlocked
                ? { color: C.teal, background: C.teal + '20', border: `1px solid ${C.teal}30` }
                : { color: C.pink, background: C.pink + '15', border: `1px solid ${C.pink}30` }}>
              {blockMutation.isPending ? '...' : customer.isBlocked ? 'Unblock' : 'Block'}
            </button>
          </div>
        </div>

        {/* Dates */}
        <div className="flex gap-4 text-[10px] text-white/30">
          {customer.firstVisit && <span>First visit: <span className="text-white/50">{new Date(customer.firstVisit).toLocaleDateString()}</span></span>}
          {customer.lastVisit && <span>Last seen: <span className="text-white/50">{new Date(customer.lastVisit).toLocaleDateString()}</span></span>}
        </div>
      </div>
    </motion.div>
  )
}

export default function Users() {
  const activeShop = useAuthStore((s) => s.activeShop)
  const [search, setSearch] = useState('')
  const [segment, setSegment] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [backfillDone, setBackfillDone] = useState(false)

  const { data, isLoading } = useCustomersByShop(activeShop?._id, {
    page, limit: 15,
    segment: segment || undefined,
    search: search || undefined,
  })
  const { data: topData } = useTopCustomers(activeShop?._id, 3)
  const { data: inactiveData } = useInactiveCustomers(activeShop?._id)
  const backfillMutation = useBackfillCustomerStats()

  const customers = data?.data?.customers || []
  const pagination = data?.data?.pagination || {}
  const topCustomers = topData?.data || []
  const inactiveCount = inactiveData?.count || 0

  const whatsappOptIn = customers.filter(c => c.whatsappOptIn).length
  const SEGMENTS = ['', 'vip', 'active', 'regular', 'new', 'inactive', 'blocked']

  const handleBackfill = () => {
    backfillMutation.mutate(activeShop._id, {
      onSuccess: () => setBackfillDone(true),
    })
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="font-display text-[28px] font-black text-white tracking-tight">Customer Registry</h2>
          <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {pagination.total ? `${pagination.total} customers across your network` : 'Manage your customer base'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {backfillDone && (
            <span className="text-[11px] px-3 py-1.5 rounded-lg font-medium" style={{ color: C.green, background: C.green + '15', border: `1px solid ${C.green}30` }}>
              ✓ Stats synced
            </span>
          )}
          <button onClick={handleBackfill} disabled={backfillMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all disabled:opacity-50"
            style={{ color: C.cyan, background: C.cyan + '12', border: `1px solid ${C.cyan}30` }}>
            <span className={`material-symbols-outlined text-[15px] ${backfillMutation.isPending ? 'animate-spin' : ''}`}>
              {backfillMutation.isPending ? 'autorenew' : 'sync'}
            </span>
            {backfillMutation.isPending ? 'Syncing...' : 'Sync Stats'}
          </button>
        </div>
      </div>

      {!activeShop ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="material-symbols-outlined text-[48px] block mb-3" style={{ color: C.blue }}>store</span>
          <p className="text-white font-bold text-[16px] mb-1">No Active Shop Selected</p>
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Select a shop from your profile to view its customer registry.</p>
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Customers', value: pagination.total || 0, icon: 'group', color: C.blue },
              { label: 'VIP Customers', value: customers.filter(c => c.segment === 'vip').length, icon: 'workspace_premium', color: C.amber },
              { label: 'Inactive (7d)', value: inactiveCount, icon: 'schedule', color: C.pink },
              { label: 'WhatsApp Opted-In', value: whatsappOptIn, icon: 'forum', color: C.teal },
            ].map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                whileHover={{ y: -3, scale: 1.02 }}
                className="rounded-2xl p-5 relative overflow-hidden cursor-default"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl" style={{ background: k.color + '30' }} />
                <div className="relative z-10">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: k.color + '22' }}>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: k.color }}>{k.icon}</span>
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{k.label}</p>
                  <p className="font-display font-black text-[26px] text-white leading-none">{k.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Top Customers Strip */}
          {topCustomers.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-5 mb-5"
              style={{ background: `linear-gradient(135deg, ${C.blue}0a, ${C.purple}0a)`, border: `1px solid ${C.blue}20` }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[16px]" style={{ color: C.amber }}>workspace_premium</span>
                <h3 className="font-bold text-white text-[13px]">Top Spenders</h3>
              </div>
              <div className="flex gap-3 flex-wrap">
                {topCustomers.map((c, i) => (
                  <button key={c._id} onClick={() => setSelected(c)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all hover:scale-105"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black text-white"
                      style={{ background: [C.amber, C.teal, C.blue][i] + '44' }}>
                      {(c.name || c.phone).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-semibold text-white">{c.name || 'Guest'}</p>
                      <p className="text-[10px]" style={{ color: C.green }}>Rs.{(c.stats?.totalSpent || 0).toLocaleString()}</p>
                    </div>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{ color: [C.amber, '#9ca3af', C.teal][i], background: [C.amber, '#9ca3af', C.teal][i] + '20' }}>
                      #{i + 1}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: 'rgba(255,255,255,0.3)' }}>search</span>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search by name, phone, or tag..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] text-white placeholder:text-white/20 focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)` }}
                onFocus={e => e.target.style.borderColor = C.blue + '80'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {SEGMENTS.map(s => {
                const cfg = s ? SEGMENT_CONFIG[s] : null
                const active = segment === s
                return (
                  <button key={s} onClick={() => { setSegment(s); setPage(1) }}
                    className="px-3 py-2 rounded-lg text-[11px] font-medium capitalize transition-all"
                    style={active
                      ? { color: cfg?.color || C.blue, background: (cfg?.color || C.blue) + '20', border: `1px solid ${(cfg?.color || C.blue)}40` }
                      : { color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {s || 'All'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Table */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Customer', 'Phone', 'Segment', 'Total Spent', 'Orders', 'Last Visit'].map((h, i) => (
                      <th key={h} className={`px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider ${i > 1 && i < 3 ? 'hidden lg:table-cell' : i >= 3 ? (i === 3 ? 'text-right hidden lg:table-cell' : i === 4 ? 'text-right' : 'text-right hidden xl:table-cell') : i === 1 ? 'hidden md:table-cell' : ''}`}
                        style={{ color: 'rgba(255,255,255,0.3)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {[...Array(6)].map((_, j) => (
                          <td key={j} className="px-5 py-4"><div className="h-3 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} /></td>
                        ))}
                      </tr>
                    ))
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <span className="material-symbols-outlined text-[48px] block mb-3" style={{ color: 'rgba(255,255,255,0.1)' }}>group</span>
                        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No customers found.</p>
                      </td>
                    </tr>
                  ) : customers.map((c, i) => {
                    const initials = (c.name || c.phone || '?').slice(0, 2).toUpperCase()
                    const spent = c.stats?.totalSpent || 0
                    const orders = c.stats?.totalOrders || 0
                    return (
                      <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        onClick={() => setSelected(c)}
                        className="cursor-pointer transition-colors group"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black text-white flex-shrink-0"
                              style={{ background: c.isBlocked ? C.pink + '30' : `linear-gradient(135deg, ${C.blue}50, ${C.purple}50)`, border: `1px solid ${c.isBlocked ? C.pink : C.blue}30` }}>
                              {initials}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-white group-hover:text-[#00d4ff] transition-colors">{c.name || 'Unnamed'}</p>
                              {c.email && <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{c.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className="text-[12px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{c.phone}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <SegmentBadge segment={c.segment} />
                        </td>
                        <td className="px-5 py-3.5 text-right hidden lg:table-cell">
                          <span className="text-[13px] font-bold" style={{ color: spent > 0 ? C.green : 'rgba(255,255,255,0.3)' }}>
                            Rs.{spent.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-[13px] font-bold" style={{ color: orders > 0 ? C.blue : 'rgba(255,255,255,0.3)' }}>{orders}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right hidden xl:table-cell">
                          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
              <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {pagination.total} customers · {whatsappOptIn} on WhatsApp
                </span>
                {pagination.pages > 1 && (
                  <div className="flex gap-1.5">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="px-3 py-1 rounded-lg text-[11px] transition-colors disabled:opacity-30"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                      ← Prev
                    </button>
                    <span className="px-3 py-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{page}/{pagination.pages}</span>
                    <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                      className="px-3 py-1 rounded-lg text-[11px] transition-colors disabled:opacity-30"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)} className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
            <CustomerDrawer customer={selected} onClose={() => setSelected(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
