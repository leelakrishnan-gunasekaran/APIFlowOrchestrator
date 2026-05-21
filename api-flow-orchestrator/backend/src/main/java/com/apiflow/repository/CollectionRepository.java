package com.apiflow.repository;

import com.apiflow.model.Collections;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CollectionRepository extends JpaRepository<Collections, Long> {
    List<Collections> findByNameContainingIgnoreCase(String name);
}

// Made with Bob