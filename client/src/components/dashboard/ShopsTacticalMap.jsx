import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import useAuthStore from '../../store/useAuthStore'
import api from '../../lib/axios'

const DEFAULT_CENTER = [24.8607, 67.0011]
const DEFAULT_ZOOM   = 14

// Place type config — icon + color
const PLACE_CONFIG = {
  school:     { color: '#ffb95f', label: 'School',     icon: '🏫' },
  university: { color: '#a3e635', label: 'University', icon: '🎓' },
  office:     { color: '#00d4ff', label: 'Office',     icon: '🏢' },
  hospital:   { color: '#f43f5e', label: 'Hospital',   icon: '🏥' },
  restaurant: { color: '#fb923c', label: 'Restaurant', icon: '🍽️' },
  shop:       { color: '#c084fc', label: 'Shop',       icon: '🛍️' },
}

function getShopLatLng(shop) {
  const c = shop?.location?.coordinates
  if (!c || c.length < 2) return null
  const lng = Number(c[0]), lat = Number(c[1])
  if (isNaN(lat) || isNaN(lng)) return null
  return [lat, lng]
}

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (!positions.length) return
    if (positions.length === 1) { map.setView(positions[0], DEFAULT_ZOOM); return }
    map.fitBounds(L.latLngBounds(positions), { padding: [48, 48], maxZoom: 15 })
  }, [map, positions])
  return null
}

// Fetch nearby places from Overpass via backend
async function fetchNearbyPlaces(lat, lng) {
  try {
    const radius = 1000
    const query = `[out:json][timeout:20];(node["amenity"~"school|university|hospital|restaurant"](around:${radius},${lat},${lng});node["office"](around:${radius},${lat},${lng});node["shop"](around:${radius},${lat},${lng}););out body;`
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`)
    const data = await res.json()
    const elements = data.elements || []
    const places = []
    elements.forEach(e => {
      if (!e.lat || !e.lon) return
      let type = null
      if (e.tags?.amenity === 'school')     type = 'school'
      else if (e.tags?.amenity === 'university') type = 'university'
      else if (e.tags?.amenity === 'hospital')   type = 'hospital'
      else if (e.tags?.amenity === 'restaurant') type = 'restaurant'
      else if (e.tags?.office)                   type = 'office'
      else if (e.tags?.shop)                     type = 'shop'
      if (type) places.push({ lat: e.lat, lng: e.lon, type, name: e.tags?.name || PLACE_CONFIG[type]?.label })
    })
    return places.slice(0, 60) // limit markers
  } catch { return [] }
}

export default function ShopsTacticalMap({ shops = [], isLoading }) {
  const navigate    = useNavigate()
  const activeShop  = useAuthStore((s) => s.activeShop)
  const setActiveShop = useAuthStore((s) => s.setActiveShop)
  const [nearbyPlaces, setNearbyPlaces] = useState([])
  const [loadingPlaces, setLoadingPlaces] = useState(false)
  const [showPlaces, setShowPlaces] = useState(true)

  const pins = useMemo(() =>
    shops.map(shop => ({ shop, latlng: getShopLatLng(shop) })).filter(p => p.latlng),
    [shops]
  )
  const positions = useMemo(() => pins.map(p => p.latlng), [pins])
  const center = positions[0] || DEFAULT_CENTER

  // Fetch nearby places when active shop changes
  useEffect(() => {
    if (!activeShop?.location?.coordinates) return
    const [lng, lat] = activeShop.location.coordinates
    if (!lat || !lng) return
    setLoadingPlaces(true)
    fetchNearbyPlaces(lat, lng)
      .then(places => setNearbyPlaces(places))
      .finally(() => setLoadingPlaces(false))
  }, [activeShop?._id])

  const handleSelect = (shop) => {
    setActiveShop(shop)
    navigate(`/dashboard/shops/${shop._id}`)
  }

  // Count by type
  const placeCounts = nearbyPlaces.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1
    return acc
  }, {})

  return (
    <div className="col-span-12 overflow-hidden relative"
      style={{ background: '#000000', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', minHeight: '460px' }}>
      {/* Header overlay */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 text-white drop-shadow-md">
          <span className="material-symbols-outlined text-[16px]" style={{ color: '#06b6d4' }}>map</span>
          <span style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", fontWeight: 700, fontSize: '13px', color: '#fff' }}>
            Shop &amp; Nearby Area
          </span>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', padding: '5px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '10px', fontFamily: "'Inter',system-ui,sans-serif", color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4', animation: 'pulse 2s infinite' }} />
          {isLoading ? 'Loading...' : `${pins.length} shop${pins.length !== 1 ? 's' : ''}`}
          {nearbyPlaces.length > 0 && ` · ${nearbyPlaces.length} nearby places`}
        </div>
      </div>

      {/* Toggle nearby places */}
      {nearbyPlaces.length > 0 && (
        <button
          onClick={() => setShowPlaces(v => !v)}
          style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000, padding: '5px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "'Inter',system-ui,sans-serif", fontSize: '10px', fontWeight: 600, color: showPlaces ? '#06b6d4' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
        >
          {showPlaces ? 'Hide' : 'Show'} Nearby
        </button>
      )}

      {isLoading ? (
        <div style={{ height: '460px', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '36px', height: '36px', border: '2px solid rgba(6,182,212,0.2)', borderTop: '2px solid #06b6d4', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : pins.length === 0 ? (
        <div style={{ height: '460px', background: '#050505', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '44px', color: 'rgba(255,255,255,0.08)', display: 'block', marginBottom: '12px' }}>location_off</span>
          <p style={{ fontFamily: "'Inter',system-ui,sans-serif", fontWeight: 700, fontSize: '14px', color: 'white', margin: '0 0 5px' }}>No shop coordinates yet</p>
          <p style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.4)', margin: 0, maxWidth: '260px' }}>Add a shop with latitude &amp; longitude to see it on the map.</p>
        </div>
      ) : (
        <MapContainer center={center} zoom={DEFAULT_ZOOM} className="w-full z-0" style={{ background: '#060e20', height: '460px' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <FitBounds positions={positions} />

          {/* Shop markers */}
          {pins.map(({ shop, latlng }) => {
            const isActive = activeShop?._id === shop._id
            return (
              <CircleMarker key={shop._id} center={latlng}
                radius={isActive ? 16 : 11}
                pathOptions={{ color: isActive ? '#ffffff' : '#00d4ff', weight: isActive ? 3 : 2, fillColor: isActive ? '#00d4ff' : '#7c3aed', fillOpacity: 0.9 }}
                eventHandlers={{ click: () => handleSelect(shop) }}>
                <Popup>
                  <div className="text-[12px] min-w-[140px]">
                    <p className="font-bold text-gray-900">🏪 {shop.name}</p>
                    <p className="text-gray-600 capitalize text-[11px]">{shop.businessType}</p>
                    <button type="button" onClick={() => handleSelect(shop)}
                      className="mt-2 w-full py-1.5 rounded-md bg-cyan-600 text-white text-[11px] font-semibold">
                      Open Shop →
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}

          {/* Nearby place markers */}
          {showPlaces && nearbyPlaces.map((place, i) => {
            const cfg = PLACE_CONFIG[place.type] || { color: '#ffffff', label: place.type }
            return (
              <CircleMarker key={i} center={[place.lat, place.lng]}
                radius={5}
                pathOptions={{ color: cfg.color, weight: 1.5, fillColor: cfg.color, fillOpacity: 0.7 }}>
                <Popup>
                  <div className="text-[11px]">
                    <p className="font-bold">{PLACE_CONFIG[place.type]?.icon} {place.name}</p>
                    <p className="text-gray-500 capitalize">{cfg.label}</p>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      )}

      {/* Nearby places legend */}
      {nearbyPlaces.length > 0 && showPlaces && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-black/80 backdrop-blur rounded-xl p-3 border border-white/10">
          <p className="text-[9px] text-on-surface-variant uppercase tracking-wider font-bold mb-2">Nearby (1km)</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {Object.entries(placeCounts).map(([type, count]) => {
              const cfg = PLACE_CONFIG[type]
              if (!cfg) return null
              return (
                <div key={type} className="flex items-center gap-1.5 text-[10px] text-white">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                  <span>{cfg.icon} {cfg.label}: <span className="font-bold">{count}</span></span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {loadingPlaces && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-black/80 backdrop-blur rounded-lg px-3 py-1.5 border border-white/10 text-[10px] text-secondary flex items-center gap-1.5">
          <div className="w-3 h-3 border border-secondary/30 border-t-secondary rounded-full animate-spin" />
          Loading nearby places...
        </div>
      )}
    </div>
  )
}
