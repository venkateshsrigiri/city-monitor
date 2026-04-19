package com.smart.traffic.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;

@RestController
@RequestMapping("/api/geocode")
@Slf4j
public class GeocodingController {

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * GET /api/geocode?location=Chandanagar,Hyderabad
     * Proxies to Nominatim so the frontend avoids CORS restrictions.
     * Returns the raw Nominatim JSON array.
     */
    @GetMapping
    public ResponseEntity<String> geocode(@RequestParam String location) {
        try {
            String url = "https://nominatim.openstreetmap.org/search"
                    + "?q=" + java.net.URLEncoder.encode(location, "UTF-8")
                    + "&format=json&limit=1&addressdetails=0";

            // Nominatim requires a User-Agent header
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "SmartCityTrafficApp/1.0");
            headers.set("Accept-Language", "en");

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, String.class);

            log.info("Geocoded '{}' -> {}", location, response.getBody());
            return ResponseEntity.ok(response.getBody());

        } catch (Exception e) {
            log.warn("Geocoding failed for '{}': {}", location, e.getMessage());
            return ResponseEntity.ok("[]");
        }
    }
}