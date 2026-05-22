package com.apiflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.time.LocalDateTime;

@Entity
@Table(name = "api_node_execution_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiNodeExecutionResult {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "execution_run_id", nullable = false)
    @JsonBackReference("executionrun-results")
    private ApiGroupExecutionRun executionRun;
    
    @Column(name = "api_node_id", nullable = false)
    private Long apiNodeId;
    
    @Column(name = "node_name")
    private String nodeName;
    
    @Column(nullable = false)
    private String method;
    
    @Column(length = 2000)
    private String url;
    
    @Column(name = "request_body", length = 10000)
    private String requestBody;
    
    @Column(nullable = false)
    private String status; // SUCCESS, FAILED
    
    @Column(name = "status_code")
    private Integer statusCode;
    
    @Column(length = 50000)
    private String response;
    
    @Column(name = "duration_ms")
    private Long duration;
    
    @Column(length = 5000)
    private String error;
    
    @Column(name = "executed_at")
    private LocalDateTime executedAt;
    
    @PrePersist
    protected void onCreate() {
        if (executedAt == null) {
            executedAt = LocalDateTime.now();
        }
    }
}

// Made with Bob