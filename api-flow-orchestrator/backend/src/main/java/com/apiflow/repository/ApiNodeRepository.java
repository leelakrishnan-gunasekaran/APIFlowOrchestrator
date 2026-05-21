package com.apiflow.repository;

import com.apiflow.model.ApiNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ApiNodeRepository extends JpaRepository<ApiNode, Long> {
    List<ApiNode> findByApiGroupIdOrderBySequenceOrder(Long apiGroupId);
}

// Made with Bob
