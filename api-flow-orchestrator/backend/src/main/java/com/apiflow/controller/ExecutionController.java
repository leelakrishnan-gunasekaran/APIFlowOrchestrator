package com.apiflow.controller;

import com.apiflow.model.ApiGroupExecutionRun;
import com.apiflow.service.BatchExecutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/execution")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:3001"})
public class ExecutionController {
    
    private final BatchExecutionService batchExecutionService;
    
    @PostMapping("/run/{groupId}")
    public ResponseEntity<Map<String, Object>> executeApiGroup(
            @PathVariable Long groupId,
            @RequestBody(required = false) Map<String, Object> variables) {
        log.info("Executing API Group: {}", groupId);
        try {
            Map<String, Object> result = batchExecutionService.executeApiGroup(groupId, variables);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error executing API Group: {}", groupId, e);
            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "status", "FAILED",
                            "error", e.getMessage()
                    ));
        }
    }
    
    @GetMapping("/trigger/{groupId}")
    public ResponseEntity<Map<String, Object>> triggerApiGroup(@PathVariable Long groupId) {
        log.info("Triggering API Group via URL: {}", groupId);
        try {
            Map<String, Object> result = batchExecutionService.executeApiGroup(groupId, null);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error triggering API Group: {}", groupId, e);
            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "status", "FAILED",
                            "error", e.getMessage()
                    ));
        }
    }
    
    @GetMapping("/runs/{groupId}")
    public ResponseEntity<List<ApiGroupExecutionRun>> getRunsByGroup(@PathVariable Long groupId) {
        log.info("Getting execution runs for group: {}", groupId);
        List<ApiGroupExecutionRun> runs = batchExecutionService.getRunsByGroup(groupId);
        return ResponseEntity.ok(runs);
    }
    
    @GetMapping("/runs/{groupId}/recent")
    public ResponseEntity<List<ApiGroupExecutionRun>> getRecentRuns(@PathVariable Long groupId) {
        log.info("Getting recent execution runs for group: {}", groupId);
        List<ApiGroupExecutionRun> runs = batchExecutionService.getRecentRuns(groupId);
        return ResponseEntity.ok(runs);
    }
    
    @GetMapping("/run/{runId}")
    public ResponseEntity<ApiGroupExecutionRun> getRunById(@PathVariable Long runId) {
        log.info("Getting execution run: {}", runId);
        return batchExecutionService.getRunById(runId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

// Made with Bob