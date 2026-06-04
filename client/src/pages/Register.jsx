import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import 'leaflet/dist/leaflet.css'
import { useRegisterWithShop } from '../features/auth/authHooks'
import ShopLocationPicker from '../components/register/ShopLocationPicker'
import { BUSINESS_TYPES, getBusinessHint } from '../lib/businessCatalog'
import useAuthStore from '../store/useAuthStore'
import LetterGlitch from '../components/ui/LetterGlitch'

const F = "'Inter','Segoe UI',system-ui,sans-serif"

/* hide scrollbar globally for pill row */
const hideScrollStyle = document.createElement('style')
hideScrollStyle.textContent = '.pill-scroll::-webkit-scrollbar { display: none; }'
document.head.appendChild(hideScrollStyle)

/* ── shared ─────────────────────────────────────────── */
function Input({ type = 'text', placeholder, value, onChange, suffix }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '9px 12px', paddingRight: suffix ? '40px' : '12px',
          borderRadius: '6px', fontFamily: F, fontWeight: 300, fontSize: '13px',
          outline: 'none', boxSizing: 'border-box',
          background: focused ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.09)'}`,
          color: '#fff', transition: 'all 0.15s', backdropFilter: 'blur(6px)',
        }} />
      {suffix && (
        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
          {suffix}
        </div>
      )}
    </div>
  )
}

function Label({ children }) {
  return <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, color: 'rgba(255,255,255,0.5)', margin: '0 0 5px', letterSpacing: '0.01em' }}>{children}</p>
}

const BIZ_ICONS = {
  grocery: 'local_grocery_store', clothing: 'checkroom', pharmacy: 'local_pharmacy',
  restaurant: 'restaurant', electronics: 'devices', other: 'storefront',
}

export default function Register() {
  const navigate         = useNavigate()
  const registerMutation = useRegisterWithShop()
  const setActiveShop    = useAuthStore(s => s.setActiveShop)

  const [step, setStep]         = useState(1)
  const [errorMsg, setErrorMsg] = useState('')
  const [showPass, setShowPass] = useState(false)

  const [name, setName]         = useState('')
  const [phone, setPhone]       = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  const [shopName, setShopName]         = useState('')
  const [businessType, setBusinessType] = useState('grocery')
  const [location, setLocation]         = useState({})

  const goStep2 = (e) => {
    e.preventDefault(); setErrorMsg('')
    if (!name.trim())        { setErrorMsg('Name is required'); return }
    if (!phone.trim())       { setErrorMsg('Phone is required'); return }
    if (!email.trim())       { setErrorMsg('Email is required'); return }
    if (!password)           { setErrorMsg('Password is required'); return }
    if (password.length < 6) { setErrorMsg('Password must be at least 6 characters'); return }
    setStep(2)
  }

  const handleSubmit = (e) => {
    e.preventDefault(); setErrorMsg('')
    if (!shopName.trim())                       { setErrorMsg('Shop name is required'); return }
    if (!location?.cityId || !location?.areaId) { setErrorMsg('Select your city and area'); return }
    const lat = Number(location.lat), lng = Number(location.lng)
    if (isNaN(lat) || isNaN(lng)) { setErrorMsg('Wait for the map pin, or tap the map once.'); return }
    registerMutation.mutate(
      { name: name.trim(), phone: phone.trim(), email: email.trim(), password, shopName: shopName.trim(), businessType, city: location.city, area: location.area, street: location.street || '', latitude: lat, longitude: lng },
      {
        onSuccess: res => { if (res?.success && res?.data?.shop) { setActiveShop(res.data.shop); navigate('/dashboard') } },
        onError:   err => setErrorMsg(err.response?.data?.error || 'Registration failed'),
      }
    )
  }

  const bizHint  = getBusinessHint(businessType)
  const strength = Math.min(Math.floor(password.length / 3), 4)
  const sColors  = ['#f43f5e', '#f59e0b', '#10b981', 'rgba(255,255,255,0.7)']

  return (
    <div style={{ position: 'fixed', inset: 0, fontFamily: F, overflow: 'hidden' }}>

      {/* glitch bg */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <LetterGlitch
          glitchColors={['#0d1f17', '#1a4a35', '#2d8a6b']}
          glitchSpeed={60}
          smooth={true}
          outerVignette={true}
          centerVignette={false}
        />
      </div>

      {/* dark radial overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.78) 20%, rgba(0,0,0,0.1) 100%)' }} />

      {/* scrollable centering wrapper */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 20px' }}>
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{
            width: '100%',
            /* Step 2 has more content — wider card */
            maxWidth: step === 2 ? '580px' : '440px',
            minWidth: '255px',
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderRadius: '12px',
            padding: '32px 28px',
            margin: 'auto 0',
          }}>

          {/* logo — robotic icon, no box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '24px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'rgba(255,255,255,0.75)' }}>
              precision_manufacturing
            </span>
            <span style={{ fontFamily: F, fontWeight: 300, fontSize: '15px', color: 'rgba(255,255,255,0.85)', letterSpacing: '0.5px' }}>
              MarketPulse AI
            </span>
          </div>

          {/* heading */}
          <h1 style={{ fontFamily: F, fontWeight: 300, fontSize: '22px', color: '#fff', margin: '0 0 3px', letterSpacing: '-0.2px' }}>
            {step === 1 ? 'Create account' : 'Set up your shop'}
          </h1>
          <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.32)', margin: '0 0 18px' }}>
            {step === 1 ? 'Step 1 of 2 — Personal details' : 'Step 2 of 2 — Shop information'}
          </p>

          {/* progress bar */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '2px', borderRadius: '1px', background: 'rgba(255,255,255,0.5)' }} />
            <div style={{ flex: 1, height: '2px', borderRadius: '1px', transition: 'background 0.4s', background: step >= 2 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* error */}
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 11px', borderRadius: '6px', marginBottom: '14px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#f43f5e' }}>error</span>
              <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#f43f5e' }}>{errorMsg}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">

            {/* ── Step 1 ── */}
            {step === 1 && (
              <motion.form key="s1" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                onSubmit={goStep2} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                <div>
                  <Label>Full Name</Label>
                  <Input type="text" placeholder="Ahmed Khan" value={name} onChange={e => setName(e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <Label>Phone</Label>
                    <Input type="text" placeholder="+92 300 1234567" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" placeholder="you@gmail.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label>Password</Label>
                  <Input type={showPass ? 'text' : 'password'} placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)}
                    suffix={
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{showPass ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    } />
                  {password.length > 0 && (
                    <div style={{ display: 'flex', gap: '3px', marginTop: '5px' }}>
                      {[...Array(4)].map((_, i) => (
                        <div key={i} style={{ flex: 1, height: '2px', borderRadius: '1px', transition: 'background 0.3s', background: i < strength ? sColors[strength - 1] : 'rgba(255,255,255,0.08)' }} />
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', fontFamily: F, fontSize: '13px', fontWeight: 400, background: 'rgba(255,255,255,0.92)', color: '#000', border: 'none', cursor: 'pointer', marginTop: '2px', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.92)'}>
                  Continue
                </button>

                <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.3)', textAlign: 'center', margin: 0 }}>
                  Already have an account?{' '}
                  <button type="button" onClick={() => navigate('/login')}
                    style={{ fontFamily: F, fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                    Sign in
                  </button>
                </p>
              </motion.form>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <motion.form key="s2" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                <div>
                  <Label>Shop / Business Name</Label>
                  <Input type="text" placeholder="e.g. Ahmed Fashion House" value={shopName} onChange={e => setShopName(e.target.value)} />
                </div>

                {/* ── Business type — horizontal pill row ── */}
                <div>
                  <Label>Business Type</Label>
                  <div className="pill-scroll" style={{
                    display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px',
                    scrollbarWidth: 'none', msOverflowStyle: 'none',
                  }}>
                    {BUSINESS_TYPES.map(b => {
                      const active = businessType === b.id
                      return (
                        <button key={b.id} type="button" onClick={() => setBusinessType(b.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '7px 12px', borderRadius: '20px', flexShrink: 0,
                            fontFamily: F, fontSize: '12px', fontWeight: active ? 500 : 300,
                            cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
                            background: active ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${active ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.08)'}`,
                            color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                          }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '14px', color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)' }}>
                            {BIZ_ICONS[b.id] || 'storefront'}
                          </span>
                          {b.label}
                        </button>
                      )
                    })}
                  </div>
                  {bizHint && (
                    <p style={{ fontFamily: F, fontSize: '10px', fontWeight: 300, color: 'rgba(255,255,255,0.3)', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '11px' }}>info</span>{bizHint}
                    </p>
                  )}
                </div>

                {/* ── Location ── */}
                <div>
                  <Label>Shop Location</Label>
                  <ShopLocationPicker value={location} onChange={patch => setLocation(prev => ({ ...prev, ...patch }))} disabled={registerMutation.isPending} />
                </div>

                <button type="submit" disabled={registerMutation.isPending}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', fontFamily: F, fontSize: '13px', fontWeight: 400, background: 'rgba(255,255,255,0.92)', color: '#000', border: 'none', cursor: 'pointer', marginTop: '2px', opacity: registerMutation.isPending ? 0.6 : 1, transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (!registerMutation.isPending) e.currentTarget.style.background = '#fff' }}
                  onMouseLeave={e => { if (!registerMutation.isPending) e.currentTarget.style.background = 'rgba(255,255,255,0.92)' }}>
                  {registerMutation.isPending ? 'Launching...' : 'Launch MarketPulse'}
                </button>

                <button type="button" onClick={() => { setStep(1); setErrorMsg('') }}
                  style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.28)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
                  ← Back
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p style={{ fontFamily: F, fontSize: '10px', fontWeight: 300, color: 'rgba(255,255,255,0.12)', textAlign: 'center', marginTop: '20px', letterSpacing: '0.3px' }}>
            © 2025 MarketPulse AI · Free forever
          </p>
        </motion.div>
      </div>
    </div>
  )
}
