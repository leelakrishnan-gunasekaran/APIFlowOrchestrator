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
@Table(name = "api_group_execution_runs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiGroupExecutionRun {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "api_group_id", nullable = false)
    private Long apiGroupId;
    
    @Column(nullable = false)
    private String status; // SUCCESS, FAILED, PARTIAL_SUCCESS
    
    @Column(name = "executed_at", nullable = false)
    private LocalDateTime executedAt;
    
    @Column(name = "total_nodes")
    private Integer totalNodes;
    
    @Column(name = "executed_nodes")
    private Integer executedNodes;
    
    @OneToMany(mappedBy = "executionRun", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("executionrun-results")
    private List<ApiNodeExecutionResult> apiRunResults = new ArrayList<>();
    
    @PrePersist
    protected void onCreate() {
        if (executedAt == null) {
            executedAt = LocalDateTime.now();
        }
    }
}

// Made with Bob