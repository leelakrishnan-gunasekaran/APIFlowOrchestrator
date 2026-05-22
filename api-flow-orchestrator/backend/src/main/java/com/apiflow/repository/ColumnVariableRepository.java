package com.apiflow.repository;

import com.apiflow.model.ColumnVariable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ColumnVariableRepository extends JpaRepository<ColumnVariable, Long> {
    List<ColumnVariable> findByApiGroupId(Long apiGroupId);
    void deleteByApiGroupId(Long apiGroupId);
}

// Made with Bob