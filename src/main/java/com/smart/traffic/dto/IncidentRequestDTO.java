package com.smart.traffic.dto;

import com.smart.traffic.model.IncidentType;
import com.smart.traffic.model.Severity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder

public class IncidentRequestDTO {
    @NotBlank(message="Title is required")
    private String title;
    @NotBlank
    private String description;
    @NotNull
    private IncidentType incidentType;
    @NotNull
    private Severity severity;

    private double latitude;

    private double longitude;
    @NotBlank
    private String location;
    
}
