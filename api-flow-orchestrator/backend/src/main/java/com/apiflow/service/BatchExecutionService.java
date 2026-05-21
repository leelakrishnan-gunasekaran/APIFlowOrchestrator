package com.apiflow.service;

import com.apiflow.model.ApiNode;
import com.apiflow.model.ExecutionRun;
import com.apiflow.repository.ApiNodeRepository;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BatchExecutionService {
    
    private final ApiExecutionService apiExecutionService;
    private final ApiNodeRepository apiNodeRepository;
    private final ExecutorService executorService = Executors.newFixedThreadPool(5);
    
    public List<Map<String, String>> parseCSV(MultipartFile file) throws IOException, CsvException {
        List<Map<String, String>> records = new ArrayList<>();
        
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            List<String[]> rows = reader.readAll();
            
            if (rows.isEmpty()) {
                return records;
            }
            
            // First row is header
            String[] headers = rows.get(0);
            
            // Process data rows
            for (int i = 1; i < rows.size(); i++) {
                String[] row = rows.get(i);
                Map<String, String> record = new HashMap<>();
                
                for (int j = 0; j < headers.length && j < row.length; j++) {
                    record.put(headers[j], row[j]);
                }
                
                records.add(record);
            }
        }
        
        return records;
    }
    
    public List<Map<String, String>> parseExcel(MultipartFile file) throws IOException {
        List<Map<String, String>> records = new ArrayList<>();
        
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            
            if (sheet.getPhysicalNumberOfRows() == 0) {
                return records;
            }
            
            // First row is header
            Row headerRow = sheet.getRow(0);
            List<String> headers = new ArrayList<>();
            
            for (Cell cell : headerRow) {
                headers.add(getCellValueAsString(cell));
            }
            
            // Process data rows
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                
                Map<String, String> record = new HashMap<>();
                
                for (int j = 0; j < headers.size(); j++) {
                    Cell cell = row.getCell(j);
                    String value = cell != null ? getCellValueAsString(cell) : "";
                    record.put(headers.get(j), value);
                }
                
                records.add(record);
            }
        }
        
        return records;
    }
    
    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                }
                return String.valueOf(cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return "";
        }
    }
    
    public Map<String, Object> executeBatch(Long apiGroupId, List<Map<String, String>> records, 
                                           Map<String, String> fieldMappings) {
        log.info("Starting batch execution for group {} with {} records", apiGroupId, records.size());
        
        List<ExecutionRun> results = new ArrayList<>();
        int successCount = 0;
        int failCount = 0;
        
        for (int i = 0; i < records.size(); i++) {
            Map<String, String> record = records.get(i);
            
            // Map CSV/Excel columns to API variables
            Map<String, String> variables = new HashMap<>();
            for (Map.Entry<String, String> mapping : fieldMappings.entrySet()) {
                String apiVariable = mapping.getKey();
                String csvColumn = mapping.getValue();
                
                if (record.containsKey(csvColumn)) {
                    variables.put(apiVariable, record.get(csvColumn));
                }
            }
            
            try {
                ExecutionRun run = apiExecutionService.executeApiGroup(apiGroupId, variables);
                results.add(run);
                
                if ("COMPLETED".equals(run.getStatus())) {
                    successCount++;
                } else {
                    failCount++;
                }
                
                log.info("Batch execution {}/{} completed with status: {}", 
                        i + 1, records.size(), run.getStatus());
                
            } catch (Exception e) {
                log.error("Batch execution {}/{} failed", i + 1, records.size(), e);
                failCount++;
            }
        }
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalRecords", records.size());
        summary.put("successCount", successCount);
        summary.put("failCount", failCount);
        summary.put("results", results);
        
        log.info("Batch execution completed: {} success, {} failed out of {} total", 
                successCount, failCount, records.size());
        
        return summary;
    }
    
    public CompletableFuture<Map<String, Object>> executeBatchAsync(Long apiGroupId, 
                                                                     List<Map<String, String>> records,
                                                                     Map<String, String> fieldMappings) {
        return CompletableFuture.supplyAsync(() -> 
            executeBatch(apiGroupId, records, fieldMappings), executorService);
    }
    
    public List<String> getAvailableFields(Long apiGroupId) {
        List<ApiNode> nodes = apiNodeRepository.findByApiGroupIdOrderBySequenceOrder(apiGroupId);
        Set<String> fields = new HashSet<>();
        
        for (ApiNode node : nodes) {
            // Extract variable placeholders from URL and body
            if (node.getUrl() != null) {
                extractVariables(node.getUrl(), fields);
            }
            if (node.getRequestBody() != null) {
                extractVariables(node.getRequestBody(), fields);
            }
        }
        
        return new ArrayList<>(fields);
    }
    
    private void extractVariables(String text, Set<String> fields) {
        // Extract {{variable}} patterns
        int start = 0;
        while ((start = text.indexOf("{{", start)) != -1) {
            int end = text.indexOf("}}", start);
            if (end != -1) {
                String variable = text.substring(start + 2, end).trim();
                fields.add(variable);
                start = end + 2;
            } else {
                break;
            }
        }
    }
}

// Made with Bob
