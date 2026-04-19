package com.smart.traffic.controller;

import com.smart.traffic.kafka.IncidentEventDocument;
import com.smart.traffic.repository.IncidentEventRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Slf4j
public class IncidentEventController {

    private final IncidentEventRepo incidentEventRepo;

    /**
     * GET /api/events/recent
     * Returns the 50 most recent Kafka events stored in MongoDB,
     * sorted newest-first by createdAt.
     */
    @GetMapping("/recent")
    public ResponseEntity<List<IncidentEventDocument>> getRecentEvents() {
        try {
            // MongoRepository doesn't support Pageable directly on findAll,
            // so we sort all and take top 50 in memory — fine for this scale.
            List<IncidentEventDocument> all = incidentEventRepo.findAll(
                    Sort.by(Sort.Direction.DESC, "createdAt")
            );
            List<IncidentEventDocument> recent = all.size() > 50
                    ? all.subList(0, 50)
                    : all;
            log.info("Returning {} recent events from MongoDB", recent.size());
            return ResponseEntity.ok(recent);
        } catch (Exception e) {
            log.error("Failed to fetch recent events from MongoDB: {}", e.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    /**
     * GET /api/events/incident/{incidentId}
     * Returns all Kafka events for a specific incident (its full lifecycle).
     */
    @GetMapping("/incident/{incidentId}")
    public ResponseEntity<List<IncidentEventDocument>> getEventsByIncident(
            @PathVariable Long incidentId) {
        try {
            List<IncidentEventDocument> events = incidentEventRepo.findByIncidentId(incidentId);
            log.info("Returning {} events for incident id: {}", events.size(), incidentId);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            log.error("Failed to fetch events for incident {}: {}", incidentId, e.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }
    }
}