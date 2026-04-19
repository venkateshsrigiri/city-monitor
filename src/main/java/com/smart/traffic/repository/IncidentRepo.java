package com.smart.traffic.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smart.traffic.model.Incident;
import com.smart.traffic.model.IncidentStatus;
import com.smart.traffic.model.IncidentType;

public interface IncidentRepo extends JpaRepository<Incident, Long> {

    List<Incident> findByStatus(IncidentStatus status);
    List<Incident> findByIncidentType(IncidentType incidentType);


    
}
