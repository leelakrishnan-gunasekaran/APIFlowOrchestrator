package com.apiflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "api_nodes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiNode {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String method; // GET, POST, PUT, DELETE, PATCH
    
    @Column(nullable = false, length = 2000)
    private String url;
    
    @Column(name = "sequence_order")
    private Integer sequenceOrder;
    
    @Column(length = 5000)
    private String headers; // JSON string
    
    @Column(length = 10000)
    private String requestBody; // JSON string
    
    @Column(name = "export_response")
    private Boolean exportResponse = false;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_group_id")
    @JsonBackReference
    private ApiGroup apiGroup;
    
    @ElementCollection
    @CollectionTable(name = "api_node_field_mappings", joinColumns = @JoinColumn(name = "api_node_id"))
    @MapKeyColumn(name = "field_name")
    @Column(name = "field_value")
    private Map<String, String> fieldMappings = new HashMap<>();
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

// Made with Bob
