package com.smart.traffic.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.config.TopicBuilder;

public class KafkaProducerConfig{

    @Bean
    public NewTopic incidentCreatedTopic(){
        return TopicBuilder.name(KafkaTopicConstants.INCIDENT_CREATED)
        .partitions(3)
        .replicas(1)
        .build();

    }


    @Bean
    public NewTopic incidentUpdatedTopic(){
        return TopicBuilder.name(KafkaTopicConstants.INCIDENT_UPDATED)

        .partitions(3)
        .replicas(1)
        .build();

    }
    
    
}