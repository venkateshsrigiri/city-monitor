import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    getAllIncidents,
    createIncident,
    updateIncidentStatus,
    deleteIncident,
} from '../api/incidentApi'
import './AdminPanel.css'

const INCIDENT_TYPES = ['ACCIDENT', 'FLOOD', 'FIRE', 'ROADBLOCK', 'CONSTRUCTION', 'CONGESTION']
const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const STATUSES = ['REPORTED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED']

const TYPE_ICONS = {
    ACCIDENT: '⚠', FLOOD: '◈', FIRE: '⬡',
    ROADBLOCK: '◼', CONSTRUCTION: '⚙', CONGESTION: '≡',
}

const SEV_COLORS = {
    LOW: 'var(--severity-low)',
    MEDIUM: 'var(--severity-medium)',
    HIGH: 'var(--severity-high)',
    CRITICAL: 'var(--severity-critical)',
}

const emptyForm = {
    title: '',
    description: '',
    incidentType: 'ACCIDENT',
    severity: 'LOW',
    latitude: '',
    longitude: '',
    location: '',
}

function AdminPanel() {
    const [form, setForm] = useState(emptyForm)
    const [formError, setFormError] = useState('')
    const [successMsg, setSuccessMsg] = useState('')
    const [sortField, setSortField] = useState('id')
    const [sortDir, setSortDir] = useState('desc')
    const [filterStatus, setFilterStatus] = useState('ALL')
    const [filterSeverity, setFilterSeverity] = useState('ALL')

    const queryClient = useQueryClient()

    const { data: incidents = [], isLoading, isError } = useQuery({
        queryKey: ['admin-incidents'],
        queryFn: getAllIncidents,
        refetchInterval: 10000,
    })

    // Invalidate every query that could show incidents — dashboard, map, events
    const invalidateAll = () => {
        queryClient.invalidateQueries()
    }

    const createMutation = useMutation({
        mutationFn: createIncident,
        onSuccess: () => {
            invalidateAll()
            setForm(emptyForm)
            setFormError('')
            showSuccess('✓ Incident created — Kafka event published')
        },
        onError: () => setFormError('Create failed — check all required fields'),
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, status }) => updateIncidentStatus(id, status),
        onSuccess: (data) => {
            invalidateAll()
            showSuccess(`✓ Status updated to ${data?.status || ''}`)
        },
        onError: () => setFormError('Status update failed'),
    })

    const deleteMutation = useMutation({
        mutationFn: deleteIncident,
        onSuccess: () => {
            invalidateAll()
            showSuccess('✓ Incident deleted')
        },
        onError: () => setFormError('Delete failed'),
    })

    const showSuccess = (msg) => {
        setSuccessMsg(msg)
        setFormError('')
        setTimeout(() => setSuccessMsg(''), 4000)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.title || !form.description || !form.location) {
            setFormError('Title, description and location are required')
            return
        }
        createMutation.mutate(form)
    }

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleStatusChange = (id, status) => updateMutation.mutate({ id, status })

    const handleDelete = (id) => {
        if (window.confirm('Delete this incident?')) deleteMutation.mutate(id)
    }

    const handleSort = (field) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortField(field); setSortDir('asc') }
    }

    const filteredIncidents = incidents
        .filter(i => filterStatus === 'ALL' || i.status === filterStatus)
        .filter(i => filterSeverity === 'ALL' || i.severity === filterSeverity)
        .sort((a, b) => {
            let av = a[sortField], bv = b[sortField]
            if (typeof av === 'string') { av = av.toLowerCase(); bv = bv?.toLowerCase() }
            if (av < bv) return sortDir === 'asc' ? -1 : 1
            if (av > bv) return sortDir === 'asc' ? 1 : -1
            return 0
        })

    const sortIcon = (field) => sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'

    return (
        <div className="admin-panel">
            <div className="admin-header">
                <div>
                    <p className="dash-eyebrow mono">COMMAND CENTER / ADMIN</p>
                    <h1 className="dash-title">Incident Management</h1>
                </div>
                <div className="api-badge">
                    <span className="ab-dot"></span>
                    <span className="mono">REST · PUT /api/incidents/{'{id}'}/status</span>
                </div>
            </div>

            <div className="admin-grid">
                {/* Create Form */}
                <div className="form-section">
                    <div className="section-panel-header">
                        <span className="sph-icon">⊕</span>
                        <h2 className="section-panel-title">Create Incident</h2>
                    </div>

                    {formError && <div className="form-error mono">{formError}</div>}
                    {successMsg && <div className="form-success mono">{successMsg}</div>}

                    <form onSubmit={handleSubmit} className="incident-form">
                        <div className="form-group">
                            <label className="form-label">Title <span className="req">*</span></label>
                            <input className="form-input" name="title" value={form.title}
                                   onChange={handleChange} placeholder="e.g. Major accident on Ring Road" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description <span className="req">*</span></label>
                            <textarea className="form-input form-textarea" name="description"
                                      value={form.description} onChange={handleChange}
                                      placeholder="Describe the incident..." rows={3} />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select className="form-input form-select" name="incidentType"
                                        value={form.incidentType} onChange={handleChange}>
                                    {INCIDENT_TYPES.map(t => (
                                        <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Severity</label>
                                <select className="form-input form-select" name="severity"
                                        value={form.severity} onChange={handleChange}
                                        style={{ borderColor: SEV_COLORS[form.severity], color: SEV_COLORS[form.severity] }}>
                                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Location <span className="req">*</span></label>
                            <input className="form-input" name="location" value={form.location}
                                   onChange={handleChange} placeholder="e.g. MG Road, Bengaluru" />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Latitude</label>
                                <input className="form-input" name="latitude" type="number"
                                       step="any" value={form.latitude} onChange={handleChange}
                                       placeholder="12.9716" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Longitude</label>
                                <input className="form-input" name="longitude" type="number"
                                       step="any" value={form.longitude} onChange={handleChange}
                                       placeholder="77.5946" />
                            </div>
                        </div>

                        <div className="coords-hint mono">
                            💡 Leave lat/lng blank — the map will auto-geocode from the location name
                        </div>

                        <button type="submit" className="create-btn" disabled={createMutation.isPending}>
                            {createMutation.isPending
                                ? <><span className="btn-spinner" /> Creating...</>
                                : <><span>⊕</span> Create Incident</>}
                        </button>
                    </form>
                </div>

                {/* Table */}
                <div className="table-section">
                    <div className="section-panel-header">
                        <span className="sph-icon">⬡</span>
                        <h2 className="section-panel-title">Manage Incidents</h2>
                        <span className="sph-count mono">{filteredIncidents.length} / {incidents.length}</span>
                    </div>

                    <div className="table-filters">
                        <div className="tf-group">
                            <label className="filter-label mono">STATUS</label>
                            <select className="filter-select" value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}>
                                <option value="ALL">All</option>
                                {STATUSES.map(s => (
                                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                        <div className="tf-group">
                            <label className="filter-label mono">SEVERITY</label>
                            <select className="filter-select" value={filterSeverity}
                                    onChange={e => setFilterSeverity(e.target.value)}>
                                <option value="ALL">All</option>
                                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {isLoading && <div className="loading-screen">LOADING...</div>}
                    {isError && <div className="error-screen">Failed to load incidents.</div>}

                    <div className="table-wrapper">
                        <table className="incidents-table">
                            <thead>
                            <tr>
                                {[
                                    { field: 'id',           label: 'ID' },
                                    { field: 'title',        label: 'Title' },
                                    { field: 'incidentType', label: 'Type' },
                                    { field: 'severity',     label: 'Severity' },
                                    { field: 'status',       label: 'Status' },
                                    { field: 'location',     label: 'Location' },
                                    { field: null,           label: 'Delete' },
                                ].map(col => (
                                    <th key={col.label}
                                        className={col.field ? 'sortable' : ''}
                                        onClick={() => col.field && handleSort(col.field)}>
                                        {col.label}
                                        {col.field && <span className="sort-icon mono">{sortIcon(col.field)}</span>}
                                    </th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {filteredIncidents.map(incident => (
                                <tr key={incident.id}>
                                    <td className="td-id mono">#{incident.id}</td>
                                    <td className="td-title">{incident.title}</td>
                                    <td className="td-type">
                                            <span className="type-chip mono">
                                                {TYPE_ICONS[incident.incidentType]} {incident.incidentType}
                                            </span>
                                    </td>
                                    <td>
                                            <span className={`sev-badge ${incident.severity?.toLowerCase()}`}>
                                                {incident.severity}
                                            </span>
                                    </td>
                                    <td>
                                        <select
                                            className="status-select"
                                            value={incident.status}
                                            onChange={e => handleStatusChange(incident.id, e.target.value)}
                                            disabled={updateMutation.isPending}
                                        >
                                            {STATUSES.map(s => (
                                                <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="td-loc mono">{incident.location}</td>
                                    <td>
                                        <button className="delete-btn"
                                                onClick={() => handleDelete(incident.id)}
                                                disabled={deleteMutation.isPending}>
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredIncidents.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="td-empty mono">
                                        — no incidents match filters —
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminPanel