package com.apiflow.controller;

import com.apiflow.model.ApiRequestHistory;
import com.apiflow.service.ApiRequestHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:3001"})
public class ApiRequestHistoryController {
    
    private final ApiRequestHistoryService historyService;
    
    @GetMapping("/request/{requestId}")
    public ResponseEntity<List<ApiRequestHistory>> getHistoryByRequestId(@PathVariable Long requestId) {
        return ResponseEntity.ok(historyService.getHistoryByRequestId(requestId));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiRequestHistory> getHistoryById(@PathVariable Long id) {
        return historyService.getHistoryById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping("/request/{requestId}")
    public ResponseEntity<ApiRequestHistory> saveHistory(
            @PathVariable Long requestId,
            @RequestBody ApiRequestHistory history) {
        try {
            ApiRequestHistory saved = historyService.saveHistory(requestId, history);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHistory(@PathVariable Long id) {
        historyService.deleteHistory(id);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/request/{requestId}/clear")
    public ResponseEntity<Void> clearHistoryForRequest(@PathVariable Long requestId) {
        historyService.clearHistoryForRequest(requestId);
        return ResponseEntity.noContent().build();
    }
}

// Made with Bob