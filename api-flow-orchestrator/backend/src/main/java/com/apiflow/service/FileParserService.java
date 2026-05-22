package com.apiflow.service;

import com.apiflow.dto.ParsedFileData;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;

@Service
@Slf4j
public class FileParserService {
    
    /**
     * Parse CSV file and extract data
     */
    public ParsedFileData parseCsv(MultipartFile file) throws IOException {
        log.info("Parsing CSV file: {}", file.getOriginalFilename());
        
        ParsedFileData parsedData = new ParsedFileData();
        parsedData.setFileId(UUID.randomUUID().toString());
        parsedData.setFileName(file.getOriginalFilename());
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader().withTrim())) {
            
            // Get headers
            List<String> headers = new ArrayList<>(csvParser.getHeaderNames());
            parsedData.setHeaders(headers);
            
            // Parse rows
            List<Map<String, String>> rows = new ArrayList<>();
            for (CSVRecord record : csvParser) {
                Map<String, String> row = new HashMap<>();
                for (String header : headers) {
                    row.put(header, record.get(header));
                }
                rows.add(row);
            }
            
            parsedData.setRows(rows);
            parsedData.setTotalRows(rows.size());
            
            // Detect column types
            ParsedFileData.ColumnMapping columnMapping = detectColumnTypes(headers);
            parsedData.setColumnMapping(columnMapping);
            
            // Create preview (first 5 rows)
            List<Map<String, String>> preview = rows.subList(0, Math.min(5, rows.size()));
            parsedData.setPreview(preview);
            
            log.info("CSV parsed successfully: {} rows, {} columns", rows.size(), headers.size());
            
            return parsedData;
        }
    }
    
    /**
     * Parse Excel file and extract data
     */
    public ParsedFileData parseExcel(MultipartFile file) throws IOException {
        log.info("Parsing Excel file: {}", file.getOriginalFilename());
        
        ParsedFileData parsedData = new ParsedFileData();
        parsedData.setFileId(UUID.randomUUID().toString());
        parsedData.setFileName(file.getOriginalFilename());
        
        Workbook workbook = null;
        try {
            // Try XLSX format first
            try {
                workbook = new XSSFWorkbook(file.getInputStream());
            } catch (Exception e) {
                // Try XLS format
                workbook = new HSSFWorkbook(file.getInputStream());
            }
            
            // Get first sheet
            Sheet sheet = workbook.getSheetAt(0);
            
            // Get headers from first row
            Row headerRow = sheet.getRow(0);
            List<String> headers = new ArrayList<>();
            for (Cell cell : headerRow) {
                headers.add(getCellValueAsString(cell));
            }
            parsedData.setHeaders(headers);
            
            // Parse data rows
            List<Map<String, String>> rows = new ArrayList<>();
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                
                Map<String, String> rowData = new HashMap<>();
                for (int j = 0; j < headers.size(); j++) {
                    Cell cell = row.getCell(j);
                    String value = cell != null ? getCellValueAsString(cell) : "";
                    rowData.put(headers.get(j), value);
                }
                rows.add(rowData);
            }
            
            parsedData.setRows(rows);
            parsedData.setTotalRows(rows.size());
            
            // Detect column types
            ParsedFileData.ColumnMapping columnMapping = detectColumnTypes(headers);
            parsedData.setColumnMapping(columnMapping);
            
            // Create preview (first 5 rows)
            List<Map<String, String>> preview = rows.subList(0, Math.min(5, rows.size()));
            parsedData.setPreview(preview);
            
            log.info("Excel parsed successfully: {} rows, {} columns", rows.size(), headers.size());
            
            return parsedData;
            
        } finally {
            if (workbook != null) {
                workbook.close();
            }
        }
    }
    
    /**
     * Get cell value as string
     */
    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    return String.valueOf((long) cell.getNumericCellValue());
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return "";
        }
    }
    
    /**
     * Detect column types (input variables vs assertions)
     */
    public ParsedFileData.ColumnMapping detectColumnTypes(List<String> headers) {
        ParsedFileData.ColumnMapping columnMapping = new ParsedFileData.ColumnMapping();
        
        List<String> inputColumns = new ArrayList<>();
        List<String> assertionColumns = new ArrayList<>();
        Map<String, String> columnTypes = new HashMap<>();
        
        for (String header : headers) {
            if (header.toUpperCase().startsWith("ASSERT_")) {
                assertionColumns.add(header);
                columnTypes.put(header, "ASSERTION");
            } else if (!header.equalsIgnoreCase("TEST_CASE")) {
                inputColumns.add(header);
                columnTypes.put(header, "INPUT");
            } else {
                columnTypes.put(header, "IDENTIFIER");
            }
        }
        
        columnMapping.setInputColumns(inputColumns);
        columnMapping.setAssertionColumns(assertionColumns);
        columnMapping.setColumnTypes(columnTypes);
        
        return columnMapping;
    }
    
    /**
     * Validate file structure
     */
    public void validateFile(ParsedFileData data) {
        if (data.getHeaders() == null || data.getHeaders().isEmpty()) {
            throw new RuntimeException("File must contain headers");
        }
        
        if (data.getRows() == null || data.getRows().isEmpty()) {
            throw new RuntimeException("File must contain at least one data row");
        }
        
        if (data.getTotalRows() > 10000) {
            throw new RuntimeException("File contains too many rows. Maximum allowed: 10000");
        }
        
        log.info("File validation passed");
    }
}

// Made with Bob
