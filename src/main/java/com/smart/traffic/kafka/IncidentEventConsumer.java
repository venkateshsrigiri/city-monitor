package com.smart.traffic.kafka;

import java.time.LocalDateTime;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.smart.traffic.repository.IncidentEventRepo;



import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class IncidentEventConsumer{

    
    private final IncidentEventRepo incidentEventRepo;
    public IncidentEventConsumer(IncidentEventRepo incidentEventRepo) {
        this.incidentEventRepo = incidentEventRepo;
    }

    @KafkaListener(topics="incident-created",groupId = "incident-consumer-group")
    public void consumeIncidentCreated(IncidentEvent event){
        log.info("Received INCIDENT_CREATED event for incident id:{}",event.getIncidentId());

        IncidentEventDocument document = IncidentEventDocument.builder()
        .incidentId(event.getIncidentId())
        .title(event.getTitle())
        .incidentType(event.getIncidentType())
        .status(event.getStatus())
        .severity(event.getSeverity())
        .latitude(event.getLatitude())
        .longitude(event.getLongitude())
        .location(event.getLocation())
        .reportedBy(event.getReportedBy())
        .eventType(event.getEventType())
        .timestamp(event.getTimestamp())
        .createdAt(LocalDateTime.now())
        .build();

        incidentEventRepo.save(document);
        log.info("Saved INCIDENT_CREATED event to MongoDB for incident id: {}", event.getIncidentId());
    }

    @KafkaListener(topics = "incident-updated",groupId = "incident-consumer group")
    public void consumeIncidentUpdated(IncidentEvent event){
        log.info("Received INCIDENT_UPDATED event for incident id:{}",event.getIncidentId());

        IncidentEventDocument existing = incidentEventRepo
        .findByIncidentId(event.getIncidentId())
        .stream()
        .findFirst()
        .orElse(new IncidentEventDocument());

        existing.setIncidentId(event.getIncidentId());
        existing.setTitle(event.getTitle());
        existing.setIncidentType(event.getIncidentType());
        existing.setStatus(event.getStatus());
        existing.setSeverity(event.getSeverity());
        existing.setLatitude(event.getLatitude());
        existing.setLongitude(event.getLongitude());
        existing.setLocation(event.getLocation());
        existing.setReportedBy(event.getReportedBy());
        existing.setEventType(event.getEventType());
        existing.setTimestamp(event.getTimestamp());
        existing.setCreatedAt(LocalDateTime.now());

        incidentEventRepo.save(existing);
        log.info("Upserted INCIDENT_UPDATED event to MongoDB for incident id: {}", event.getIncidentId());

    }


    


}
