package com.apiflow.controller;

import com.apiflow.service.BatchExecutionService;
import com.opencsv.exceptions.CsvException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/batch")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:3001"})
@Slf4j
public class BatchExecutionController {
    
    private final BatchExecutionService batchExecutionService;
    
    @PostMapping("/parse-csv")
    public ResponseEntity<?> parseCSV(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }
            
            if (!file.getOriginalFilename().endsWith(".csv")) {
                return ResponseEntity.badRequest().body("File must be a CSV");
            }
            
            List<Map<String, String>> records = batchExecutionService.parseCSV(file);
            
            return ResponseEntity.ok(Map.of(
                "records", records,
                "count", records.size(),
                "columns", records.isEmpty() ? List.of() : records.get(0).keySet()
            ));
            
        } catch (IOException | CsvException e) {
            log.error("Error parsing CSV file", e);
            return ResponseEntity.badRequest().body("Error parsing CSV: " + e.getMessage());
        }
    }
    
    @PostMapping("/parse-excel")
    public ResponseEntity<?> parseExcel(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }
            
            String filename = file.getOriginalFilename();
            if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
                return ResponseEntity.badRequest().body("File must be an Excel file (.xlsx or .xls)");
            }
            
            List<Map<String, String>> records = batchExecutionService.parseExcel(file);
            
            return ResponseEntity.ok(Map.of(
                "records", records,
                "count", records.size(),
                "columns", records.isEmpty() ? List.of() : records.get(0).keySet()
            ));
            
        } catch (IOException e) {
            log.error("Error parsing Excel file", e);
            return ResponseEntity.badRequest().body("Error parsing Excel: " + e.getMessage());
        }
    }
    
    @GetMapping("/fields/{apiGroupId}")
    public ResponseEntity<List<String>> getAvailableFields(@PathVariable Long apiGroupId) {
        List<String> fields = batchExecutionService.getAvailableFields(apiGroupId);
        return ResponseEntity.ok(fields);
    }
    
    @PostMapping("/execute/{apiGroupId}")
    public ResponseEntity<?> executeBatch(
            @PathVariable Long apiGroupId,
            @RequestBody Map<String, Object> request) {
        
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, String>> records = (List<Map<String, String>>) request.get("records");
            
            @SuppressWarnings("unchecked")
            Map<String, String> fieldMappings = (Map<String, String>) request.get("fieldMappings");
            
            if (records == null || records.isEmpty()) {
                return ResponseEntity.badRequest().body("No records provided");
            }
            
            if (fieldMappings == null || fieldMappings.isEmpty()) {
                return ResponseEntity.badRequest().body("No field mappings provided");
            }
            
            Map<String, Object> result = batchExecutionService.executeBatch(apiGroupId, records, fieldMappings);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error executing batch", e);
            return ResponseEntity.badRequest().body("Error executing batch: " + e.getMessage());
        }
    }
    
    @PostMapping("/execute-async/{apiGroupId}")
    public ResponseEntity<?> executeBatchAsync(
            @PathVariable Long apiGroupId,
            @RequestBody Map<String, Object> request) {
        
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, String>> records = (List<Map<String, String>>) request.get("records");
            
            @SuppressWarnings("unchecked")
            Map<String, String> fieldMappings = (Map<String, String>) request.get("fieldMappings");
            
            if (records == null || records.isEmpty()) {
                return ResponseEntity.badRequest().body("No records provided");
            }
            
            if (fieldMappings == null || fieldMappings.isEmpty()) {
                return ResponseEntity.badRequest().body("No field mappings provided");
            }
            
            // Start async execution
            batchExecutionService.executeBatchAsync(apiGroupId, records, fieldMappings);
            
            return ResponseEntity.ok(Map.of(
                "message", "Batch execution started",
                "totalRecords", records.size()
            ));
            
        } catch (Exception e) {
            log.error("Error starting async batch execution", e);
            return ResponseEntity.badRequest().body("Error starting batch: " + e.getMessage());
        }
    }
}

// Made with Bob
