package com.apiflow.repository;

import com.apiflow.model.ApiRequestHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ApiRequestHistoryRepository extends JpaRepository<ApiRequestHistory, Long> {
    List<ApiRequestHistory> findByApiRequestIdOrderByExecutedAtDesc(Long apiRequestId);
    List<ApiRequestHistory> findTop50ByApiRequestIdOrderByExecutedAtDesc(Long apiRequestId);
}

// Made with Bob