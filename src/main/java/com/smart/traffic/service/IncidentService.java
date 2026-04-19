package com.smart.traffic.service;

import java.util.List;

import com.smart.traffic.dto.IncidentRequestDTO;
import com.smart.traffic.dto.IncidentResponseDTO;
import com.smart.traffic.model.IncidentStatus;
import com.smart.traffic.model.IncidentType;

public interface IncidentService {
    IncidentResponseDTO createIncident(IncidentRequestDTO request,String reportedBy);
    IncidentResponseDTO getIncidentById(Long id);
    List<IncidentResponseDTO> getAllIncidents();
    List<IncidentResponseDTO> getIncidentByStatus(IncidentStatus status);
    List<IncidentResponseDTO> getIncidentsByType(IncidentType type);

    IncidentResponseDTO updateIncidentStatus(Long id ,IncidentStatus status);
    void deleteIncident(Long id);

    


    
    
}
