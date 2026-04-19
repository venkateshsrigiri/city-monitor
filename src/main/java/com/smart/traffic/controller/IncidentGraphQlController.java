package com.smart.traffic.controller;

import com.smart.traffic.dto.IncidentRequestDTO;
import com.smart.traffic.dto.IncidentResponseDTO;
import com.smart.traffic.model.IncidentStatus;
import com.smart.traffic.model.IncidentType;
import com.smart.traffic.model.Severity;
import com.smart.traffic.service.IncidentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@Slf4j
public class IncidentGraphQlController{



    private final IncidentService incidentService;

    public IncidentGraphQlController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }
    @QueryMapping
    public List<IncidentResponseDTO> getAllIncidents(){
        log.info("GraphQl query: getAllIncidents");
        return incidentService.getAllIncidents();

    }
    @QueryMapping
    public IncidentResponseDTO getIncidentById(@Argument Long id){
        log.info("GraphQl query: getIncidentById:{}",id);
        return incidentService.getIncidentById(id);
    }
    @QueryMapping
    public List<IncidentResponseDTO> getIncidentByType(@Argument IncidentType type){
        log.info("GraphQl query:getIncidentByType type : {}",type);
        return incidentService.getIncidentsByType(type);

    }
    @QueryMapping
    public List<IncidentResponseDTO> getIncidentByStatus(@Argument IncidentStatus status){
        log.info("GraphQl query: getIncidentByStatus status:{}",status);
        return incidentService.getIncidentByStatus(status);


    }

    @MutationMapping
    public IncidentResponseDTO createIncident(@Argument IncidentInput input) {
        log.info("GraphQL mutation: createIncident title: {}", input.getTitle());
        IncidentRequestDTO request = IncidentRequestDTO.builder()
                .title(input.getTitle())
                .description(input.getDescription())
                .incidentType(input.getIncidentType())
                .severity(input.getSeverity())
                .latitude(input.getLatitude())
                .longitude(input.getLongitude())
                .location(input.getLocation())
                .build();
        return incidentService.createIncident(request, "graphql-user");
    }

    @MutationMapping
    public IncidentResponseDTO updateIncidentStatus(@Argument Long id, @Argument IncidentStatus status) {
        log.info("GraphQL mutation: updateIncidentStatus id: {} status: {}", id, status);
        return incidentService.updateIncidentStatus(id, status);
    }

    @MutationMapping
    public String deleteIncident(@Argument Long id) {
        log.info("GraphQL mutation: deleteIncident id: {}", id);
        incidentService.deleteIncident(id);
        return "Incident with id " + id + " deleted successfully";
    }

    // Inner class to map GraphQL IncidentInput
    public static class IncidentInput {
        private String title;
        private String description;
        private IncidentType incidentType;
        private Severity severity;
        private double latitude;
        private double longitude;
        private String location;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public IncidentType getIncidentType() { return incidentType; }
        public void setIncidentType(IncidentType incidentType) { this.incidentType = incidentType; }
        public com.smart.traffic.model.Severity getSeverity() { return severity; }
        public void setSeverity(com.smart.traffic.model.Severity severity) { this.severity = severity; }
        public double getLatitude() { return latitude; }
        public void setLatitude(double latitude) { this.latitude = latitude; }
        public double getLongitude() { return longitude; }
        public void setLongitude(double longitude) { this.longitude = longitude; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
    }
}





