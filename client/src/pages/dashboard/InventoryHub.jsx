/**
 * InventoryHub — top-level /dashboard/inventory
 * Redirects to the active shop's inventory, or shows a shop picker.
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuthStore from '../../store/useAuthStore'
import { useShopsByOwner } from '../../features/shops/shopHooks'

const C = { blue: '#1390ff', purple: '#7c3aed', cyan: '#00d4ff', green: '#22c55e', amber: '#f59e0b' }

export default function InventoryHub() {
  const navigate    = useNavigate()
  const activeShop  = useAuthStore((s) => s.activeShop)
  const setActiveShop = useAuthStore((s) => s.setActiveShop)
  const user        = useAuthStore((s) => s.user)
  const { data, isLoading } = useShopsByOwner(user?._id)
  const shops = data?.data || []

  // Auto-redirect if active shop is set
  useEffect(() => {
    if (activeShop?._id) {
      navigate(`/dashboard/shops/${activeShop._id}/inventory`, { replace: true })
    }
  }, [activeShop?._id])

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: C.blue }} />
    </div>
  )

  if (shops.length === 0) return (
    <div className="rounded-2xl p-16 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <span className="material-symbols-outlined text-[56px] block mb-4" style={{ color: C.blue + '40' }}>inventory_2</span>
      <p className="text-white font-bold text-[18px] mb-2">No Shops Yet</p>
      <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Register a shop first to manage inventory.</p>
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[28px] font-black text-white tracking-tight">Inventory</h2>
        <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Select a shop to manage its inventory</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {shops.map((shop, i) => (
          <motion.button key={shop._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            onClick={() => { setActiveShop(shop); navigate(`/dashboard/shops/${shop._id}/inventory`) }}
            className="p-5 rounded-2xl text-left transition-all"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.blue + '40'; e.currentTarget.style.background = C.blue + '08' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.blue + '20' }}>
                <span className="material-symbols-outlined text-[20px]" style={{ color: C.blue }}>storefront</span>
              </div>
              <div>
                <p className="font-bold text-white text-[15px]">{shop.name}</p>
                <p className="text-[11px] capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>{shop.businessType}</p>
              </div>
              <span className="material-symbols-outlined text-[18px] ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>arrow_forward</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
