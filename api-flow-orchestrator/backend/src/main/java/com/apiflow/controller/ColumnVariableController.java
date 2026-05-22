package com.apiflow.controller;

import com.apiflow.model.ApiGroup;
import com.apiflow.model.ColumnVariable;
import com.apiflow.repository.ApiGroupRepository;
import com.apiflow.repository.ColumnVariableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups/{groupId}/column-variables")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:3001"})
public class ColumnVariableController {
    
    private final ColumnVariableRepository columnVariableRepository;
    private final ApiGroupRepository apiGroupRepository;
    
    @GetMapping
    public ResponseEntity<List<ColumnVariable>> getColumnVariables(@PathVariable Long groupId) {
        List<ColumnVariable> variables = columnVariableRepository.findByApiGroupId(groupId);
        return ResponseEntity.ok(variables);
    }
    
    @PostMapping
    public ResponseEntity<ColumnVariable> createColumnVariable(
            @PathVariable Long groupId,
            @RequestBody ColumnVariable columnVariable) {
        ApiGroup apiGroup = apiGroupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("API Group not found"));
        
        columnVariable.setApiGroup(apiGroup);
        columnVariable.setVariableType("COLUMN");
        ColumnVariable saved = columnVariableRepository.save(columnVariable);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
    
    @PutMapping("/{variableId}")
    public ResponseEntity<ColumnVariable> updateColumnVariable(
            @PathVariable Long groupId,
            @PathVariable Long variableId,
            @RequestBody ColumnVariable columnVariable) {
        ColumnVariable existing = columnVariableRepository.findById(variableId)
                .orElseThrow(() -> new RuntimeException("Column Variable not found"));
        
        existing.setVariableName(columnVariable.getVariableName());
        existing.setColumnName(columnVariable.getColumnName());
        existing.setDescription(columnVariable.getDescription());
        
        ColumnVariable updated = columnVariableRepository.save(existing);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{variableId}")
    public ResponseEntity<Void> deleteColumnVariable(
            @PathVariable Long groupId,
            @PathVariable Long variableId) {
        columnVariableRepository.deleteById(variableId);
        return ResponseEntity.noContent().build();
    }
}

// Made with Bob