import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Navbar.css'

function Navbar() {
    const location = useLocation()
    const [time, setTime] = useState(new Date())
    const [pulse, setPulse] = useState(true)

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date())
            setPulse(p => !p)
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const formatTime = (d) => d.toLocaleTimeString('en-US', { hour12: false })
    const formatDate = (d) => d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })

    const navItems = [
        { path: '/',         label: 'Command Center', icon: '⬡' },
        { path: '/map',      label: 'Live Map',        icon: '◈' },
        { path: '/search',   label: 'ES Search',       icon: '⌖' },
        { path: '/events',   label: 'Event Stream',    icon: '⊕' },
        { path: '/admin',    label: 'Admin',           icon: '⚙' },
    ]

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <div className="navbar-brand">
                    <span className="brand-icon">◈</span>
                    <span className="brand-text">SMART CITY</span>
                    <span className="brand-sub">TRAFFIC OPS</span>
                </div>
                <div className="system-status">
                    <span className={`live-dot ${pulse ? 'pulse' : ''}`}></span>
                    <span className="live-label">LIVE</span>
                </div>
            </div>

            <div className="navbar-links">
                {navItems.map(item => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </Link>
                ))}
            </div>

            <div className="navbar-right">
                <div className="clock-block">
                    <span className="clock-time">{formatTime(time)}</span>
                    <span className="clock-date">{formatDate(time)}</span>
                </div>
                <div className="operator-badge">
                    <span className="op-icon">◉</span>
                    <span className="op-label">OPS·ADMIN</span>
                </div>
            </div>
        </nav>
    )
}

export default Navbar