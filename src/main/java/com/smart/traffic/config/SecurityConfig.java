package com.smart.traffic.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives(
                                        "default-src 'self'; " +
                                                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; " +
                                                "style-src 'self' 'unsafe-inline' https://unpkg.com; " +
                                                "img-src 'self' data:; " +
                                                "font-src 'self' data: https://unpkg.com; " +
                                                "connect-src 'self' ws://localhost:8081;"
                                )))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/api-docs/**",
                                "/v3/api-docs/**",
                                "/graphiql/**",
                                "/graphql/**",
                                "/actuator/**"
                        ).permitAll()
                        .anyRequest().permitAll());
        return http.build();
    }
}