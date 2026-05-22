package com.apiflow.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.time.LocalDateTime;

@Entity
@Table(name = "api_request_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiRequestHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_request_id", nullable = false)
    @JsonBackReference("request-history")
    private ApiRequest apiRequest;
    
    @Column(nullable = false)
    private String method;
    
    @Column(nullable = false, length = 2000)
    private String url;
    
    @Column(length = 5000)
    private String requestHeaders; // JSON string
    
    @Column(length = 10000)
    private String requestBody; // JSON string
    
    @Column(name = "response_status")
    private Integer responseStatus;
    
    @Column(name = "response_status_text")
    private String responseStatusText;
    
    @Column(length = 5000)
    private String responseHeaders; // JSON string
    
    @Column(length = 50000)
    private String responseBody; // JSON string
    
    @Column(name = "duration_ms")
    private Long durationMs;
    
    @Column(name = "response_size")
    private Long responseSize;
    
    @Column(name = "success")
    private Boolean success;
    
    @Column(length = 2000)
    private String errorMessage;
    
    @Column(name = "executed_at", nullable = false)
    private LocalDateTime executedAt;
    
    @PrePersist
    protected void onCreate() {
        if (executedAt == null) {
            executedAt = LocalDateTime.now();
        }
    }
}

// Made with Bob