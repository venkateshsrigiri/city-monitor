package com.smart.traffic.elasticsearch;

import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import com.smart.traffic.model.IncidentStatus;
import com.smart.traffic.model.IncidentType;
import com.smart.traffic.model.Severity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(indexName = "incidents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentDocument {

    @Id
    private String id;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String title;

    @Field(type = FieldType.Text, analyzer = "standard")
    private String description;

    @Field(type = FieldType.Keyword)
    private IncidentType incidentType;

    @Field(type = FieldType.Keyword)
    private IncidentStatus status;

    @Field(type = FieldType.Keyword)
    private Severity severity;

    @Field(type = FieldType.Double)
    private double latitude;

    @Field(type = FieldType.Double)
    private double longitude;

    @Field(type = FieldType.Text)
    private String location;

    @Field(type = FieldType.Text)
    private String reportedBy;

    @Field(type = FieldType.Keyword)
    private String createdAt;
}