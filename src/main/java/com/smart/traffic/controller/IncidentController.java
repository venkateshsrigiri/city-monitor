package com.smart.traffic.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smart.traffic.dto.IncidentRequestDTO;
import com.smart.traffic.dto.IncidentResponseDTO;
import com.smart.traffic.model.IncidentStatus;
import com.smart.traffic.model.IncidentType;
import com.smart.traffic.service.IncidentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentService incidentService;

    @PostMapping
    public ResponseEntity <IncidentResponseDTO> createIncident(@Valid @RequestBody IncidentRequestDTO request){
        String reportedBy = "user-123";
        
        return ResponseEntity.status(HttpStatus.CREATED).body(incidentService.createIncident(request, reportedBy));


    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentResponseDTO>  getIncidentById(@PathVariable Long id){
        return ResponseEntity.ok(incidentService.getIncidentById(id));

    }

    @GetMapping()
    public ResponseEntity<List<IncidentResponseDTO>> getAllIncidents(){
        return ResponseEntity.ok(incidentService.getAllIncidents());
        
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<IncidentResponseDTO>> getIncidentByType(@PathVariable IncidentType type){
        return ResponseEntity.ok(incidentService.getIncidentsByType(type));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<IncidentResponseDTO>> getIncidentByStatus(@PathVariable IncidentStatus status){
        return ResponseEntity.ok(incidentService.getIncidentByStatus(status));
    }


    @PutMapping("/{id}/status")
    public ResponseEntity<IncidentResponseDTO> updateIncidentStatus(@PathVariable Long id,@RequestParam IncidentStatus status){
        return ResponseEntity.ok(incidentService.updateIncidentStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIncident(@PathVariable Long id){
        incidentService.deleteIncident(id);
        return ResponseEntity.noContent().build();


    }  


    


    
}
