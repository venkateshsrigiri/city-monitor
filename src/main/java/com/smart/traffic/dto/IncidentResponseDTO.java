package com.smart.traffic.dto;

import java.io.Serializable;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import com.smart.traffic.model.IncidentStatus;
import com.smart.traffic.model.IncidentType;
import com.smart.traffic.model.Severity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class IncidentResponseDTO implements Serializable {

    private static final Long serialVersionUID = 1L;

    private Long id;
    private String title;
    private String description;
    private IncidentType incidentType;
    private IncidentStatus status;
    private Severity severity;
    private double latitude;
    private double longitude;
    private String location;
    private String reportedBy;

    // FIX: Explicitly serialize LocalDateTime as ISO string so both
    // Jackson (REST/GraphQL) and the Redis GenericJackson2JsonRedisSerializer
    // can round-trip these fields without needing a global ObjectMapper override.
    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}