Smart City Traffic Incident Management System
A full-stack, production-grade platform for real-time urban traffic incident monitoring, dispatch, and resolution. Built with a microservices-inspired Spring Boot backend and a React command-center frontend.

Screenshots

<img width="1854" height="881" alt="image" src="https://github.com/user-attachments/assets/b32b4f63-808f-45dc-9cce-f7587d4e3858" />



<img width="1854" height="881" alt="image" src="https://github.com/user-attachments/assets/ca51ddc1-b188-473c-a456-3f6c2d455f01" />



<img width="1854" height="881" alt="image" src="https://github.com/user-attachments/assets/7a614470-399d-435b-908a-61faf3c843b4" />



<img width="1854" height="881" alt="image" src="https://github.com/user-attachments/assets/808d3a36-e4fd-4ade-827a-d9949a8d049f" />




Event Flow
When an incident is created or updated:

REST/GraphQL controller calls IncidentServiceImpl
Service saves to PostgreSQL and evicts Redis cache
IncidentEventProducer publishes to Kafka topic (incident-created / incident-updated)
IncidentEventConsumer consumes the event and stores it in MongoDB
IncidentSearchService indexes the incident in Elasticsearch
Frontend auto-refreshes via TanStack Query polling


Features
Command Center Dashboard

Live stats: total, reported, in-progress, resolved, critical
Charts: severity distribution (pie), status breakdown (bar), incidents by type (bar)
System health panel showing status of all 5 backend services
Recent activity feed
GraphQL-powered data fetching with automatic REST fallback
Filter incidents by severity and status

Live Incident Map

Dark-themed Leaflet map (CartoDB dark tiles)
Severity-colored markers (green → amber → orange → red)
Click markers to see full incident details in popup
Incidents without coordinates are auto-geocoded by location name via backend proxy
Filter by severity and incident type
Full incident list panel alongside the map

Elasticsearch Search

Full-text search across title, description, and location
Three search modes: full-text keyword, location, severity
Additional filters: type, status
Query term highlighting in results
Response time display

Event Stream

Visual incident lifecycle timeline: REPORTED → IN_PROGRESS → RESOLVED
Kafka event log sourced from MongoDB
Auto-refresh every 15 seconds with live indicator
Shows event type badges (CREATED, UPDATED, RESOLVED)

Admin Panel

Create incidents with title, description, type, severity, location, coordinates
Inline status updates (dropdown per row) via REST
Sortable table columns
Filter by status and severity
Delete incidents




# Mutations
createIncident(input: IncidentInput!): Incident
updateIncidentStatus(id: ID!, status: IncidentStatus!): Incident
deleteIncident(id: ID!): String
Swagger UI
Available at http://localhost:8081/swagger-ui.html

Getting Started
Prerequisites

Java 21
Maven
Docker + Docker Compose
Node.js 18+

Run with Docker Compose (full stack)
bash# Clone the repo
git clone https://github.com/YOUR_USERNAME/smart-city-traffic.git
cd smart-city-traffic

# Build the jar
./mvnw clean package -DskipTests

# Start all services
docker-compose up --build
Wait for:
incident-service | Started TrafficApplication
Then start the frontend:
bashcd traffic-frontend
npm install
npm run dev
Open http://localhost:5173

Services Started by Docker Compose
ServicePortSpring Boot API8081PostgreSQL5432MongoDB27017Redis6379Kafka9092Zookeeper2181Elasticsearch9200

Useful URLs
URLDescriptionhttp://localhost:5173React frontendhttp://localhost:8081/api/incidentsREST APIhttp://localhost:8081/graphiqlGraphQL IDEhttp://localhost:8081/swagger-ui.htmlAPI docshttp://localhost:8081/actuator/healthSystem health

Incident Types & Severities
Types: ACCIDENT · FLOOD · FIRE · ROADBLOCK · CONSTRUCTION · CONGESTION
Severities: LOW · MEDIUM · HIGH · CRITICAL
Statuses: REPORTED → IN_PROGRESS → RESOLVED · DISMISSED




Author
Venkatesh Srigiri - Full Stack Java Developer and ML Enthusiast
