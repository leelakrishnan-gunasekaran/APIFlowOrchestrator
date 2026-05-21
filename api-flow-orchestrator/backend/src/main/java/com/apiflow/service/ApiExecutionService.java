package com.apiflow.service;

import com.apiflow.model.*;
import com.apiflow.repository.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApiExecutionService {
    
    private final ApiNodeRepository apiNodeRepository;
    private final ExecutionRunRepository executionRunRepository;
    private final PerformanceBaselineRepository performanceBaselineRepository;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;
    
    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{([^}]+)\\}\\}");
    
    @Transactional
    public ExecutionRun executeApiGroup(Long apiGroupId, Map<String, String> initialVariables) {
        log.info("Starting execution for API Group: {}", apiGroupId);
        
        // Create execution run
        ExecutionRun executionRun = new ExecutionRun();
        executionRun.setApiGroupId(apiGroupId);
        executionRun.setStatus("RUNNING");
        executionRun.setStartTime(LocalDateTime.now());
        executionRun = executionRunRepository.save(executionRun);
        
        // Get all API nodes in sequence
        List<ApiNode> apiNodes = apiNodeRepository.findByApiGroupIdOrderBySequenceOrder(apiGroupId);
        
        // Variable context for hooking
        Map<String, Object> variableContext = new HashMap<>(initialVariables);
        
        int successCount = 0;
        int failCount = 0;
        
        try {
            for (ApiNode apiNode : apiNodes) {
                ApiRunResult result = executeApiNode(apiNode, variableContext, executionRun);
                
                if ("SUCCESS".equals(result.getStatus())) {
                    successCount++;
                    // Update performance baseline
                    updatePerformanceBaseline(apiNode.getId(), result.getDurationMs());
                } else {
                    failCount++;
                    // If one fails, we might want to stop or continue based on configuration
                }
            }
            
            executionRun.setStatus("COMPLETED");
        } catch (Exception e) {
            log.error("Execution failed for API Group: {}", apiGroupId, e);
            executionRun.setStatus("FAILED");
            failCount++;
        } finally {
            executionRun.setEndTime(LocalDateTime.now());
            executionRun.setTotalDurationMs(
                Duration.between(executionRun.getStartTime(), executionRun.getEndTime()).toMillis()
            );
            executionRun.setSuccessfulCount(successCount);
            executionRun.setFailedCount(failCount);
            executionRunRepository.save(executionRun);
        }
        
        return executionRun;
    }
    
    private ApiRunResult executeApiNode(ApiNode apiNode, Map<String, Object> variableContext, ExecutionRun executionRun) {
        log.info("Executing API Node: {} - {}", apiNode.getName(), apiNode.getUrl());
        
        ApiRunResult result = new ApiRunResult();
        result.setExecutionRun(executionRun);
        result.setApiNodeId(apiNode.getId());
        result.setApiNodeName(apiNode.getName());
        result.setSequenceOrder(apiNode.getSequenceOrder());
        
        long startTime = System.currentTimeMillis();
        
        try {
            // Replace variables in URL
            String url = replaceVariables(apiNode.getUrl(), variableContext);
            
            // Replace variables in headers
            Map<String, String> headers = parseHeaders(apiNode.getHeaders(), variableContext);
            
            // Replace variables in request body
            String requestBody = replaceVariables(apiNode.getRequestBody(), variableContext);
            
            // Build WebClient
            WebClient webClient = webClientBuilder.build();
            
            // Execute HTTP request
            Mono<String> responseMono = switch (apiNode.getMethod().toUpperCase()) {
                case "GET" -> webClient.get()
                        .uri(url)
                        .headers(h -> headers.forEach(h::add))
                        .retrieve()
                        .bodyToMono(String.class);
                case "POST" -> webClient.post()
                        .uri(url)
                        .headers(h -> headers.forEach(h::add))
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(requestBody != null ? requestBody : "{}")
                        .retrieve()
                        .bodyToMono(String.class);
                case "PUT" -> webClient.put()
                        .uri(url)
                        .headers(h -> headers.forEach(h::add))
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(requestBody != null ? requestBody : "{}")
                        .retrieve()
                        .bodyToMono(String.class);
                case "DELETE" -> webClient.delete()
                        .uri(url)
                        .headers(h -> headers.forEach(h::add))
                        .retrieve()
                        .bodyToMono(String.class);
                default -> throw new IllegalArgumentException("Unsupported HTTP method: " + apiNode.getMethod());
            };
            
            String response = responseMono.block(Duration.ofSeconds(30));
            long endTime = System.currentTimeMillis();
            
            result.setStatus("SUCCESS");
            result.setStatusCode(200);
            result.setDurationMs(endTime - startTime);
            result.setRequest(requestBody);
            result.setResponse(response);
            
            // Hook variables from response
            hookVariablesFromResponse(response, apiNode, variableContext);
            
        } catch (Exception e) {
            long endTime = System.currentTimeMillis();
            log.error("Failed to execute API Node: {}", apiNode.getName(), e);
            
            result.setStatus("FAILED");
            result.setDurationMs(endTime - startTime);
            result.setErrorMessage(e.getMessage());
        }
        
        result.setExecutedAt(LocalDateTime.now());
        executionRun.getApiRunResults().add(result);
        
        return result;
    }
    
    private String replaceVariables(String text, Map<String, Object> variableContext) {
        if (text == null) return null;
        
        Matcher matcher = VARIABLE_PATTERN.matcher(text);
        StringBuffer result = new StringBuffer();
        
        while (matcher.find()) {
            String variableName = matcher.group(1).trim();
            Object value = variableContext.get(variableName);
            matcher.appendReplacement(result, value != null ? value.toString() : "");
        }
        matcher.appendTail(result);
        
        return result.toString();
    }
    
    private Map<String, String> parseHeaders(String headersJson, Map<String, Object> variableContext) {
        Map<String, String> headers = new HashMap<>();
        if (headersJson == null || headersJson.isEmpty()) {
            return headers;
        }
        
        try {
            JsonNode jsonNode = objectMapper.readTree(headersJson);
            jsonNode.fields().forEachRemaining(entry -> {
                String value = replaceVariables(entry.getValue().asText(), variableContext);
                headers.put(entry.getKey(), value);
            });
        } catch (Exception e) {
            log.error("Failed to parse headers", e);
        }
        
        return headers;
    }
    
    private void hookVariablesFromResponse(String response, ApiNode apiNode, Map<String, Object> variableContext) {
        if (response == null || apiNode.getFieldMappings() == null) {
            return;
        }
        
        try {
            JsonNode responseJson = objectMapper.readTree(response);
            
            // Extract values based on field mappings (JSONPath-like)
            apiNode.getFieldMappings().forEach((variableName, jsonPath) -> {
                try {
                    JsonNode value = extractValueFromJsonPath(responseJson, jsonPath);
                    if (value != null) {
                        variableContext.put(variableName, value.asText());
                        log.info("Hooked variable: {} = {}", variableName, value.asText());
                    }
                } catch (Exception e) {
                    log.error("Failed to extract variable: {}", variableName, e);
                }
            });
        } catch (Exception e) {
            log.error("Failed to hook variables from response", e);
        }
    }
    
    private JsonNode extractValueFromJsonPath(JsonNode root, String path) {
        // Simple JSONPath implementation (supports dot notation)
        String[] parts = path.split("\\.");
        JsonNode current = root;
        
        for (String part : parts) {
            if (current == null) return null;
            current = current.get(part);
        }
        
        return current;
    }
    
    private void updatePerformanceBaseline(Long apiNodeId, Long durationMs) {
        Optional<PerformanceBaseline> baselineOpt = performanceBaselineRepository.findByApiNodeId(apiNodeId);
        
        PerformanceBaseline baseline;
        if (baselineOpt.isPresent()) {
            baseline = baselineOpt.get();
            
            // Update running average
            int newCount = baseline.getSampleCount() + 1;
            long newAvg = ((baseline.getAvgDurationMs() * baseline.getSampleCount()) + durationMs) / newCount;
            
            baseline.setAvgDurationMs(newAvg);
            baseline.setMinDurationMs(Math.min(baseline.getMinDurationMs(), durationMs));
            baseline.setMaxDurationMs(Math.max(baseline.getMaxDurationMs(), durationMs));
            baseline.setSampleCount(newCount);
        } else {
            baseline = new PerformanceBaseline();
            baseline.setApiNodeId(apiNodeId);
            baseline.setAvgDurationMs(durationMs);
            baseline.setMinDurationMs(durationMs);
            baseline.setMaxDurationMs(durationMs);
            baseline.setSampleCount(1);
        }
        
        performanceBaselineRepository.save(baseline);
    }
}

// Made with Bob
