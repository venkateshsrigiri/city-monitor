package com.smart.traffic.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Smart City Traffic Incident Management API")
                        .description("REST API for managing traffic incidents in a smart city environment. " +
                                "Supports incident reporting, status tracking, and real-time event streaming via Kafka.")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("Srigiri Venkatesh")
                                .email("srigiri.venkatesh@example.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")));
    }
}