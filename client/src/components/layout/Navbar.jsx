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

const NOTIF_ICONS = {
  stock_low:   { icon: 'warning',      color: '#f59e0b' },
  stock_out:   { icon: 'report',       color: '#f43f5e' },
  order:       { icon: 'shopping_cart', color: '#3b82f6' },
  payment:     { icon: 'payments',     color: '#10b981' },
  default:     { icon: 'notifications', color: '#6b7280' },
}

export default function Navbar() {
  const navigate       = useNavigate()
  const user           = useAuthStore((s) => s.user)
  const activeShop     = useAuthStore((s) => s.activeShop)
  const setActiveShop  = useAuthStore((s) => s.setActiveShop)
  const logout         = useAuthStore((s) => s.logout)
  const shops          = useAppStore((s) => s.shops)
  const notifications  = useUIStore((s) => s.notifications)
  const markNotificationsRead = useUIStore((s) => s.markNotificationsRead)
  const clearNotifications    = useUIStore((s) => s.clearNotifications)
  const sidebarOpen    = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar  = useUIStore((s) => s.toggleSidebar)

  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen]     = useState(false)
  const profileRef = useRef(null)
  const notifRef   = useRef(null)

  useClickOutside(profileRef, () => setProfileOpen(false))
  useClickOutside(notifRef,   () => setNotifOpen(false))

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const unread   = notifications.filter(n => !n.read).length

  const handleOpenNotif = () => {
    setNotifOpen(v => !v)
    setProfileOpen(false)
    if (!notifOpen) setTimeout(() => markNotificationsRead(), 1500)
  }

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
        <button onClick={toggleSidebar}
          style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '5px', background: 'none', border: '1px solid transparent', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', transition: 'all .12s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>{sidebarOpen ? 'menu_open' : 'menu'}</span>
        </button>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} className="hidden sm:flex">
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '9px', fontSize: '15px', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>search</span>
          <input placeholder="Search customers, orders..."
            style={{ height: '32px', width: '220px', paddingLeft: '32px', paddingRight: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', fontFamily: FONT, fontSize: '12px', color: '#fff', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button onClick={handleOpenNotif}
            style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '5px', background: 'none', border: '1px solid transparent', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', position: 'relative', transition: 'all .12s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>notifications</span>
            {unread > 0 && (
              <span style={{ position: 'absolute', top: '5px', right: '5px', width: '7px', height: '7px', background: '#f43f5e', borderRadius: '50%', border: '1.5px solid #000' }} />
            )}
          </button>

          {notifOpen && (
            <div style={{ position: 'absolute', top: '40px', right: 0, width: '320px', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,.8)', zIndex: 50 }}>
              {/* header */}
              <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '12px', color: '#fff', margin: 0 }}>Notifications</p>
                  {unread > 0 && (
                    <span style={{ fontFamily: FONT, fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '3px', background: 'rgba(244,63,94,0.15)', color: '#f43f5e' }}>{unread}</span>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button onClick={clearNotifications}
                    style={{ fontFamily: FONT, fontSize: '10px', color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
                    Clear all
                  </button>
                )}
              </div>

              {/* list */}
              <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'rgba(255,255,255,0.1)', display: 'block', marginBottom: '6px' }}>notifications_off</span>
                    <p style={{ fontFamily: FONT, fontSize: '11px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>No notifications</p>
                  </div>
                ) : notifications.map(n => {
                  const cfg = NOTIF_ICONS[n.type] || NOTIF_ICONS.default
                  return (
                    <div key={n.id} style={{
                      padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      background: n.read ? 'transparent' : 'rgba(255,255,255,0.025)',
                    }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '5px', background: cfg.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '13px', color: cfg.color }}>{cfg.icon}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: FONT, fontSize: '11px', color: n.read ? 'rgba(255,255,255,0.45)' : '#fff', lineHeight: 1.5, margin: 0 }}>{n.text}</p>
                        {n.ts && (
                          <p style={{ fontFamily: FONT, fontSize: '9px', color: 'rgba(255,255,255,0.25)', margin: '3px 0 0' }}>
                            {new Date(n.ts).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      {!n.read && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f43f5e', flexShrink: 0, marginTop: '5px' }} />}
                    </div>
                  )
                })}
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
            <div style={{ width: '28px', height: '28px', borderRadius: '5px', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, fontSize: '11px', color: '#3b82f6', flexShrink: 0 }}>
              {initials}
            </div>
            <div className="hidden lg:block" style={{ textAlign: 'left' }}>
              <p style={{ fontFamily: FONT, fontWeight: 600, fontSize: '12px', color: '#fff', margin: 0, lineHeight: 1.2 }}>{user?.name || 'User'}</p>
              <p style={{ fontFamily: FONT, fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: '1px 0 0' }}>{activeShop?.name || 'No shop'}</p>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>expand_more</span>
          </button>

          {profileOpen && (
            <div style={{ position: 'absolute', top: '44px', right: 0, width: '220px', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', boxShadow: '0 16px 48px rgba(0,0,0,.7)', zIndex: 50 }}>
              <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '4px' }}>
                <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '13px', color: '#fff', margin: 0 }}>{user?.name || 'User'}</p>
                <p style={{ fontFamily: FONT, fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>{user?.phone}</p>
              </div>

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
