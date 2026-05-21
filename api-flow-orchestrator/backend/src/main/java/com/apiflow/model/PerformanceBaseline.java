package com.apiflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "performance_baselines")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceBaseline {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "api_node_id", nullable = false)
    private Long apiNodeId;
    
    @Column(name = "avg_duration_ms")
    private Long avgDurationMs;
    
    @Column(name = "min_duration_ms")
    private Long minDurationMs;
    
    @Column(name = "max_duration_ms")
    private Long maxDurationMs;
    
    @Column(name = "sample_count")
    private Integer sampleCount;
    
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastUpdated = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
}

// Made with Bob
