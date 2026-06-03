import { NavLink } from 'react-router-dom'
import useUIStore from '../../store/useUIStore'
import useAuthStore from '../../store/useAuthStore'

const FONT = "'Inter','Segoe UI',system-ui,sans-serif"

const NAV = [
  {
    group: 'Business',
    links: [
      { to: '/dashboard',           label: 'Overview',   icon: 'dashboard',     end: true },
      { to: '/dashboard/users',     label: 'Customers',  icon: 'group'                    },
      { to: '/dashboard/orders',    label: 'Orders',     icon: 'receipt_long'             },
      { to: '/dashboard/payments',  label: 'Payments',   icon: 'credit_card'              },
      { to: '/dashboard/shops',     label: 'My Shops',   icon: 'storefront'               },
      { to: '/dashboard/inventory', label: 'Inventory',  icon: 'inventory_2'              },
    ],
  },
  {
    group: 'AI Tools',
    links: [
      { to: '/dashboard/analytics', label: 'Analytics',    icon: 'monitoring'  },
      { to: '/dashboard/ai-agent',  label: 'AI Assistant', icon: 'smart_toy'   },
      { to: '/dashboard/whatsapp',  label: 'WhatsApp',     icon: 'forum'       },
    ],
  },
  {
    group: 'Account',
    links: [
      { to: '/dashboard/settings', label: 'Settings', icon: 'settings' },
    ],
  },
]

export default function Sidebar() {
  const activeShop    = useAuthStore((s) => s.activeShop)
  const setActiveModal = useUIStore((s) => s.setActiveModal)
  const sidebarOpen   = useUIStore((s) => s.sidebarOpen)
  const w = sidebarOpen ? '240px' : '56px'

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, height: '100%',
      width: w, transition: 'width 0.2s ease',
      background: '#000000',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', flexDirection: 'column',
      zIndex: 50, fontFamily: FONT,
      transform: sidebarOpen ? 'none' : undefined,
    }}>

      {/* Logo */}
      <div style={{ padding: sidebarOpen ? '18px 16px 14px' : '18px 0 14px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: sidebarOpen ? 'flex-start' : 'center', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#fff' }}>storefront</span>
        </div>
        {sidebarOpen && (
          <div>
            <p style={{ fontFamily: FONT, fontWeight: 800, fontSize: '14px', color: '#fff', margin: 0, lineHeight: 1.1 }}>MarketPulse</p>
            <p style={{ fontFamily: FONT, fontSize: '9px', color: 'rgba(255,255,255,0.35)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '.12em' }}>AI Business OS</p>
          </div>
        )}
      </div>

      {/* Active shop */}
      {activeShop && sidebarOpen && (
        <div style={{ margin: '10px 10px 2px', padding: '8px 10px', borderRadius: '6px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#3b82f6' }}>store</span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '11px', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeShop.name}</p>
            <p style={{ fontFamily: FONT, fontSize: '9px', color: 'rgba(255,255,255,0.4)', margin: '1px 0 0', textTransform: 'capitalize' }}>{activeShop.businessType}</p>
          </div>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '0px' }}>
        {NAV.map((group) => (
          <div key={group.group} style={{ marginBottom: '4px' }}>
            {sidebarOpen ? (
              <p style={{ fontFamily: FONT, fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: 'rgba(255,255,255,0.28)', padding: '10px 8px 4px', margin: 0 }}>
                {group.group}
              </p>
            ) : (
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '8px 4px' }} />
            )}
            {group.links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end}
                title={!sidebarOpen ? link.label : undefined}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center',
                  gap: sidebarOpen ? '8px' : 0,
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  padding: sidebarOpen ? '7px 9px' : '8px',
                  borderRadius: '6px', marginBottom: '1px',
                  textDecoration: 'none', transition: 'all .12s',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
                  fontFamily: FONT, fontSize: '13px', fontWeight: isActive ? 600 : 400,
                  border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                })}>
                {({ isActive }) => (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: '17px', color: isActive ? '#3b82f6' : 'inherit', flexShrink: 0 }}>
                      {link.icon}
                    </span>
                    {sidebarOpen && <span>{link.label}</span>}
                    {isActive && sidebarOpen && (
                      <span style={{ marginLeft: 'auto', width: '5px', height: '5px', borderRadius: '50%', background: '#3b82f6' }} />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom: Upgrade */}
      <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        {sidebarOpen ? (
          <div style={{ padding: '12px', borderRadius: '6px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#3b82f6' }}>auto_awesome</span>
              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '12px', color: '#fff', margin: 0 }}>Upgrade Plan</p>
            </div>
            <p style={{ fontFamily: FONT, fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: '0 0 8px', lineHeight: 1.5 }}>Unlock unlimited AI & advanced features</p>
            <button onClick={() => setActiveModal('upgrade-plan')}
              style={{ width: '100%', fontFamily: FONT, fontWeight: 700, fontSize: '11px', padding: '7px', borderRadius: '5px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }}>
              View Plans
            </button>
          </div>
        ) : (
          <button onClick={() => setActiveModal('upgrade-plan')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: '#3b82f6' }}
            title="Upgrade Plan">
            <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>auto_awesome</span>
          </button>
        )}
      </div>
    </aside>
  )
}
