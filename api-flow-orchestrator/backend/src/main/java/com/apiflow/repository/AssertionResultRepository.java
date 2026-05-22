package com.apiflow.repository;

import com.apiflow.model.AssertionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssertionResultRepository extends JpaRepository<AssertionResult, Long> {
    
    /**
     * Find all assertion results for a test case
     */
    List<AssertionResult> findByTestCaseResultId(Long testCaseResultId);
    
    /**
     * Find assertion results by status
     */
    List<AssertionResult> findByTestCaseResultIdAndStatus(Long testCaseResultId, String status);
    
    /**
     * Find failed assertions for a test case
     */
    @Query("SELECT a FROM AssertionResult a WHERE a.testCaseResult.id = :testCaseResultId AND a.status = 'FAILED'")
    List<AssertionResult> findFailedAssertions(@Param("testCaseResultId") Long testCaseResultId);
    
    /**
     * Find passed assertions for a test case
     */
    @Query("SELECT a FROM AssertionResult a WHERE a.testCaseResult.id = :testCaseResultId AND a.status = 'PASSED'")
    List<AssertionResult> findPassedAssertions(@Param("testCaseResultId") Long testCaseResultId);
    
    /**
     * Count assertions by status for a test case
     */
    long countByTestCaseResultIdAndStatus(Long testCaseResultId, String status);
    
    /**
     * Find all failed assertions for a bulk test run
     */
    @Query("SELECT a FROM AssertionResult a WHERE a.testCaseResult.bulkTestRun.id = :bulkTestRunId AND a.status = 'FAILED'")
    List<AssertionResult> findAllFailedAssertionsInBulkRun(@Param("bulkTestRunId") Long bulkTestRunId);
    
    /**
     * Get assertion statistics for a bulk test run
     */
    @Query("SELECT a.assertionType, COUNT(a), " +
           "SUM(CASE WHEN a.status = 'PASSED' THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN a.status = 'FAILED' THEN 1 ELSE 0 END) " +
           "FROM AssertionResult a WHERE a.testCaseResult.bulkTestRun.id = :bulkTestRunId " +
           "GROUP BY a.assertionType")
    List<Object[]> getAssertionStatisticsByType(@Param("bulkTestRunId") Long bulkTestRunId);
}

// Made with Bob