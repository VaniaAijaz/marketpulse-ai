import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  useGenerateMessage,
  useAiLimit,
  useAiLogs,
  useAiStats,
  useAiCost,
  useLatestRecommendations,
  useGenerateRecommendations,
  useUpdateRecommendationStatus,
  useGenerateWhatsAppMessage,
} from '../../features/ai/aiHooks'
import { useShopsByOwner } from '../../features/shops/shopHooks'
import useAuthStore from '../../store/useAuthStore'

const TABS = [
  { id: 'command', label: 'Command Center', icon: 'hub' },
  { id: 'recommendations', label: 'Recommendations', icon: 'auto_awesome' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'forum' },
  { id: 'chat', label: 'AI Chat', icon: 'smart_toy' },
]

const QUICK_PROMPTS = [
  { label: 'Cold drinks push', prompt: 'Suggest 3 cold drink promotions for today based on hot weather.' },
  { label: 'Office lunch combo', prompt: 'Create a lunch combo offer targeting nearby office workers.' },
  { label: 'Low stock alert', prompt: 'Which products should I restock first based on typical demand?' },
  { label: 'Weekend sale', prompt: 'Write a short weekend sale strategy for my shop.' },
]

const WA_TYPES = [
  { id: 'promotion', label: 'Flash Sale', icon: 'local_offer' },
  { id: 'reengagement', label: 'Re-engage', icon: 'person_search' },
  { id: 'newproduct', label: 'New Product', icon: 'new_releases' },
  { id: 'weather', label: 'Weather-based', icon: 'wb_sunny' },
]

function UsageRing({ used = 0, limit = 50, size = 110 }) {
  const radius = (size - 14) / 2
  const circumference = 2 * Math.PI * radius
  const pct = limit > 0 ? Math.min(used / limit, 1) : 0
  const dashOffset = circumference * (1 - pct)
  const color = pct >= 0.9 ? '#ef4444' : pct >= 0.7 ? '#f97316' : '#00d4ff'
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display font-black text-white text-[17px] leading-none">{used}</span>
        <span className="text-[9px] text-on-surface-variant mt-0.5">/ {limit}</span>
      </div>
    </div>
  )
}

function normalizeRecLog(log) {
  if (!log) return null
  if (log.weather) return log
  const wc = log.weatherContext || {}
  return {
    ...log,
    weather: {
      temp: wc.temp,
      condition: wc.condition,
      description: wc.condition,
      humidity: null,
      windSpeed: null,
    },
    weatherContext: { mood: wc.mood, suggestion: log.insight },
    location: wc.city ? { city: wc.city } : null,
  }
}

function AISidebar({ shopId }) {
  const { data: limitRes, isLoading: limitLoading } = useAiLimit(shopId)
  const { data: statsRes, isLoading: statsLoading } = useAiStats(shopId)
  const { data: logsRes, isLoading: logsLoading } = useAiLogs(shopId)
  const { data: costRes, isLoading: costLoading } = useAiCost(shopId)

  const limit = limitRes?.data || {}
  const totals = statsRes?.data?.totals || {}
  const logs = logsRes?.data?.logs || []
  const cost = costRes?.data || {}
  const used = limit.usedToday ?? 0
  const cap = limit.limit ?? 50
  const successCount = logs.filter((l) => l.status === 'success').length
  const successRate = logs.length ? ((successCount / logs.length) * 100).toFixed(1) : '100'
  const totalTokens = totals.tokens ?? cost.breakdown?.reduce((s, b) => s + (b.tokens || 0), 0) ?? 0

  const metrics = [
    { label: 'Total Tokens', value: Number(totalTokens).toLocaleString(), icon: 'token' },
    { label: 'Requests', value: totals.requests ?? logs.length, icon: 'send' },
    { label: 'Cost (PKR)', value: (totals.costPKR ?? cost.totalCostPKR ?? 0).toFixed(2), icon: 'payments' },
    { label: 'Success Rate', value: `${successRate}%`, icon: 'check_circle' },
  ]

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[18px] text-secondary">speed</span>
          <h3 className="font-semibold text-white text-[13px]">Daily Usage</h3>
        </div>
        {limitLoading ? (
          <div className="w-[110px] h-[110px] rounded-full bg-white/5 animate-pulse mx-auto" />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <UsageRing used={used} limit={cap} />
            <div className="w-full flex justify-between text-[11px]">
              <span className="text-on-surface-variant">Remaining</span>
              <span className="text-secondary font-bold">{limit.remaining ?? cap - used}</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                style={{ width: `${Math.min((used / cap) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[18px] text-primary">bar_chart</span>
          <h3 className="font-semibold text-white text-[13px]">AI Metrics (7d)</h3>
        </div>
        {statsLoading || costLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {metrics.map((m) => (
              <div key={m.label} className="p-2.5 rounded-xl bg-white/3 border border-white/5">
                <div className="flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-[12px] text-on-surface-variant">{m.icon}</span>
                  <span className="text-[9px] text-on-surface-variant">{m.label}</span>
                </div>
                <span className="font-display font-black text-white text-[14px]">{m.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">history</span>
          <h3 className="font-semibold text-white text-[13px]">Recent Logs</h3>
        </div>
        {logsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-[11px] text-on-surface-variant/50 text-center py-4">No AI calls yet</p>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {logs.slice(0, 10).map((log, i) => (
              <div key={log._id || i} className="flex items-start gap-2 p-2 rounded-lg bg-white/3 border border-white/5">
                <span
                  className={`material-symbols-outlined text-[13px] mt-0.5 flex-shrink-0 ${
                    log.status === 'success' ? 'text-green-400' : 'text-error'
                  }`}
                >
                  {log.status === 'success' ? 'check_circle' : 'error'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-white truncate capitalize">
                    {(log.endpoint || 'request').replace(/_/g, ' ')}
                  </p>
                  <p className="text-[9px] text-on-surface-variant/60">
                    {log.totalTokens || 0} tok · {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RecommendationsPanel({ shopId }) {
  const navigate = useNavigate()
  const { data: recRes, isLoading } = useLatestRecommendations(shopId)
  const generateRec = useGenerateRecommendations()
  const updateStatus = useUpdateRecommendationStatus()
  const rec = normalizeRecLog(recRes?.data)

  const handleGenerate = () => generateRec.mutate(shopId)

  if (isLoading) {
    return <div className="glass-panel rounded-2xl h-64 animate-pulse" />
  }

  if (!rec && !generateRec.isPending) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <span className="material-symbols-outlined text-[52px] text-secondary/30 block mb-3">auto_awesome</span>
        <p className="text-white font-bold text-[15px] mb-1">No recommendations yet</p>
        <p className="text-on-surface-variant text-[12px] mb-5 max-w-sm mx-auto">
          Run AI analysis on weather, nearby places, and your inventory.
        </p>
        <button
          onClick={handleGenerate}
          disabled={generateRec.isPending}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-surface font-bold text-[12px] shadow-glow"
        >
          Generate Recommendations
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <p className="text-[12px] text-on-surface-variant">
          {rec?.generatedAt ? `Last run: ${new Date(rec.generatedAt).toLocaleString()}` : 'Fresh analysis'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/dashboard/shops/${shopId}`)}
            className="px-3 py-1.5 rounded-lg text-[11px] border border-white/10 text-on-surface-variant hover:text-white"
          >
            Full Shop View
          </button>
          <button
            onClick={handleGenerate}
            disabled={generateRec.isPending}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-secondary/15 text-secondary border border-secondary/25"
          >
            {generateRec.isPending ? 'Analyzing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {rec?.insight && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-secondary/20 flex gap-3">
          <span className="material-symbols-outlined text-secondary">lightbulb</span>
          <p className="text-[13px] text-white">{rec.insight}</p>
        </div>
      )}

      {generateRec.isError && (
        <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-[12px]">
          {generateRec.error?.response?.data?.error || 'Generation failed'}
        </div>
      )}

      <div className="space-y-3">
        {(rec?.recommendations || []).map((r, i) => {
          const pid = r.productId?._id || r.productId || r.productName
          return (
            <div key={i} className="glass-panel rounded-xl p-4 flex gap-3 justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-white text-[13px]">{r.productName}</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">{r.reason}</p>
                <span className="inline-block mt-2 text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                  {r.expectedUplift}
                </span>
              </div>
              {r.status === 'pending' && (
                <button
                  onClick={() => updateStatus.mutate({ logId: rec._id, productId: pid, status: 'displayed', shopId })}
                  disabled={updateStatus.isPending}
                  className="self-start px-2.5 py-1 rounded-lg text-[10px] font-bold text-secondary border border-secondary/25 bg-secondary/10"
                >
                  Mark Displayed
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WhatsAppPanel({ shopId }) {
  const generateWA = useGenerateWhatsAppMessage()
  const [messageType, setMessageType] = useState('promotion')
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const run = () => {
    generateWA.mutate(
      { shopId, messageType },
      { onSuccess: (d) => setMsg(d?.data?.message || '') }
    )
  }

  const copy = () => {
    navigator.clipboard.writeText(msg)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="glass-panel rounded-2xl p-5">
      <p className="text-[12px] text-on-surface-variant mb-4">
        MVP: AI message generate karo, copy karke WhatsApp pe manually bhejo.
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {WA_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setMessageType(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
              messageType === t.id
                ? 'bg-green-400/15 text-green-400 border-green-400/30'
                : 'bg-white/5 text-on-surface-variant border-white/8'
            }`}
          >
            <span className="material-symbols-outlined text-[13px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
      <button
        onClick={run}
        disabled={generateWA.isPending}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-green-400 text-white font-bold text-[12px] mb-4 disabled:opacity-50"
      >
        {generateWA.isPending ? 'Generating...' : 'Generate WhatsApp Message'}
      </button>
      {msg && (
        <div className="p-4 rounded-xl bg-green-400/5 border border-green-400/20">
          <p className="text-[13px] text-white leading-relaxed mb-3">{msg}</p>
          <button onClick={copy} className="text-[11px] font-bold text-green-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </div>
      )}
    </div>
  )
}

function ChatPanel({ shopId }) {
  const generateMsg = useGenerateMessage()
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Assalam o Alaikum! Main MarketPulse AI hoon. Aaj ki sales strategy ya koi bhi sawal poochho.' },
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text || generateMsg.isPending) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    generateMsg.mutate(
      { shopId, prompt: text },
      {
        onSuccess: (data) => {
          setMessages((m) => [...m, { role: 'assistant', text: data?.message || 'No response.' }])
        },
        onError: (err) => {
          setMessages((m) => [
            ...m,
            { role: 'assistant', text: err.response?.data?.error || 'Request failed. Try again.' },
          ])
        },
      }
    )
  }

  return (
    <div className="glass-panel rounded-2xl flex flex-col h-[480px] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-primary/20 text-white border border-primary/25 rounded-br-sm'
                  : 'bg-white/5 text-on-surface border border-white/8 rounded-bl-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {generateMsg.isPending && (
          <div className="flex gap-1 px-3">
            <span className="w-2 h-2 rounded-full bg-secondary animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:0.15s]" />
            <span className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:0.3s]" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-white/8 flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q.label}
            onClick={() => setInput(q.prompt)}
            className="text-[10px] px-2 py-1 rounded-lg bg-white/5 text-on-surface-variant border border-white/8 hover:text-white"
          >
            {q.label}
          </button>
        ))}
      </div>

      <div className="p-3 border-t border-white/8 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Poochho: aaj kya promote karun?"
          className="flex-1 px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white text-[13px] placeholder:text-on-surface-variant/40 focus:border-secondary outline-none"
        />
        <button
          onClick={send}
          disabled={generateMsg.isPending || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-surface font-bold text-[12px] disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">send</span>
        </button>
      </div>
    </div>
  )
}

function CommandCenter({ shopId, shopName, onSelectTab }) {
  const navigate = useNavigate()
  const generateRec = useGenerateRecommendations()
  const { data: recRes } = useLatestRecommendations(shopId)
  const rec = normalizeRecLog(recRes?.data)

  const actions = [
    {
      title: 'Product Recommendations',
      desc: 'Weather + nearby places + inventory analysis',
      icon: 'auto_awesome',
      iconClass: 'text-secondary',
      onClick: () => generateRec.mutate(shopId),
      loading: generateRec.isPending,
    },
    {
      title: 'Shop Intelligence',
      desc: 'Full dashboard with maps and widgets',
      icon: 'storefront',
      iconClass: 'text-primary',
      onClick: () => navigate(`/dashboard/shops/${shopId}`),
    },
    {
      title: 'Manage Inventory',
      desc: 'Update stock so AI suggests in-stock items',
      icon: 'inventory_2',
      iconClass: 'text-tertiary',
      onClick: () => navigate(`/dashboard/shops/${shopId}/inventory`),
    },
    {
      title: 'Customer Outreach',
      desc: 'WhatsApp message generator',
      icon: 'forum',
      iconClass: 'text-green-400',
      onClick: () => onSelectTab('whatsapp'),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="glass-panel rounded-2xl p-5 border-secondary/15">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
            <span className="material-symbols-outlined text-surface text-[24px]">psychology</span>
          </div>
          <div>
            <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">Active Node</p>
            <p className="font-display font-black text-white text-[18px]">{shopName}</p>
          </div>
          {rec?.confidenceScore && (
            <span className="ml-auto text-[11px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-bold">
              {rec.confidenceScore}% confidence
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((a, i) => (
          <motion.button
            key={a.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={a.onClick}
            disabled={a.loading}
            className="glass-panel rounded-2xl p-5 text-left hover:border-secondary/30 transition-all"
          >
            <span className={`material-symbols-outlined text-[28px] mb-3 block ${a.iconClass}`}>{a.icon}</span>
            <p className="font-semibold text-white text-[14px] mb-1">{a.title}</p>
            <p className="text-[11px] text-on-surface-variant">{a.loading ? 'Running analysis...' : a.desc}</p>
          </motion.button>
        ))}
      </div>

      {rec?.recommendations?.length > 0 && (
        <div className="glass-panel rounded-2xl p-5">
          <p className="text-[12px] font-semibold text-white mb-3">Latest top picks</p>
          <div className="flex flex-wrap gap-2">
            {rec.recommendations.slice(0, 3).map((r, i) => (
              <span
                key={i}
                className="text-[11px] px-3 py-1.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20"
              >
                {r.productName} · {r.expectedUplift}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AIAgent() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const activeShop = useAuthStore((s) => s.activeShop)
  const setActiveShop = useAuthStore((s) => s.setActiveShop)
  const { data: shopsRes } = useShopsByOwner(user?._id)
  const shops = shopsRes?.data || []

  const [tab, setTab] = useState('command')
  const shopId = activeShop?._id

  if (!user) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center">
        <p className="text-white font-bold">Please log in</p>
        <button onClick={() => navigate('/login')} className="mt-4 text-secondary text-[12px]">
          Go to Login
        </button>
      </div>
    )
  }

  if (!shopId) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center max-w-md mx-auto">
        <span className="material-symbols-outlined text-[48px] text-secondary/40 block mb-3">store</span>
        <p className="text-white font-bold text-[16px] mb-2">No active shop</p>
        <p className="text-on-surface-variant text-[13px] mb-5">Select a shop node to power the AI assistant.</p>
        {shops.length > 0 ? (
          <div className="space-y-2">
            {shops.map((s) => (
              <button
                key={s._id}
                onClick={() => setActiveShop(s)}
                className="w-full py-2.5 rounded-xl border border-secondary/25 text-secondary text-[12px] font-bold hover:bg-secondary/10"
              >
                {s.name}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => navigate('/dashboard/shops')}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-surface font-bold text-[12px]"
          >
            Create Your First Shop
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-[28px] font-black text-white tracking-tight">AI Command Center</h2>
          <p className="text-[12px] text-on-surface-variant mt-1">
            Gemini-powered retail brain for <span className="text-secondary font-medium">{activeShop.name}</span>
          </p>
        </div>
        {shops.length > 1 && (
          <select
            value={shopId}
            onChange={(e) => {
              const s = shops.find((x) => x._id === e.target.value)
              if (s) setActiveShop(s)
            }}
            className="px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-[12px] outline-none focus:border-secondary"
          >
            {shops.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap mb-5 p-1 rounded-xl bg-black/20 border border-white/8 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium transition-all ${
              tab === t.id
                ? 'bg-secondary/15 text-secondary border border-secondary/25'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {tab === 'command' && (
                <CommandCenter shopId={shopId} shopName={activeShop.name} onSelectTab={setTab} />
              )}
              {tab === 'recommendations' && <RecommendationsPanel shopId={shopId} />}
              {tab === 'whatsapp' && <WhatsAppPanel shopId={shopId} />}
              {tab === 'chat' && <ChatPanel shopId={shopId} />}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="xl:col-span-4">
          <AISidebar shopId={shopId} />
        </div>
      </div>
    </div>
  )
}
