import axios from 'axios'

const REST_BASE = '/api/incidents'
const GRAPHQL_URL = '/graphql'

// ── REST ────────────────────────────────────────────────────────────────────

export const getAllIncidents = async () => {
    const response = await axios.get(REST_BASE)
    const data = response.data
    return Array.isArray(data) ? data : []
}

export const getIncidentById = async (id) => {
    const response = await axios.get(`${REST_BASE}/${id}`)
    return response.data
}

export const createIncident = async (incident) => {
    const response = await axios.post(REST_BASE, incident)
    return response.data
}

export const updateIncidentStatus = async (id, status) => {
    const response = await axios.put(`${REST_BASE}/${id}/status?status=${status}`)
    return response.data
}

export const deleteIncident = async (id) => {
    await axios.delete(`${REST_BASE}/${id}`)
}

// ── Elasticsearch Search ─────────────────────────────────────────────────────

export const searchIncidents = async (keyword) => {
    const response = await axios.get(`${REST_BASE}/search?keyword=${encodeURIComponent(keyword)}`)
    const data = response.data
    return Array.isArray(data) ? data : []
}

export const searchByLocation = async (location) => {
    const response = await axios.get(`${REST_BASE}/search/location?location=${encodeURIComponent(location)}`)
    const data = response.data
    return Array.isArray(data) ? data : []
}

export const searchBySeverity = async (severity) => {
    const response = await axios.get(`${REST_BASE}/search/severity?severity=${severity}`)
    const data = response.data
    return Array.isArray(data) ? data : []
}

// ── GraphQL ──────────────────────────────────────────────────────────────────

const gql = async (query, variables = {}) => {
    const response = await axios.post(GRAPHQL_URL, { query, variables }, {
        headers: { 'Content-Type': 'application/json' }
    })
    if (response.data.errors) {
        throw new Error(response.data.errors[0]?.message || 'GraphQL error')
    }
    return response.data.data
}

export const gqlGetAllIncidents = async () => {
    const data = await gql(`
        query {
            getAllIncidents {
                id title description incidentType severity status
                latitude longitude location reportedBy
            }
        }
    `)
    return data.getAllIncidents || []
}

export const gqlGetByType = async (type) => {
    const data = await gql(`
        query($type: IncidentType!) {
            getIncidentByType(type: $type) {
                id title description incidentType severity status
                latitude longitude location reportedBy
            }
        }
    `, { type })
    return data.getIncidentByType || []
}

export const gqlGetByStatus = async (status) => {
    const data = await gql(`
        query($status: IncidentStatus!) {
            getIncidentByStatus(status: $status) {
                id title description incidentType severity status
                latitude longitude location reportedBy
            }
        }
    `, { status })
    return data.getIncidentByStatus || []
}

export const gqlDashboardSummary = async () => {
    const data = await gql(`
        query {
            getAllIncidents {
                id severity status incidentType latitude longitude location
            }
        }
    `)
    return data.getAllIncidents || []
}

export const gqlUpdateStatus = async (id, status) => {
    const data = await gql(`
        mutation($id: ID!, $status: IncidentStatus!) {
            updateIncidentStatus(id: $id, status: $status) {
                id status
            }
        }
    `, { id, status })
    return data.updateIncidentStatus
}

export const gqlDeleteIncident = async (id) => {
    const data = await gql(`
        mutation($id: ID!) {
            deleteIncident(id: $id)
        }
    `, { id })
    return data.deleteIncident
}

// ── MongoDB Event History ─────────────────────────────────────────────────────

export const getIncidentEventHistory = async (incidentId) => {
    try {
        const response = await axios.get(`/api/events/incident/${incidentId}`)
        return Array.isArray(response.data) ? response.data : []
    } catch {
        return []
    }
}

export const getRecentEvents = async () => {
    try {
        const response = await axios.get('/api/events/recent')
        return Array.isArray(response.data) ? response.data : []
    } catch {
        return []
    }
}

// ── Health / Actuator ─────────────────────────────────────────────────────────

export const getSystemHealth = async () => {
    try {
        const response = await axios.get('/actuator/health')
        return response.data
    } catch {
        return { status: 'UNKNOWN' }
    }
}