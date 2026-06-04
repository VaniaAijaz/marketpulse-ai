import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  useGenerateMessage,
  useLatestRecommendations, useGenerateRecommendations, useUpdateRecommendationStatus,
  useCopilotChat, useCopilotReport, useCopilotAdvise, useCopilotAlerts,
} from '../../features/ai/aiHooks'
import { useShopsByOwner, useUpdateAISettings } from '../../features/shops/shopHooks'
import useAuthStore from '../../store/useAuthStore'

// ── Shadcn-style professional palette ────────────────────
const P = {
  bg:       '#2C2C2C',   // page background
  card:     '#000000',   // card background
  border:   'rgba(255,255,255,0.08)',
  text:     '#ffffff',
  muted:    'rgba(255,255,255,0.5)',
  dim:      'rgba(255,255,255,0.28)',
  // accent colors — professional, not rainbow
  blue:     '#3b82f6',   // slate blue
  indigo:   '#6366f1',   // indigo
  violet:   '#8b5cf6',   // violet
  emerald:  '#10b981',   // emerald green
  slate:    '#94a3b8',   // slate
  rose:     '#f43f5e',   // rose (only for critical)
  amber:    '#f59e0b',   // amber (only for warnings)
  cyan:     '#06b6d4',   // cyan
}
const FONT = "'Inter','Segoe UI',system-ui,sans-serif"
const R    = '6px'
const R2   = '10px'     // slightly larger for main panels

// ── Section header ────────────────────────────────────────
function SectionHeader({ icon, title, sub, color = P.blue, action }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center"
          style={{ background: color + '18', borderRadius: R, border: `1px solid ${color}30` }}>
          <span className="material-symbols-outlined text-[16px]" style={{ color }}>{icon}</span>
        </div>
        <div>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '14px', color: P.text, margin: 0 }}>{title}</p>
          {sub && <p style={{ fontFamily: FONT, fontSize: '11px', color: P.muted, margin: 0 }}>{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

// ── Card wrapper ──────────────────────────────────────────
function Card({ children, className = '', style = {} }) {
  return (
    <div className={className}
      style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: R2, padding: '20px', ...style }}>
      {children}
    </div>
  )
}

// ── 1. Business Q&A Chat ──────────────────────────────────
function QAChat({ shopId }) {
  const chatMut   = useCopilotChat()
  const [msgs, setMsgs] = useState([
    { role: 'ai', text: 'Assalam o Alaikum! Apni dukaan ke baare mein koi bhi sawal poochhein — sales, customers, inventory, strategy.' }
  ])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const QUICK = ['Is hafte revenue kaisa raha?', 'Kaunse products promote karein?', 'Weekend sales kaise badhayein?', 'Stock ki kya situation hai?']

  const send = async (text) => {
    const q = (text || input).trim()
    if (!q || chatMut.isPending) return
    setInput('')
    setMsgs(m => [...m, { role: 'user', text: q }])
    try {
      const res = await chatMut.mutateAsync({ shopId, question: q })
      setMsgs(m => [...m, { role: 'ai', text: res.data?.answer || 'Jawab nahi mila.' }])
    } catch { setMsgs(m => [...m, { role: 'ai', text: 'Network error. Dobara try karein.' }]) }
  }

  return (
    <Card>
      <SectionHeader icon="forum" title="Business Q&A" sub="Real store data se contextual jawab" color={P.blue} />
      {/* Messages */}
      <div style={{ height: '340px', overflowY: 'auto', marginBottom: '12px', padding: '4px 0' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
            {m.role === 'ai' && (
              <div style={{ width: '28px', height: '28px', borderRadius: R, background: P.blue + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', flexShrink: 0, marginTop: '2px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: P.blue }}>psychology</span>
              </div>
            )}
            <div style={{
              maxWidth: '80%', padding: '10px 14px', fontFamily: FONT, fontSize: '13px', lineHeight: 1.6,
              borderRadius: m.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
              background: m.role === 'user' ? P.blue + '22' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${m.role === 'user' ? P.blue + '35' : 'rgba(255,255,255,0.09)'}`,
              color: P.text,
            }}>{m.text}</div>
          </div>
        ))}
        {chatMut.isPending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '36px' }}>
            {[0,.15,.3].map((d,i) => (
              <span key={i} className="animate-bounce" style={{ width: '7px', height: '7px', borderRadius: '50%', background: P.cyan, display: 'inline-block', animationDelay: `${d}s` }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {/* Quick prompts */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => send(q)} style={{ fontFamily: FONT, fontSize: '10px', padding: '5px 10px', borderRadius: R, background: 'rgba(255,255,255,0.04)', border: `1px solid ${P.border}`, color: P.muted, cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = P.cyan; e.currentTarget.style.borderColor = P.cyan + '40' }}
            onMouseLeave={e => { e.currentTarget.style.color = P.muted; e.currentTarget.style.borderColor = P.border }}>
            {q}
          </button>
        ))}
      </div>
      {/* Input */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Apna sawal likhein..."
          style={{ flex: 1, fontFamily: FONT, fontSize: '13px', padding: '10px 14px', borderRadius: R, background: 'rgba(0,0,0,0.35)', border: `1px solid ${P.border}`, color: P.text, outline: 'none' }}
          onFocus={e => e.target.style.borderColor = P.blue + '70'}
          onBlur={e => e.target.style.borderColor = P.border} />
        <button onClick={() => send()} disabled={chatMut.isPending || !input.trim()}
          style={{ fontFamily: FONT, fontWeight: 700, padding: '10px 18px', borderRadius: R, background: P.blue, color: '#fff', border: 'none', cursor: 'pointer', opacity: chatMut.isPending || !input.trim() ? 0.4 : 1 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', display: 'block' }}>send</span>
        </button>
      </div>
    </Card>
  )
}

// ── 2. Smart Alerts ───────────────────────────────────────
function AlertsPanel({ shopId }) {
  const { data, isLoading, refetch } = useCopilotAlerts(shopId)
  const navigate  = useNavigate()
  const alerts    = data?.data?.alerts || []
  const ctx       = data?.data?.context || {}
  const TYPE_CLR  = { critical: P.rose, warning: P.amber, info: P.blue }

  return (
    <Card>
      <SectionHeader icon="notifications" title="Smart Alerts"
        sub={alerts.length > 0 ? `${alerts.length} issues need attention` : 'All systems normal'}
        color={alerts.length > 0 ? P.amber : P.emerald}
        action={
          <button onClick={() => refetch()} style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: R, background: 'rgba(255,255,255,0.05)', border: `1px solid ${P.border}`, color: P.muted, cursor: 'pointer' }}>
            Refresh
          </button>
        }
      />
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2].map(i => <div key={i} style={{ height: '70px', borderRadius: R, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '40px', color: P.emerald + '60', display: 'block', marginBottom: '8px' }}>check_circle</span>
          <p style={{ fontFamily: FONT, fontWeight: 700, color: P.text, margin: '0 0 4px' }}>Sab theek hai</p>
          <p style={{ fontFamily: FONT, fontSize: '12px', color: P.muted, margin: 0 }}>No critical issues detected right now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alerts.map((a, i) => {
            const col = TYPE_CLR[a.type] || P.blue
            return (
              <motion.div key={a.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .06 }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', borderRadius: R, background: col + '0a', border: `1px solid ${col}25` }}>
                <div style={{ width: '34px', height: '34px', borderRadius: R, background: col + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '17px', color: col }}>{a.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '13px', color: P.text, margin: '0 0 3px' }}>{a.title}</p>
                  <p style={{ fontFamily: FONT, fontSize: '11px', color: P.muted, margin: '0 0 8px' }}>{a.desc}</p>
                  {a.actionPath && (
                    <button onClick={() => navigate(a.actionPath)}
                      style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: R, background: col + '18', border: `1px solid ${col}35`, color: col, cursor: 'pointer' }}>
                      {a.action} →
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
      {/* Mini stats */}
      {ctx.revenue7d !== undefined && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${P.border}` }}>
          {[
            { l: '7d Revenue', v: `Rs.${ctx.revenue7d?.toLocaleString()}`, c: P.emerald },
            { l: 'Cancel Rate', v: `${ctx.cancelRate}%`, c: parseFloat(ctx.cancelRate) > 15 ? P.rose : P.emerald },
            { l: 'Low Stock',   v: ctx.inventory?.lowStock ?? 0, c: ctx.inventory?.lowStock > 0 ? P.amber : P.emerald },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center', padding: '10px', borderRadius: R, background: 'rgba(255,255,255,0.03)', border: `1px solid ${P.border}` }}>
              <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: '17px', color: s.c, margin: 0 }}>{s.v}</p>
              <p style={{ fontFamily: FONT, fontSize: '9px', color: P.dim, margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '.08em' }}>{s.l}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ── 3. Business Advisor ───────────────────────────────────
function AdvisorPanel({ shopId }) {
  const adviseMut = useCopilotAdvise()
  const [advice, setAdvice]   = useState(null)
  const [active, setActive]   = useState(null)
  const [customQ, setCustomQ] = useState('')

  const TOPICS = [
    { id: 'weekend_sales',             label: 'Weekend Sales Boost',     icon: 'weekend',    color: P.blue    },
    { id: 'customer_retention',        label: 'Customer Retention',      icon: 'favorite',   color: P.violet  },
    { id: 'inventory_optimization',    label: 'Inventory Optimization',  icon: 'inventory_2',color: P.cyan    },
    { id: 'pricing_strategy',          label: 'Pricing Strategy',        icon: 'sell',       color: P.amber   },
    { id: 'inactive_customers',        label: 'Re-engage Inactive',      icon: 'person_off', color: P.indigo  },
  ]

  const ask = async (topic, custom) => {
    setActive(topic || 'custom'); setAdvice(null)
    const res = await adviseMut.mutateAsync({ shopId, topic: custom || topic })
    setAdvice(res.data?.advice)
  }

  return (
    <Card>
      <SectionHeader icon="lightbulb" title="Business Advisor" sub="AI strategy based on your store data" color={P.violet} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '8px', marginBottom: '14px' }}>
        {TOPICS.map(t => (
          <button key={t.id} onClick={() => ask(t.id)} disabled={adviseMut.isPending}
            style={{ fontFamily: FONT, textAlign: 'left', padding: '12px', borderRadius: R, cursor: 'pointer', transition: 'all .15s', disabled: adviseMut.isPending,
              background: active === t.id && advice ? t.color + '15' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${active === t.id && advice ? t.color + '40' : P.border}` }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.color + '45'; e.currentTarget.style.background = t.color + '0d' }}
            onMouseLeave={e => { if (active !== t.id || !advice) { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: t.color, display: 'block', marginBottom: '6px' }}>{t.icon}</span>
            <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: '12px', color: P.text, margin: 0 }}>{t.label}</p>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <input value={customQ} onChange={e => setCustomQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && customQ.trim() && ask(null, customQ)}
          placeholder="Ya apna sawal likhein..."
          style={{ flex: 1, fontFamily: FONT, fontSize: '12px', padding: '9px 13px', borderRadius: R, background: 'rgba(0,0,0,0.3)', border: `1px solid ${P.border}`, color: P.text, outline: 'none' }}
          onFocus={e => e.target.style.borderColor = P.violet + '70'}
          onBlur={e => e.target.style.borderColor = P.border} />
        <button onClick={() => customQ.trim() && ask(null, customQ)} disabled={adviseMut.isPending || !customQ.trim()}
          style={{ fontFamily: FONT, fontWeight: 600, fontSize: '12px', padding: '9px 16px', borderRadius: R, background: P.violet, color: '#fff', border: 'none', cursor: 'pointer', opacity: adviseMut.isPending || !customQ.trim() ? .4 : 1 }}>
          Ask
        </button>
      </div>
      {adviseMut.isPending && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
            {[0,.15,.3].map((d,i) => <span key={i} className="animate-bounce" style={{ width: '8px', height: '8px', borderRadius: '50%', background: P.violet, display: 'inline-block', animationDelay: `${d}s` }} />)}
          </div>
          <p style={{ fontFamily: FONT, fontSize: '11px', color: P.muted, marginTop: '8px' }}>Store data analyze ho raha hai...</p>
        </div>
      )}
      {advice && !adviseMut.isPending && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '16px', borderRadius: R, background: P.violet + '0a', border: `1px solid ${P.violet}25`, whiteSpace: 'pre-wrap', fontFamily: FONT, fontSize: '13px', lineHeight: 1.7, color: P.text }}>
          {advice}
        </motion.div>
      )}
    </Card>
  )
}

// ── 4. Report Generator ───────────────────────────────────
function ReportPanel({ shopId }) {
  const reportMut = useCopilotReport()
  const [period, setPeriod]   = useState('weekly')
  const [report, setReport]   = useState(null)
  const [error, setError]     = useState('')

  const PERIODS = [
    { id: 'daily',   label: 'Daily',   icon: 'today',        color: P.cyan   },
    { id: 'weekly',  label: 'Weekly',  icon: 'date_range',   color: P.blue   },
    { id: 'monthly', label: 'Monthly', icon: 'calendar_month', color: P.indigo },
  ]

  const generate = async () => {
    setError(''); setReport(null)
    try {
      const res = await reportMut.mutateAsync({ shopId, period })
      setReport(res.data)
    } catch { setError('Report generate karne mein error. Dobara try karein.') }
  }

  return (
    <Card>
      <SectionHeader icon="summarize" title="Report Generator" sub="Daily, Weekly, Monthly business reports" color={P.indigo} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => { setPeriod(p.id); setReport(null) }}
            style={{ fontFamily: FONT, padding: '14px 8px', borderRadius: R, cursor: 'pointer', textAlign: 'center', transition: 'all .15s',
              background: period === p.id ? p.color + '18' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${period === p.id ? p.color + '45' : P.border}` }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: period === p.id ? p.color : P.dim, display: 'block', marginBottom: '5px' }}>{p.icon}</span>
            <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: '12px', color: period === p.id ? p.color : P.muted, margin: 0 }}>{p.label}</p>
          </button>
        ))}
      </div>
      <button onClick={generate} disabled={reportMut.isPending}
        style={{ width: '100%', fontFamily: FONT, fontWeight: 700, fontSize: '13px', padding: '12px', borderRadius: R, background: reportMut.isPending ? 'rgba(255,255,255,0.08)' : P.indigo, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px', opacity: reportMut.isPending ? .7 : 1 }}>
        <span className={`material-symbols-outlined ${reportMut.isPending ? 'animate-spin' : ''}`} style={{ fontSize: '18px' }}>
          {reportMut.isPending ? 'autorenew' : 'summarize'}
        </span>
        {reportMut.isPending ? 'Report ban rahi hai...' : `Generate ${PERIODS.find(p => p.id === period)?.label} Report`}
      </button>
      {error && <p style={{ fontFamily: FONT, fontSize: '11px', color: P.rose, textAlign: 'center' }}>{error}</p>}
      {report && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {/* stats summary strip — real numbers from DB */}
          {report.context && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
              {[
                { l: 'Revenue',     v: `Rs.${(period === 'monthly' ? report.context.revenue30d : report.context.revenue7d)?.toLocaleString()}`, c: P.emerald },
                { l: 'Orders',      v: period === 'monthly' ? report.context.orders30d : report.context.orders7d,     c: P.blue    },
                { l: 'Cancel Rate', v: `${report.context.cancelRate}%`, c: parseFloat(report.context.cancelRate) > 15 ? P.rose : P.emerald },
                { l: 'Customers',   v: report.context.totalCustomers,   c: P.violet  },
              ].map(s => (
                <div key={s.l} style={{ padding: '10px 12px', borderRadius: R, background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)` }}>
                  <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: '18px', color: s.c, margin: 0, lineHeight: 1 }}>{s.v}</p>
                  <p style={{ fontFamily: FONT, fontSize: '9px', color: P.dim, margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '.08em' }}>{s.l}</p>
                </div>
              ))}
            </div>
          )}
          {/* Report text — clean, no duplicate heading */}
          <div style={{ padding: '16px 18px', borderRadius: R, background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`, fontFamily: FONT, fontSize: '13px', lineHeight: 1.8, color: P.text, whiteSpace: 'pre-wrap', marginBottom: '10px' }}>
            {report.report}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => navigator.clipboard.writeText(report.report)}
              style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 600, padding: '6px 14px', borderRadius: R, background: 'rgba(255,255,255,0.05)', border: `1px solid ${P.border}`, color: P.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>content_copy</span> Copy
            </button>
            <button onClick={() => setReport(null)}
              style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 600, padding: '6px 14px', borderRadius: R, background: 'rgba(255,255,255,0.05)', border: `1px solid ${P.border}`, color: P.muted, cursor: 'pointer' }}>
              Clear
            </button>
          </div>
        </motion.div>
      )}
    </Card>
  )
}

// ── 5. AI Recommendations ────────────────────────────────
function RecommendationsPanel({ shopId }) {
  const { data: recRes, isLoading } = useLatestRecommendations(shopId)
  const generateRec  = useGenerateRecommendations()
  const updateStatus = useUpdateRecommendationStatus()
  const rec = recRes?.data
  const normRec = rec ? (rec.weather ? rec : { ...rec, weather: rec.weatherContext ? { temp: rec.weatherContext.temp, condition: rec.weatherContext.condition } : null }) : null

  return (
    <Card>
      <SectionHeader icon="auto_awesome" title="AI Product Recommendations"
        sub={normRec?.generatedAt ? `Last: ${new Date(normRec.generatedAt).toLocaleString()}` : 'Weather + location + inventory analysis'}
        color={P.cyan}
        action={
          <button onClick={() => generateRec.mutate(shopId)} disabled={generateRec.isPending}
            style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 600, padding: '6px 14px', borderRadius: R, background: P.cyan + '18', border: `1px solid ${P.cyan}35`, color: P.cyan, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: generateRec.isPending ? .5 : 1 }}>
            <span className={`material-symbols-outlined ${generateRec.isPending ? 'animate-spin' : ''}`} style={{ fontSize: '14px' }}>
              {generateRec.isPending ? 'autorenew' : 'refresh'}
            </span>
            {generateRec.isPending ? 'Analyzing...' : 'Refresh'}
          </button>
        }
      />
      {generateRec.isError && (
        <p style={{ fontFamily: FONT, fontSize: '12px', color: P.rose, marginBottom: '12px' }}>
          {generateRec.error?.response?.data?.error || 'Failed. Add products to inventory first.'}
        </p>
      )}
      {(isLoading || generateRec.isPending) ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3].map(i => <div key={i} style={{ height: '72px', borderRadius: R, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : !normRec ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '40px', color: P.cyan + '40', display: 'block', marginBottom: '8px' }}>auto_awesome</span>
          <p style={{ fontFamily: FONT, fontWeight: 700, color: P.text, margin: '0 0 4px' }}>No recommendations yet</p>
          <p style={{ fontFamily: FONT, fontSize: '12px', color: P.muted, margin: '0 0 14px' }}>Click Refresh to analyze your inventory, weather, and location.</p>
          <button onClick={() => generateRec.mutate(shopId)}
            style={{ fontFamily: FONT, fontWeight: 700, fontSize: '12px', padding: '10px 20px', borderRadius: R, background: P.cyan, color: '#000', border: 'none', cursor: 'pointer' }}>
            Run Analysis
          </button>
        </div>
      ) : (
        <>
          {normRec.insight && (
            <div style={{ padding: '12px 14px', borderRadius: R, background: P.blue + '0d', border: `1px solid ${P.blue}25`, marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: P.cyan, flexShrink: 0, marginTop: '1px' }}>lightbulb</span>
              <p style={{ fontFamily: FONT, fontSize: '13px', color: P.text, margin: 0 }}>{normRec.insight}</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(normRec.recommendations || []).map((r, i) => {
              const RANK_CLR = [P.amber, P.blue, P.cyan]
              const col = RANK_CLR[i] || P.slate
              const pid = r.productId?._id || r.productId || r.productName
              const STATUS_LABEL = { pending: 'Pending', displayed: 'Displayed', acted: 'Done ✓', dismissed: 'Dismissed' }
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', borderRadius: R, background: col + '08', border: `1px solid ${col}20` }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: R, background: col + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: FONT, fontWeight: 800, fontSize: '14px', color: col }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '13px', color: P.text, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.productName}</p>
                    <p style={{ fontFamily: FONT, fontSize: '11px', color: P.muted, margin: '0 0 8px' }}>{r.reason}</p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: P.emerald + '18', color: P.emerald, border: `1px solid ${P.emerald}30` }}>{r.expectedUplift}</span>
                      <span style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: P.muted, border: `1px solid ${P.border}` }}>{STATUS_LABEL[r.status] || 'Pending'}</span>
                    </div>
                  </div>
                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }}>
                      <button onClick={() => updateStatus.mutate({ logId: normRec._id, productId: pid, status: 'displayed', shopId })} disabled={updateStatus.isPending}
                        style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 600, padding: '4px 10px', borderRadius: '4px', background: P.blue + '18', border: `1px solid ${P.blue}30`, color: P.blue, cursor: 'pointer' }}>
                        Displayed
                      </button>
                      <button onClick={() => updateStatus.mutate({ logId: normRec._id, productId: pid, status: 'acted', shopId })} disabled={updateStatus.isPending}
                        style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 600, padding: '4px 10px', borderRadius: '4px', background: P.emerald + '18', border: `1px solid ${P.emerald}30`, color: P.emerald, cursor: 'pointer' }}>
                        Done ✓
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </Card>
  )
}

// ── 6. AI Settings ────────────────────────────────────────
function AISettingsPanel({ shop }) {
  const updateAI = useUpdateAISettings()
  const [form, setForm] = useState({
    enabled:      shop?.aiSettings?.enabled      ?? false,
    systemPrompt: shop?.aiSettings?.systemPrompt || '',
  })
  const [saved, setSaved] = useState(false)

  const save = () => updateAI.mutate({ shopId: shop._id, aiSettings: form }, {
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  })

  if (!shop) return null

  return (
    <Card>
      <SectionHeader icon="settings" title="AI Agent Settings" sub={shop.name} color={P.slate} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: R, background: 'rgba(255,255,255,0.03)', border: `1px solid ${P.border}` }}>
          <div>
            <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: '13px', color: P.text, margin: '0 0 3px' }}>AI Agent Auto-Reply</p>
            <p style={{ fontFamily: FONT, fontSize: '11px', color: P.muted, margin: 0 }}>Gemini-powered WhatsApp responses</p>
          </div>
          <button onClick={() => setForm(p => ({ ...p, enabled: !p.enabled }))}
            style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', background: form.enabled ? P.blue : 'rgba(255,255,255,0.12)' }}>
            <span style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.4)', transition: 'left .2s', left: form.enabled ? '23px' : '3px' }} />
          </button>
        </div>
        {/* System prompt */}
        <div>
          <p style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: P.dim, margin: '0 0 6px' }}>System Prompt</p>
          <textarea rows={4} value={form.systemPrompt} onChange={e => setForm(p => ({ ...p, systemPrompt: e.target.value }))}
            placeholder="You are a helpful assistant for {shop.name}..."
            style={{ width: '100%', fontFamily: FONT, fontSize: '12px', padding: '10px 13px', borderRadius: R, background: 'rgba(0,0,0,0.3)', border: `1px solid ${P.border}`, color: P.text, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = P.blue + '70'} onBlur={e => e.target.style.borderColor = P.border} />
        </div>
        <button onClick={save} disabled={updateAI.isPending}
          style={{ fontFamily: FONT, fontWeight: 700, fontSize: '13px', padding: '12px', borderRadius: R, background: saved ? P.emerald : P.blue, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: updateAI.isPending ? .6 : 1 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{saved ? 'check_circle' : 'save'}</span>
          {saved ? 'Saved!' : updateAI.isPending ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </Card>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function AIAgent() {
  const navigate      = useNavigate()
  const user          = useAuthStore((s) => s.user)
  const activeShop    = useAuthStore((s) => s.activeShop)
  const setActiveShop = useAuthStore((s) => s.setActiveShop)
  const { data: shopsRes } = useShopsByOwner(user?._id)
  const shops = shopsRes?.data || []
  const shopId = activeShop?._id

  if (!user) return (
    <div style={{ textAlign: 'center', padding: '64px 24px', fontFamily: FONT }}>
      <p style={{ color: P.text, fontWeight: 700 }}>Please log in</p>
      <button onClick={() => navigate('/login')} style={{ marginTop: '12px', color: P.blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontFamily: FONT }}>Go to Login</button>
    </div>
  )

  if (!shopId) return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '64px 24px', textAlign: 'center', fontFamily: FONT }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', color: P.slate + '60', display: 'block', marginBottom: '12px' }}>store</span>
      <p style={{ fontWeight: 700, fontSize: '16px', color: P.text, margin: '0 0 6px' }}>No active shop</p>
      <p style={{ fontSize: '13px', color: P.muted, margin: '0 0 20px' }}>Select a shop to use the AI assistant.</p>
      {shops.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {shops.map(s => (
            <button key={s._id} onClick={() => setActiveShop(s)}
              style={{ fontFamily: FONT, padding: '10px', borderRadius: R, border: `1px solid ${P.blue}35`, background: P.blue + '12', color: P.blue, fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
              {s.name}
            </button>
          ))}
        </div>
      ) : (
        <button onClick={() => navigate('/dashboard/shops')}
          style={{ fontFamily: FONT, padding: '10px 20px', borderRadius: R, background: P.blue, color: '#fff', fontWeight: 700, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
          Create Your First Shop
        </button>
      )}
    </div>
  )

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: '24px', color: P.text, margin: 0 }}>AI Assistant</h2>
          <p style={{ fontFamily: FONT, fontSize: '12px', color: P.muted, margin: '4px 0 0' }}>
            Gemini-powered business copilot for <span style={{ color: P.cyan, fontWeight: 600 }}>{activeShop.name}</span>
          </p>
        </div>
        <span style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 600, padding: '5px 14px', borderRadius: R, background: P.cyan + '12', border: `1px solid ${P.cyan}30`, color: P.cyan, textTransform: 'capitalize' }}>
          {activeShop.businessType} · AI On
        </span>
      </div>

      {/* All modules on one page — 2 column grid on large, 1 on small */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 520px), 1fr))', gap: '20px' }}>
        {/* Q&A Chat — full width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <QAChat shopId={shopId} />
        </div>

        {/* Alerts */}
        <AlertsPanel shopId={shopId} />

        {/* Advisor */}
        <AdvisorPanel shopId={shopId} />

        {/* Report — full width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <ReportPanel shopId={shopId} />
        </div>

        {/* Recommendations — full width */}
        <div style={{ gridColumn: '1 / -1' }}>
          <RecommendationsPanel shopId={shopId} />
        </div>

        {/* Settings */}
        <div style={{ gridColumn: '1 / -1' }}>
          <AISettingsPanel shop={activeShop} />
        </div>
      </div>
    </div>
  )
}
