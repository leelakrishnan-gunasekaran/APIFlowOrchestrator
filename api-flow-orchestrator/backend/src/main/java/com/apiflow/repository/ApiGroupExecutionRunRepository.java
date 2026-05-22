package com.apiflow.repository;

import com.apiflow.model.ApiGroupExecutionRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ApiGroupExecutionRunRepository extends JpaRepository<ApiGroupExecutionRun, Long> {
    List<ApiGroupExecutionRun> findByApiGroupIdOrderByExecutedAtDesc(Long apiGroupId);
    List<ApiGroupExecutionRun> findTop10ByApiGroupIdOrderByExecutedAtDesc(Long apiGroupId);
}

// Made with Bob