import './IncidentCard.css'

const TYPE_ICONS = {
    ACCIDENT: '⚠',
    FLOOD: '◈',
    FIRE: '⬡',
    ROADBLOCK: '◼',
    CONSTRUCTION: '⚙',
    CONGESTION: '≡',
}

function IncidentCard({ incident }) {
    const sev = incident.severity?.toLowerCase()
    const stat = incident.status?.toLowerCase().replace('_', '')

    return (
        <div className={`incident-card sev-${sev}`}>
            <div className="ic-header">
                <div className="ic-type-icon">{TYPE_ICONS[incident.incidentType] || '◉'}</div>
                <div className="ic-meta">
                    <span className={`sev-badge ${sev}`}>{incident.severity}</span>
                    <span className="ic-id mono">#{incident.id}</span>
                </div>
            </div>

            <h3 className="ic-title">{incident.title}</h3>
            <p className="ic-desc">{incident.description}</p>

            <div className="ic-footer">
                <span className="ic-location">
                    <span className="ic-loc-icon">⊕</span>
                    {incident.location}
                </span>
                <span className={`status-pill ${stat === 'in_progress' ? 'in_progress' : stat}`}>
                    <span className="sp-dot">●</span>
                    {incident.status?.replace('_', ' ')}
                </span>
            </div>

            <div className="ic-bottom">
                <span className="ic-type mono">{incident.incidentType}</span>
                {incident.reportedBy && (
                    <span className="ic-reporter mono">by {incident.reportedBy}</span>
                )}
            </div>
        </div>
    )
}

export default IncidentCard