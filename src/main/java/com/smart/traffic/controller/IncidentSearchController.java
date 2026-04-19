package com.smart.traffic.controller;

import com.smart.traffic.elasticsearch.IncidentDocument;
import com.smart.traffic.model.Severity;
import com.smart.traffic.service.IncidentSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/incidents/search")
@RequiredArgsConstructor
public class IncidentSearchController {

    private final IncidentSearchService incidentSearchService;

    @GetMapping
    public ResponseEntity<List<IncidentDocument>> searchByKeyword(
            @RequestParam String keyword) {
        return ResponseEntity.ok(incidentSearchService.searchByKeyword(keyword));
    }

    @GetMapping("/location")
    public ResponseEntity<List<IncidentDocument>> searchByLocation(
            @RequestParam String location) {
        return ResponseEntity.ok(incidentSearchService.searchByLocation(location));
    }

    @GetMapping("/severity")
    public ResponseEntity<List<IncidentDocument>> searchBySeverity(
            @RequestParam Severity severity) {
        return ResponseEntity.ok(incidentSearchService.searchBySeverity(severity.name()));
    }
}