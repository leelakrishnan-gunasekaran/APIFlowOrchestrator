package com.apiflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.time.LocalDateTime;

@Entity
@Table(name = "auth_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String authType; // NONE, BASIC, BEARER, OAUTH2, API_KEY
    
    @Column(length = 2000)
    private String credentials; // Encrypted credentials JSON
    
    @Column(length = 5000)
    private String headers; // Additional auth headers as JSON
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_group_id")
    @JsonBackReference
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
