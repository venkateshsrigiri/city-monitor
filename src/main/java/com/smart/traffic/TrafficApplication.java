package com.smart.traffic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
public class TrafficApplication {

	public static void main(String[] args) {
		SpringApplication.run(TrafficApplication.class, args);
	}

}
