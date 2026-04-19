package com.smart.traffic.repository;

import java.util.List;


import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.smart.traffic.kafka.IncidentEventDocument;


public interface  IncidentEventRepo extends  MongoRepository<IncidentEventDocument,String>{
    List<IncidentEventDocument> findByIncidentId(Long incidentId);
    
}
