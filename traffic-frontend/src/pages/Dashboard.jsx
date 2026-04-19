import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import StatsCard from '../components/StatsCard'
import IncidentCard from '../components/IncidentCard'
import { gqlDashboardSummary, getAllIncidents, getSystemHealth } from '../api/incidentApi'
import './Dashboard.css'

const SEVERITY_COLORS = {
    LOW: 'var(--severity-low)',
    MEDIUM: 'var(--severity-medium)',
    HIGH: 'var(--severity-high)',
    CRITICAL: 'var(--severity-critical)',
}

const STATUS_COLORS = {
    REPORTED: 'var(--status-reported)',
    IN_PROGRESS: 'var(--status-inprogress)',
    RESOLVED: 'var(--status-resolved)',
    DISMISSED: 'var(--status-dismissed)',
}

const TYPE_ICONS = {
    ACCIDENT: '⚠', FLOOD: '◈', FIRE: '⬡',
    ROADBLOCK: '◼', CONSTRUCTION: '⚙', CONGESTION: '≡',
}

const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="chart-tooltip">
            {label && <p className="ct-label">{label}</p>}
            {payload.map((p, i) => (
                <p key={i} className="ct-value" style={{ color: p.color || p.fill }}>
                    {p.name || p.dataKey}: <span>{p.value}</span>
                </p>
            ))}
        </div>
    )
}

function SystemHealthPanel({ health }) {
    if (!health) return null
    const overall = health.status || 'UNKNOWN'
    const components = health.components || {}

    const services = [
        { key: 'db',            label: 'PostgreSQL',    icon: '⊞' },
        { key: 'mongo',         label: 'MongoDB',       icon: '⊟' },
        { key: 'redis',         label: 'Redis',         icon: '⊠' },
        { key: 'kafka',         label: 'Kafka',         icon: '⊡' },
        { key: 'elasticsearch', label: 'Elasticsearch', icon: '⊛' },
    ]

    return (
        <div className="health-panel">
            <div className="panel-header">
                <span className="panel-icon">⊕</span>
                <h3 className="panel-title">System Health</h3>
                <span className={`health-overall ${overall.toLowerCase()}`}>{overall}</span>
            </div>
            <div className="health-services">
                {services.map(svc => {
                    const comp = components[svc.key]
                    const status = comp?.status || 'UNKNOWN'
                    return (
                        <div key={svc.key} className="health-row">
                            <span className="health-svc-icon">{svc.icon}</span>
                            <span className="health-svc-label">{svc.label}</span>
                            <span className={`health-dot ${status.toLowerCase()}`}></span>
                            <span className={`health-status ${status.toLowerCase()}`}>{status}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function RecentIncidentsFeed({ incidents }) {
    const recent = [...incidents].sort((a, b) => b.id - a.id).slice(0, 5)
    return (
        <div className="feed-panel">
            <div className="panel-header">
                <span className="panel-icon">⊕</span>
                <h3 className="panel-title">Recent Activity</h3>
                <span className="panel-tag mono">LIVE FEED</span>
            </div>
            <div className="feed-list">
                {recent.map((inc, i) => (
                    <div key={inc.id} className="feed-item" style={{ animationDelay: `${i * 60}ms` }}>
                        <span className="feed-icon">{TYPE_ICONS[inc.incidentType] || '◉'}</span>
                        <div className="feed-content">
                            <span className="feed-title">{inc.title}</span>
                            <span className="feed-loc mono">{inc.location}</span>
                        </div>
                        <span className={`sev-badge ${inc.severity?.toLowerCase()}`}>{inc.severity}</span>
                    </div>
                ))}
                {recent.length === 0 && <p className="feed-empty mono">— no incidents —</p>}
            </div>
        </div>
    )
}

function Dashboard() {
    const [activeFilter, setActiveFilter] = useState('ALL')
    const [dataSource, setDataSource] = useState('graphql') // 'graphql' | 'rest'

    // Try GraphQL first; on error fall back to REST automatically
    const gqlQuery = useQuery({
        queryKey: ['dashboard-gql'],
        queryFn: gqlDashboardSummary,
        refetchInterval: 30000,
        retry: 1,
    })

    const restQuery = useQuery({
        queryKey: ['dashboard-rest'],
        queryFn: getAllIncidents,
        refetchInterval: 30000,
        // Only run if GraphQL failed
        enabled: gqlQuery.isError,
    })

    const { data: health } = useQuery({
        queryKey: ['system-health'],
        queryFn: getSystemHealth,
        refetchInterval: 60000,
    })

    // Determine which source to use
    const usingGraphQL = !gqlQuery.isError
    const incidents = usingGraphQL
        ? (gqlQuery.data ?? [])
        : (restQuery.data ?? [])
    const isLoading = usingGraphQL ? gqlQuery.isLoading : restQuery.isLoading
    const isError   = gqlQuery.isError && restQuery.isError

    const total     = incidents.length
    const reported  = incidents.filter(i => i.status === 'REPORTED').length
    const inProgress = incidents.filter(i => i.status === 'IN_PROGRESS').length
    const resolved  = incidents.filter(i => i.status === 'RESOLVED').length
    const critical  = incidents.filter(i => i.severity === 'CRITICAL').length

    const severityData = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => ({
        name: s, value: incidents.filter(i => i.severity === s).length, fill: SEVERITY_COLORS[s],
    })).filter(d => d.value > 0)

    const statusData = ['REPORTED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'].map(s => ({
        name: s.replace('_', ' '),
        count: incidents.filter(i => i.status === s).length,
        fill: STATUS_COLORS[s],
    }))

    const typeData = ['ACCIDENT', 'FLOOD', 'FIRE', 'ROADBLOCK', 'CONSTRUCTION', 'CONGESTION'].map(t => ({
        name: t, count: incidents.filter(i => i.incidentType === t).length,
    })).filter(d => d.count > 0)

    const filterButtons = ['ALL', 'CRITICAL', 'HIGH', 'IN_PROGRESS', 'REPORTED']
    const filteredIncidents = incidents.filter(inc => {
        if (activeFilter === 'ALL') return true
        return inc.severity === activeFilter || inc.status === activeFilter
    })

    if (isLoading) return <div className="loading-screen">LOADING INCIDENT DATA...</div>
    if (isError) return (
        <div className="error-screen">
            BACKEND UNAVAILABLE — ensure Spring Boot is running on :8081
        </div>
    )

    const tickStyle = { fontSize: 9, fontFamily: 'var(--text-mono)', fill: 'var(--text-dim)', letterSpacing: '0.05em' }

    return (
        <div className="dashboard">
            <div className="dash-header">
                <div className="dash-header-left">
                    <p className="dash-eyebrow mono">COMMAND CENTER / OVERVIEW</p>
                    <h1 className="dash-title">Traffic Incident Dashboard</h1>
                </div>
                <div className="dash-header-right">
                    <div className={`data-source-tag ${usingGraphQL ? 'gql' : 'rest'}`}>
                        <span className="ds-icon">⬡</span>
                        <span className="mono">{usingGraphQL ? 'GraphQL · /graphql' : 'REST · /api/incidents'}</span>
                    </div>
                    <div className="data-source-tag">
                        <span className="ds-icon">◈</span>
                        <span className="mono">Auto-refresh · 30s</span>
                    </div>
                </div>
            </div>

            <div className="stats-grid">
                <StatsCard title="Total Incidents" value={total}      icon="🚨" color="var(--amber)" />
                <StatsCard title="Reported"         value={reported}   icon="📋" color="var(--blue)" />
                <StatsCard title="In Progress"      value={inProgress} icon="⚙"  color="var(--orange)" />
                <StatsCard title="Resolved"         value={resolved}   icon="✓"  color="var(--green)" />
                <StatsCard title="Critical"         value={critical}   icon="⬡" color="var(--red)" subtitle="Requires immediate action" />
            </div>

            <div className="dash-main">
                <div className="charts-col">
                    <div className="charts-row">
                        <div className="chart-card">
                            <div className="chart-header">
                                <h2 className="chart-title">Severity Distribution</h2>
                                <span className="chart-tag mono">PIE</span>
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={severityData} dataKey="value" nameKey="name"
                                        cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                                        {severityData.map((e, i) => (
                                            <Cell key={i} fill={e.fill} stroke="var(--bg-card)" strokeWidth={2} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend formatter={(v) => (
                                        <span style={{ fontSize: 11, fontFamily: 'var(--text-mono)', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>{v}</span>
                                    )} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="chart-card">
                            <div className="chart-header">
                                <h2 className="chart-title">Status Breakdown</h2>
                                <span className="chart-tag mono">BAR</span>
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={statusData} barSize={28}>
                                    <CartesianGrid strokeDasharray="2 4" stroke="var(--border-dim)" />
                                    <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
                                    <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                                        {statusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="chart-card chart-wide">
                        <div className="chart-header">
                            <h2 className="chart-title">Incidents by Type</h2>
                            <span className="chart-tag mono">BAR</span>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={typeData} barSize={32}>
                                <CartesianGrid strokeDasharray="2 4" stroke="var(--border-dim)" />
                                <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
                                <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="count" fill="var(--cyan)" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="side-panels">
                    <SystemHealthPanel health={health} />
                    <RecentIncidentsFeed incidents={incidents} />
                </div>
            </div>

            <div className="incidents-section">
                <div className="incidents-header">
                    <div className="incidents-header-left">
                        <h2 className="section-title">Incident Feed</h2>
                        <span className="mono section-count">{filteredIncidents.length} records</span>
                    </div>
                    <div className="filter-buttons">
                        {filterButtons.map(f => (
                            <button
                                key={f}
                                className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
                                onClick={() => setActiveFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredIncidents.length === 0 ? (
                    <div className="empty-state mono">— no incidents match filter —</div>
                ) : (
                    <div className="incidents-grid">
                        {filteredIncidents.map(incident => (
                            <IncidentCard key={incident.id} incident={incident} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard