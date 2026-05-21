package com.apiflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.time.LocalDateTime;

@Entity
@Table(name = "api_run_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiRunResult {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "execution_run_id")
    @JsonBackReference
    private ExecutionRun executionRun;
    
    @Column(name = "api_node_id", nullable = false)
    private Long apiNodeId;
    
    @Column(name = "api_node_name")
    private String apiNodeName;
    
    @Column(name = "sequence_order")
    private Integer sequenceOrder;
    
    @Column(nullable = false)
    private String status; // SUCCESS, FAILED, SKIPPED
    
    @Column(name = "status_code")
    private Integer statusCode;
    
    @Column(name = "duration_ms")
    private Long durationMs;
    
    @Column(length = 10000)
    private String request; // JSON string of request
    
    @Column(length = 10000)
    private String response; // JSON string of response
    
    @Column(length = 2000)
    private String errorMessage;
    
    @Column(name = "executed_at")
    private LocalDateTime executedAt;
    
    @PrePersist
    protected void onCreate() {
        executedAt = LocalDateTime.now();
    }
}

// Made with Bob
