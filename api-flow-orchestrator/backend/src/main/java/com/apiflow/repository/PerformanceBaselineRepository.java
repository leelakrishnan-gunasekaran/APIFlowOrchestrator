package com.apiflow.repository;

import com.apiflow.model.PerformanceBaseline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PerformanceBaselineRepository extends JpaRepository<PerformanceBaseline, Long> {
    Optional<PerformanceBaseline> findByApiNodeId(Long apiNodeId);
}

// Made with Bob
