package com.apiflow.controller;

import com.apiflow.dto.BulkTestRequest;
import com.apiflow.dto.ParsedFileData;
import com.apiflow.model.BulkTestRun;
import com.apiflow.service.BulkTestService;
import com.apiflow.service.FileParserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bulk-test")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:3001"})
public class BulkTestController {
    
    private final FileParserService fileParserService;
    private final BulkTestService bulkTestService;
    
    /**
     * Upload and parse CSV/Excel file
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        log.info("Uploading file: {}", file.getOriginalFilename());
        
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }
            
            String fileName = file.getOriginalFilename();
            if (fileName == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid file name"));
            }
            
            ParsedFileData parsedData;
            
            if (fileName.endsWith(".csv")) {
                parsedData = fileParserService.parseCsv(file);
            } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
                parsedData = fileParserService.parseExcel(file);
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Unsupported file format. Please upload CSV or Excel file."));
            }
            
            // Validate file
            fileParserService.validateFile(parsedData);
            
            // Store file data
            bulkTestService.storeFileData(parsedData);
            
            log.info("File parsed successfully: {} rows", parsedData.getTotalRows());
            
            return ResponseEntity.ok(parsedData);
            
        } catch (Exception e) {
            log.error("Error uploading file", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to parse file: " + e.getMessage()));
        }
    }
    
    /**
     * Get available fields (variables) for an API group
     */
    @GetMapping("/fields/{groupId}")
    public ResponseEntity<?> getAvailableFields(@PathVariable Long groupId) {
        log.info("Getting available fields for API group: {}", groupId);
        
        try {
            // TODO: Extract variables from API group nodes
            // For now, return example structure
            Map<String, Object> response = new HashMap<>();
            response.put("apiVariables", List.of("PRODUCT_ID", "USER_NAME", "CATEGORY"));
            response.put("assertionTypes", List.of(
                    Map.of(
                            "name", "STATUS_CODE",
                            "description", "Validate HTTP status code",
                            "example", "200"
                    ),
                    Map.of(
                            "name", "JSON_PATH",
                            "description", "Validate response field using JSON path",
                            "example", "$.data.id==123"
                    ),
                    Map.of(
                            "name", "RESPONSE_FIELD",
                            "description", "Validate specific response field",
                            "example", "message"
                    )
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting available fields", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Execute bulk tests
     */
    @PostMapping("/execute/{groupId}")
    public ResponseEntity<?> executeBulkTests(
            @PathVariable Long groupId,
            @RequestBody BulkTestRequest request) {
        
        log.info("Executing bulk tests for API group: {}", groupId);
        
        try {
            BulkTestRun bulkTestRun = bulkTestService.executeBulkTests(groupId, request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("bulkTestRunId", bulkTestRun.getId());
            response.put("status", bulkTestRun.getStatus());
            response.put("totalTests", bulkTestRun.getTotalTests());
            response.put("message", "Bulk test execution started");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error executing bulk tests", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to execute bulk tests: " + e.getMessage()));
        }
    }
    
    /**
     * Get bulk test run results
     */
    @GetMapping("/results/{runId}")
    public ResponseEntity<?> getTestResults(@PathVariable Long runId) {
        log.info("Getting test results for run: {}", runId);
        
        try {
            BulkTestRun bulkTestRun = bulkTestService.getTestRunResults(runId);
            return ResponseEntity.ok(bulkTestRun);
            
        } catch (Exception e) {
            log.error("Error getting test results", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get all bulk test runs for an API group
     */
    @GetMapping("/runs/{groupId}")
    public ResponseEntity<?> getRunsByGroup(@PathVariable Long groupId) {
        log.info("Getting bulk test runs for API group: {}", groupId);
        
        try {
            List<BulkTestRun> runs = bulkTestService.getRunsByApiGroup(groupId);
            return ResponseEntity.ok(runs);
            
        } catch (Exception e) {
            log.error("Error getting bulk test runs", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get recent bulk test runs for an API group
     */
    @GetMapping("/runs/{groupId}/recent")
    public ResponseEntity<?> getRecentRuns(@PathVariable Long groupId) {
        log.info("Getting recent bulk test runs for API group: {}", groupId);
        
        try {
            List<BulkTestRun> runs = bulkTestService.getRecentRuns(groupId);
            return ResponseEntity.ok(runs);
            
        } catch (Exception e) {
            log.error("Error getting recent bulk test runs", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Export bulk test results
     */
    @GetMapping("/export/{runId}")
    public ResponseEntity<?> exportResults(
            @PathVariable Long runId,
            @RequestParam(defaultValue = "json") String format) {
        
        log.info("Exporting test results for run: {} in format: {}", runId, format);
        
        try {
            byte[] exportData = bulkTestService.exportResults(runId, format);
            
            String contentType;
            String fileName;
            
            switch (format.toLowerCase()) {
                case "csv":
                    contentType = "text/csv";
                    fileName = "test-results-" + runId + ".csv";
                    break;
                case "pdf":
                    contentType = "application/pdf";
                    fileName = "test-results-" + runId + ".pdf";
                    break;
                default:
                    contentType = "application/json";
                    fileName = "test-results-" + runId + ".json";
            }
            
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=" + fileName)
                    .header("Content-Type", contentType)
                    .body(exportData);
                    
        } catch (Exception e) {
            log.error("Error exporting test results", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to export results: " + e.getMessage()));
        }
    }
}