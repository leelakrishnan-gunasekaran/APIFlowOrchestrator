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
@Table(name = "api_groups")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiGroup {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(length = 1000)
    private String description;
    
    @OneToMany(mappedBy = "apiGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("apigroup-nodes")
    private List<ApiNode> apiNodes = new ArrayList<>();
    
    @OneToMany(mappedBy = "apiGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("apigroup-variables")
    private List<HookVariable> hookVariables = new ArrayList<>();
    
    @OneToOne(mappedBy = "apiGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("apigroup-authprofile")
    private AuthProfile authProfile;
    
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
