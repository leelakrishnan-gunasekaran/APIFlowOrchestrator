package com.apiflow.repository;

import com.apiflow.model.BulkTestRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BulkTestRunRepository extends JpaRepository<BulkTestRun, Long> {
    
    /**
     * Find all bulk test runs for a specific API group
     */
    List<BulkTestRun> findByApiGroupIdOrderByStartedAtDesc(Long apiGroupId);
    
    /**
     * Find recent bulk test runs for a specific API group
     */
    List<BulkTestRun> findTop10ByApiGroupIdOrderByStartedAtDesc(Long apiGroupId);
    
    /**
     * Find bulk test runs by status
     */
    List<BulkTestRun> findByStatusOrderByStartedAtDesc(String status);
    
    /**
     * Find bulk test runs by API group and status
     */
    List<BulkTestRun> findByApiGroupIdAndStatusOrderByStartedAtDesc(Long apiGroupId, String status);
    
    /**
     * Find bulk test runs within a date range
     */
    @Query("SELECT b FROM BulkTestRun b WHERE b.startedAt BETWEEN :startDate AND :endDate ORDER BY b.startedAt DESC")
    List<BulkTestRun> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find bulk test runs by created user
     */
    List<BulkTestRun> findByCreatedByOrderByStartedAtDesc(String createdBy);
    
    /**
     * Count total bulk test runs for an API group
     */
    long countByApiGroupId(Long apiGroupId);
    
    /**
     * Count bulk test runs by status for an API group
     */
    long countByApiGroupIdAndStatus(Long apiGroupId, String status);
    
    /**
     * Get average pass rate for an API group
     */
    @Query("SELECT AVG((b.passedTests * 100.0) / b.totalTests) FROM BulkTestRun b WHERE b.apiGroupId = :apiGroupId AND b.totalTests > 0")
    Double getAveragePassRateByApiGroupId(@Param("apiGroupId") Long apiGroupId);
}

// Made with Bob