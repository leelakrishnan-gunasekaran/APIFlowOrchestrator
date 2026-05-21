package com.apiflow.repository;

import com.apiflow.model.ExecutionRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExecutionRunRepository extends JpaRepository<ExecutionRun, Long> {
    List<ExecutionRun> findByApiGroupIdOrderByCreatedAtDesc(Long apiGroupId);
    List<ExecutionRun> findTop10ByApiGroupIdOrderByCreatedAtDesc(Long apiGroupId);
}

// Made with Bob
