package com.apiflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bulk_test_runs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkTestRun {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "api_group_id", nullable = false)
    private Long apiGroupId;
    
    @Column(name = "file_name")
    private String fileName;
    
    @Column(name = "total_tests")
    private Integer totalTests;
    
    @Column(name = "passed_tests")
    private Integer passedTests;
    
    @Column(name = "failed_tests")
    private Integer failedTests;
    
    @Column(name = "skipped_tests")
    private Integer skippedTests;
    
    @Column(nullable = false)
    private String status; // RUNNING, COMPLETED, FAILED, CANCELLED
    
    @Column(name = "total_duration_ms")
    private Long totalDuration;
    
    @Column(name = "started_at")
    private LocalDateTime startedAt;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    @Column(name = "created_by")
    private String createdBy;
    
    @Column(length = 2000)
    private String description;
    
    @OneToMany(mappedBy = "bulkTestRun", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference("bulktestrun-testcases")
    private List<TestCaseResult> testCaseResults = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "RUNNING";
        }
        if (passedTests == null) {
            passedTests = 0;
        }
        if (failedTests == null) {
            failedTests = 0;
        }
        if (skippedTests == null) {
            skippedTests = 0;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        if ("COMPLETED".equals(status) || "FAILED".equals(status) || "CANCELLED".equals(status)) {
            if (completedAt == null) {
                completedAt = LocalDateTime.now();
            }
        }
    }
    
    /**
     * Calculate pass rate percentage
     */
    public double getPassRate() {
        if (totalTests == null || totalTests == 0) {
            return 0.0;
        }
        return (passedTests * 100.0) / totalTests;
    }
    
    /**
     * Add a test case result and update counters
     */
    public void addTestCaseResult(TestCaseResult testCaseResult) {
        testCaseResults.add(testCaseResult);
        testCaseResult.setBulkTestRun(this);
        
        // Initialize counters if null
        if (passedTests == null) passedTests = 0;
        if (failedTests == null) failedTests = 0;
        if (skippedTests == null) skippedTests = 0;
        
        // Update counters based on test case status
        if ("PASSED".equals(testCaseResult.getStatus())) {
            passedTests++;
        } else if ("FAILED".equals(testCaseResult.getStatus())) {
            failedTests++;
        } else if ("SKIPPED".equals(testCaseResult.getStatus())) {
            skippedTests++;
        }
    }
}

// Made with Bob