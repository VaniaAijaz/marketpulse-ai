import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/useAuthStore'
import {
  useCampaigns, useSegmentCounts, useCampaignAnalytics, useSmartSuggestions,
  useTemplates, usePreviewRecipients, useAiGenerateMessage,
  useSendCampaign, useScheduleCampaign, useGenerateCoupon,
} from '../../features/campaigns/campaignHooks'

// ── Same professional palette as AI Assistant ─────────────
const P = {
  bg:      '#2C2C2C',
  card:    '#000000',
  border:  'rgba(255,255,255,0.08)',
  text:    '#ffffff',
  muted:   'rgba(255,255,255,0.5)',
  dim:     'rgba(255,255,255,0.28)',
  blue:    '#3b82f6',
  indigo:  '#6366f1',
  violet:  '#8b5cf6',
  emerald: '#10b981',
  slate:   '#94a3b8',
  rose:    '#f43f5e',
  amber:   '#f59e0b',
  cyan:    '#06b6d4',
  wa:      '#25D366',
}
const FONT = "'Inter','Segoe UI',system-ui,sans-serif"
const R    = '6px'
const R2   = '10px'

const SEGMENTS = [
  { id: 'all',      label: 'All',      icon: 'group',             color: P.blue    },
  { id: 'vip',      label: 'VIP',      icon: 'workspace_premium', color: P.amber   },
  { id: 'active',   label: 'Active',   icon: 'trending_up',       color: P.emerald },
  { id: 'regular',  label: 'Regular',  icon: 'repeat',            color: P.cyan    },
  { id: 'new',      label: 'New',      icon: 'person_add',        color: P.indigo  },
  { id: 'inactive', label: 'Inactive', icon: 'schedule',          color: P.slate   },
]

const TABS = [
  { id: 'compose',     label: 'Compose',     icon: 'edit_note'    },
  { id: 'history',     label: 'History',     icon: 'history'      },
  { id: 'analytics',   label: 'Analytics',   icon: 'bar_chart'    },
  { id: 'templates',   label: 'Templates',   icon: 'style'        },
  { id: 'suggestions', label: 'Suggestions', icon: 'lightbulb'    },
]

// ── Shared components ─────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: R2, padding: '20px', fontFamily: FONT, ...style }}>
    {children}
  </div>
)

const Label = ({ children }) => (
  <p style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: P.dim, margin: '0 0 6px' }}>{children}</p>
)

const Input = ({ style = {}, ...props }) => (
  <input style={{ fontFamily: FONT, fontSize: '13px', padding: '10px 13px', borderRadius: R, background: 'rgba(0,0,0,0.35)', border: `1px solid ${P.border}`, color: P.text, outline: 'none', width: '100%', boxSizing: 'border-box', ...style }}
    onFocus={e => e.target.style.borderColor = P.blue + '70'}
    onBlur={e => e.target.style.borderColor = P.border}
    {...props} />
)

// ── Compose Tab ───────────────────────────────────────────
function ComposeTab({ shopId, prefillMsg = '', prefillSeg = 'all' }) {
  const segCounts  = useSegmentCounts(shopId)
  const previewMut = usePreviewRecipients()
  const aiGenMut   = useAiGenerateMessage()
  const sendMut    = useSendCampaign()
  const scheduleMut = useScheduleCampaign()
  const couponMut  = useGenerateCoupon()
  const { data: tplData } = useTemplates()
  const templates  = tplData?.data || []
  const counts     = segCounts.data?.data || {}

  const [segment, setSegment]       = useState(prefillSeg)
  const [message, setMessage]       = useState(prefillMsg)
  const [name, setName]             = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [couponExpiry, setCouponExpiry] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [mode, setMode]             = useState('now')
  const [preview, setPreview]       = useState(null)
  const [success, setSuccess]       = useState('')
  const [error, setError]           = useState('')
  const [showAi, setShowAi]         = useState(false)
  const [aiGoal, setAiGoal]         = useState('')
  const [aiProduct, setAiProduct]   = useState('')
  const [aiDiscount, setAiDiscount] = useState('')

  const handlePreview = async () => {
    const res = await previewMut.mutateAsync({ shopId, segment })
    setPreview(res.data)
  }
  const handleAiGen = async () => {
    const res = await aiGenMut.mutateAsync({ shopId, goal: aiGoal, productName: aiProduct, discount: aiDiscount, segment, couponCode })
    setMessage(res.data?.message || '')
    setShowAi(false)
  }
  const handleCoupon = async () => {
    const res = await couponMut.mutateAsync({ type: 'discount', value: 15 })
    setCouponCode(res.data?.code || '')
  }
  const handleSend = async () => {
    setError(''); setSuccess('')
    if (!name.trim()) { setError('Campaign ka naam zaroori hai'); return }
    if (!message.trim()) { setError('Message zaroori hai'); return }
    try {
      if (mode === 'schedule') {
        if (!scheduledAt) { setError('Date aur time select karein'); return }
        await scheduleMut.mutateAsync({ shopId, name, segment, message, couponCode, couponExpiry, scheduledAt })
        setSuccess(`Campaign ${new Date(scheduledAt).toLocaleString()} ke liye schedule ho gaya!`)
      } else {
        const res = await sendMut.mutateAsync({ shopId, name, segment, message, couponCode, couponExpiry })
        setSuccess(`${res.data?.sentCount} customers ko message bhej diya gaya!`)
      }
      setMessage(''); setName(''); setCouponCode(''); setScheduledAt('')
    } catch (e) { setError(e.response?.data?.error || 'Campaign send nahi hua') }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: '20px' }} className="xl:grid">
      {/* Left column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Campaign name */}
        <Card>
          <Label>Campaign Ka Naam *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Eid Flash Sale 2026" />
        </Card>

        {/* Segment */}
        <Card>
          <Label>Target Customers</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
            {SEGMENTS.map(s => (
              <button key={s.id} onClick={() => { setSegment(s.id); setPreview(null) }}
                style={{ fontFamily: FONT, padding: '12px 8px', borderRadius: R, cursor: 'pointer', textAlign: 'center', transition: 'all .15s',
                  background: segment === s.id ? s.color + '18' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${segment === s.id ? s.color + '45' : P.border}` }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: segment === s.id ? s.color : P.dim, display: 'block', marginBottom: '4px' }}>{s.icon}</span>
                <p style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 700, color: segment === s.id ? s.color : P.muted, margin: '0 0 3px' }}>{s.label}</p>
                <p style={{ fontFamily: FONT, fontSize: '14px', fontWeight: 800, color: segment === s.id ? s.color : P.text, margin: 0 }}>{counts[s.id] ?? '—'}</p>
              </button>
            ))}
          </div>
          <button onClick={handlePreview} disabled={previewMut.isPending}
            style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 600, color: P.cyan, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>group</span>
            {previewMut.isPending ? 'Loading...' : 'Kitnon ko jayega?'}
          </button>
          <AnimatePresence>
            {preview && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginTop: '10px' }}>
                <div style={{ padding: '10px 13px', borderRadius: R, background: P.cyan + '0d', border: `1px solid ${P.cyan}25` }}>
                  <p style={{ fontFamily: FONT, fontSize: '12px', fontWeight: 700, color: P.cyan, margin: '0 0 3px' }}>
                    📱 {preview.count} customers ko message jayega
                  </p>
                  {preview.sample?.length > 0 && (
                    <p style={{ fontFamily: FONT, fontSize: '10px', color: P.muted, margin: 0 }}>
                      {preview.sample.map(c => c.name || c.phone).join(', ')}{preview.count > 5 ? ` +${preview.count - 5} aur` : ''}
                    </p>
                  )}
                  {preview.count === 0 && <p style={{ fontFamily: FONT, fontSize: '10px', color: P.amber, margin: 0 }}>Is segment mein koi customer nahi</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Message */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <Label>Message *</Label>
            <button onClick={() => setShowAi(v => !v)}
              style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: R, background: P.violet + '18', border: `1px solid ${P.violet}30`, color: P.violet, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>auto_awesome</span>
              AI Generate
            </button>
          </div>
          <AnimatePresence>
            {showAi && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ padding: '14px', borderRadius: R, background: P.violet + '0d', border: `1px solid ${P.violet}25`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div><Label>Campaign Goal</Label><Input value={aiGoal} onChange={e => setAiGoal(e.target.value)} placeholder="Flash sale" /></div>
                    <div><Label>Product</Label><Input value={aiProduct} onChange={e => setAiProduct(e.target.value)} placeholder="Rice, Clothing" /></div>
                  </div>
                  <div><Label>Discount / Offer</Label><Input value={aiDiscount} onChange={e => setAiDiscount(e.target.value)} placeholder="20% off, free delivery" /></div>
                  <button onClick={handleAiGen} disabled={aiGenMut.isPending}
                    style={{ fontFamily: FONT, fontWeight: 700, fontSize: '12px', padding: '10px', borderRadius: R, background: P.violet, color: '#fff', border: 'none', cursor: 'pointer', opacity: aiGenMut.isPending ? .5 : 1 }}>
                    {aiGenMut.isPending ? 'Generating...' : 'Generate Message'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
            placeholder="Apna WhatsApp message likhein ya AI Generate use karein..."
            style={{ fontFamily: FONT, fontSize: '13px', padding: '11px 13px', borderRadius: R, background: 'rgba(0,0,0,0.35)', border: `1px solid ${P.border}`, color: P.text, resize: 'none', outline: 'none', width: '100%', boxSizing: 'border-box', lineHeight: 1.6 }}
            onFocus={e => e.target.style.borderColor = P.wa + '60'}
            onBlur={e => e.target.style.borderColor = P.border} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <span style={{ fontFamily: FONT, fontSize: '10px', color: message.length > 200 ? P.rose : P.dim }}>{message.length}/200</span>
            {message && (
              <div style={{ background: '#dcf8c6', borderRadius: '12px 12px 2px 12px', padding: '8px 12px', maxWidth: '65%' }}>
                <p style={{ fontFamily: FONT, fontSize: '11px', color: '#1a1a1a', margin: '0 0 2px', lineHeight: 1.5 }}>{message.slice(0,80)}{message.length > 80 ? '...' : ''}</p>
                <p style={{ fontFamily: FONT, fontSize: '9px', color: '#666', textAlign: 'right', margin: 0 }}>✓✓</p>
              </div>
            )}
          </div>
        </Card>

        {/* Coupon */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <Label>Coupon Code <span style={{ fontSize: '9px', fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: P.dim }}>(optional)</span></Label>
            <button onClick={handleCoupon} disabled={couponMut.isPending}
              style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 600, color: P.amber, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>auto_awesome</span>
              Auto Generate
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <Input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="e.g. SAVE20" style={{ fontFamily: "'Courier New', monospace", letterSpacing: '.08em' }} />
            <Input type="date" value={couponExpiry} onChange={e => setCouponExpiry(e.target.value)} />
          </div>
        </Card>

        {/* Send */}
        <Card>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            {['now', 'schedule'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{ flex: 1, fontFamily: FONT, fontWeight: 700, fontSize: '12px', padding: '10px', borderRadius: R, cursor: 'pointer', transition: 'all .15s',
                  background: mode === m ? P.wa + '18' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${mode === m ? P.wa + '45' : P.border}`,
                  color: mode === m ? P.wa : P.muted }}>
                {m === 'now' ? '⚡ Send Now' : '🗓 Schedule'}
              </button>
            ))}
          </div>
          {mode === 'schedule' && (
            <div style={{ marginBottom: '12px' }}>
              <Label>Date & Time</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
            </div>
          )}
          {error && <div style={{ fontFamily: FONT, fontSize: '12px', padding: '10px 13px', borderRadius: R, background: P.rose + '12', border: `1px solid ${P.rose}30`, color: P.rose, marginBottom: '10px' }}>{error}</div>}
          {success && <div style={{ fontFamily: FONT, fontSize: '12px', padding: '10px 13px', borderRadius: R, background: P.emerald + '12', border: `1px solid ${P.emerald}30`, color: P.emerald, marginBottom: '10px' }}>✓ {success}</div>}
          <button onClick={handleSend} disabled={sendMut.isPending || scheduleMut.isPending}
            style={{ width: '100%', fontFamily: FONT, fontWeight: 800, fontSize: '14px', padding: '14px', borderRadius: R, background: `linear-gradient(135deg, #25D366, #128C7E)`, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: sendMut.isPending || scheduleMut.isPending ? .6 : 1, boxShadow: '0 0 20px rgba(37,211,102,0.25)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{mode === 'now' ? 'send' : 'schedule_send'}</span>
            {sendMut.isPending || scheduleMut.isPending ? 'Processing...' : mode === 'now' ? `Send to ${counts[segment] || 0} customers` : 'Schedule Campaign'}
          </button>
        </Card>
      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Templates */}
        <Card>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '13px', color: P.text, margin: '0 0 12px' }}>Quick Templates</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '380px', overflowY: 'auto' }}>
            {templates.map(t => (
              <button key={t.id} onClick={() => setMessage(t.body)}
                style={{ fontFamily: FONT, textAlign: 'left', padding: '10px 12px', borderRadius: R, cursor: 'pointer', transition: 'border-color .15s', background: 'rgba(255,255,255,0.03)', border: `1px solid ${P.border}` }}
                onMouseEnter={e => e.currentTarget.style.borderColor = t.color + '50'}
                onMouseLeave={e => e.currentTarget.style.borderColor = P.border}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px', color: t.color }}>{t.icon}</span>
                  <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '12px', color: P.text, margin: 0, flex: 1 }}>{t.label}</p>
                  <span style={{ fontSize: '10px', color: t.color }}>Use →</span>
                </div>
                <p style={{ fontFamily: FONT, fontSize: '10px', color: P.dim, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.body}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Best practices */}
        <Card>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '13px', color: P.text, margin: '0 0 10px' }}>Best Practices</p>
          {[
            { icon: 'schedule',        text: 'Best time: 10 AM – 12 PM',       color: P.blue    },
            { icon: 'emoji_emotions',  text: 'Emojis increase open rates 25%', color: P.amber   },
            { icon: 'short_text',      text: 'Keep under 160 characters',      color: P.emerald },
            { icon: 'campaign',        text: 'Max 2 messages per week',        color: P.violet  },
          ].map(tip => (
            <div key={tip.text} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', fontFamily: FONT, fontSize: '11px', color: P.muted }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: tip.color, flexShrink: 0 }}>{tip.icon}</span>
              {tip.text}
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

// ── Analytics Tab ─────────────────────────────────────────
function AnalyticsTab({ shopId }) {
  const { data, isLoading } = useCampaignAnalytics(shopId)
  const s = data?.data || {}

  const KPI = [
    { label: 'Campaigns',  value: s.totalCampaigns ?? 0, icon: 'campaign',        color: P.blue    },
    { label: 'Sent',       value: s.totalMessages  ?? 0, icon: 'send',            color: P.cyan    },
    { label: 'Delivered',  value: s.delivered      ?? 0, icon: 'done_all',        color: P.emerald, sub: `${s.deliveryRate ?? 0}%` },
    { label: 'Read',       value: s.read           ?? 0, icon: 'mark_email_read', color: P.violet,  sub: `${s.readRate ?? 0}%` },
  ]

  if (isLoading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '12px' }}>
      {[1,2,3,4].map(i => <div key={i} style={{ height: '100px', borderRadius: R2, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />)}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '12px' }}>
        {KPI.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .07 }}
            style={{ background: P.card, border: `1px solid ${k.color}20`, borderRadius: R2, padding: '18px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-8px', right: '-8px', width: '50px', height: '50px', borderRadius: '50%', background: k.color + '20', filter: 'blur(16px)' }} />
            <div style={{ width: '34px', height: '34px', borderRadius: R, background: k.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: k.color }}>{k.icon}</span>
            </div>
            <p style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: P.dim, margin: '0 0 3px' }}>{k.label}</p>
            <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: '24px', color: P.text, margin: 0, lineHeight: 1 }}>{k.value}</p>
            {k.sub && <p style={{ fontFamily: FONT, fontSize: '11px', color: k.color, margin: '3px 0 0' }}>{k.sub} rate</p>}
          </motion.div>
        ))}
      </div>

      {/* Funnel bars */}
      <Card>
        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '14px', color: P.text, margin: '0 0 16px' }}>Delivery Funnel</p>
        {[
          { label: 'Sent',      val: s.sent      ?? 0, color: P.cyan,    max: s.totalMessages || 1 },
          { label: 'Delivered', val: s.delivered ?? 0, color: P.emerald, max: s.totalMessages || 1 },
          { label: 'Read',      val: s.read      ?? 0, color: P.violet,  max: s.totalMessages || 1 },
          { label: 'Failed',    val: s.failed    ?? 0, color: P.rose,    max: s.totalMessages || 1 },
        ].map(row => (
          <div key={row.label} style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontSize: '11px', marginBottom: '5px' }}>
              <span style={{ color: P.muted }}>{row.label}</span>
              <span style={{ color: row.color, fontWeight: 700 }}>{row.val} <span style={{ color: P.dim }}>({Math.round((row.val / row.max) * 100)}%)</span></span>
            </div>
            <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.07)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((row.val / row.max) * 100, 100)}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{ height: '100%', borderRadius: '3px', background: row.color }} />
            </div>
          </div>
        ))}
      </Card>

      {/* Recent campaigns */}
      {s.recentCampaigns?.length > 0 && (
        <Card>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '14px', color: P.text, margin: '0 0 14px' }}>Recent Campaigns</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {s.recentCampaigns.map(c => {
              const seg = SEGMENTS.find(s => s.id === c.segment)
              return (
                <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: R, background: 'rgba(255,255,255,0.03)', border: `1px solid ${P.border}` }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: R, background: (seg?.color || P.blue) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px', color: seg?.color || P.blue }}>{seg?.icon || 'campaign'}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: '12px', color: P.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                    <p style={{ fontFamily: FONT, fontSize: '10px', color: P.dim, margin: '2px 0 0' }}>{new Date(c.sentAt).toLocaleDateString()} · {c.segment}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '12px', color: P.emerald, margin: 0 }}>{c.stats?.sentCount ?? 0} sent</p>
                    <p style={{ fontFamily: FONT, fontSize: '10px', color: P.dim, margin: '2px 0 0' }}>{c.stats?.readCount ?? 0} read</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

// ── History Tab ───────────────────────────────────────────
function HistoryTab({ shopId }) {
  const { data, isLoading } = useCampaigns(shopId, { limit: 30 })
  const campaigns = data?.data?.campaigns || []
  const STATUS_CLR = { sent: P.emerald, scheduled: P.cyan, sending: P.amber, failed: P.rose, draft: P.slate }

  if (isLoading) return <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>{[1,2,3].map(i => <div key={i} style={{ height: '72px', borderRadius: R2, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />)}</div>

  if (!campaigns.length) return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '44px', color: 'rgba(255,255,255,0.1)', display: 'block', marginBottom: '10px' }}>history</span>
      <p style={{ fontFamily: FONT, fontWeight: 700, color: P.text, margin: '0 0 5px' }}>Abhi koi campaign nahi</p>
      <p style={{ fontFamily: FONT, fontSize: '12px', color: P.muted, margin: 0 }}>Pehla campaign Compose tab se bhejein.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {campaigns.map((c, i) => {
        const seg = SEGMENTS.find(s => s.id === c.segment)
        const col = STATUS_CLR[c.status] || P.slate
        return (
          <motion.div key={c._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .04 }}
            style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: R2, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <div style={{ width: '36px', height: '36px', borderRadius: R, background: (seg?.color || P.blue) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: seg?.color || P.blue }}>{seg?.icon || 'campaign'}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '13px', color: P.text, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                  <p style={{ fontFamily: FONT, fontSize: '10px', color: P.dim, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.message?.slice(0, 55)}...</p>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '4px', background: col + '18', border: `1px solid ${col}30`, color: col, textTransform: 'capitalize' }}>{c.status}</span>
                <p style={{ fontFamily: FONT, fontSize: '10px', color: P.dim, margin: '4px 0 0' }}>
                  {c.status === 'scheduled' ? new Date(c.scheduledAt).toLocaleString() : new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {c.status === 'sent' && (
              <div style={{ display: 'flex', gap: '20px', marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${P.border}` }}>
                {[
                  { l: 'Recipients', v: c.stats?.recipientCount ?? 0, c: P.muted    },
                  { l: 'Sent',       v: c.stats?.sentCount      ?? 0, c: P.emerald  },
                  { l: 'Read',       v: c.stats?.readCount      ?? 0, c: P.violet   },
                ].map(s => (
                  <div key={s.l}>
                    <p style={{ fontFamily: FONT, fontSize: '9px', color: P.dim, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '.07em' }}>{s.l}</p>
                    <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: '14px', color: s.c, margin: 0 }}>{s.v}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Templates Tab ─────────────────────────────────────────
function TemplatesTab({ onUseTemplate }) {
  const { data, isLoading } = useTemplates()
  const templates = data?.data || []

  if (isLoading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '12px' }}>
      {[1,2,3,4].map(i => <div key={i} style={{ height: '140px', borderRadius: R2, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />)}
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '14px' }}>
      {templates.map((t, i) => (
        <motion.div key={t.id} initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * .05 }}
          style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: R2, padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: R, background: t.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '17px', color: t.color }}>{t.icon}</span>
            </div>
            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '13px', color: P.text, margin: 0 }}>{t.label}</p>
          </div>
          <p style={{ fontFamily: FONT, fontSize: '12px', color: P.muted, margin: 0, lineHeight: 1.6, flex: 1 }}>{t.body}</p>
          <button onClick={() => onUseTemplate(t)}
            style={{ fontFamily: FONT, fontWeight: 700, fontSize: '11px', padding: '8px', borderRadius: R, background: t.color + '15', border: `1px solid ${t.color}30`, color: t.color, cursor: 'pointer', width: '100%' }}>
            Use This Template →
          </button>
        </motion.div>
      ))}
    </div>
  )
}

// ── Suggestions Tab ───────────────────────────────────────
function SuggestionsTab({ shopId, onUseSuggestion }) {
  const { data, isLoading } = useSmartSuggestions(shopId)
  const suggestions = data?.data || []
  const PRIORITY_CLR = { high: P.rose, medium: P.amber, low: P.blue }

  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[1,2,3].map(i => <div key={i} style={{ height: '110px', borderRadius: R2, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />)}
    </div>
  )

  if (!suggestions.length) return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '44px', color: P.emerald + '50', display: 'block', marginBottom: '10px' }}>check_circle</span>
      <p style={{ fontFamily: FONT, fontWeight: 700, color: P.text, margin: '0 0 5px' }}>Sab theek hai!</p>
      <p style={{ fontFamily: FONT, fontSize: '12px', color: P.muted, margin: 0 }}>Abhi koi urgent suggestion nahi hai.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontFamily: FONT, fontSize: '12px', color: P.muted, margin: 0 }}>
        Aapke customer data ke basis par yeh campaigns bhejne chahiyein:
      </p>
      {suggestions.map((s, i) => (
        <motion.div key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .08 }}
          style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: R2, padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              <div style={{ width: '38px', height: '38px', borderRadius: R, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: s.color }}>{s.icon}</span>
              </div>
              <div>
                <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '13px', color: P.text, margin: '0 0 2px' }}>{s.title}</p>
                <p style={{ fontFamily: FONT, fontSize: '11px', color: P.muted, margin: 0 }}>{s.desc}</p>
              </div>
            </div>
            <span style={{ fontFamily: FONT, fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', padding: '3px 8px', borderRadius: '4px', background: (PRIORITY_CLR[s.priority] || P.blue) + '20', color: PRIORITY_CLR[s.priority] || P.blue, flexShrink: 0 }}>
              {s.priority}
            </span>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: R, background: 'rgba(255,255,255,0.04)', marginBottom: '12px' }}>
            <p style={{ fontFamily: FONT, fontSize: '12px', color: P.muted, margin: 0, lineHeight: 1.6 }}>{s.template}</p>
          </div>
          <button onClick={() => onUseSuggestion(s)}
            style={{ fontFamily: FONT, fontWeight: 700, fontSize: '12px', padding: '9px 16px', borderRadius: R, background: P.wa + '18', border: `1px solid ${P.wa}35`, color: P.wa, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>send</span>
            Is Campaign Ko Bhejein
          </button>
        </motion.div>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function WhatsApp() {
  const navigate   = useNavigate()
  const activeShop = useAuthStore((s) => s.activeShop)
  const shopId     = activeShop?._id
  const [tab, setTab]           = useState('compose')
  const [prefillMsg, setPrefillMsg] = useState('')
  const [prefillSeg, setPrefillSeg] = useState('all')

  const handleUseSuggestion = (s) => { setPrefillMsg(s.template); setPrefillSeg(s.segment); setTab('compose') }
  const handleUseTemplate   = (t) => { setPrefillMsg(t.body);     setTab('compose') }

  if (!activeShop) return (
    <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: FONT }}>
      <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'rgba(255,255,255,0.1)', display: 'block', marginBottom: '12px' }}>forum</span>
      <p style={{ fontWeight: 700, fontSize: '17px', color: P.text, margin: '0 0 6px' }}>Koi shop select nahi</p>
      <p style={{ fontSize: '13px', color: P.muted, margin: '0 0 20px' }}>WhatsApp Marketing use karne ke liye pehle shop select karein.</p>
      <button onClick={() => navigate('/dashboard/shops')}
        style={{ fontFamily: FONT, fontWeight: 700, padding: '10px 22px', borderRadius: R, background: P.blue, color: '#fff', border: 'none', cursor: 'pointer' }}>
        My Shops
      </button>
    </div>
  )

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: '24px', color: P.text, margin: 0 }}>WhatsApp Marketing</h2>
          <p style={{ fontFamily: FONT, fontSize: '12px', color: P.muted, margin: '4px 0 0' }}>
            {activeShop.name} — AI-powered campaign center
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: R, background: P.wa + '12', border: `1px solid ${P.wa}30` }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: P.wa, animation: 'pulse 2s infinite' }} />
          <span style={{ fontFamily: FONT, fontSize: '12px', fontWeight: 700, color: P.wa }}>WhatsApp Ready</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', padding: '4px', background: P.card, border: `1px solid ${P.border}`, borderRadius: R2, width: 'fit-content', marginBottom: '20px' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ fontFamily: FONT, fontWeight: 600, fontSize: '12px', padding: '8px 16px', borderRadius: R, cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: '6px',
              background: tab === t.id ? P.wa + '18' : 'transparent',
              border: tab === t.id ? `1px solid ${P.wa}35` : '1px solid transparent',
              color: tab === t.id ? P.wa : P.muted }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
          {tab === 'compose'     && <ComposeTab     shopId={shopId} prefillMsg={prefillMsg} prefillSeg={prefillSeg} />}
          {tab === 'history'     && <HistoryTab     shopId={shopId} />}
          {tab === 'analytics'   && <AnalyticsTab   shopId={shopId} />}
          {tab === 'templates'   && <TemplatesTab   onUseTemplate={handleUseTemplate} />}
          {tab === 'suggestions' && <SuggestionsTab shopId={shopId} onUseSuggestion={handleUseSuggestion} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
