package com.apiflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_case_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestCaseResult {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bulk_test_run_id", nullable = false)
    @JsonBackReference("bulktestrun-testcases")
    private BulkTestRun bulkTestRun;
    
    @Column(name = "test_case_id", nullable = false)
    private String testCaseId;
    
    @Column(name = "sequence_number")
    private Integer sequenceNumber;
    
    @Column(nullable = false)
    private String status; // PASSED, FAILED, SKIPPED, ERROR
    
    @Column(name = "execution_time_ms")
    private Long executionTime;
    
    @Column(name = "input_variables", length = 5000)
    private String inputVariables; // JSON string of input variables
    
    @Column(name = "api_response", length = 10000)
    private String apiResponse; // JSON string of API response
    
    @Column(name = "status_code")
    private Integer statusCode;
    
    @Column(name = "error_message", length = 2000)
    private String errorMessage;
    
    @Column(name = "executed_at")
    private LocalDateTime executedAt;
    
    @OneToMany(mappedBy = "testCaseResult", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference("testcase-assertions")
    private List<AssertionResult> assertionResults = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        if (executedAt == null) {
            executedAt = LocalDateTime.now();
        }
    }
    
    /**
     * Add an assertion result and update test case status if needed
     */
    public void addAssertionResult(AssertionResult assertionResult) {
        assertionResults.add(assertionResult);
        assertionResult.setTestCaseResult(this);
    }
    
    /**
     * Calculate assertion pass rate
     */
    public double getAssertionPassRate() {
        if (assertionResults.isEmpty()) {
            return 100.0;
        }
        long passedCount = assertionResults.stream()
                .filter(ar -> "PASSED".equals(ar.getStatus()))
                .count();
        return (passedCount * 100.0) / assertionResults.size();
    }
    
    /**
     * Check if all assertions passed
     */
    public boolean allAssertionsPassed() {
        return assertionResults.stream()
                .allMatch(ar -> "PASSED".equals(ar.getStatus()));
    }
    
    /**
     * Get count of passed assertions
     */
    public long getPassedAssertionsCount() {
        return assertionResults.stream()
                .filter(ar -> "PASSED".equals(ar.getStatus()))
                .count();
    }
    
    /**
     * Get count of failed assertions
     */
    public long getFailedAssertionsCount() {
        return assertionResults.stream()
                .filter(ar -> "FAILED".equals(ar.getStatus()))
                .count();
    }
}

// Made with Bob