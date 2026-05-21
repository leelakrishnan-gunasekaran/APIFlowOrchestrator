package com.apiflow.repository;

import com.apiflow.model.ApiGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ApiGroupRepository extends JpaRepository<ApiGroup, Long> {
    List<ApiGroup> findByNameContainingIgnoreCase(String name);
}

// Made with Bob
