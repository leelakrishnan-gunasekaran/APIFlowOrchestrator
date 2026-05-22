package com.apiflow.repository;

import com.apiflow.model.TestCaseResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestCaseResultRepository extends JpaRepository<TestCaseResult, Long> {
    
    /**
     * Find all test case results for a bulk test run
     */
    List<TestCaseResult> findByBulkTestRunIdOrderBySequenceNumber(Long bulkTestRunId);
    
    /**
     * Find test case results by status
     */
    List<TestCaseResult> findByBulkTestRunIdAndStatus(Long bulkTestRunId, String status);
    
    /**
     * Find test case result by test case ID
     */
    TestCaseResult findByBulkTestRunIdAndTestCaseId(Long bulkTestRunId, String testCaseId);
    
    /**
     * Count test cases by status for a bulk test run
     */
    long countByBulkTestRunIdAndStatus(Long bulkTestRunId, String status);
    
    /**
     * Get failed test cases for a bulk test run
     */
    @Query("SELECT t FROM TestCaseResult t WHERE t.bulkTestRun.id = :bulkTestRunId AND t.status = 'FAILED' ORDER BY t.sequenceNumber")
    List<TestCaseResult> findFailedTestCases(@Param("bulkTestRunId") Long bulkTestRunId);
    
    /**
     * Get passed test cases for a bulk test run
     */
    @Query("SELECT t FROM TestCaseResult t WHERE t.bulkTestRun.id = :bulkTestRunId AND t.status = 'PASSED' ORDER BY t.sequenceNumber")
    List<TestCaseResult> findPassedTestCases(@Param("bulkTestRunId") Long bulkTestRunId);
    
    /**
     * Get average execution time for a bulk test run
     */
    @Query("SELECT AVG(t.executionTime) FROM TestCaseResult t WHERE t.bulkTestRun.id = :bulkTestRunId")
    Double getAverageExecutionTime(@Param("bulkTestRunId") Long bulkTestRunId);
    
    /**
     * Get slowest test cases
     */
    @Query("SELECT t FROM TestCaseResult t WHERE t.bulkTestRun.id = :bulkTestRunId ORDER BY t.executionTime DESC")
    List<TestCaseResult> findSlowestTestCases(@Param("bulkTestRunId") Long bulkTestRunId);
}

// Made with Bob