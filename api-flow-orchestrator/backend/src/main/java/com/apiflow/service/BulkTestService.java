package com.apiflow.service;

import com.apiflow.dto.Assertion;
import com.apiflow.dto.BulkTestRequest;
import com.apiflow.dto.ParsedFileData;
import com.apiflow.model.*;
import com.apiflow.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class BulkTestService {
    
    private final BulkTestRunRepository bulkTestRunRepository;
    private final TestCaseResultRepository testCaseResultRepository;
    private final ApiGroupRepository apiGroupRepository;
    private final ApiNodeRepository apiNodeRepository;
    private final BatchExecutionService batchExecutionService;
    private final AssertionService assertionService;
    private final ObjectMapper objectMapper;
    
    // Store parsed file data temporarily (in production, use Redis or database)
    private final Map<String, ParsedFileData> fileDataCache = new ConcurrentHashMap<>();
    
    /**
     * Store parsed file data
     */
    public void storeFileData(ParsedFileData fileData) {
        fileDataCache.put(fileData.getFileId(), fileData);
        log.info("Stored file data: {} with {} rows", fileData.getFileId(), fileData.getTotalRows());
    }
    
    /**
     * Get stored file data
     */
    public ParsedFileData getFileData(String fileId) {
        return fileDataCache.get(fileId);
    }
    
    /**
     * Execute bulk tests from parsed file data
     */
    @Transactional
    public BulkTestRun executeBulkTests(
            Long apiGroupId,
            BulkTestRequest request) {
        
        log.info("Starting bulk test execution for API Group: {}", apiGroupId);
        
        // Validate API group exists
        ApiGroup apiGroup = apiGroupRepository.findById(apiGroupId)
                .orElseThrow(() -> new RuntimeException("API Group not found: " + apiGroupId));
        
        // Get file data
        ParsedFileData fileData = getFileData(request.getFileId());
        if (fileData == null) {
            throw new RuntimeException("File data not found: " + request.getFileId());
        }
        
        // Create bulk test run
        BulkTestRun bulkTestRun = new BulkTestRun();
        bulkTestRun.setApiGroupId(apiGroupId);
        bulkTestRun.setFileName(fileData.getFileName());
        bulkTestRun.setTotalTests(fileData.getTotalRows());
        bulkTestRun.setStatus("RUNNING");
        bulkTestRun.setStartedAt(LocalDateTime.now());
        
        bulkTestRun = bulkTestRunRepository.save(bulkTestRun);
        
        log.info("Created bulk test run: {}", bulkTestRun.getId());
        
        // Execute tests
        try {
            executeTests(bulkTestRun, fileData, request, apiGroupId);
            
            bulkTestRun.setStatus("COMPLETED");
            bulkTestRun.setCompletedAt(LocalDateTime.now());
            
        } catch (Exception e) {
            log.error("Bulk test execution failed", e);
            bulkTestRun.setStatus("FAILED");
            bulkTestRun.setCompletedAt(LocalDateTime.now());
        }
        
        // Calculate total duration
        if (bulkTestRun.getStartedAt() != null && bulkTestRun.getCompletedAt() != null) {
            long duration = java.time.Duration.between(
                    bulkTestRun.getStartedAt(),
                    bulkTestRun.getCompletedAt()
            ).toMillis();
            bulkTestRun.setTotalDuration(duration);
        }
        
        bulkTestRun = bulkTestRunRepository.save(bulkTestRun);
        
        log.info("Bulk test run completed: {} (Status: {}, Passed: {}, Failed: {})",
                bulkTestRun.getId(),
                bulkTestRun.getStatus(),
                bulkTestRun.getPassedTests(),
                bulkTestRun.getFailedTests());
        
        return bulkTestRun;
    }
    
    /**
     * Execute individual tests
     */
    private void executeTests(
            BulkTestRun bulkTestRun,
            ParsedFileData fileData,
            BulkTestRequest request,
            Long apiGroupId) {
        
        int sequenceNumber = 1;
        
        for (Map<String, String> rowData : fileData.getRows()) {
            try {
                log.info("Executing test case {}/{}", sequenceNumber, fileData.getTotalRows());
                
                // Prepare input variables
                Map<String, Object> inputVariables = prepareInputVariables(rowData, request.getFieldMappings());
                
                // Prepare assertions
                List<Assertion> assertions = prepareAssertions(rowData, request.getAssertionMappings());
                
                // Get test case ID
                String testCaseId = rowData.getOrDefault("TEST_CASE", "TC" + sequenceNumber);
                
                // Execute test case
                TestCaseResult testCaseResult = executeTestCase(
                        bulkTestRun,
                        testCaseId,
                        sequenceNumber,
                        apiGroupId,
                        inputVariables,
                        assertions
                );
                
                bulkTestRun.addTestCaseResult(testCaseResult);
                
            } catch (Exception e) {
                log.error("Error executing test case {}", sequenceNumber, e);
                
                // Create failed test case result
                TestCaseResult failedResult = new TestCaseResult();
                failedResult.setBulkTestRun(bulkTestRun);
                failedResult.setTestCaseId("TC" + sequenceNumber);
                failedResult.setSequenceNumber(sequenceNumber);
                failedResult.setStatus("ERROR");
                failedResult.setErrorMessage(e.getMessage());
                failedResult.setExecutedAt(LocalDateTime.now());
                
                bulkTestRun.addTestCaseResult(failedResult);
            }
            
            sequenceNumber++;
        }
    }
    
    /**
     * Execute single test case
     */
    private TestCaseResult executeTestCase(
            BulkTestRun bulkTestRun,
            String testCaseId,
            int sequenceNumber,
            Long apiGroupId,
            Map<String, Object> inputVariables,
            List<Assertion> assertions) {
        
        long startTime = System.currentTimeMillis();
        
        TestCaseResult testCaseResult = new TestCaseResult();
        testCaseResult.setBulkTestRun(bulkTestRun);
        testCaseResult.setTestCaseId(testCaseId);
        testCaseResult.setSequenceNumber(sequenceNumber);
        testCaseResult.setExecutedAt(LocalDateTime.now());
        
        try {
            // Store input variables as JSON
            testCaseResult.setInputVariables(objectMapper.writeValueAsString(inputVariables));
            
            // Execute API group with variables
            Map<String, Object> executionResult = batchExecutionService.executeApiGroup(apiGroupId, inputVariables);
            
            // Get the last API response (assuming single API or last in chain)
            List<Map<String, Object>> results = (List<Map<String, Object>>) executionResult.get("results");
            if (results != null && !results.isEmpty()) {
                Map<String, Object> lastResult = results.get(results.size() - 1);
                
                String responseBody = (String) lastResult.get("response");
                Integer statusCode = (Integer) lastResult.get("statusCode");
                
                testCaseResult.setApiResponse(responseBody);
                testCaseResult.setStatusCode(statusCode);
                
                // Validate assertions
                boolean allPassed = true;
                for (Assertion assertion : assertions) {
                    AssertionResult assertionResult = assertionService.validateAssertion(
                            assertion,
                            responseBody,
                            statusCode != null ? statusCode : 0,
                            inputVariables
                    );
                    
                    testCaseResult.addAssertionResult(assertionResult);
                    
                    if (!"PASSED".equals(assertionResult.getStatus())) {
                        allPassed = false;
                    }
                }
                
                testCaseResult.setStatus(allPassed ? "PASSED" : "FAILED");
            } else {
                testCaseResult.setStatus("FAILED");
                testCaseResult.setErrorMessage("No API execution results");
            }
            
        } catch (Exception e) {
            log.error("Error executing test case: {}", testCaseId, e);
            testCaseResult.setStatus("FAILED");
            testCaseResult.setErrorMessage(e.getMessage());
        }
        
        testCaseResult.setExecutionTime(System.currentTimeMillis() - startTime);
        
        return testCaseResult;
    }
    
    /**
     * Prepare input variables from row data
     */
    private Map<String, Object> prepareInputVariables(
            Map<String, String> rowData,
            Map<String, String> fieldMappings) {
        
        Map<String, Object> variables = new HashMap<>();
        
        if (fieldMappings != null) {
            for (Map.Entry<String, String> mapping : fieldMappings.entrySet()) {
                String csvColumn = mapping.getKey();
                String apiVariable = mapping.getValue();
                
                // Extract variable name from {{VARIABLE_NAME}}
                String varName = apiVariable.replaceAll("[{}]", "").trim();
                
                String value = rowData.get(csvColumn);
                if (value != null) {
                    variables.put(varName, value);
                }
            }
        }
        
        return variables;
    }
    
    /**
     * Prepare assertions from row data
     */
    private List<Assertion> prepareAssertions(
            Map<String, String> rowData,
            Map<String, BulkTestRequest.AssertionMapping> assertionMappings) {
        
        List<Assertion> assertions = new ArrayList<>();
        
        if (assertionMappings != null) {
            for (Map.Entry<String, BulkTestRequest.AssertionMapping> entry : assertionMappings.entrySet()) {
                String assertionName = entry.getKey();
                BulkTestRequest.AssertionMapping mapping = entry.getValue();
                
                String expectedValue = rowData.get(mapping.getColumn());
                if (expectedValue != null && !expectedValue.isEmpty()) {
                    Assertion assertion = new Assertion();
                    assertion.setName(assertionName);
                    assertion.setType(mapping.getType());
                    assertion.setExpectedValue(expectedValue);
                    assertion.setJsonPath(mapping.getJsonPath());
                    assertion.setOperator(mapping.getOperator());
                    
                    // For JSON_PATH type, the expected value might be the full expression
                    if ("JSON_PATH".equals(mapping.getType())) {
                        assertion.setExpression(expectedValue);
                    }
                    
                    assertions.add(assertion);
                }
            }
        }
        
        return assertions;
    }
    
    /**
     * Get bulk test run results
     */
    public BulkTestRun getTestRunResults(Long runId) {
        return bulkTestRunRepository.findById(runId)
                .orElseThrow(() -> new RuntimeException("Bulk test run not found: " + runId));
    }
    
    /**
     * Get all bulk test runs for an API group
     */
    public List<BulkTestRun> getRunsByApiGroup(Long apiGroupId) {
        return bulkTestRunRepository.findByApiGroupIdOrderByStartedAtDesc(apiGroupId);
    }
    
    /**
     * Get recent bulk test runs for an API group
     */
    public List<BulkTestRun> getRecentRuns(Long apiGroupId) {
        return bulkTestRunRepository.findTop10ByApiGroupIdOrderByStartedAtDesc(apiGroupId);
    }
    
    /**
     * Export results in various formats
     */
    public byte[] exportResults(Long runId, String format) {
        BulkTestRun bulkTestRun = getTestRunResults(runId);
        
        try {
            switch (format.toLowerCase()) {
                case "csv":
                    return exportToCsv(bulkTestRun);
                case "json":
                    return exportToJson(bulkTestRun);
                case "pdf":
                    // PDF export can be added later
                    throw new UnsupportedOperationException("PDF export not yet implemented");
                default:
                    return exportToJson(bulkTestRun);
            }
        } catch (Exception e) {
            log.error("Error exporting results", e);
            throw new RuntimeException("Failed to export results: " + e.getMessage());
        }
    }
    
    /**
     * Export to JSON format
     */
    private byte[] exportToJson(BulkTestRun bulkTestRun) throws Exception {
        String json = objectMapper.writerWithDefaultPrettyPrinter()
                .writeValueAsString(bulkTestRun);
        return json.getBytes();
    }
    
    /**
     * Export to CSV format
     */
    private byte[] exportToCsv(BulkTestRun bulkTestRun) {
        StringBuilder csv = new StringBuilder();
        
        // Header
        csv.append("Test Case ID,Sequence,Status,Execution Time (ms),Status Code,");
        csv.append("Input Variables,Assertions Passed,Assertions Failed,Error Message\n");
        
        // Data rows
        for (TestCaseResult testCase : bulkTestRun.getTestCaseResults()) {
            csv.append(escapeCsv(testCase.getTestCaseId())).append(",");
            csv.append(testCase.getSequenceNumber()).append(",");
            csv.append(testCase.getStatus()).append(",");
            csv.append(testCase.getExecutionTime()).append(",");
            csv.append(testCase.getStatusCode() != null ? testCase.getStatusCode() : "").append(",");
            csv.append(escapeCsv(testCase.getInputVariables())).append(",");
            
            // Count assertions
            long passedAssertions = testCase.getAssertionResults().stream()
                    .filter(a -> "PASSED".equals(a.getStatus()))
                    .count();
            long failedAssertions = testCase.getAssertionResults().stream()
                    .filter(a -> "FAILED".equals(a.getStatus()))
                    .count();
            
            csv.append(passedAssertions).append(",");
            csv.append(failedAssertions).append(",");
            csv.append(escapeCsv(testCase.getErrorMessage())).append("\n");
        }
        
        return csv.toString().getBytes();
    }
    
    /**
     * Escape CSV values
     */
    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}