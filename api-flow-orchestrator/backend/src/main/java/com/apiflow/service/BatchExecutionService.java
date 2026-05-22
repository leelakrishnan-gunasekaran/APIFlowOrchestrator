package com.apiflow.service;

import com.apiflow.model.ApiGroup;
import com.apiflow.model.ApiNode;
import com.apiflow.model.ApiGroupExecutionRun;
import com.apiflow.model.ApiNodeExecutionResult;
import com.apiflow.repository.ApiGroupRepository;
import com.apiflow.repository.ApiNodeRepository;
import com.apiflow.repository.ApiGroupExecutionRunRepository;
import com.apiflow.repository.ApiRequestHistoryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class BatchExecutionService {
    
    private final ApiGroupRepository apiGroupRepository;
    private final ApiNodeRepository apiNodeRepository;
    private final ApiGroupExecutionRunRepository executionRunRepository;
    private final ApiRequestHistoryRepository historyRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Create RestTemplate instance
    private RestTemplate getRestTemplate() {
        return new RestTemplate();
    }
    
    @Transactional
    public Map<String, Object> executeApiGroup(Long groupId, Map<String, Object> initialVariables) {
        log.info("Starting execution of API Group: {}", groupId);
        
        ApiGroup apiGroup = apiGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("API Group not found: " + groupId));
        
        List<ApiNode> nodes = apiNodeRepository.findByApiGroupIdOrderBySequenceOrder(groupId);
        
        if (nodes.isEmpty()) {
            throw new RuntimeException("No API nodes found in group: " + groupId);
        }
        
        Map<String, Object> variables = new HashMap<>();
        if (initialVariables != null) {
            variables.putAll(initialVariables);
        }
        
        // Create execution run record
        ApiGroupExecutionRun executionRun = new ApiGroupExecutionRun();
        executionRun.setApiGroupId(groupId);
        executionRun.setTotalNodes(nodes.size());
        executionRun.setExecutedAt(LocalDateTime.now());
        
        List<Map<String, Object>> results = new ArrayList<>();
        boolean allSuccess = true;
        String overallStatus = "SUCCESS";
        
        for (int i = 0; i < nodes.size(); i++) {
            ApiNode node = nodes.get(i);
            try {
                log.info("========================================");
                log.info("Executing node {}/{}: {}", (i + 1), nodes.size(), node.getName());
                log.info("Current variables before execution: {}", variables);
                log.info("========================================");
                
                // Execute node synchronously - this blocks until completion
                Map<String, Object> nodeResult = executeNode(node, variables);
                
                log.info("========================================");
                log.info("Node {}/{} completed: {}", (i + 1), nodes.size(), node.getName());
                log.info("Variables after execution: {}", variables);
                log.info("========================================");
                
                results.add(nodeResult);
                
                // Create execution result record
                ApiNodeExecutionResult executionResult = new ApiNodeExecutionResult();
                executionResult.setExecutionRun(executionRun);
                executionResult.setApiNodeId(node.getId());
                executionResult.setNodeName(node.getName());
                executionResult.setMethod(node.getMethod());
                executionResult.setUrl((String) nodeResult.get("url"));  // Resolved URL with actual values
                executionResult.setRequestBody((String) nodeResult.get("requestBody"));  // Resolved request body with actual values
                executionResult.setStatus((String) nodeResult.get("status"));
                executionResult.setStatusCode((Integer) nodeResult.get("statusCode"));
                executionResult.setResponse((String) nodeResult.get("response"));
                if (nodeResult.get("duration") != null) {
                    executionResult.setDuration(((Number) nodeResult.get("duration")).longValue());
                }
                executionResult.setExecutedAt(LocalDateTime.now());
                
                executionRun.getApiRunResults().add(executionResult);
                
                if (!"SUCCESS".equals(nodeResult.get("status"))) {
                    allSuccess = false;
                    overallStatus = "PARTIAL_SUCCESS";
                }
                
            } catch (Exception e) {
                log.error("Error executing node: {} - {}", node.getName(), e.getMessage(), e);
                allSuccess = false;
                // Only mark as FAILED if this is the first failure, otherwise keep PARTIAL_SUCCESS
                if ("SUCCESS".equals(overallStatus)) {
                    overallStatus = "PARTIAL_SUCCESS";
                }
                
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("nodeId", node.getId());
                errorResult.put("nodeName", node.getName());
                errorResult.put("method", node.getMethod());
                errorResult.put("url", node.getUrl());  // Template URL (error occurred before resolution)
                errorResult.put("requestBody", node.getRequestBody());  // Template request body
                errorResult.put("status", "FAILED");
                errorResult.put("error", e.getMessage());
                errorResult.put("errorType", e.getClass().getSimpleName());
                errorResult.put("timestamp", LocalDateTime.now().toString());
                results.add(errorResult);
                
                // Create error execution result record
                ApiNodeExecutionResult executionResult = new ApiNodeExecutionResult();
                executionResult.setExecutionRun(executionRun);
                executionResult.setApiNodeId(node.getId());
                executionResult.setNodeName(node.getName());
                executionResult.setMethod(node.getMethod());
                executionResult.setUrl(node.getUrl());  // Template URL (error occurred before resolution)
                executionResult.setRequestBody(node.getRequestBody());  // Template request body
                executionResult.setStatus("FAILED");
                executionResult.setError(e.getMessage());
                executionResult.setExecutedAt(LocalDateTime.now());
                
                executionRun.getApiRunResults().add(executionResult);
                
                // Continue execution - do not break
            }
        }
        
        // Save execution run with all results
        executionRun.setStatus(overallStatus);
        executionRun.setExecutedNodes(results.size());
        executionRunRepository.save(executionRun);
        
        Map<String, Object> response = new HashMap<>();
        response.put("groupId", groupId);
        response.put("groupName", apiGroup.getName());
        response.put("status", overallStatus);
        response.put("executedNodes", results.size());
        response.put("totalNodes", nodes.size());
        response.put("results", results);
        response.put("timestamp", LocalDateTime.now().toString());
        
        log.info("Execution completed for group: {} with status: {}", groupId, overallStatus);
        
        return response;
    }
    
    private synchronized Map<String, Object> executeNode(ApiNode node, Map<String, Object> variables) throws Exception {
        log.info("Starting executeNode for: {}", node.getName());
        
        // Replace variables in URL
        String url = replaceVariables(node.getUrl(), variables);
        log.info("Template URL: {}", node.getUrl());
        log.info("Resolved URL: {}", url);
        
        // Replace variables in headers
        Map<String, String> headers = new HashMap<>();
        if (node.getHeaders() != null && !node.getHeaders().isEmpty()) {
            try {
                Map<String, String> headerMap = objectMapper.readValue(node.getHeaders(),
                    objectMapper.getTypeFactory().constructMapType(HashMap.class, String.class, String.class));
                for (Map.Entry<String, String> entry : headerMap.entrySet()) {
                    headers.put(entry.getKey(), replaceVariables(entry.getValue(), variables));
                }
            } catch (Exception e) {
                log.warn("Failed to parse headers for node: {}", node.getName(), e);
            }
        }
        
        // Replace variables in request body
        String requestBody = null;
        if (node.getRequestBody() != null && !node.getRequestBody().isEmpty()) {
            requestBody = replaceVariables(node.getRequestBody(), variables);
            log.info("Request body after variable replacement: {}", requestBody);
        }
        
        // Execute HTTP request
        HttpHeaders httpHeaders = new HttpHeaders();
        headers.forEach(httpHeaders::add);
        
        // If there's a request body and no Content-Type header, set it to application/json
        if (requestBody != null && !requestBody.isEmpty()) {
            if (!httpHeaders.containsKey("Content-Type") && !httpHeaders.containsKey("content-type")) {
                httpHeaders.set("Content-Type", "application/json");
            }
        }
        
        HttpEntity<String> entity = new HttpEntity<>(requestBody, httpHeaders);
        HttpMethod method = HttpMethod.valueOf(node.getMethod().toUpperCase());
        
        log.info("========================================");
        log.info("HTTP Request Details:");
        log.info("Method: {}", method);
        log.info("URL: {}", url);
        log.info("Request headers: {}", headers);
        log.info("Request body: {}", requestBody);
        log.info("========================================");
        
        long startTime = System.currentTimeMillis();
        RestTemplate restTemplate = getRestTemplate();
        ResponseEntity<String> response;
        
        try {
            response = restTemplate.exchange(url, method, entity, String.class);
        } catch (Exception e) {
            log.error("HTTP request failed: {} {}", method, url, e);
            throw new RuntimeException("HTTP request failed: " + e.getMessage(), e);
        }
        
        long duration = System.currentTimeMillis() - startTime;
        
        log.info("Response status: {}", response.getStatusCode());
        log.info("Response body: {}", response.getBody());
        
        // Extract variables from response - this must complete before returning
        if (node.getFieldMappings() != null && !node.getFieldMappings().isEmpty()) {
            log.info("Extracting variables from response using field mappings: {}", node.getFieldMappings());
            extractVariablesFromResponse(response.getBody(), node.getFieldMappings(), variables);
            log.info("Variables after extraction: {}", variables);
        } else {
            log.info("No field mappings defined for this node");
        }
        
        // Build result
        Map<String, Object> result = new HashMap<>();
        result.put("nodeId", node.getId());
        result.put("nodeName", node.getName());
        result.put("method", node.getMethod());
        result.put("url", url);  // This is the resolved URL with actual values
        result.put("requestBody", requestBody);  // This is the resolved request body with actual values
        result.put("status", "SUCCESS");
        result.put("statusCode", response.getStatusCode().value());
        result.put("response", response.getBody());
        result.put("duration", duration);
        result.put("timestamp", LocalDateTime.now().toString());
        
        return result;
    }
    
    private String replaceVariables(String text, Map<String, Object> variables) {
        if (text == null || text.isEmpty()) {
            return text;
        }
        
        String result = text;
        Pattern pattern = Pattern.compile("\\{\\{([^}]+)\\}\\}");
        Matcher matcher = pattern.matcher(text);
        
        while (matcher.find()) {
            String varName = matcher.group(1).trim();
            Object value = variables.get(varName);
            if (value != null) {
                result = result.replace("{{" + matcher.group(1) + "}}", value.toString());
            }
        }
        
        return result;
    }
    
    private synchronized void extractVariablesFromResponse(String responseBody, Map<String, String> fieldMappings, Map<String, Object> variables) {
        try {
            log.info("Starting variable extraction from response body");
            JsonNode jsonNode = objectMapper.readTree(responseBody);
            
            for (Map.Entry<String, String> mapping : fieldMappings.entrySet()) {
                String varName = mapping.getKey();
                String jsonPath = mapping.getValue();
                
                log.info("Attempting to extract variable '{}' from path '{}'", varName, jsonPath);
                Object value = extractValueFromJsonPath(jsonNode, jsonPath);
                if (value != null) {
                    variables.put(varName, value);
                    log.info("Successfully extracted and stored variable: {} = {}", varName, value);
                } else {
                    log.warn("Could not extract value for variable '{}' from path '{}'", varName, jsonPath);
                }
            }
            log.info("Variable extraction completed. Current variables: {}", variables);
        } catch (Exception e) {
            log.error("Error extracting variables from response", e);
        }
    }
    
    private Object extractValueFromJsonPath(JsonNode node, String path) {
        if (path == null || path.isEmpty()) {
            return null;
        }
        
        // Remove leading $ or $. if present
        String cleanPath = path.replaceFirst("^\\$\\.?", "");
        String[] parts = cleanPath.split("\\.");
        
        JsonNode current = node;
        for (String part : parts) {
            if (current == null || current.isNull()) {
                return null;
            }
            current = current.get(part);
        }
        
        if (current == null || current.isNull()) {
            return null;
        }
        
        if (current.isTextual()) {
            return current.asText();
        } else if (current.isNumber()) {
            return current.numberValue();
        } else if (current.isBoolean()) {
            return current.asBoolean();
        } else {
            return current.toString();
        }
    }
    
    public List<ApiGroupExecutionRun> getRunsByGroup(Long groupId) {
        return executionRunRepository.findByApiGroupIdOrderByExecutedAtDesc(groupId);
    }
    
    public List<ApiGroupExecutionRun> getRecentRuns(Long groupId) {
        return executionRunRepository.findTop10ByApiGroupIdOrderByExecutedAtDesc(groupId);
    }
    
    public Optional<ApiGroupExecutionRun> getRunById(Long runId) {
        return executionRunRepository.findById(runId);
    }
    
    private String getStackTraceAsString(Exception e) {
        StringBuilder sb = new StringBuilder();
        sb.append(e.toString()).append("\n");
        for (StackTraceElement element : e.getStackTrace()) {
            sb.append("\tat ").append(element.toString()).append("\n");
            if (sb.length() > 1000) break; // Limit stack trace length
        }
        return sb.toString();
    }
}

// Made with Bob