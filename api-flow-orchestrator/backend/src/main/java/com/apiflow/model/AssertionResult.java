package com.apiflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.time.LocalDateTime;

@Entity
@Table(name = "assertion_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssertionResult {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_case_result_id", nullable = false)
    @JsonBackReference("testcase-assertions")
    private TestCaseResult testCaseResult;
    
    @Column(name = "assertion_name", nullable = false)
    private String assertionName;
    
    @Column(name = "assertion_type", nullable = false)
    private String assertionType; // STATUS_CODE, RESPONSE_FIELD, JSON_PATH, CUSTOM
    
    @Column(length = 1000)
    private String expression; // The assertion expression (e.g., "$.data.id==123")
    
    @Column(name = "expected_value", length = 2000)
    private String expectedValue;
    
    @Column(name = "actual_value", length = 2000)
    private String actualValue;
    
    @Column(nullable = false)
    private String status; // PASSED, FAILED
    
    @Column(name = "error_message", length = 2000)
    private String errorMessage;
    
    @Column(name = "operator")
    private String operator; // ==, !=, >, <, >=, <=, contains, matches, etc.
    
    @Column(name = "json_path")
    private String jsonPath; // JSON path used for extraction (e.g., "$.data.id")
    
    @Column(name = "execution_time_ms")
    private Long executionTime;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
    
    /**
     * Check if assertion passed
     */
    public boolean isPassed() {
        return "PASSED".equals(status);
    }
    
    /**
     * Check if assertion failed
     */
    public boolean isFailed() {
        return "FAILED".equals(status);
    }
    
    /**
     * Create a passed assertion result
     */
    public static AssertionResult passed(String name, String type, String expected, String actual) {
        AssertionResult result = new AssertionResult();
        result.setAssertionName(name);
        result.setAssertionType(type);
        result.setExpectedValue(expected);
        result.setActualValue(actual);
        result.setStatus("PASSED");
        return result;
    }
    
    /**
     * Create a failed assertion result
     */
    public static AssertionResult failed(String name, String type, String expected, String actual, String errorMessage) {
        AssertionResult result = new AssertionResult();
        result.setAssertionName(name);
        result.setAssertionType(type);
        result.setExpectedValue(expected);
        result.setActualValue(actual);
        result.setStatus("FAILED");
        result.setErrorMessage(errorMessage);
        return result;
    }
}

// Made with Bob