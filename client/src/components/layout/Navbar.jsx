import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/useAuthStore'
import useAppStore from '../../store/useAppStore'
import useUIStore from '../../store/useUIStore'

const FONT = "'Inter','Segoe UI',system-ui,sans-serif"

function useClickOutside(ref, handler) {
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) handler() }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [ref, handler])
}

export default function Navbar() {
  const navigate       = useNavigate()
  const user           = useAuthStore((s) => s.user)
  const activeShop     = useAuthStore((s) => s.activeShop)
  const setActiveShop  = useAuthStore((s) => s.setActiveShop)
  const logout         = useAuthStore((s) => s.logout)
  const shops          = useAppStore((s) => s.shops)
  const notifications  = useUIStore((s) => s.notifications)
  const setActiveModal = useUIStore((s) => s.setActiveModal)
  const sidebarOpen    = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar  = useUIStore((s) => s.toggleSidebar)

  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen]     = useState(false)
  const profileRef = useRef(null)
  const notifRef   = useRef(null)

  useClickOutside(profileRef, () => setProfileOpen(false))
  useClickOutside(notifRef,   () => setNotifOpen(false))

  const initials  = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const unread    = notifications.filter(n => !n.read).length

  const menuBtn = (label, icon, onClick, danger = false) => (
    <button key={label} onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '5px', fontFamily: FONT, fontSize: '12px', fontWeight: 500, color: danger ? '#f43f5e' : 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer', transition: 'background .12s, color .12s', textAlign: 'left' }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(244,63,94,0.08)' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = danger ? '#f43f5e' : '#fff' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = danger ? '#f43f5e' : 'rgba(255,255,255,0.7)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{icon}</span>
      {label}
    </button>
  )

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30, height: '52px',
      background: '#000000', borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', fontFamily: FONT, flexShrink: 0,
    }}>

      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Sidebar toggle */}
        <button onClick={toggleSidebar}
          style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '5px', background: 'none', border: '1px solid transparent', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', transition: 'all .12s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>{sidebarOpen ? 'menu_open' : 'menu'}</span>
        </button>

        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} className="hidden sm:flex">
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '9px', fontSize: '15px', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>search</span>
          <input placeholder="Search customers, orders..."
            style={{ height: '32px', width: '220px', paddingLeft: '32px', paddingRight: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', fontFamily: FONT, fontSize: '12px', color: '#fff', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button onClick={() => { setNotifOpen(v => !v); setProfileOpen(false) }}
            style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '5px', background: 'none', border: '1px solid transparent', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', position: 'relative', transition: 'all .12s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>notifications</span>
            {unread > 0 && (
              <span style={{ position: 'absolute', top: '5px', right: '5px', width: '6px', height: '6px', background: '#f43f5e', borderRadius: '50%', border: '1.5px solid #000' }} />
            )}
          </button>

          {notifOpen && (
            <div style={{ position: 'absolute', top: '40px', right: 0, width: '300px', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '14px', boxShadow: '0 16px 48px rgba(0,0,0,.7)', zIndex: 50 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '12px', color: '#fff', margin: 0 }}>Notifications</p>
                {unread > 0 && <span style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'rgba(244,63,94,0.12)', color: '#f43f5e' }}>{unread} new</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '220px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{ padding: '8px 10px', borderRadius: '5px', fontSize: '11px', lineHeight: 1.5, fontFamily: FONT, background: n.read ? 'rgba(255,255,255,0.03)' : 'rgba(59,130,246,0.06)', border: `1px solid ${n.read ? 'rgba(255,255,255,0.06)' : 'rgba(59,130,246,0.15)'}`, color: n.read ? 'rgba(255,255,255,0.45)' : '#fff' }}>
                    {n.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 6px' }} />

        {/* Profile */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button onClick={() => { setProfileOpen(v => !v); setNotifOpen(false) }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '5px', background: 'none', border: '1px solid transparent', cursor: 'pointer', transition: 'all .12s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent' }}>
            {/* Avatar */}
            <div style={{ width: '28px', height: '28px', borderRadius: '5px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, fontSize: '11px', color: '#3b82f6', flexShrink: 0 }}>
              {initials}
            </div>
            <div className="hidden lg:block" style={{ textAlign: 'left' }}>
              <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: '12px', color: '#fff', margin: 0, lineHeight: 1.2 }}>{user?.name || 'User'}</p>
              <p style={{ fontFamily: FONT, fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: '1px 0 0', textTransform: 'capitalize' }}>{user?.plan || 'free'} plan</p>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>expand_more</span>
          </button>

          {profileOpen && (
            <div style={{ position: 'absolute', top: '44px', right: 0, width: '220px', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', boxShadow: '0 16px 48px rgba(0,0,0,.7)', zIndex: 50 }}>
              {/* User info */}
              <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '4px' }}>
                <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '13px', color: '#fff', margin: 0 }}>{user?.name || 'User'}</p>
                <p style={{ fontFamily: FONT, fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>{user?.phone}</p>
              </div>

              {/* Shop switcher */}
              {shops.length > 0 && (
                <div style={{ padding: '4px 0 6px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '4px' }}>
                  <p style={{ fontFamily: FONT, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,0.3)', padding: '4px 10px 6px', margin: 0 }}>Switch Shop</p>
                  {shops.map(s => (
                    <button key={s._id} onClick={() => { setActiveShop(s); setProfileOpen(false) }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '5px', fontFamily: FONT, fontSize: '12px', fontWeight: activeShop?._id === s._id ? 600 : 400, color: activeShop?._id === s._id ? '#3b82f6' : 'rgba(255,255,255,0.65)', background: activeShop?._id === s._id ? 'rgba(59,130,246,0.08)' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                      {activeShop?._id === s._id && <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#3b82f6' }}>check</span>}
                    </button>
                  ))}
                </div>
              )}

              {menuBtn('Account Settings', 'manage_accounts', () => { setProfileOpen(false); navigate('/dashboard/settings') })}
              {menuBtn('Sign Out', 'logout', () => { setProfileOpen(false); logout(); navigate('/login') }, true)}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
