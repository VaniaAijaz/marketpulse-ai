import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useShopsByOwner } from '../../features/shops/shopHooks'
import { useGenerateRecommendations } from '../../features/ai/aiHooks'
import useAuthStore from '../../store/useAuthStore'
import useUIStore from '../../store/useUIStore'

function ShopOverviewCard({ shop, isActive, onSelect, onAnalyze, analyzing }) {
  const navigate = useNavigate()
  const rec = shop.lastRecommendation
  const wx = shop.weather

  const weatherAlert =
    wx?.temp >= 35
      ? { label: 'Hot — push cold drinks', color: 'text-orange-400 border-orange-400/30 bg-orange-400/10' }
      : wx?.temp <= 15
        ? { label: 'Cold — chai & soup', color: 'text-blue-400 border-blue-400/30 bg-blue-400/10' }
        : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-panel rounded-2xl p-5 transition-all ${
        isActive ? 'border-secondary/35 shadow-[0_0_24px_rgba(0,212,255,0.08)]' : 'border-white/8'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <button type="button" onClick={onSelect} className="text-left min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-[15px] truncate">{shop.name}</h3>
            {isActive && (
              <span className="text-[9px] bg-secondary/15 text-secondary border border-secondary/30 px-1.5 py-0.5 rounded-full font-bold">
                ACTIVE
              </span>
            )}
          </div>
          <p className="text-[11px] text-on-surface-variant capitalize mt-0.5">
            {shop.businessType} · {shop.inStockCount || 0} in stock
          </p>
        </button>
        {wx && (
          <div className="text-right flex-shrink-0">
            <p className="font-display font-black text-white text-[18px] leading-none">{Math.round(wx.temp)}°</p>
            <p className="text-[9px] text-on-surface-variant capitalize">{wx.condition}</p>
          </div>
        )}
      </div>

      {weatherAlert && (
        <div className={`mb-3 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium ${weatherAlert.color}`}>
          {weatherAlert.label}
        </div>
      )}

      <div className="mb-4 p-3 rounded-xl bg-white/3 border border-white/5">
        {rec ? (
          <>
            <p className="text-[10px] text-secondary font-bold uppercase tracking-wider mb-1">Last AI Run</p>
            <p className="text-[11px] text-white line-clamp-2">{rec.insight || rec.topProduct || 'Recommendations ready'}</p>
            <p className="text-[10px] text-on-surface-variant mt-1">
              {new Date(rec.generatedAt).toLocaleString()}
              {rec.confidenceScore ? ` · ${rec.confidenceScore}% confidence` : ''}
            </p>
          </>
        ) : (
          <p className="text-[11px] text-on-surface-variant">No AI analysis yet — run recommendations</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => navigate(`/dashboard/shops/${shop._id}`)}
          className="flex-1 min-w-[100px] px-3 py-2 rounded-lg text-[11px] font-bold text-secondary border border-secondary/25 bg-secondary/8 hover:bg-secondary/15"
        >
          View Details
        </button>
        <button
          type="button"
          onClick={() => onAnalyze(shop._id)}
          disabled={analyzing || !shop.inStockCount}
          className="flex-1 min-w-[100px] px-3 py-2 rounded-lg text-[11px] font-bold bg-gradient-to-r from-primary to-secondary text-surface disabled:opacity-50"
        >
          {analyzing ? 'Analyzing...' : 'Get AI Recs'}
        </button>
      </div>
    </motion.div>
  )
}

export default function ShopsOverview() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const activeShop = useAuthStore((s) => s.activeShop)
  const setActiveShop = useAuthStore((s) => s.setActiveShop)
  const setActiveModal = useUIStore((s) => s.setActiveModal)

  const { data, isLoading, refetch } = useShopsByOwner(user?._id)
  const generateRec = useGenerateRecommendations()
  const shops = data?.data || []

  const handleAnalyze = (shopId) => {
    generateRec.mutate(shopId, {
      onSuccess: () => refetch(),
    })
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[1, 2].map((i) => (
          <div key={i} className="glass-panel rounded-2xl h-40 animate-pulse" />
        ))}
      </div>
    )
  }

  if (shops.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center mb-6 border-secondary/15">
        <span className="material-symbols-outlined text-[48px] text-secondary/30 block mb-3">store</span>
        <p className="text-white font-bold text-[16px] mb-2">No shops yet</p>
        <p className="text-on-surface-variant text-[12px] mb-4">Add a shop to start AI recommendations.</p>
        <p className="text-[11px] text-on-surface-variant">One email = one shop. Complete registration to unlock AI.</p>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-[18px] font-bold text-white">Your Shops</h3>
          <p className="text-[11px] text-on-surface-variant">Weather + last AI run per location</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/shops')}
          className="text-[11px] text-secondary hover:text-white font-medium"
        >
          Manage all →
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shops.map((shop) => (
          <ShopOverviewCard
            key={shop._id}
            shop={shop}
            isActive={activeShop?._id === shop._id}
            onSelect={() => setActiveShop(shop)}
            onAnalyze={handleAnalyze}
            analyzing={generateRec.isPending && generateRec.variables === shop._id}
          />
        ))}
      </div>
    </div>
  )
}
