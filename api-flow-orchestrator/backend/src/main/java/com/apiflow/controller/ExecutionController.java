package com.apiflow.controller;

import com.apiflow.model.ExecutionRun;
import com.apiflow.repository.ExecutionRunRepository;
import com.apiflow.service.ApiExecutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/execution")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:3001"})
public class ExecutionController {
    
    private final ApiExecutionService apiExecutionService;
    private final ExecutionRunRepository executionRunRepository;
    
    @PostMapping("/run/{apiGroupId}")
    public ResponseEntity<ExecutionRun> executeApiGroup(
            @PathVariable Long apiGroupId,
            @RequestBody(required = false) Map<String, String> variables) {
        
        Map<String, String> initialVariables = variables != null ? variables : new HashMap<>();
        ExecutionRun executionRun = apiExecutionService.executeApiGroup(apiGroupId, initialVariables);
        
        return ResponseEntity.ok(executionRun);
    }
    
    @GetMapping("/runs/{apiGroupId}")
    public ResponseEntity<List<ExecutionRun>> getExecutionRuns(@PathVariable Long apiGroupId) {
        List<ExecutionRun> runs = executionRunRepository.findByApiGroupIdOrderByCreatedAtDesc(apiGroupId);
        return ResponseEntity.ok(runs);
    }
    
    @GetMapping("/runs/{apiGroupId}/recent")
    public ResponseEntity<List<ExecutionRun>> getRecentExecutionRuns(@PathVariable Long apiGroupId) {
        List<ExecutionRun> runs = executionRunRepository.findTop10ByApiGroupIdOrderByCreatedAtDesc(apiGroupId);
        return ResponseEntity.ok(runs);
    }
    
    @GetMapping("/run/{runId}")
    public ResponseEntity<ExecutionRun> getExecutionRunById(@PathVariable Long runId) {
        return executionRunRepository.findById(runId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

// Made with Bob
