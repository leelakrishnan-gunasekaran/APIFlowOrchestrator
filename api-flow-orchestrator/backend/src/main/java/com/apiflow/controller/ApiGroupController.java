package com.apiflow.controller;

import com.apiflow.model.ApiGroup;
import com.apiflow.model.ApiNode;
import com.apiflow.service.ApiGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:3001"})
public class ApiGroupController {
    
    private final ApiGroupService apiGroupService;
    
    @GetMapping
    public ResponseEntity<List<ApiGroup>> getAllApiGroups() {
        return ResponseEntity.ok(apiGroupService.getAllApiGroups());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiGroup> getApiGroupById(@PathVariable Long id) {
        return apiGroupService.getApiGroupById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<ApiGroup>> searchApiGroups(@RequestParam String name) {
        return ResponseEntity.ok(apiGroupService.searchApiGroups(name));
    }
    
    @PostMapping
    public ResponseEntity<ApiGroup> createApiGroup(@RequestBody ApiGroup apiGroup) {
        ApiGroup created = apiGroupService.createApiGroup(apiGroup);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiGroup> updateApiGroup(
            @PathVariable Long id,
            @RequestBody ApiGroup apiGroup) {
        try {
            ApiGroup updated = apiGroupService.updateApiGroup(id, apiGroup);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApiGroup(@PathVariable Long id) {
        apiGroupService.deleteApiGroup(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/{id}/nodes")
    public ResponseEntity<List<ApiNode>> getApiNodes(@PathVariable Long id) {
        return ResponseEntity.ok(apiGroupService.getApiNodesByGroupId(id));
    }
    
    @PostMapping("/{id}/nodes")
    public ResponseEntity<ApiNode> addApiNode(
            @PathVariable Long id,
            @RequestBody ApiNode apiNode) {
        try {
            ApiNode created = apiGroupService.addApiNodeToGroup(id, apiNode);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/nodes/{nodeId}")
    public ResponseEntity<ApiNode> updateApiNode(
            @PathVariable Long nodeId,
            @RequestBody ApiNode apiNode) {
        try {
            ApiNode updated = apiGroupService.updateApiNode(nodeId, apiNode);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/nodes/{nodeId}")
    public ResponseEntity<Void> deleteApiNode(@PathVariable Long nodeId) {
        apiGroupService.deleteApiNode(nodeId);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/{id}/nodes/reorder")
    public ResponseEntity<Void> reorderApiNodes(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        try {
            System.out.println("=== Reorder API Called ===");
            System.out.println("Group ID: " + id);
            System.out.println("Request body: " + request);
            System.out.println("Request keys: " + request.keySet());
            
            Object nodeIdsObj = request.get("nodeIds");
            System.out.println("nodeIds object: " + nodeIdsObj);
            System.out.println("nodeIds class: " + (nodeIdsObj != null ? nodeIdsObj.getClass() : "null"));
            
            if (nodeIdsObj == null) {
                System.out.println("ERROR: nodeIds is null");
                return ResponseEntity.badRequest().build();
            }
            
            // Convert to List<Long>
            List<Long> nodeIds = new java.util.ArrayList<>();
            if (nodeIdsObj instanceof List) {
                for (Object obj : (List<?>) nodeIdsObj) {
                    if (obj instanceof Number) {
                        nodeIds.add(((Number) obj).longValue());
                    } else if (obj instanceof String) {
                        nodeIds.add(Long.parseLong((String) obj));
                    }
                }
            }
            
            System.out.println("Converted nodeIds: " + nodeIds);
            
            if (nodeIds.isEmpty()) {
                System.out.println("ERROR: nodeIds is empty after conversion");
                return ResponseEntity.badRequest().build();
            }
            
            apiGroupService.reorderApiNodes(id, nodeIds);
            System.out.println("Reorder successful");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            System.out.println("ERROR in reorder: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}

// Made with Bob
