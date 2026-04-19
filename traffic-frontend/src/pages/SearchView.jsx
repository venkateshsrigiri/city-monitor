import { useState, useCallback, useRef } from 'react'
import { searchIncidents, searchByLocation, searchBySeverity, getAllIncidents } from '../api/incidentApi'
import IncidentCard from '../components/IncidentCard'
import './SearchView.css'

const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const TYPES = ['ACCIDENT', 'FLOOD', 'FIRE', 'ROADBLOCK', 'CONSTRUCTION', 'CONGESTION']
const STATUSES = ['REPORTED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED']

const TYPE_ICONS = {
    ACCIDENT: '⚠', FLOOD: '◈', FIRE: '⬡',
    ROADBLOCK: '◼', CONSTRUCTION: '⚙', CONGESTION: '≡',
}

function HighlightText({ text = '', query = '' }) {
    if (!query || !text) return <span>{text}</span>
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return (
        <span>
            {parts.map((p, i) =>
                p.toLowerCase() === query.toLowerCase()
                    ? <mark key={i} className="search-highlight">{p}</mark>
                    : <span key={i}>{p}</span>
            )}
        </span>
    )
}

function SearchResultRow({ incident, query }) {
    const sev = incident.severity?.toLowerCase()
    const stat = incident.status?.toLowerCase().replace('_', '')

    return (
        <div className={`result-row sev-left-${sev}`}>
            <div className="rr-icon">{TYPE_ICONS[incident.incidentType] || '◉'}</div>
            <div className="rr-main">
                <div className="rr-top">
                    <span className="rr-title">
                        <HighlightText text={incident.title} query={query} />
                    </span>
                    <span className={`sev-badge ${sev}`}>{incident.severity}</span>
                    <span className={`status-pill ${stat === 'in_progress' ? 'in_progress' : stat}`}>
                        {incident.status?.replace('_', ' ')}
                    </span>
                </div>
                <div className="rr-desc">
                    <HighlightText text={incident.description} query={query} />
                </div>
                <div className="rr-meta mono">
                    <span className="rr-loc">⊕ <HighlightText text={incident.location} query={query} /></span>
                    <span className="rr-type">{incident.incidentType}</span>
                    <span className="rr-id">#{incident.id}</span>
                </div>
            </div>
        </div>
    )
}

function SearchView() {
    const [keyword, setKeyword] = useState('')
    const [locationQuery, setLocationQuery] = useState('')
    const [selectedSeverity, setSelectedSeverity] = useState('')
    const [selectedType, setSelectedType] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [results, setResults] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [searchMode, setSearchMode] = useState('keyword') // keyword | location | severity | all
    const [searchTime, setSearchTime] = useState(null)
    const debounceRef = useRef(null)

    const executeSearch = useCallback(async (kw, loc, sev, typ, stat, mode) => {
        if (!kw && !loc && !sev && !typ && !stat) {
            setResults(null)
            return
        }

        setLoading(true)
        setError('')
        const t0 = performance.now()

        try {
            let data = []

            if (mode === 'severity' && sev) {
                data = await searchBySeverity(sev)
            } else if (mode === 'location' && loc) {
                data = await searchByLocation(loc)
            } else if (kw) {
                data = await searchIncidents(kw)
            } else {
                data = await getAllIncidents()
            }

            // Client-side filter on top of ES results
            if (typ)  data = data.filter(i => i.incidentType === typ)
            if (stat) data = data.filter(i => i.status === stat)
            if (sev && mode !== 'severity') data = data.filter(i => i.severity === sev)

            setResults(data)
            setSearchTime(Math.round(performance.now() - t0))
        } catch (e) {
            setError('Search failed — ensure Elasticsearch is running')
            setResults([])
        } finally {
            setLoading(false)
        }
    }, [])

    const handleKeywordChange = (e) => {
        const val = e.target.value
        setKeyword(val)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            executeSearch(val, locationQuery, selectedSeverity, selectedType, selectedStatus, 'keyword')
        }, 350)
    }

    const handleApplyFilters = () => {
        executeSearch(keyword, locationQuery, selectedSeverity, selectedType, selectedStatus, searchMode)
    }

    const handleClear = () => {
        setKeyword('')
        setLocationQuery('')
        setSelectedSeverity('')
        setSelectedType('')
        setSelectedStatus('')
        setResults(null)
        setError('')
        setSearchTime(null)
    }

    const totalWithGeo = results?.filter(i => i.latitude && i.longitude).length ?? 0

    return (
        <div className="search-view">
            {/* Header */}
            <div className="search-header">
                <div>
                    <p className="dash-eyebrow mono">COMMAND CENTER / ELASTICSEARCH</p>
                    <h1 className="dash-title">Advanced Incident Search</h1>
                </div>
                <div className="es-badge">
                    <span className="es-icon">⊛</span>
                    <div>
                        <p className="es-label mono">Elasticsearch</p>
                        <p className="es-sub mono">Full-text · Filters · Ranking</p>
                    </div>
                </div>
            </div>

            {/* Search panel */}
            <div className="search-panel">
                {/* Mode selector */}
                <div className="mode-selector">
                    {[
                        { id: 'keyword',  label: 'Full-text',  icon: '⌖' },
                        { id: 'location', label: 'Location',   icon: '⊕' },
                        { id: 'severity', label: 'Severity',   icon: '⬡' },
                    ].map(m => (
                        <button
                            key={m.id}
                            className={`mode-btn ${searchMode === m.id ? 'active' : ''}`}
                            onClick={() => setSearchMode(m.id)}
                        >
                            <span className="mode-icon">{m.icon}</span>
                            {m.label}
                        </button>
                    ))}
                </div>

                {/* Main search inputs */}
                <div className="search-inputs">
                    {(searchMode === 'keyword') && (
                        <div className="search-input-wrap main-input">
                            <span className="si-icon">⌖</span>
                            <input
                                className="search-input"
                                type="text"
                                placeholder="Search title, description, location..."
                                value={keyword}
                                onChange={handleKeywordChange}
                                autoFocus
                            />
                            {keyword && (
                                <button className="si-clear" onClick={() => { setKeyword(''); setResults(null) }}>✕</button>
                            )}
                        </div>
                    )}

                    {searchMode === 'location' && (
                        <div className="search-input-wrap main-input">
                            <span className="si-icon">⊕</span>
                            <input
                                className="search-input"
                                type="text"
                                placeholder="Search by location name..."
                                value={locationQuery}
                                onChange={e => setLocationQuery(e.target.value)}
                            />
                        </div>
                    )}

                    {searchMode === 'severity' && (
                        <div className="severity-quick-select">
                            {SEVERITIES.map(s => (
                                <button
                                    key={s}
                                    className={`sev-quick-btn sev-q-${s.toLowerCase()} ${selectedSeverity === s ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedSeverity(s)
                                        executeSearch(keyword, locationQuery, s, selectedType, selectedStatus, 'severity')
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filter row */}
                <div className="filter-row">
                    <div className="filter-group">
                        <label className="filter-label mono">TYPE</label>
                        <select className="filter-select" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                            <option value="">All Types</option>
                            {TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label className="filter-label mono">STATUS</label>
                        <select className="filter-select" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                            <option value="">All Statuses</option>
                            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    {searchMode !== 'severity' && (
                        <div className="filter-group">
                            <label className="filter-label mono">SEVERITY</label>
                            <select className="filter-select" value={selectedSeverity} onChange={e => setSelectedSeverity(e.target.value)}>
                                <option value="">All Severities</option>
                                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}
                    <button className="apply-btn" onClick={handleApplyFilters}>
                        <span>⌖</span> Apply Filters
                    </button>
                    <button className="clear-btn-sec" onClick={handleClear}>Clear</button>
                </div>
            </div>

            {/* Results area */}
            <div className="results-area">
                {/* Results meta bar */}
                {results !== null && (
                    <div className="results-meta">
                        <div className="rm-left">
                            <span className="rm-count mono">{results.length}</span>
                            <span className="rm-label">results</span>
                            {keyword && <span className="rm-query">for "<em>{keyword}</em>"</span>}
                        </div>
                        {searchTime !== null && (
                            <span className="rm-time mono">{searchTime}ms · via Elasticsearch</span>
                        )}
                    </div>
                )}

                {error && <div className="search-error mono">{error}</div>}

                {loading && (
                    <div className="search-loading">
                        <div className="sl-spinner"></div>
                        <span className="mono">Querying Elasticsearch...</span>
                    </div>
                )}

                {!loading && results === null && (
                    <div className="search-empty-state">
                        <div className="ses-icon">⊛</div>
                        <p className="ses-title">Elasticsearch-powered search</p>
                        <p className="ses-sub mono">Full-text search across title, description, and location<br/>with real-time filtering by type, status, and severity</p>
                        <div className="ses-features">
                            {['Full-text ranking', 'Location search', 'Severity filter', 'Status filter'].map(f => (
                                <span key={f} className="ses-feature mono">◈ {f}</span>
                            ))}
                        </div>
                    </div>
                )}

                {!loading && results !== null && results.length === 0 && (
                    <div className="no-results mono">— no incidents match your search —</div>
                )}

                {!loading && results && results.length > 0 && (
                    <div className="results-list">
                        {results.map(inc => (
                            <SearchResultRow key={inc.id} incident={inc} query={keyword} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default SearchView