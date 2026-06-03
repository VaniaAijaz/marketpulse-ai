import { useState } from 'react'
import { motion } from 'framer-motion'
import { useProfile, useUpdateProfile } from '../../features/auth/authHooks'
import useAuthStore from '../../store/useAuthStore'
import useUIStore from '../../store/useUIStore'

function Section({ title, icon, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/8 flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary text-[18px]">{icon}</span>
        <h3 className="font-bold text-[14px] text-white">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  )
}

export default function Settings() {
  const user = useAuthStore((s) => s.user)
  const activeShop = useAuthStore((s) => s.activeShop)
  const setActiveModal = useUIStore((s) => s.setActiveModal)
  const updateMutation = useUpdateProfile()

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
  })
  const [profileMsg, setProfileMsg] = useState(null)

  const handleProfileSave = (e) => {
    e.preventDefault()
    setProfileMsg(null)
    if (profileForm.password && profileForm.password !== profileForm.confirmPassword) {
      setProfileMsg({ type: 'error', text: 'Passwords do not match' })
      return
    }
    const payload = { name: profileForm.name, email: profileForm.email }
    if (profileForm.password) payload.password = profileForm.password
    updateMutation.mutate(payload, {
      onSuccess: () => setProfileMsg({ type: 'success', text: 'Profile updated successfully.' }),
      onError: (err) => setProfileMsg({ type: 'error', text: err.response?.data?.error || 'Update failed.' }),
    })
  }



  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[28px] font-black text-white tracking-tight">Account Settings</h2>
        <p className="text-[12px] text-on-surface-variant mt-1">Manage your profile and account settings</p>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-7 space-y-5">

          {/* Profile Card */}
          <Section title="My Profile" icon="account_circle">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/50 to-secondary/50 flex items-center justify-center font-bold text-[24px] text-white border border-secondary/20 shadow-glow">
                {getInitials(user?.name)}
              </div>
              <div>
                <p className="text-[18px] font-bold text-white">{user?.name || 'Unknown User'}</p>
                <p className="text-[12px] text-on-surface-variant font-mono">{user?.phone}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] border px-2 py-0.5 rounded-full font-bold uppercase ${
                    user?.plan === 'premium' ? 'text-tertiary border-tertiary/30 bg-tertiary/10' :
                    user?.plan === 'standard' ? 'text-primary border-primary/30 bg-primary/10' :
                    'text-outline border-outline/30'
                  }`}>{user?.plan || 'basic'} user</span>
                  {user?.isVerified && (
                    <span className="text-[10px] text-secondary border border-secondary/25 bg-secondary/10 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[11px]">verified</span>Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {profileMsg && (
              <div className={`mb-5 p-3 rounded-lg border text-[11px] flex items-center gap-2 ${
                profileMsg.type === 'error' ? 'bg-error/10 border-error/20 text-error' : 'bg-secondary/10 border-secondary/20 text-secondary'
              }`}>
                <span className="material-symbols-outlined text-[14px]">{profileMsg.type === 'error' ? 'error' : 'check_circle'}</span>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-outline uppercase tracking-wider font-semibold mb-1.5">Your Name</label>
                  <input
                    value={profileForm.name}
                    onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your name"
                    className="w-full p-3 rounded-xl text-[13px] bg-black/20 border border-white/10 text-white placeholder:text-on-surface-variant/40 focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-outline uppercase tracking-wider font-semibold mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full p-3 rounded-xl text-[13px] bg-black/20 border border-white/10 text-white placeholder:text-on-surface-variant/40 focus:border-secondary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-outline uppercase tracking-wider font-semibold mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={profileForm.password}
                    onChange={e => setProfileForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Leave blank to keep current"
                    className="w-full p-3 rounded-xl text-[13px] bg-black/20 border border-white/10 text-white placeholder:text-on-surface-variant/30 focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-outline uppercase tracking-wider font-semibold mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    value={profileForm.confirmPassword}
                    onChange={e => setProfileForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Repeat new password"
                    className="w-full p-3 rounded-xl text-[13px] bg-black/20 border border-white/10 text-white placeholder:text-on-surface-variant/30 focus:border-secondary"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-surface font-bold text-[12px] shadow-glow hover:shadow-[0_0_25px_rgba(0,212,255,0.5)] transition-all active:scale-95 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save My Profile'}
              </button>
            </form>
          </Section>

          {/* Active Shop Info */}
          <Section title="Active Shop" icon="storefront">
            {activeShop ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-secondary/5 rounded-xl border border-secondary/20">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-surface text-[22px]">storefront</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-[15px]">{activeShop.name}</p>
                    <p className="text-[11px] text-on-surface-variant capitalize">{activeShop.businessType} Â· {activeShop.plan || 'basic'} plan</p>
                  </div>
                  <span className="text-[9px] bg-secondary/15 text-secondary border border-secondary/30 px-2 py-1 rounded-full font-bold uppercase">Active</span>
                </div>
                <button
                  onClick={() => setActiveModal('upgrade-plan')}
                  className="w-full py-2.5 rounded-xl border border-secondary/25 text-secondary text-[12px] font-bold hover:bg-secondary/10 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                  Upgrade Shop Plan
                </button>
              </div>
            ) : (
              <p className="text-[12px] text-on-surface-variant italic">No active shop selected. Choose one from the sidebar profile menu.</p>
            )}
          </Section>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-5 space-y-5">

          {/* Account Info */}
          <Section title="Account Details" icon="badge">
            <div className="space-y-3">
              {[
                { label: 'User ID', value: user?._id || 'â€”', mono: true },
                { label: 'Phone', value: user?.phone || 'â€”', mono: true },
                { label: 'Login Method', value: user?.authProvider || 'local', capitalize: true },
                { label: 'Plan', value: user?.plan || 'basic', capitalize: true },
                { label: 'Account Status', value: user?.isActive ? 'Active' : 'Inactive' },
              ].map(row => (
                <div key={row.label} className="flex items-start justify-between py-2 border-b border-white/5">
                  <span className="text-[11px] text-on-surface-variant">{row.label}</span>
                  <span className={`text-[11px] text-white font-medium max-w-[60%] text-right truncate ${row.mono ? 'font-mono' : ''} ${row.capitalize ? 'capitalize' : ''}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
