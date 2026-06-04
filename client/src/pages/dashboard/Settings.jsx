import { useState } from 'react'
import { motion } from 'framer-motion'
import { useProfile, useUpdateProfile } from '../../features/auth/authHooks'
import useAuthStore from '../../store/useAuthStore'

/* ─── Design tokens ─────────────────────────────────────── */
const F    = "'Inter','Segoe UI',system-ui,sans-serif"
const CARD = '#000000'

const C = {
  blue:    '#3b82f6',
  violet:  '#8b5cf6',
  emerald: '#10b981',
  cyan:    '#06b6d4',
  rose:    '#f43f5e',
  amber:   '#f59e0b',
}

/* ══════════════════════════════════════════════════════════
   SECTION WRAPPER
══════════════════════════════════════════════════════════ */
function Section({ title, icon, accentColor = C.blue, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: CARD, border: '1px solid rgba(255,255,255,0.09)', borderRadius: '6px', overflow: 'hidden' }}>
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '15px', color: accentColor }}>{icon}</span>
        <span style={{ fontFamily: F, fontWeight: 600, fontSize: '13px', color: '#fff' }}>{title}</span>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function Settings() {
  const user = useAuthStore(s => s.user)
  const activeShop = useAuthStore(s => s.activeShop)
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

  const inp = {
    width: '100%', padding: '10px 13px', borderRadius: '6px', fontFamily: F, fontSize: '13px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
    color: '#fff', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{ fontFamily: F }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontFamily: F, fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Account Settings</h2>
        <p style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.38)', marginTop: '4px' }}>
          Manage your profile and connected shop information
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>

        {/* ═══ Left Column ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ── My Profile ── */}
          <Section title="My Profile" icon="account_circle" accentColor={C.blue}>

            {/* avatar + meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '6px',
                background: `linear-gradient(135deg, ${C.blue}80, ${C.cyan}50)`,
                border: `1px solid ${C.blue}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: F, fontWeight: 800, fontSize: '24px', color: '#fff', flexShrink: 0,
              }}>
                {getInitials(user?.name)}
              </div>
              <div>
                <p style={{ fontFamily: F, fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                  {user?.name || 'Unknown User'}
                </p>
                <p style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                  {user?.phone}
                </p>
                {user?.isVerified && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', padding: '2px 8px', borderRadius: '4px', background: C.emerald + '15', border: `1px solid ${C.emerald}30` }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '11px', color: C.emerald }}>verified</span>
                    <span style={{ fontFamily: F, fontSize: '10px', fontWeight: 600, color: C.emerald }}>Verified</span>
                  </div>
                )}
              </div>
            </div>

            {/* feedback message */}
            {profileMsg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 12px', borderRadius: '6px', marginBottom: '16px',
                background: profileMsg.type === 'error' ? C.rose + '12' : C.emerald + '12',
                border: profileMsg.type === 'error' ? `1px solid ${C.rose}30` : `1px solid ${C.emerald}30`,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: profileMsg.type === 'error' ? C.rose : C.emerald }}>
                  {profileMsg.type === 'error' ? 'error' : 'check_circle'}
                </span>
                <span style={{ fontFamily: F, fontSize: '11px', color: profileMsg.type === 'error' ? C.rose : C.emerald }}>
                  {profileMsg.text}
                </span>
              </div>
            )}

            {/* form */}
            <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: F, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>
                    Your Name
                  </label>
                  <input
                    value={profileForm.name}
                    onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your name"
                    style={inp}
                    onFocus={e => e.target.style.borderColor = C.blue + '50'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: F, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="you@example.com"
                    style={inp}
                    onFocus={e => e.target.style.borderColor = C.blue + '50'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontFamily: F, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={profileForm.password}
                    onChange={e => setProfileForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Leave blank to keep"
                    style={inp}
                    onFocus={e => e.target.style.borderColor = C.blue + '50'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: F, fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={profileForm.confirmPassword}
                    onChange={e => setProfileForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Repeat new password"
                    style={inp}
                    onFocus={e => e.target.style.borderColor = C.blue + '50'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.09)'}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updateMutation.isPending}
                style={{
                  width: '100%', padding: '11px', borderRadius: '6px', fontFamily: F, fontSize: '13px', fontWeight: 600,
                  background: C.blue, color: '#fff', border: 'none', cursor: updateMutation.isPending ? 'not-allowed' : 'pointer',
                  opacity: updateMutation.isPending ? 0.65 : 1,
                  boxShadow: `0 0 16px ${C.blue}40`, transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!updateMutation.isPending) e.currentTarget.style.background = '#2563eb' }}
                onMouseLeave={e => { if (!updateMutation.isPending) e.currentTarget.style.background = C.blue }}>
                {updateMutation.isPending ? 'Saving…' : 'Save Profile'}
              </button>
            </form>
          </Section>

          {/* ── Active Shop ── */}
          <Section title="Connected Shop" icon="storefront" accentColor={C.emerald}>
            {activeShop ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 16px', borderRadius: '6px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '6px', flexShrink: 0,
                  background: `linear-gradient(135deg, ${C.emerald}70, ${C.cyan}40)`,
                  border: `1px solid ${C.emerald}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#fff' }}>storefront</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeShop.name}
                  </p>
                  <p style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize', marginTop: '2px' }}>
                    {activeShop.businessType}
                  </p>
                </div>
                <span style={{
                  fontFamily: F, fontSize: '10px', fontWeight: 600, padding: '3px 9px', borderRadius: '4px',
                  color: C.emerald, background: C.emerald + '15', border: `1px solid ${C.emerald}30`, flexShrink: 0,
                }}>Active</span>
              </div>
            ) : (
              <p style={{ fontFamily: F, fontSize: '12px', color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
                No shop selected. Choose one from the sidebar profile menu.
              </p>
            )}
          </Section>

        </div>

        {/* ═══ Right Column ═══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* ── Account Details ── */}
          <Section title="Account Info" icon="badge" accentColor={C.violet}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {[
                { label: 'User ID',        value: user?._id?.slice(-8).toUpperCase() || '—', mono: true, color: C.cyan    },
                { label: 'Phone',          value: user?.phone || '—',                        mono: true, color: C.blue    },
                { label: 'Email',          value: user?.email || 'Not set',                  mono: false, color: C.violet  },
                { label: 'Login Method',   value: user?.authProvider || 'local',             cap: true,   color: C.amber   },
                { label: 'Status',         value: user?.isActive !== false ? 'Active' : 'Inactive', cap: false, color: user?.isActive !== false ? C.emerald : C.rose },
              ].map((row, i) => (
                <div key={row.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                  <span style={{ fontFamily: F, fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
                  <span style={{
                    fontFamily: row.mono ? 'monospace' : F,
                    fontSize: '11px', fontWeight: 600, color: row.color,
                    textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textTransform: row.cap ? 'capitalize' : 'none',
                  }}>{row.value}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Quick Actions ── */}
          <Section title="Quick Actions" icon="bolt" accentColor={C.amber}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Change Password',   icon: 'lock',           color: C.amber   },
                { label: 'Logout All Devices', icon: 'devices_other', color: C.rose    },
                { label: 'Download My Data',   icon: 'download',       color: C.cyan    },
              ].map(act => (
                <button key={act.label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '6px', fontFamily: F, fontSize: '12px', fontWeight: 500,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = act.color + '30' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '15px', color: act.color }}>{act.icon}</span>
                  {act.label}
                </button>
              ))}
            </div>
          </Section>

        </div>
      </div>
    </div>
  )
}
