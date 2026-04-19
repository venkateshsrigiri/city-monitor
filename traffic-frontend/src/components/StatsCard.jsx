import './StatsCard.css'

function StatsCard({ title, value, icon, color, subtitle, trend }) {
    return (
        <div className="stats-card" style={{ '--accent': color }}>
            <div className="stats-card-top">
                <span className="stats-icon">{icon}</span>
                <span className="stats-value">{value}</span>
            </div>
            <div className="stats-card-bottom">
                <p className="stats-title">{title}</p>
                {subtitle && <p className="stats-subtitle">{subtitle}</p>}
            </div>
            <div className="stats-bar" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
        </div>
    )
}

export default StatsCard