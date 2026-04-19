package com.smart.traffic.elasticsearch;

import java.util.List;

import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import com.smart.traffic.model.Severity;

@Repository
public interface IncidentSearchRepository
        extends ElasticsearchRepository<IncidentDocument, String> {

    @Query("{\"match\": {\"title\": {\"query\": \"?0\", \"operator\": \"or\"}}}")
    List<IncidentDocument> findByTitleContaining(String keyword);

    @Query("{\"match\": {\"location\": {\"query\": \"?0\", \"operator\": \"or\"}}}")
    List<IncidentDocument> findByLocationContaining(String location);

    List<IncidentDocument> findBySeverity(Severity severity);

    @Query("{\"multi_match\": {\"query\": \"?0\", \"fields\": [\"title\", \"description\"], \"operator\": \"or\"}}")
    List<IncidentDocument> findByTitleContainingOrDescriptionContaining(
            String title, String description);
}