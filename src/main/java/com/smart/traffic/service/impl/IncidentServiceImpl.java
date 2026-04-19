package com.smart.traffic.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.smart.traffic.dto.IncidentRequestDTO;
import com.smart.traffic.dto.IncidentResponseDTO;
import com.smart.traffic.exception.ResourceNotFoundException;
import com.smart.traffic.kafka.IncidentEventProducer;
import com.smart.traffic.model.Incident;
import com.smart.traffic.model.IncidentStatus;
import com.smart.traffic.model.IncidentType;
import com.smart.traffic.repository.IncidentRepo;
import com.smart.traffic.service.IncidentSearchService;
import com.smart.traffic.service.IncidentService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncidentServiceImpl implements IncidentService {

    private final IncidentRepo incidentRepo;
    private final IncidentEventProducer incidentEventProducer;
    private final IncidentSearchService incidentSearchService;

    @Override
    @CacheEvict(value = "incidents", key = "'all'")
    public IncidentResponseDTO createIncident(IncidentRequestDTO request, String reportedBy) {
        Incident incident = mapToEntity(request, reportedBy);
        Incident savedIncident = incidentRepo.save(incident);
        incidentEventProducer.sendIncidentCreatedEvent(savedIncident);
        incidentSearchService.indexIncident(savedIncident);
        log.info("Incident created with id: {}", savedIncident.getId());
        return mapToResponseDTO(savedIncident);
    }

    @Override
    @Cacheable(value = "incidents", key = "#id")
    public IncidentResponseDTO getIncidentById(Long id) {
        Incident incident = incidentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + id));
        log.info("Fetching the incident with id: {}", incident.getId());
        return mapToResponseDTO(incident);
    }

    @Override
    @Cacheable(value = "incidents", key = "'all'")
    public List<IncidentResponseDTO> getAllIncidents() {
        List<Incident> incidents = incidentRepo.findAll();
        log.info("Fetching all incidents, count: {}", incidents.size());
        return incidents.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<IncidentResponseDTO> getIncidentByStatus(IncidentStatus status) {
        List<Incident> incidents = incidentRepo.findByStatus(status);
        log.info("Fetching all incidents by status: {}", status);
        return incidents.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<IncidentResponseDTO> getIncidentsByType(IncidentType type) {
        List<Incident> incidents = incidentRepo.findByIncidentType(type);
        log.info("Fetching all incidents by type: {}", type);
        return incidents.stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @CachePut(value = "incidents", key = "#id")
    public IncidentResponseDTO updateIncidentStatus(Long id, IncidentStatus status) {
        Incident incident = incidentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + id));
        incident.setStatus(status);
        Incident updatedIncident = incidentRepo.save(incident);
        incidentEventProducer.sendIncidentUpdatedEvent(updatedIncident);
        incidentSearchService.indexIncident(updatedIncident);
        log.info("Updated status successfully with id: {} status: {}", id, status);
        return mapToResponseDTO(updatedIncident);
    }

    @Override
    @CacheEvict(value = "incidents", allEntries = true)
    public void deleteIncident(Long id) {
        incidentRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + id));
        incidentRepo.deleteById(id);
        incidentSearchService.deleteIncident(id);
        log.info("Deleted incident with id: {}", id);
    }

    private IncidentResponseDTO mapToResponseDTO(Incident incident) {
        return IncidentResponseDTO.builder()
                .id(incident.getId())
                .title(incident.getTitle())
                .description(incident.getDescription())
                .incidentType(incident.getIncidentType())
                .status(incident.getStatus())
                .severity(incident.getSeverity())
                .latitude(incident.getLatitude())
                .longitude(incident.getLongitude())
                .location(incident.getLocation())
                .reportedBy(incident.getReportedBy())
                .createdAt(incident.getCreatedAt())
                .updatedAt(incident.getUpdatedAt())
                .build();
    }

    private Incident mapToEntity(IncidentRequestDTO request, String reportedBy) {
        return Incident.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .incidentType(request.getIncidentType())
                .severity(request.getSeverity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .location(request.getLocation())
                .reportedBy(reportedBy)
                .status(IncidentStatus.REPORTED)
                .build();
    }
}