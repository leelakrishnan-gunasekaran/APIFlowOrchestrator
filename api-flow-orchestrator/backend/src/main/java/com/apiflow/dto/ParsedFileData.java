package com.apiflow.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class ParsedFileData {
    private String fileId;
    private String fileName;
    private List<String> headers;
    private List<Map<String, String>> rows;
    private int totalRows;
    private ColumnMapping columnMapping;
    private List<Map<String, String>> preview; // First few rows for preview
    
    @Data
    public static class ColumnMapping {
        private List<String> inputColumns;
        private List<String> assertionColumns;
        private Map<String, String> columnTypes; // column name -> type (INPUT/ASSERTION)
    }
}

// Made with Bob