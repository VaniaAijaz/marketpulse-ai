import { NavLink } from 'react-router-dom'
import useUIStore from '../../store/useUIStore'
import useAuthStore from '../../store/useAuthStore'

const FONT = "'Inter','Segoe UI',system-ui,sans-serif"

/* ── nav — no group labels ─────────────────────────────── */
const NAV = [
  { to: '/dashboard',           label: 'Overview',     icon: 'dashboard',    end: true },
  { to: '/dashboard/users',     label: 'Customers',    icon: 'group'                   },
  { to: '/dashboard/orders',    label: 'Orders',       icon: 'receipt_long'            },
  { to: '/dashboard/payments',  label: 'Payments',     icon: 'credit_card'             },
  { to: '/dashboard/shops',     label: 'My Shops',     icon: 'storefront'              },
  { to: '/dashboard/inventory', label: 'Inventory',    icon: 'inventory_2'             },
  null, /* divider */
  { to: '/dashboard/analytics', label: 'Analytics',    icon: 'monitoring'              },
  { to: '/dashboard/ai-agent',  label: 'AI Assistant', icon: 'smart_toy'               },
  { to: '/dashboard/whatsapp',  label: 'WhatsApp',     icon: 'forum'                   },
  null, /* divider */
  { to: '/dashboard/settings',  label: 'Settings',     icon: 'settings'                },
]

export default function Sidebar() {
  const activeShop     = useAuthStore(s => s.activeShop)
  const sidebarOpen    = useUIStore(s => s.sidebarOpen)
  const w = sidebarOpen ? '240px' : '56px'

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, height: '100%',
      width: w, transition: 'width 0.2s ease',
      background: '#000000',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', flexDirection: 'column',
      zIndex: 50, fontFamily: FONT,
    }}>

      {/* ── Logo ── */}
      <div style={{
        padding: sidebarOpen ? '16px 14px 13px' : '16px 0 13px',
        display: 'flex', alignItems: 'center', gap: '9px',
        justifyContent: sidebarOpen ? 'flex-start' : 'center',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        {/* robotic icon — no box, no blue */}
        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>
          precision_manufacturing
        </span>
        {sidebarOpen && (
          <div>
            <p style={{ fontFamily: FONT, fontWeight: 500, fontSize: '13px', color: '#fff', margin: 0, lineHeight: 1.1, letterSpacing: '0.1px' }}>MarketPulse AI</p>
            <p style={{ fontFamily: FONT, fontSize: '9px', fontWeight: 300, color: 'rgba(255,255,255,0.3)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '.1em' }}>Business OS</p>
          </div>
        )}
      </div>

      {/* ── Active shop chip ── */}
      {activeShop && sidebarOpen && (
        <div style={{
          margin: '8px 10px 2px', padding: '7px 10px', borderRadius: '6px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>store</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontFamily: FONT, fontWeight: 500, fontSize: '11px', color: 'rgba(255,255,255,0.85)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeShop.name}
            </p>
            <p style={{ fontFamily: FONT, fontSize: '9px', fontWeight: 300, color: 'rgba(255,255,255,0.35)', margin: '1px 0 0', textTransform: 'capitalize' }}>
              {activeShop.businessType}
            </p>
          </div>
          {/* online dot — green, not blue */}
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
        </div>
      )}

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 8px', display: 'flex', flexDirection: 'column' }}>
        {NAV.map((item, idx) => {
          /* divider */
          if (item === null) return (
            <div key={idx} style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '5px 4px' }} />
          )

          return (
            <NavLink key={item.to} to={item.to} end={item.end}
              title={!sidebarOpen ? item.label : undefined}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center',
                gap: sidebarOpen ? '8px' : 0,
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                padding: sidebarOpen ? '7px 9px' : '8px',
                borderRadius: '6px', marginBottom: '1px',
                textDecoration: 'none', transition: 'all .12s',
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                fontFamily: FONT, fontSize: '13px',
                fontWeight: isActive ? 500 : 300,
                border: '1px solid transparent',
              })}>
              {({ isActive }) => (
                <>
                  <span className="material-symbols-outlined" style={{
                    fontSize: '17px', flexShrink: 0,
                    /* active icon: white, not blue */
                    color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                  }}>
                    {item.icon}
                  </span>
                  {sidebarOpen && (
                    <span style={{ flex: 1 }}>{item.label}</span>
                  )}
                  {/* active indicator — small white dot, not blue */}
                  {isActive && sidebarOpen && (
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
