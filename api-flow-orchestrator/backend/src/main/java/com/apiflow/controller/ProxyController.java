package com.apiflow.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/proxy")
@RequiredArgsConstructor
@Slf4j
public class ProxyController {
    
    private final WebClient.Builder webClientBuilder;
    
    @PostMapping("/execute")
    public ResponseEntity<?> proxyRequest(@RequestBody ProxyRequestDto request) {
        log.info("Proxying request: {} {}", request.getMethod(), request.getUrl());
        
        try {
            WebClient webClient = webClientBuilder.build();
            
            // Build headers
            HttpHeaders headers = new HttpHeaders();
            if (request.getHeaders() != null) {
                request.getHeaders().forEach(headers::add);
            }
            
            // Execute request based on method with error handling
            String response = switch (request.getMethod().toUpperCase()) {
                case "GET" -> webClient.get()
                        .uri(request.getUrl())
                        .headers(h -> headers.forEach(h::addAll))
                        .retrieve()
                        .onStatus(status -> status.isError(), clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                .map(body -> new RuntimeException("HTTP " + clientResponse.statusCode() + ": " + body)))
                        .bodyToMono(String.class)
                        .block(Duration.ofSeconds(30));
                case "POST" -> webClient.post()
                        .uri(request.getUrl())
                        .headers(h -> headers.forEach(h::addAll))
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(request.getBody() != null ? request.getBody() : "{}")
                        .retrieve()
                        .onStatus(status -> status.isError(), clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                .map(body -> new RuntimeException("HTTP " + clientResponse.statusCode() + ": " + body)))
                        .bodyToMono(String.class)
                        .block(Duration.ofSeconds(30));
                case "PUT" -> webClient.put()
                        .uri(request.getUrl())
                        .headers(h -> headers.forEach(h::addAll))
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(request.getBody() != null ? request.getBody() : "{}")
                        .retrieve()
                        .onStatus(status -> status.isError(), clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                .map(body -> new RuntimeException("HTTP " + clientResponse.statusCode() + ": " + body)))
                        .bodyToMono(String.class)
                        .block(Duration.ofSeconds(30));
                case "DELETE" -> webClient.delete()
                        .uri(request.getUrl())
                        .headers(h -> headers.forEach(h::addAll))
                        .retrieve()
                        .onStatus(status -> status.isError(), clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                .map(body -> new RuntimeException("HTTP " + clientResponse.statusCode() + ": " + body)))
                        .bodyToMono(String.class)
                        .block(Duration.ofSeconds(30));
                case "PATCH" -> webClient.patch()
                        .uri(request.getUrl())
                        .headers(h -> headers.forEach(h::addAll))
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(request.getBody() != null ? request.getBody() : "{}")
                        .retrieve()
                        .onStatus(status -> status.isError(), clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                .map(body -> new RuntimeException("HTTP " + clientResponse.statusCode() + ": " + body)))
                        .bodyToMono(String.class)
                        .block(Duration.ofSeconds(30));
                default -> throw new IllegalArgumentException("Unsupported HTTP method: " + request.getMethod());
            };
            
            log.info("Proxy request successful for: {} {}", request.getMethod(), request.getUrl());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
                    
        } catch (Exception e) {
            log.error("Proxy request failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "error", "Proxy request failed",
                        "message", e.getMessage()
                    ));
        }
    }
    
    // Inner class for request body
    public static class ProxyRequestDto {
        private String method;
        private String url;
        private Map<String, String> headers;
        private String body;
        
        public String getMethod() {
            return method;
        }
        
        public void setMethod(String method) {
            this.method = method;
        }
        
        public String getUrl() {
            return url;
        }
        
        public void setUrl(String url) {
            this.url = url;
        }
        
        public Map<String, String> getHeaders() {
            return headers;
        }
        
        public void setHeaders(Map<String, String> headers) {
            this.headers = headers;
        }
        
        public String getBody() {
            return body;
        }
        
        public void setBody(String body) {
            this.body = body;
        }
    }
}

// Made with Bob