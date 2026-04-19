package com.smart.traffic.service;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;

import com.smart.traffic.elasticsearch.IncidentDocument;
import com.smart.traffic.elasticsearch.IncidentSearchRepository;
import com.smart.traffic.model.Incident;
import com.smart.traffic.model.Severity;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncidentSearchService {

    private final IncidentSearchRepository incidentSearchRepository;

    public void indexIncident(Incident incident) {
        try {
            IncidentDocument document = IncidentDocument.builder()
                    .id(String.valueOf(incident.getId()))
                    .title(incident.getTitle())
                    .description(incident.getDescription())
                    .incidentType(incident.getIncidentType())
                    .status(incident.getStatus())
                    .severity(incident.getSeverity())
                    .latitude(incident.getLatitude())
                    .longitude(incident.getLongitude())
                    .location(incident.getLocation())
                    .reportedBy(incident.getReportedBy())
                    .createdAt(incident.getCreatedAt() != null ?
                            incident.getCreatedAt().toString() : null)
                    .build();

            incidentSearchRepository.save(document);
            log.info("Indexed incident id: {} to Elasticsearch", incident.getId());
        } catch (Exception e) {
            // FIX: was already caught here — good. Kept as-is.
            log.warn("Elasticsearch unavailable — skipping index for incident id: {}. Error: {}",
                    incident.getId(), e.getMessage());
        }
    }

    public List<IncidentDocument> searchByKeyword(String keyword) {
        // FIX: previously uncaught — if ES is down this threw straight to the
        // controller which returned a 500 to the frontend.
        try {
            log.info("Searching incidents by keyword: {}", keyword);
            return incidentSearchRepository
                    .findByTitleContainingOrDescriptionContaining(keyword, keyword);
        } catch (Exception e) {
            log.warn("Elasticsearch search by keyword failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<IncidentDocument> searchByLocation(String location) {
        // FIX: same — was uncaught.
        try {
            log.info("Searching incidents by location: {}", location);
            return incidentSearchRepository.findByLocationContaining(location);
        } catch (Exception e) {
            log.warn("Elasticsearch search by location failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<IncidentDocument> searchBySeverity(String severity) {
        // FIX: same — was uncaught. Also added guard for invalid enum value.
        try {
            log.info("Searching incidents by severity: {}", severity);
            Severity sev = Severity.valueOf(severity.toUpperCase());
            return incidentSearchRepository.findBySeverity(sev);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid severity value: {}", severity);
            return Collections.emptyList();
        } catch (Exception e) {
            log.warn("Elasticsearch search by severity failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public void deleteIncident(Long id) {
        // FIX: was uncaught — a delete could 500 if ES was down.
        try {
            incidentSearchRepository.deleteById(String.valueOf(id));
            log.info("Deleted incident id: {} from Elasticsearch", id);
        } catch (Exception e) {
            log.warn("Elasticsearch delete failed for incident id: {}. Error: {}", id, e.getMessage());
        }
    }
}