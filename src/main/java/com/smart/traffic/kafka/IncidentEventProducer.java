package com.smart.traffic.kafka;

import java.time.LocalDateTime;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.smart.traffic.config.KafkaTopicConstants;
import com.smart.traffic.model.Incident;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncidentEventProducer {
    private final KafkaTemplate<String,IncidentEvent> kafkaTemplate;

        public void sendIncidentCreatedEvent(Incident incident){
            IncidentEvent event =IncidentEvent.builder()
            .incidentId(incident.getId())
            .title(incident.getTitle())
            .incidentType(incident.getIncidentType())
            .status(incident.getStatus())
            .severity(incident.getSeverity())
            .latitude(incident.getLatitude())
            .longitude(incident.getLongitude())
            .location(incident.getLocation())
            .reportedBy(incident.getReportedBy())

            .eventType("INCIDENT_CREATED").
            timestamp(LocalDateTime.now())
            .build();

            kafkaTemplate.send(KafkaTopicConstants.INCIDENT_CREATED,
                String.valueOf(incident.getId()),event);

                log.info("Published Incident created event for incident id {}",incident.getId());
            
            
        }

        public void sendIncidentUpdatedEvent(Incident incident){
            IncidentEvent event = IncidentEvent.builder()
            .incidentId(incident.getId())
            .title(incident.getTitle())
            .incidentType(incident.getIncidentType())
            .status(incident.getStatus())
            .severity(incident.getSeverity())
            .latitude(incident.getLatitude())
            .longitude(incident.getLongitude())
            .location(incident.getLocation())
            .reportedBy(incident.getReportedBy())
            .eventType("INCIDENT_UPDATED")
            .timestamp(LocalDateTime.now())
            .build();

        kafkaTemplate.send(KafkaTopicConstants.INCIDENT_UPDATED,
            String.valueOf(incident.getId()),event
        );
        log.info("Published INCIDENT_UPDATED event for incident id:{}",incident.getId());


        }


    


    
}
