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
@Table(name = "execution_runs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionRun {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "api_group_id", nullable = false)
    private Long apiGroupId;
    
    @Column(nullable = false)
    private String status; // RUNNING, COMPLETED, FAILED, CANCELLED
    
    @Column(name = "start_time")
    private LocalDateTime startTime;
    
    @Column(name = "end_time")
    private LocalDateTime endTime;
    
    @Column(name = "total_duration_ms")
    private Long totalDurationMs;
    
    @Column(name = "is_batch_run")
    private Boolean isBatchRun = false;
    
    @Column(name = "batch_size")
    private Integer batchSize;
    
    @Column(name = "successful_count")
    private Integer successfulCount = 0;
    
    @Column(name = "failed_count")
    private Integer failedCount = 0;
    
    @OneToMany(mappedBy = "executionRun", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<ApiRunResult> apiRunResults = new ArrayList<>();
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        startTime = LocalDateTime.now();
        status = "RUNNING";
    }
}

// Made with Bob
