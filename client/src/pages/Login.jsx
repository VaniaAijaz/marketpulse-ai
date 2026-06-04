import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLogin, useVerifyOTP } from '../features/auth/authHooks'
import LetterGlitch from '../components/ui/LetterGlitch'

const F = "'Inter','Segoe UI',system-ui,sans-serif"

/* ── input ───────────────────────────────────────────── */
function Input({ type = 'text', placeholder, value, onChange, suffix, mono }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={type} placeholder={placeholder} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '9px 12px', paddingRight: suffix ? '40px' : '12px',
          borderRadius: '6px', fontFamily: mono ? 'monospace' : F,
          fontWeight: 300, fontSize: '13px', outline: 'none', boxSizing: 'border-box',
          background: focused ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.09)'}`,
          color: '#fff', transition: 'all 0.15s',
          backdropFilter: 'blur(6px)',
        }}
      />
      {suffix && (
        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
          {suffix}
        </div>
      )}
    </div>
  )
}

function Label({ children }) {
  return (
    <p style={{ fontFamily: F, fontSize: '11px', fontWeight: 400, color: 'rgba(255,255,255,0.5)', margin: '0 0 5px', letterSpacing: '0.01em' }}>
      {children}
    </p>
  )
}

function SegControl({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '2px', padding: '3px', borderRadius: '7px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {options.map(o => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          style={{
            flex: 1, padding: '7px 0', borderRadius: '5px', fontFamily: F,
            fontSize: '12px', fontWeight: value === o.v ? 500 : 400,
            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            background: value === o.v ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: value === o.v ? '#fff' : 'rgba(255,255,255,0.35)',
          }}>
          {o.l}
        </button>
      ))}
    </div>
  )
}

export default function Login() {
  const navigate          = useNavigate()
  const loginMutation     = useLogin()
  const verifyOTPMutation = useVerifyOTP()

  const [loginMode, setLoginMode] = useState('password')
  const [loginWith, setLoginWith] = useState('email')
  const [phone, setPhone]         = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [otp, setOtp]             = useState('')
  const [errorMsg, setErrorMsg]   = useState('')
  const [showPass, setShowPass]   = useState(false)

  const handleLogin = (e) => {
    e.preventDefault(); setErrorMsg('')
    if (loginMode === 'password') {
      if (loginWith === 'email' && !email.trim()) { setErrorMsg('Email is required'); return }
      if (loginWith === 'phone' && !phone.trim()) { setErrorMsg('Phone is required'); return }
      const creds = loginWith === 'email' ? { email: email.trim(), password } : { phone, password }
      loginMutation.mutate(creds, {
        onSuccess: res => { if (res.success) navigate('/dashboard'); else setErrorMsg(res.error || 'Invalid credentials') },
        onError:   err => setErrorMsg(err.response?.data?.error || 'Login failed'),
      })
    } else {
      if (!phone.trim()) { setErrorMsg('Phone is required'); return }
      setLoginMode('otp-verify')
    }
  }

  const handleVerifyOTP = (e) => {
    e.preventDefault(); setErrorMsg('')
    if (!otp) { setErrorMsg('Please enter the OTP'); return }
    verifyOTPMutation.mutate({ phone, otp }, {
      onSuccess: res => { if (res.success) navigate('/dashboard'); else setErrorMsg(res.error || 'Invalid OTP') },
      onError:   err => setErrorMsg(err.response?.data?.error || 'OTP verification failed'),
    })
  }

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

      {/* center dark radial */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.78) 25%, rgba(0,0,0,0.1) 100%)' }} />

      {/* centered card */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{
            width: '100%', maxWidth: '380px', minWidth: '255px',
            /* no border, no bg box — just blur + very subtle bg */
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderRadius: '12px',
            padding: '36px 30px',
            /* no border */
          }}>

          {/* logo — robotic icon, no box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '28px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'rgba(255,255,255,0.75)' }}>
              precision_manufacturing
            </span>
            <span style={{ fontFamily: F, fontWeight: 300, fontSize: '15px', color: 'rgba(255,255,255,0.85)', letterSpacing: '0.5px' }}>
              MarketPulse AI
            </span>
          </div>

          {/* heading */}
          <h1 style={{ fontFamily: F, fontWeight: 300, fontSize: '24px', color: '#fff', margin: '0 0 4px', letterSpacing: '-0.2px' }}>
            Sign in
          </h1>
          <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.35)', margin: '0 0 24px' }}>
            Enter your credentials to continue
          </p>

          {/* error */}
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 11px', borderRadius: '6px', marginBottom: '16px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#f43f5e' }}>error</span>
              <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: '#f43f5e' }}>{errorMsg}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {loginMode !== 'otp-verify' ? (
              <motion.form key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>

                <SegControl
                  options={[{ v: 'password', l: 'Password' }, { v: 'otp-request', l: 'OTP' }]}
                  value={loginMode} onChange={v => { setLoginMode(v); setErrorMsg('') }} />

                {loginMode === 'password' && (
                  <SegControl
                    options={[{ v: 'email', l: 'Email' }, { v: 'phone', l: 'Phone' }]}
                    value={loginWith} onChange={setLoginWith} />
                )}

                <div>
                  <Label>{loginMode === 'password' && loginWith === 'email' ? 'Email' : 'Phone Number'}</Label>
                  {loginMode === 'password' && loginWith === 'email'
                    ? <Input type="email" placeholder="you@gmail.com" value={email} onChange={e => setEmail(e.target.value)} />
                    : <Input type="text"  placeholder="+92 300 1234567" value={phone} onChange={e => setPhone(e.target.value)} />
                  }
                </div>

                {loginMode === 'password' && (
                  <div>
                    <Label>Password</Label>
                    <Input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      suffix={
                        <button type="button" onClick={() => setShowPass(v => !v)}
                          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                            {showPass ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      }
                    />
                  </div>
                )}

                {/* submit */}
                <button type="submit" disabled={loginMutation.isPending}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '6px', fontFamily: F,
                    fontSize: '13px', fontWeight: 400, letterSpacing: '0.2px',
                    background: 'rgba(255,255,255,0.92)', color: '#000',
                    border: 'none', cursor: 'pointer',
                    opacity: loginMutation.isPending ? 0.6 : 1,
                    transition: 'opacity 0.15s, background 0.15s',
                  }}
                  onMouseEnter={e => { if (!loginMutation.isPending) e.currentTarget.style.background = '#fff' }}
                  onMouseLeave={e => { if (!loginMutation.isPending) e.currentTarget.style.background = 'rgba(255,255,255,0.92)' }}>
                  {loginMutation.isPending ? 'Signing in...' : loginMode === 'password' ? 'Sign in' : 'Send OTP'}
                </button>

                {/* divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                  <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.2)' }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                </div>

                {/* register */}
                <button type="button" onClick={() => navigate('/register')}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '6px', fontFamily: F,
                    fontSize: '13px', fontWeight: 300,
                    background: 'transparent', color: 'rgba(255,255,255,0.55)',
                    border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}>
                  Create an account
                </button>
              </motion.form>

            ) : (
              <motion.form key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
                <div style={{ padding: '9px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <p style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                    OTP sent to <span style={{ color: '#fff' }}>{phone}</span>. Demo:{' '}
                    <span style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.8)' }}>1234</span>
                  </p>
                </div>
                <div>
                  <Label>OTP Code</Label>
                  <Input type="text" placeholder="4-digit code" value={otp} onChange={e => setOtp(e.target.value)} mono />
                </div>
                <button type="submit" disabled={verifyOTPMutation.isPending}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', fontFamily: F, fontSize: '13px', fontWeight: 400, background: 'rgba(255,255,255,0.92)', color: '#000', border: 'none', cursor: 'pointer', opacity: verifyOTPMutation.isPending ? 0.6 : 1 }}>
                  {verifyOTPMutation.isPending ? 'Verifying...' : 'Verify & sign in'}
                </button>
                <button type="button" onClick={() => { setLoginMode('otp-request'); setErrorMsg('') }}
                  style={{ fontFamily: F, fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
                  ← Back
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p style={{ fontFamily: F, fontSize: '10px', fontWeight: 300, color: 'rgba(255,255,255,0.12)', textAlign: 'center', marginTop: '24px', letterSpacing: '0.3px' }}>
            © 2025 MarketPulse AI · Free forever
          </p>
        </motion.div>
      </div>
    </div>
  )
}
