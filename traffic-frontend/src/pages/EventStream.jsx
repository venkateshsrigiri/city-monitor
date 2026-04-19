import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAllIncidents, getRecentEvents } from '../api/incidentApi'
import './EventStream.css'

const EVENT_COLORS = {
    INCIDENT_CREATED: { color: 'var(--cyan)', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.3)' },
    INCIDENT_UPDATED: { color: 'var(--amber)', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
    INCIDENT_RESOLVED: { color: 'var(--green)', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
    INCIDENT_DELETED: { color: 'var(--red)', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
}

const STATUS_TIMELINE = ['REPORTED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED']

const TYPE_ICONS = {
    ACCIDENT: '⚠', FLOOD: '◈', FIRE: '⬡',
    ROADBLOCK: '◼', CONSTRUCTION: '⚙', CONGESTION: '≡',
}

function EventBadge({ eventType }) {
    const cfg = EVENT_COLORS[eventType] || EVENT_COLORS.INCIDENT_UPDATED
    return (
        <span className="event-badge" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            {eventType?.replace('INCIDENT_', '') || 'EVENT'}
        </span>
    )
}

function IncidentTimeline({ incident }) {
    const currentIdx = STATUS_TIMELINE.indexOf(incident.status)

    return (
        <div className="timeline-card">
            <div className="tc-header">
                <span className="tc-icon">{TYPE_ICONS[incident.incidentType] || '◉'}</span>
                <div className="tc-info">
                    <span className="tc-title">{incident.title}</span>
                    <span className="tc-loc mono">⊕ {incident.location}</span>
                </div>
                <span className={`sev-badge ${incident.severity?.toLowerCase()}`}>{incident.severity}</span>
            </div>

            <div className="timeline-track">
                {STATUS_TIMELINE.map((status, idx) => {
                    const isPast    = idx < currentIdx
                    const isCurrent = idx === currentIdx
                    const isFuture  = idx > currentIdx
                    const isDismissed = incident.status === 'DISMISSED'

                    return (
                        <div key={status} className="timeline-step">
                            <div className={`ts-node ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''} ${isFuture ? 'future' : ''} ${isDismissed && status === 'DISMISSED' ? 'dismissed' : ''}`}>
                                {isPast && <span>✓</span>}
                                {isCurrent && <span className="ts-pulse"></span>}
                            </div>
                            {idx < STATUS_TIMELINE.length - 1 && (
                                <div className={`ts-line ${isPast ? 'filled' : ''}`}></div>
                            )}
                            <span className={`ts-label mono ${isCurrent ? 'active' : ''} ${isFuture ? 'dim' : ''}`}>
                                {status.replace('_', '\n')}
                            </span>
                        </div>
                    )
                })}
            </div>

            <div className="tc-meta">
                <span className="tc-type mono">{incident.incidentType}</span>
                <span className="tc-id mono">#{incident.id}</span>
            </div>
        </div>
    )
}

function EventRow({ event, index }) {
    const cfg = EVENT_COLORS[event.eventType] || EVENT_COLORS.INCIDENT_UPDATED
    const ts = event.timestamp || event.createdAt
    const formatted = ts ? new Date(ts).toLocaleTimeString('en-US', { hour12: false }) : '—'
    const dateStr   = ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : ''

    return (
        <div className="event-row" style={{ animationDelay: `${index * 40}ms` }}>
            <div className="er-timeline">
                <div className="er-dot" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }}></div>
                <div className="er-line"></div>
            </div>
            <div className="er-content">
                <div className="er-top">
                    <EventBadge eventType={event.eventType} />
                    <span className="er-title">{event.title}</span>
                    <span className="er-time mono">{dateStr} {formatted}</span>
                </div>
                <div className="er-bottom mono">
                    <span className="er-detail">incident #{event.incidentId}</span>
                    {event.location && <span className="er-loc">⊕ {event.location}</span>}
                    {event.severity && <span className={`sev-badge ${event.severity?.toLowerCase()}`}>{event.severity}</span>}
                    {event.status && <span className="er-status">{event.status}</span>}
                </div>
            </div>
        </div>
    )
}

// Simulated event stream from incidents (since MongoDB event endpoint may not exist yet)
function buildSimulatedEvents(incidents) {
    return incidents.flatMap(inc => {
        const events = []
        events.push({
            id: `${inc.id}-created`,
            eventType: 'INCIDENT_CREATED',
            incidentId: inc.id,
            title: inc.title,
            location: inc.location,
            severity: inc.severity,
            status: 'REPORTED',
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
        })
        if (inc.status !== 'REPORTED') {
            events.push({
                id: `${inc.id}-updated`,
                eventType: 'INCIDENT_UPDATED',
                incidentId: inc.id,
                title: inc.title,
                location: inc.location,
                severity: inc.severity,
                status: inc.status,
                timestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
            })
        }
        return events
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

function EventStream() {
    const [activeTab, setActiveTab] = useState('timeline')
    const [autoRefresh, setAutoRefresh] = useState(true)
    const [lastRefresh, setLastRefresh] = useState(new Date())

    const { data: incidents = [], isLoading, refetch } = useQuery({
        queryKey: ['incidents-events'],
        queryFn: getAllIncidents,
        refetchInterval: autoRefresh ? 15000 : false,
    })

    const { data: mongoEvents = [] } = useQuery({
        queryKey: ['mongo-events'],
        queryFn: getRecentEvents,
        retry: false, // returns [] gracefully if MongoDB is offline
        refetchInterval: autoRefresh ? 15000 : false,
    })

    useEffect(() => {
        if (autoRefresh) {
            const t = setInterval(() => setLastRefresh(new Date()), 15000)
            return () => clearInterval(t)
        }
    }, [autoRefresh])

    const events = mongoEvents.length > 0
        ? mongoEvents
        : buildSimulatedEvents(incidents)

    const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'DISMISSED')
    const resolvedToday = incidents.filter(i => i.status === 'RESOLVED').length

    return (
        <div className="event-stream">
            {/* Header */}
            <div className="ev-header">
                <div>
                    <p className="dash-eyebrow mono">COMMAND CENTER / KAFKA + MONGODB</p>
                    <h1 className="dash-title">Event Stream</h1>
                </div>
                <div className="ev-controls">
                    <div className="ev-stats-row">
                        <div className="ev-stat">
                            <span className="ev-stat-val mono">{events.length}</span>
                            <span className="ev-stat-lbl">Events</span>
                        </div>
                        <div className="ev-stat">
                            <span className="ev-stat-val mono">{activeIncidents.length}</span>
                            <span className="ev-stat-lbl">Active</span>
                        </div>
                        <div className="ev-stat">
                            <span className="ev-stat-val mono">{resolvedToday}</span>
                            <span className="ev-stat-lbl">Resolved</span>
                        </div>
                    </div>
                    <button
                        className={`refresh-toggle ${autoRefresh ? 'on' : 'off'}`}
                        onClick={() => setAutoRefresh(r => !r)}
                    >
                        <span className={`rt-dot ${autoRefresh ? 'live' : ''}`}></span>
                        <span className="mono">{autoRefresh ? 'AUTO·15s' : 'PAUSED'}</span>
                    </button>
                </div>
            </div>

            {/* Source info banner */}
            <div className="source-banner">
                <div className="sb-item">
                    <span className="sb-icon kafka">⊡</span>
                    <div>
                        <span className="sb-label">Apache Kafka</span>
                        <span className="sb-sub mono">Topics: incident-created · incident-updated</span>
                    </div>
                </div>
                <div className="sb-arrow">→</div>
                <div className="sb-item">
                    <span className="sb-icon consumer">⚙</span>
                    <div>
                        <span className="sb-label">Consumer Group</span>
                        <span className="sb-sub mono">incident-consumer-group</span>
                    </div>
                </div>
                <div className="sb-arrow">→</div>
                <div className="sb-item">
                    <span className="sb-icon mongo">⊟</span>
                    <div>
                        <span className="sb-label">MongoDB</span>
                        <span className="sb-sub mono">db: trafficdb · collection: events</span>
                    </div>
                </div>
                {mongoEvents.length === 0 && (
                    <div className="sb-note mono">⚠ Showing simulated events — MongoDB endpoint not yet wired</div>
                )}
            </div>

            {/* Tabs */}
            <div className="ev-tabs">
                {[
                    { id: 'timeline', label: 'Incident Timelines', icon: '⬡' },
                    { id: 'events',   label: 'Event Log',          icon: '⊕' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`ev-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span>{tab.icon}</span> {tab.label}
                    </button>
                ))}
                <div className="ev-tabs-spacer"></div>
                <span className="refresh-time mono">
                    Last refresh: {lastRefresh.toLocaleTimeString('en-US', { hour12: false })}
                </span>
            </div>

            {isLoading ? (
                <div className="loading-screen">LOADING EVENT DATA...</div>
            ) : (
                <>
                    {activeTab === 'timeline' && (
                        <div className="timelines-section">
                            <p className="section-hint mono">
                                Each card shows the Kafka-event-driven lifecycle: REPORTED → IN_PROGRESS → RESOLVED
                            </p>
                            <div className="timelines-grid">
                                {incidents.map(inc => (
                                    <IncidentTimeline key={inc.id} incident={inc} />
                                ))}
                                {incidents.length === 0 && (
                                    <p className="feed-empty mono">— no incidents in system —</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'events' && (
                        <div className="event-log-section">
                            <p className="section-hint mono">
                                Events consumed from Kafka → stored in MongoDB (IncidentEventDocument collection)
                            </p>
                            <div className="event-log">
                                {events.map((ev, i) => (
                                    <EventRow key={ev.id || `ev-${i}`} event={ev} index={i} />
                                ))}
                                {events.length === 0 && (
                                    <p className="feed-empty mono">— no events in log —</p>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default EventStream