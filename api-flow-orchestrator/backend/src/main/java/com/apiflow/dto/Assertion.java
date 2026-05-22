package com.apiflow.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Assertion {
    private String name;
    private String type; // STATUS_CODE, RESPONSE_FIELD, JSON_PATH, CUSTOM
    private String expression; // Full expression (e.g., "$.data.id==123")
    private String expectedValue;
    private String jsonPath; // Extracted JSON path (e.g., "$.data.id")
    private String operator; // Extracted operator (e.g., "==")
    
    /**
     * Create a status code assertion
     */
    public static Assertion statusCode(String name, String expectedCode) {
        Assertion assertion = new Assertion();
        assertion.setName(name);
        assertion.setType("STATUS_CODE");
        assertion.setExpectedValue(expectedCode);
        return assertion;
    }
    
    /**
     * Create a JSON path assertion
     */
    public static Assertion jsonPath(String name, String expression) {
        Assertion assertion = new Assertion();
        assertion.setName(name);
        assertion.setType("JSON_PATH");
        assertion.setExpression(expression);
        return assertion;
    }
    
    /**
     * Create a response field assertion
     */
    public static Assertion responseField(String name, String fieldName, String expectedValue) {
        Assertion assertion = new Assertion();
        assertion.setName(name);
        assertion.setType("RESPONSE_FIELD");
        assertion.setJsonPath("$." + fieldName);
        assertion.setExpectedValue(expectedValue);
        assertion.setOperator("==");
        return assertion;
    }
}

// Made with Bob