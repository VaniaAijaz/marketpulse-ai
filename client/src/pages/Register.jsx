import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import 'leaflet/dist/leaflet.css'
import { useRegisterWithShop } from '../features/auth/authHooks'
import ShopLocationPicker from '../components/register/ShopLocationPicker'
import { BUSINESS_TYPES, getBusinessHint } from '../lib/businessCatalog'
import useAuthStore from '../store/useAuthStore'

export default function Register() {
  const navigate = useNavigate()
  const registerMutation = useRegisterWithShop()
  const setActiveShop = useAuthStore((s) => s.setActiveShop)

  const [step, setStep] = useState(1)
  const [errorMsg, setErrorMsg] = useState('')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [shopName, setShopName] = useState('')
  const [businessType, setBusinessType] = useState('grocery')
  const [location, setLocation] = useState({})

  const goStep2 = (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (!name.trim()) { setErrorMsg('Name is required'); return }
    if (!phone.trim()) { setErrorMsg('Phone is required'); return }
    if (!email.trim()) { setErrorMsg('Gmail / email is required — one shop per email'); return }
    if (!password) { setErrorMsg('Password is required'); return }
    setStep(2)
  }

  const handleRegisterShop = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (!shopName.trim()) { setErrorMsg('Shop name is required'); return }
    const cityId = location?.cityId
    const areaId = location?.areaId
    if (!cityId || !areaId) {
      setErrorMsg('Select your city and area where the shop is located')
      return
    }
    const lat = Number(location.lat)
    const lng = Number(location.lng)
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setErrorMsg('Wait for the map pin to load after selecting your area, or tap the map once.')
      return
    }

    registerMutation.mutate(
      {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        shopName: shopName.trim(),
        businessType,
        city: location.city,
        area: location.area,
        street: location.street || '',
        latitude: lat,
        longitude: lng,
      },
      {
        onSuccess: (res) => {
          if (res?.success && res?.data?.shop) {
            setActiveShop(res.data.shop)
            navigate('/dashboard')
          }
        },
        onError: (err) => setErrorMsg(err.response?.data?.error || 'Registration failed'),
      }
    )
  }

  const bizHint = getBusinessHint(businessType)

  return (
    <div className="landing-page-root min-h-screen flex items-center justify-center relative px-6 text-white py-10">
      {/* Background corner light reflection circles */}
      <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] bg-[#1390ff]/5 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[350px] h-[350px] bg-[#005eff]/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-lg w-full relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1390ff] to-[#005eff] flex items-center justify-center shadow-[0_0_30px_rgba(19,144,255,0.45)] mb-3 transition-transform duration-300 hover:scale-105">
            <span className="material-symbols-outlined text-white text-[28px] font-bold">storefront</span>
          </div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-white uppercase font-sora">Market Pulse AI</h1>
        </div>

        {/* Steps navigation bar */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[
            { n: 1, label: 'Account' },
            { n: 2, label: 'Your Shop' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-extrabold transition-all ${step >= s.n ? 'bg-[#1390ff] text-white shadow-[0_0_15px_rgba(19,144,255,0.5)] border border-[#1390ff]/40' : 'bg-white/5 text-white/30 border border-white/5'}`}>
                  {step > s.n ? <span className="material-symbols-outlined text-[14px] font-bold">check</span> : s.n}
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${step >= s.n ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
              </div>
              {i === 0 && <div className={`w-10 h-[2px] transition-colors duration-300 ${step >= 2 ? 'bg-[#1390ff]' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.8)]">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="s1" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }}>
                <h2 className="text-[24px] font-extrabold text-white text-center mb-1 font-sora uppercase">Create Account</h2>
                <p className="text-[12px] text-white/50 text-center mb-6">One email = one shop on Market Pulse AI OS</p>

                {errorMsg && (
                  <div className="mb-5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-[12px] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-red-400">error</span>
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={goStep2} className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-white/60 font-semibold mb-1.5 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Ahmed Khan" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="w-full p-3.5 rounded-xl text-[13px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-[#1390ff] focus:ring-1 focus:ring-[#1390ff] transition-all outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/60 font-semibold mb-1.5 uppercase tracking-wider">Phone Number</label>
                    <input 
                      type="text" 
                      placeholder="+92 300 1234567" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      className="w-full p-3.5 rounded-xl text-[13px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-[#1390ff] focus:ring-1 focus:ring-[#1390ff] transition-all outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/60 font-semibold mb-1.5 uppercase tracking-wider">Gmail / Email *</label>
                    <input 
                      type="email" 
                      required 
                      placeholder="you@gmail.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="w-full p-3.5 rounded-xl text-[13px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-[#1390ff] focus:ring-1 focus:ring-[#1390ff] transition-all outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/60 font-semibold mb-1.5 uppercase tracking-wider">Password</label>
                    <input 
                      type="password" 
                      placeholder="Create a strong password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="w-full p-3.5 rounded-xl text-[13px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-[#1390ff] focus:ring-1 focus:ring-[#1390ff] transition-all outline-none" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full py-3.5 rounded-xl bg-[#1390ff] text-white font-bold text-[14px] shadow-[0_0_20px_rgba(19,144,255,0.45)] hover:shadow-[0_0_30px_rgba(19,144,255,0.65)] hover:bg-[#0f7bcc] transition-all duration-300 active:scale-[0.98] mt-2 uppercase tracking-wider"
                  >
                    Next: Set up shop →
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="s2" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }}>
                <h2 className="text-[24px] font-extrabold text-white text-center mb-1 font-sora uppercase">Register Shop</h2>
                <p className="text-[12px] text-white/50 text-center mb-4">Business type locks AI, inventory & outreach parameters</p>

                {errorMsg && (
                  <div className="mb-5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-[12px] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-red-400">error</span>
                    {errorMsg}
                  </div>
                )}

                <form onSubmit={handleRegisterShop} className="space-y-4">
                  <div>
                    <label className="block text-[11px] text-white/60 font-semibold mb-1.5 uppercase tracking-wider">Shop / Business Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Ahmed Fashion House" 
                      value={shopName} 
                      onChange={(e) => setShopName(e.target.value)} 
                      className="w-full p-3.5 rounded-xl text-[13px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-[#1390ff] focus:ring-1 focus:ring-[#1390ff] transition-all outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/60 font-semibold mb-1.5 uppercase tracking-wider">Business Type (permanent)</label>
                    <select 
                      value={businessType} 
                      onChange={(e) => setBusinessType(e.target.value)} 
                      className="w-full p-3.5 rounded-xl text-[13px] bg-black/60 border border-white/10 text-white focus:border-[#1390ff] outline-none transition-all"
                    >
                      {BUSINESS_TYPES.map((b) => (
                        <option key={b.id} value={b.id} className="bg-black text-white">{b.label}</option>
                      ))}
                    </select>
                    {bizHint && (
                      <p className="text-[10px] text-[#1390ff] mt-1.5 flex items-start gap-1 font-medium">
                        <span className="material-symbols-outlined text-[14px] shrink-0">info</span>
                        {bizHint}
                      </p>
                    )}
                  </div>

                  <ShopLocationPicker
                    value={location}
                    onChange={(patch) => setLocation((prev) => ({ ...prev, ...patch }))}
                    disabled={registerMutation.isPending}
                  />

                  <button 
                    type="submit" 
                    disabled={registerMutation.isPending} 
                    className="w-full py-3.5 rounded-xl bg-[#1390ff] text-white font-bold text-[14px] shadow-[0_0_20px_rgba(19,144,255,0.45)] hover:shadow-[0_0_30px_rgba(19,144,255,0.65)] hover:bg-[#0f7bcc] transition-all duration-300 active:scale-[0.98] mt-2 uppercase tracking-wider"
                  >
                    {registerMutation.isPending ? 'Launching Shop...' : 'Launch Market Pulse AI OS →'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="w-full py-2 text-[11px] text-white/40 hover:text-white transition-colors text-center uppercase tracking-widest font-semibold mt-2"
                  >
                    ← Back to account details
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center mt-6">
          <button 
            onClick={() => navigate('/login')} 
            className="text-[11px] text-white/40 hover:text-white transition-colors flex items-center justify-center gap-1.5 mx-auto uppercase tracking-widest font-bold"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Already have an account? Sign In
          </button>
        </div>
      </div>
    </div>
  )
}
