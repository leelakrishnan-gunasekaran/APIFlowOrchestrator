package com.apiflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.time.LocalDateTime;

@Entity
@Table(name = "hook_variables")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HookVariable {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String jsonPath; // JSONPath expression to extract value
    
    @Column(name = "source_api_node_id")
    private Long sourceApiNodeId; // Which API node provides this value
    
    @Column(length = 1000)
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_group_id")
    @JsonBackReference("apigroup-variables")
    private ApiGroup apiGroup;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

// Made with Bob
