package com.apiflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.time.LocalDateTime;

@Entity
@Table(name = "column_variables")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ColumnVariable {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String variableName; // e.g., "userId", "productId"
    
    @Column(nullable = false)
    private String columnName; // Excel column name e.g., "USER_ID", "PRODUCT_ID"
    
    @Column(length = 1000)
    private String description;
    
    @Column(name = "variable_type")
    private String variableType = "COLUMN"; // To distinguish from extracted variables
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_group_id")
    @JsonBackReference("apigroup-columnvariables")
    private ApiGroup apiGroup;
    
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