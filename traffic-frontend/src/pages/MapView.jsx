import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAllIncidents } from '../api/incidentApi'
import './MapView.css'

const SEV_COLORS = {
    LOW: '#10b981',
    MEDIUM: '#f59e0b',
    HIGH: '#f97316',
    CRITICAL: '#ef4444',
}

const TYPE_ICONS = {
    ACCIDENT: '⚠', FLOOD: '◈', FIRE: '⬡',
    ROADBLOCK: '◼', CONSTRUCTION: '⚙', CONGESTION: '≡',
}

// Default city center — Bengaluru
const DEFAULT_CENTER = [12.9716, 77.5946]
const DEFAULT_ZOOM = 11

function hasValidCoords(inc) {
    return inc.latitude && inc.longitude &&
        Math.abs(inc.latitude) > 0.001 && Math.abs(inc.longitude) > 0.001 &&
        Math.abs(inc.latitude) <= 90 && Math.abs(inc.longitude) <= 180
}

function popupHtml(inc) {
    const color = SEV_COLORS[inc.severity] || '#94a3b8'
    return `
        <div style="font-family:monospace;font-size:12px;min-width:210px;color:#e2e8f0;line-height:1.5;">
            <div style="font-size:14px;font-weight:700;margin-bottom:6px;color:#f1f5f9;">${inc.title}</div>
            <div style="color:#94a3b8;font-size:11px;margin-bottom:8px;">${inc.description || ''}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
                <span style="background:${color}22;color:${color};border:1px solid ${color}66;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:700;letter-spacing:0.1em;">${inc.severity}</span>
                <span style="background:rgba(255,255,255,0.08);color:#94a3b8;border:1px solid rgba(255,255,255,0.12);padding:2px 8px;border-radius:3px;font-size:10px;">${inc.status?.replace('_',' ')}</span>
            </div>
            <div style="color:#94a3b8;font-size:11px;">📍 ${inc.location || 'Unknown location'}</div>
            <div style="color:#475569;font-size:10px;margin-top:4px;">${TYPE_ICONS[inc.incidentType] || '◉'} ${inc.incidentType} · #${inc.id}</div>
        </div>
    `
}

function LeafletMap({ withCoords, withoutCoords }) {
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const markersRef = useRef([])
    const geocacheRef = useRef({})

    useEffect(() => {
        // Inject Leaflet CSS
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link')
            link.id = 'leaflet-css'
            link.rel = 'stylesheet'
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
            document.head.appendChild(link)
        }

        const loadLeaflet = () => new Promise(resolve => {
            if (window.L) { resolve(window.L); return }
            const s = document.createElement('script')
            s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
            s.onload = () => resolve(window.L)
            document.body.appendChild(s)
        })

        loadLeaflet().then(L => {
            // Init map once
            if (mapRef.current && !mapInstanceRef.current) {
                const map = L.map(mapRef.current, {
                    center: DEFAULT_CENTER,
                    zoom: DEFAULT_ZOOM,
                    zoomControl: false,
                })
                L.control.zoom({ position: 'bottomright' }).addTo(map)
                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    attribution: '© OpenStreetMap © CARTO',
                    subdomains: 'abcd',
                    maxZoom: 20,
                }).addTo(map)
                mapInstanceRef.current = map
            }

            const map = mapInstanceRef.current
            if (!map) return

            // Clear old markers
            markersRef.current.forEach(m => m.remove())
            markersRef.current = []

            const addMarker = (inc, lat, lng) => {
                const color = SEV_COLORS[inc.severity] || '#94a3b8'
                const icon = L.divIcon({
                    className: '',
                    html: `<div style="
                        width:32px;height:32px;
                        background:${color};
                        border:2px solid rgba(255,255,255,0.4);
                        border-radius:50% 50% 50% 0;
                        transform:rotate(-45deg);
                        box-shadow:0 0 16px ${color}99;
                        display:flex;align-items:center;justify-content:center;
                    "><span style="transform:rotate(45deg);font-size:12px;line-height:1;">${TYPE_ICONS[inc.incidentType] || '●'}</span></div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -34],
                })
                const marker = L.marker([lat, lng], { icon })
                    .bindPopup(popupHtml(inc), {
                        maxWidth: 280,
                        className: 'dark-popup',
                    })
                    .addTo(map)
                markersRef.current.push(marker)
            }

            // Place incidents that have coordinates
            withCoords.forEach(inc => addMarker(inc, inc.latitude, inc.longitude))

            // Geocode incidents without coordinates via backend proxy (/api/geocode)
            // This avoids CORS — Nominatim blocks direct browser requests
            withoutCoords.forEach(async (inc) => {
                if (!inc.location) return
                const cacheKey = inc.location.toLowerCase()
                if (geocacheRef.current[cacheKey]) {
                    const { lat, lng } = geocacheRef.current[cacheKey]
                    addMarker(inc, lat, lng)
                    return
                }
                try {
                    const res = await fetch(
                        `/api/geocode?location=${encodeURIComponent(inc.location)}`
                    )
                    const data = await res.json()
                    if (data && data[0]) {
                        const lat = parseFloat(data[0].lat)
                        const lng = parseFloat(data[0].lon)
                        geocacheRef.current[cacheKey] = { lat, lng }
                        addMarker(inc, lat, lng)
                    }
                } catch {
                    // geocoding failed silently
                }
            })

            // Fit bounds if we have markers with real coords
            if (withCoords.length > 0) {
                const bounds = L.latLngBounds(withCoords.map(i => [i.latitude, i.longitude]))
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
            }
        })
    }, [withCoords, withoutCoords])

    return (
        <>
            <style>{`
                .dark-popup .leaflet-popup-content-wrapper {
                    background: #0d1526;
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 8px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.7);
                    color: #e2e8f0;
                    padding: 0;
                }
                .dark-popup .leaflet-popup-content {
                    margin: 14px 16px;
                }
                .dark-popup .leaflet-popup-tip-container .leaflet-popup-tip {
                    background: #0d1526;
                }
                .dark-popup .leaflet-popup-close-button {
                    color: #94a3b8 !important;
                    font-size: 18px !important;
                    top: 6px !important;
                    right: 8px !important;
                }
                .leaflet-container { background: #04070f; }
            `}</style>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        </>
    )
}

function MapView() {
    const [selectedSeverity, setSelectedSeverity] = useState('ALL')
    const [selectedType, setSelectedType] = useState('ALL')

    const { data: incidents = [], isLoading } = useQuery({
        queryKey: ['incidents-map'],
        queryFn: getAllIncidents,
        refetchInterval: 30000,
    })

    const filtered = incidents.filter(inc => {
        const sev = selectedSeverity === 'ALL' || inc.severity === selectedSeverity
        const typ = selectedType === 'ALL' || inc.incidentType === selectedType
        return sev && typ
    })

    const withCoords    = filtered.filter(hasValidCoords)
    const withoutCoords = filtered.filter(inc => !hasValidCoords(inc))

    return (
        <div className="map-view">
            <div className="map-header">
                <div className="map-header-left">
                    <p className="dash-eyebrow mono">COMMAND CENTER / LIVE MAP</p>
                    <h1 className="dash-title">Incident Map View</h1>
                </div>
                <div className="map-stats-row">
                    <div className="map-stat-pill">
                        <span className="msp-value mono">{withCoords.length}</span>
                        <span className="msp-label">PINNED</span>
                    </div>
                    <div className="map-stat-pill warn">
                        <span className="msp-value mono">{withoutCoords.length}</span>
                        <span className="msp-label">GEOCODING</span>
                    </div>
                    <div className="map-stat-pill crit">
                        <span className="msp-value mono">
                            {filtered.filter(i => i.severity === 'CRITICAL').length}
                        </span>
                        <span className="msp-label">CRITICAL</span>
                    </div>
                </div>
            </div>

            <div className="map-layout">
                {/* Filters */}
                <div className="map-filters">
                    <div className="filter-section">
                        <p className="filter-section-label mono">SEVERITY</p>
                        {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => (
                            <button key={s}
                                    className={`map-filter-btn ${selectedSeverity === s ? 'active' : ''}`}
                                    onClick={() => setSelectedSeverity(s)}
                            >
                                {s !== 'ALL' && <span className="mfb-dot" style={{ background: SEV_COLORS[s] }} />}
                                {s}
                            </button>
                        ))}
                    </div>
                    <div className="filter-section">
                        <p className="filter-section-label mono">TYPE</p>
                        {['ALL', 'ACCIDENT', 'FLOOD', 'FIRE', 'ROADBLOCK', 'CONSTRUCTION', 'CONGESTION'].map(t => (
                            <button key={t}
                                    className={`map-filter-btn ${selectedType === t ? 'active' : ''}`}
                                    onClick={() => setSelectedType(t)}
                            >
                                {t !== 'ALL' && <span className="mfb-icon">{TYPE_ICONS[t]}</span>}
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="map-legend">
                        <p className="filter-section-label mono">LEGEND</p>
                        {Object.entries(SEV_COLORS).map(([sev, color]) => (
                            <div key={sev} className="legend-row">
                                <div className="legend-marker" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                                <span className="legend-label mono">{sev}</span>
                            </div>
                        ))}
                        <div className="geocode-note mono">
                            📍 Incidents without coordinates are automatically geocoded by location name
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div className="map-container">
                    {isLoading ? (
                        <div className="map-placeholder">
                            <span className="loading-screen">LOADING MAP DATA...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="map-placeholder">
                            <span className="loading-screen" style={{ color: 'var(--text-dim)' }}>NO INCIDENTS TO DISPLAY</span>
                        </div>
                    ) : (
                        <LeafletMap withCoords={withCoords} withoutCoords={withoutCoords} />
                    )}
                </div>

                {/* Incident list */}
                <div className="map-incident-list">
                    <div className="mil-header">
                        <span className="panel-icon">⊕</span>
                        <span className="panel-title">All Incidents</span>
                        <span className="panel-tag mono">{filtered.length}</span>
                    </div>
                    <div className="mil-scroll">
                        {filtered.map(inc => (
                            <div key={inc.id} className={`mil-item sev-${inc.severity?.toLowerCase()}`}>
                                <div className="mil-top">
                                    <span className="mil-type-icon">{TYPE_ICONS[inc.incidentType] || '◉'}</span>
                                    <span className="mil-title">{inc.title}</span>
                                    <span className={`sev-badge ${inc.severity?.toLowerCase()}`}>{inc.severity}</span>
                                </div>
                                <div className="mil-bottom">
                                    <span className="mono mil-loc">
                                        {hasValidCoords(inc) ? '📍' : '🔍'} {inc.location}
                                    </span>
                                    <span className={`status-pill ${inc.status?.toLowerCase().replace('_', '')}`}>
                                        {inc.status?.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <p className="feed-empty mono">No incidents match filters</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MapView