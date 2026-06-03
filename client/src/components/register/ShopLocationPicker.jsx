import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getCities, getAreas, resolveLocation } from '../../features/location/locationAPI'

function MapController({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, zoom || 14)
  }, [center, zoom, map])
  return null
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

const FALLBACK_LOCATIONS = {
  karachi: {
    label: 'Karachi',
    center: { lat: 24.8607, lng: 67.0011 },
    areas: [
      { id: 'saddar', name: 'Saddar', lat: 24.8546, lng: 67.0202 },
      { id: 'gulshan', name: 'Gulshan-e-Iqbal', lat: 24.9142, lng: 67.0822 },
      { id: 'clifton', name: 'Clifton', lat: 24.8138, lng: 67.0299 },
      { id: 'north-nazimabad', name: 'North Nazimabad', lat: 24.9361, lng: 67.0369 },
      { id: 'korangi', name: 'Korangi', lat: 24.8185, lng: 67.1396 },
      { id: 'malir', name: 'Malir', lat: 24.8924, lng: 67.1981 },
      { id: 'gulistan-e-jauhar', name: 'Gulistan-e-Jauhar', lat: 24.9038, lng: 67.1146 },
      { id: 'defence', name: 'DHA / Defence', lat: 24.7948, lng: 67.0588 },
    ],
  },
  lahore: {
    label: 'Lahore',
    center: { lat: 31.5204, lng: 74.3587 },
    areas: [
      { id: 'gulberg', name: 'Gulberg', lat: 31.5204, lng: 74.3587 },
      { id: 'model-town', name: 'Model Town', lat: 31.4836, lng: 74.3256 },
      { id: 'johar-town', name: 'Johar Town', lat: 31.4697, lng: 74.2728 },
      { id: 'dha-lahore', name: 'DHA Lahore', lat: 31.4675, lng: 74.4111 },
      { id: 'wapda-town', name: 'Wapda Town', lat: 31.4422, lng: 74.2676 },
      { id: 'ichra', name: 'Ichhra', lat: 31.5336, lng: 74.3185 },
    ],
  },
  islamabad: {
    label: 'Islamabad',
    center: { lat: 33.6844, lng: 73.0479 },
    areas: [
      { id: 'g8', name: 'G-8', lat: 33.6973, lng: 73.0515 },
      { id: 'g9', name: 'G-9', lat: 33.6996, lng: 73.0362 },
      { id: 'f10', name: 'F-10', lat: 33.6919, lng: 73.0145 },
      { id: 'blue-area', name: 'Blue Area', lat: 33.7104, lng: 73.0587 },
      { id: 'rawalpindi-saddar', name: 'Rawalpindi Saddar', lat: 33.5973, lng: 73.0479 },
      { id: 'bahria-town', name: 'Bahria Town Phase 7', lat: 33.5219, lng: 73.1187 },
    ],
  },
  rawalpindi: {
    label: 'Rawalpindi',
    center: { lat: 33.5651, lng: 73.0169 },
    areas: [
      { id: 'saddar-rwp', name: 'Saddar', lat: 33.5973, lng: 73.0479 },
      { id: 'satellite-town', name: 'Satellite Town', lat: 33.6374, lng: 73.0622 },
      { id: 'chaklala', name: 'Chaklala', lat: 33.6007, lng: 73.1015 },
    ],
  },
  faisalabad: {
    label: 'Faisalabad',
    center: { lat: 31.4504, lng: 73.135 },
    areas: [
      { id: 'd-ground', name: 'D Ground', lat: 31.4187, lng: 73.0791 },
      { id: 'kohinoor', name: 'Kohinoor City', lat: 31.4365, lng: 73.1182 },
    ],
  },
  multan: {
    label: 'Multan',
    center: { lat: 30.1575, lng: 71.5249 },
    areas: [
      { id: 'gulgasht', name: 'Gulgasht Colony', lat: 30.1833, lng: 71.45 },
      { id: 'cantt', name: 'Cantt', lat: 30.196, lng: 71.4785 },
    ],
  },
  peshawar: {
    label: 'Peshawar',
    center: { lat: 34.0151, lng: 71.5249 },
    areas: [
      { id: 'saddar-pesh', name: 'Saddar', lat: 34.0089, lng: 71.5785 },
      { id: 'university-town', name: 'University Town', lat: 33.99, lng: 71.49 },
    ],
  },
};

export default function ShopLocationPicker({ value, onChange, disabled }) {
  const [cities, setCities] = useState(() => 
    Object.entries(FALLBACK_LOCATIONS).map(([id, city]) => ({
      id,
      label: city.label,
      center: city.center,
    }))
  )
  const [areas, setAreas] = useState(() => {
    const initialCity = value?.cityId || ''
    if (initialCity && FALLBACK_LOCATIONS[initialCity]) {
      return FALLBACK_LOCATIONS[initialCity].areas
    }
    return []
  })
  const [loading, setLoading] = useState(false)
  const [street, setStreet] = useState(value?.street || '')
  const [error, setError] = useState('')

  const cityId = value?.cityId || ''
  const areaId = value?.areaId || ''
  const lat = value?.lat
  const lng = value?.lng

  useEffect(() => {
    getCities()
      .then((r) => {
        if (r.data?.data && r.data.data.length > 0) {
          setCities(r.data.data)
        }
      })
      .catch(() => {
        console.warn('Could not load cities from API, using static locations')
      })
  }, [])

  useEffect(() => {
    if (!cityId) {
      setAreas([])
      return
    }
    getAreas(cityId)
      .then((r) => {
        if (r.data?.data && r.data.data.length > 0) {
          setAreas(r.data.data)
        } else if (FALLBACK_LOCATIONS[cityId]) {
          setAreas(FALLBACK_LOCATIONS[cityId].areas)
        }
      })
      .catch(() => {
        console.warn('Could not load areas from API, using static areas')
        if (FALLBACK_LOCATIONS[cityId]) {
          setAreas(FALLBACK_LOCATIONS[cityId].areas)
        }
      })
  }, [cityId])

  /** Parent should merge with setLocation(prev => ({ ...prev, ...patch })) */
  const emit = (patch) => onChange(patch)

  const resolve = async (payload, snapshot) => {
    const base = { ...(value || {}), ...(snapshot || {}) }
    setLoading(true)
    setError('')
    try {
      const res = await resolveLocation(payload)
      const d = res.data?.data
      if (d) {
        emit({
          cityId: payload.cityId ?? base.cityId,
          areaId: payload.areaId ?? base.areaId,
          city: d.city ?? base.city,
          area: d.area ?? base.area,
          street: payload.street ?? base.street ?? street,
          lat: d.lat,
          lng: d.lng,
          displayName: d.displayName,
        })
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Location lookup failed')
      // Keep city/area selection even if geocode fails
      if (snapshot) emit(snapshot)
    } finally {
      setLoading(false)
    }
  }

  const handleCity = (id) => {
    const city = cities.find((c) => c.id === id)
    const next = {
      cityId: id,
      areaId: '',
      city: city?.label,
      area: '',
      street: '',
      lat: city?.center?.lat,
      lng: city?.center?.lng,
      displayName: city?.label,
    }
    setStreet('')
    emit(next)

    // Immediately pre-populate areas from fallback list
    if (id && FALLBACK_LOCATIONS[id]) {
      setAreas(FALLBACK_LOCATIONS[id].areas)
    } else {
      setAreas([])
    }
  }

  const handleArea = (id) => {
    if (!id) return
    const area = areas.find((a) => a.id === id)
    const next = {
      cityId,
      areaId: id,
      area: area?.name,
      lat: area?.lat,
      lng: area?.lng,
      displayName: area ? `${area.name}, ${value?.city || ''}` : undefined,
    }
    emit(next)
    resolve({ cityId, areaId: id }, { ...baseFromValue(), ...next })
  }

  const baseFromValue = () => ({
    cityId: value?.cityId,
    areaId: value?.areaId,
    city: value?.city,
    area: value?.area,
    street: value?.street,
    lat: value?.lat,
    lng: value?.lng,
    displayName: value?.displayName,
  })

  const handleMapPick = (pickLat, pickLng) => {
    const next = { lat: pickLat, lng: pickLng }
    emit(next)
    resolve({ lat: pickLat, lng: pickLng }, { ...baseFromValue(), ...next })
  }

  const handleStreetBlur = () => {
    if (cityId && areaId && street.trim()) {
      const next = { street: street.trim() }
      emit(next)
      resolve({ cityId, areaId, street: street.trim() }, { ...baseFromValue(), ...next })
    }
  }

  const mapCenter = lat != null && lng != null ? [lat, lng] : [24.8607, 67.0011]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-on-surface-variant font-semibold mb-1.5">City</label>
          <select
            value={cityId}
            disabled={disabled}
            onChange={(e) => handleCity(e.target.value)}
            className="w-full p-3 rounded-xl text-[13px] bg-[#060e20] border border-white/10 text-white focus:border-secondary"
          >
            <option value="" className="bg-[#0b1326] text-white">Select city</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#0b1326] text-white">{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-on-surface-variant font-semibold mb-1.5">Area / Neighborhood</label>
          <select
            value={areaId}
            disabled={disabled || !cityId}
            onChange={(e) => handleArea(e.target.value)}
            className="w-full p-3 rounded-xl text-[13px] bg-[#060e20] border border-white/10 text-white focus:border-secondary disabled:opacity-50"
          >
            <option value="" className="bg-[#0b1326] text-white">Select area</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id} className="bg-[#0b1326] text-white">{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-on-surface-variant font-semibold mb-1.5">
          Street / Landmark <span className="text-on-surface-variant/50">(optional, refines pin)</span>
        </label>
        <input
          value={street}
          disabled={disabled || !areaId}
          onChange={(e) => setStreet(e.target.value)}
          onBlur={handleStreetBlur}
          placeholder="e.g. Main Bazaar, Block 5, near mosque"
          className="w-full p-3 rounded-xl text-[13px] bg-black/20 border border-white/10 text-white placeholder:text-on-surface-variant/40 focus:border-secondary"
        />
      </div>

      <div className="rounded-xl overflow-hidden border border-white/10 h-[220px] relative z-0">
        {loading && (
          <div className="absolute inset-0 z-[500] bg-black/50 flex items-center justify-center text-[11px] text-white">
            Locating...
          </div>
        )}
        <MapContainer
          key={`${cityId}-${areaId}`}
          center={mapCenter}
          zoom={13}
          className="h-full w-full"
          scrollWheelZoom={!disabled}
        >
          <TileLayer
            attribution="&copy; OSM"
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapController center={mapCenter} zoom={areaId ? 14 : 11} />
          {!disabled && <MapClickHandler onPick={handleMapPick} />}
          {lat != null && lng != null && (
            <CircleMarker
              center={[lat, lng]}
              radius={12}
              pathOptions={{ color: '#00d4ff', fillColor: '#00d4ff', fillOpacity: 0.9, weight: 2 }}
            />
          )}
        </MapContainer>
      </div>

      <p className="text-[10px] text-on-surface-variant">
        Select city and area, or tap the map. Coordinates fill automatically.
      </p>

      {cityId && areaId && (
        <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-[10px] text-on-surface-variant">
          Selected: <span className="text-white">{value?.area}, {value?.city}</span>
        </div>
      )}

      {lat != null && lng != null && (
        <div className="p-2.5 rounded-lg bg-secondary/10 border border-secondary/25 text-[11px]">
          <span className="text-secondary font-semibold">Pin: </span>
          <span className="text-white">{value?.displayName || `${value?.area}, ${value?.city}`}</span>
          <span className="text-on-surface-variant font-mono block mt-1">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        </div>
      )}

      {error && <p className="text-[11px] text-error">{error}</p>}
    </div>
  )
}
