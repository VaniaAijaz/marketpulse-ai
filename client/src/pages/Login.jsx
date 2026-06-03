import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLogin, useVerifyOTP } from '../features/auth/authHooks'

export default function Login() {
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const verifyOTPMutation = useVerifyOTP()

  const [loginMode, setLoginMode] = useState('password')
  const [loginWith, setLoginWith] = useState('email')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (loginMode === 'password') {
      if (loginWith === 'email' && !email.trim()) { setErrorMsg('Email is required'); return }
      if (loginWith === 'phone' && !phone.trim()) { setErrorMsg('Phone number is required'); return }
    } else if (!phone) {
      setErrorMsg('Phone number is required'); return
    }

    if (loginMode === 'password') {
      const creds = loginWith === 'email' ? { email: email.trim(), password } : { phone, password }
      loginMutation.mutate(creds, {
        onSuccess: (res) => {
          if (res.success) navigate('/dashboard')
          else setErrorMsg(res.error || 'Invalid credentials')
        },
        onError: (err) => setErrorMsg(err.response?.data?.error || 'Login failed. Make sure the server is running.'),
      })
    } else {
      setLoginMode('otp-verify')
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    if (!otp) { setErrorMsg('Please enter the OTP code'); return }
    verifyOTPMutation.mutate({ phone, otp }, {
      onSuccess: (res) => {
        if (res.success) navigate('/dashboard')
        else setErrorMsg(res.error || 'Invalid OTP')
      },
      onError: (err) => setErrorMsg(err.response?.data?.error || 'OTP verification failed'),
    })
  }

  return (
    <div className="landing-page-root min-h-screen flex items-center justify-center relative px-6 text-white py-10">
      {/* Background corner light reflection circles */}
      <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] bg-[#1390ff]/5 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[350px] h-[350px] bg-[#005eff]/5 rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1390ff] to-[#005eff] flex items-center justify-center shadow-[0_0_30px_rgba(19,144,255,0.45)] mb-3 transition-transform duration-300 hover:scale-105">
            <span className="material-symbols-outlined text-white text-[28px] font-bold">storefront</span>
          </div>
          <h1 className="font-display text-[22px] font-black tracking-tight text-white uppercase font-sora">Market Pulse AI</h1>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.8)]">
          <h2 className="text-[26px] font-extrabold text-white text-center tracking-tight font-sora uppercase">Welcome back</h2>
          <p className="text-[12px] text-white/50 text-center mt-1 mb-7">Sign in to manage your business beautifully</p>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-[12px] font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-red-400">error</span>
              {errorMsg}
            </div>
          )}

          <AnimatePresence mode="wait">
            {loginMode !== 'otp-verify' ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                {loginMode === 'password' && (
                  <div className="flex gap-2 p-1 rounded-xl bg-black/40 border border-white/10">
                    <button 
                      type="button" 
                      onClick={() => setLoginWith('email')} 
                      className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all ${loginWith === 'email' ? 'bg-[#1390ff]/20 text-[#1390ff] border border-[#1390ff]/30' : 'text-white/50 hover:text-white'}`}
                    >
                      Email
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setLoginWith('phone')} 
                      className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all ${loginWith === 'phone' ? 'bg-[#1390ff]/20 text-[#1390ff] border border-[#1390ff]/30' : 'text-white/50 hover:text-white'}`}
                    >
                      Phone
                    </button>
                  </div>
                )}

                {loginMode === 'password' && loginWith === 'email' ? (
                  <div>
                    <label className="block text-[11px] text-white/60 font-semibold mb-1.5 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3.5 rounded-xl text-[13px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-[#1390ff] focus:ring-1 focus:ring-[#1390ff] transition-all outline-none"
                    />
                  </div>
                ) : (
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
                )}

                {loginMode === 'password' && (
                  <div>
                    <label className="block text-[11px] text-white/60 font-semibold mb-1.5 uppercase tracking-wider">Password</label>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3.5 rounded-xl text-[13px] bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-[#1390ff] focus:ring-1 focus:ring-[#1390ff] transition-all outline-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full py-3.5 rounded-xl bg-[#1390ff] text-white font-bold text-[14px] shadow-[0_0_20px_rgba(19,144,255,0.45)] hover:shadow-[0_0_30px_rgba(19,144,255,0.65)] hover:bg-[#0f7bcc] transition-all duration-300 active:scale-[0.98] mt-2 uppercase tracking-wider"
                >
                  {loginMutation.isPending ? 'Signing in...' : loginMode === 'password' ? 'Sign In' : 'Send OTP'}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleVerifyOTP}
                className="space-y-4"
              >
                <div className="p-3.5 bg-[#1390ff]/10 rounded-xl border border-[#1390ff]/20 text-[#1390ff] text-[11px] text-center font-medium leading-relaxed">
                  OTP sent to <span className="font-bold text-white">{phone}</span>. Use demo code <span className="font-extrabold font-mono bg-white/20 px-1.5 py-0.5 rounded text-white">1234</span>.
                </div>
                <div>
                  <label className="block text-[11px] text-white/60 font-semibold mb-1.5 uppercase tracking-wider">Enter OTP Code</label>
                  <input
                    type="text"
                    placeholder="4-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={4}
                    className="w-full p-3.5 rounded-xl text-center text-[18px] font-mono tracking-widest bg-white/5 border border-white/10 text-white focus:border-[#1390ff] outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifyOTPMutation.isPending}
                  className="w-full py-3.5 rounded-xl bg-[#1390ff] text-white font-bold text-[14px] shadow-[0_0_20px_rgba(19,144,255,0.45)] hover:shadow-[0_0_30px_rgba(19,144,255,0.65)] hover:bg-[#0f7bcc] transition-all duration-300 active:scale-[0.98] uppercase tracking-wider"
                >
                  {verifyOTPMutation.isPending ? 'Verifying...' : 'Verify & Sign In'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setLoginMode('otp-request'); setErrorMsg('') }} 
                  className="w-full text-center text-[11px] text-white/40 hover:text-white transition-colors uppercase tracking-widest font-semibold mt-2"
                >
                  Resend OTP
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-7 pt-5 border-t border-white/10 flex items-center justify-between text-[12px]">
            {loginMode === 'password' ? (
              <button 
                type="button" 
                onClick={() => { setLoginMode('otp-request'); setErrorMsg('') }} 
                className="text-[#1390ff] font-bold hover:text-white transition-colors flex items-center gap-1.5 uppercase tracking-wide"
              >
                <span className="material-symbols-outlined text-[16px]">sms</span>
                OTP Sign In
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => { setLoginMode('password'); setErrorMsg('') }} 
                className="text-[#1390ff] font-bold hover:text-white transition-colors flex items-center gap-1.5 uppercase tracking-wide"
              >
                <span className="material-symbols-outlined text-[16px]">lock</span>
                Password Sign In
              </button>
            )}
            <button 
              type="button" 
              onClick={() => navigate('/register')} 
              className="text-[#1390ff] font-bold hover:text-white transition-colors uppercase tracking-wide"
            >
              Create Account
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <button 
            onClick={() => navigate('/')} 
            className="text-[11px] text-white/40 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto uppercase tracking-widest font-bold"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
