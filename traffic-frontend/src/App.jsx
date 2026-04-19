import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import MapView from './pages/MapView'
import SearchView from './pages/SearchView'
import EventStream from './pages/EventStream'
import AdminPanel from './pages/AdminPanel'
import './index.css'

function App() {
    return (
        <div>
            <Navbar />
            <div className="container">
                <Routes>
                    <Route path="/"        element={<Dashboard />} />
                    <Route path="/map"     element={<MapView />} />
                    <Route path="/search"  element={<SearchView />} />
                    <Route path="/events"  element={<EventStream />} />
                    <Route path="/admin"   element={<AdminPanel />} />
                </Routes>
            </div>
        </div>
    )
}

export default App