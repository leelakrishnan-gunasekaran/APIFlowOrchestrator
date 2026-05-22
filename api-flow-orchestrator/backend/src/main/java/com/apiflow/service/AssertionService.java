package com.apiflow.service;

import com.apiflow.dto.Assertion;
import com.apiflow.model.AssertionResult;
import com.jayway.jsonpath.JsonPath;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class AssertionService {
    
    /**
     * Validate a single assertion
     */
    public AssertionResult validateAssertion(
            Assertion assertion,
            String responseBody,
            int statusCode,
            Map<String, Object> variables) {
        
        AssertionResult result = new AssertionResult();
        result.setAssertionName(assertion.getName());
        result.setAssertionType(assertion.getType());
        result.setExpectedValue(assertion.getExpectedValue());
        
        try {
            boolean passed = false;
            String actualValue = null;
            
            switch (assertion.getType()) {
                case "STATUS_CODE":
                    actualValue = String.valueOf(statusCode);
                    passed = compareValues(actualValue, assertion.getExpectedValue(), "==");
                    break;
                    
                case "RESPONSE_FIELD":
                    actualValue = extractJsonValue(assertion.getJsonPath(), responseBody);
                    String operator = assertion.getOperator() != null ? assertion.getOperator() : "==";
                    passed = compareValues(actualValue, assertion.getExpectedValue(), operator);
                    break;
                    
                case "JSON_PATH":
                    // Parse expression like "$.data.id==123" or "$.status!=null"
                    ParsedAssertion parsed = parseExpression(assertion.getExpression());
                    actualValue = extractJsonValue(parsed.getJsonPath(), responseBody);
                    passed = compareValues(actualValue, parsed.getExpectedValue(), parsed.getOperator());
                    break;
                    
                default:
                    result.setStatus("FAILED");
                    result.setErrorMessage("Unknown assertion type: " + assertion.getType());
                    return result;
            }
            
            result.setActualValue(actualValue);
            result.setStatus(passed ? "PASSED" : "FAILED");
            
            if (!passed) {
                result.setErrorMessage(String.format(
                    "Expected %s %s %s, but got %s",
                    assertion.getJsonPath() != null ? assertion.getJsonPath() : "value",
                    assertion.getOperator() != null ? assertion.getOperator() : "==",
                    assertion.getExpectedValue(),
                    actualValue
                ));
            }
            
        } catch (Exception e) {
            log.error("Error validating assertion: {}", assertion.getName(), e);
            result.setStatus("FAILED");
            result.setErrorMessage("Assertion validation error: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Parse assertion expression like "$.data.id==123"
     */
    public ParsedAssertion parseExpression(String expression) {
        ParsedAssertion parsed = new ParsedAssertion();
        
        // Pattern to match: jsonPath operator value
        // Examples: $.data.id==123, $.status!=null, $.count>0
        Pattern pattern = Pattern.compile("^(.+?)(==|!=|>|<|>=|<=|contains|matches|startsWith|endsWith)(.+)$");
        Matcher matcher = pattern.matcher(expression.trim());
        
        if (matcher.find()) {
            parsed.setJsonPath(matcher.group(1).trim());
            parsed.setOperator(matcher.group(2).trim());
            parsed.setExpectedValue(matcher.group(3).trim());
        } else {
            // If no operator found, assume the whole expression is a JSON path
            parsed.setJsonPath(expression.trim());
            parsed.setOperator("!=");
            parsed.setExpectedValue("null");
        }
        
        return parsed;
    }
    
    /**
     * Extract value from JSON using path
     */
    public String extractJsonValue(String jsonPath, String responseBody) {
        try {
            if (jsonPath == null || jsonPath.isEmpty()) {
                return responseBody;
            }
            
            Object value = JsonPath.read(responseBody, jsonPath);
            return value != null ? value.toString() : "null";
            
        } catch (Exception e) {
            log.warn("Failed to extract JSON value for path: {}", jsonPath, e);
            return "null";
        }
    }
    
    /**
     * Compare values using operator
     */
    public boolean compareValues(Object actual, Object expected, String operator) {
        if (actual == null) {
            actual = "null";
        }
        if (expected == null) {
            expected = "null";
        }
        
        String actualStr = actual.toString();
        String expectedStr = expected.toString();
        
        try {
            switch (operator) {
                case "==":
                    return actualStr.equals(expectedStr);
                    
                case "!=":
                    return !actualStr.equals(expectedStr);
                    
                case ">":
                    return Double.parseDouble(actualStr) > Double.parseDouble(expectedStr);
                    
                case "<":
                    return Double.parseDouble(actualStr) < Double.parseDouble(expectedStr);
                    
                case ">=":
                    return Double.parseDouble(actualStr) >= Double.parseDouble(expectedStr);
                    
                case "<=":
                    return Double.parseDouble(actualStr) <= Double.parseDouble(expectedStr);
                    
                case "contains":
                    return actualStr.contains(expectedStr);
                    
                case "matches":
                    return actualStr.matches(expectedStr);
                    
                case "startsWith":
                    return actualStr.startsWith(expectedStr);
                    
                case "endsWith":
                    return actualStr.endsWith(expectedStr);
                    
                default:
                    log.warn("Unknown operator: {}", operator);
                    return false;
            }
        } catch (NumberFormatException e) {
            log.warn("Failed to parse numbers for comparison: {} {} {}", actualStr, operator, expectedStr);
            return false;
        }
    }
    
    /**
     * Parsed assertion data
     */
    @Data
    public static class ParsedAssertion {
        private String jsonPath;
        private String operator;
        private String expectedValue;
    }
}

// Made with Bob
