package com.apiflow.dto;

import lombok.Data;
import java.util.Map;

@Data
public class BulkTestRequest {
    private String fileId;
    private Map<String, String> fieldMappings; // CSV column -> API variable
    private Map<String, AssertionMapping> assertionMappings; // Assertion name -> mapping config
    
    @Data
    public static class AssertionMapping {
        private String type; // STATUS_CODE, RESPONSE_FIELD, JSON_PATH
        private String column; // CSV column name
        private String jsonPath; // Optional: JSON path for extraction
        private String operator; // Optional: comparison operator
    }
}

// Made with Bob