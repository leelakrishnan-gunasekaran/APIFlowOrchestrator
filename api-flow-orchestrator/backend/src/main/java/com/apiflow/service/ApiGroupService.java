package com.apiflow.service;

import com.apiflow.model.ApiGroup;
import com.apiflow.model.ApiNode;
import com.apiflow.repository.ApiGroupRepository;
import com.apiflow.repository.ApiNodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApiGroupService {
    
    private final ApiGroupRepository apiGroupRepository;
    private final ApiNodeRepository apiNodeRepository;
    
    public List<ApiGroup> getAllApiGroups() {
        return apiGroupRepository.findAll();
    }
    
    public Optional<ApiGroup> getApiGroupById(Long id) {
        return apiGroupRepository.findById(id);
    }
    
    public List<ApiGroup> searchApiGroups(String name) {
        return apiGroupRepository.findByNameContainingIgnoreCase(name);
    }
    
    @Transactional
    public ApiGroup createApiGroup(ApiGroup apiGroup) {
        log.info("Creating API Group: {}", apiGroup.getName());
        return apiGroupRepository.save(apiGroup);
    }
    
    @Transactional
    public ApiGroup updateApiGroup(Long id, ApiGroup apiGroup) {
        log.info("Updating API Group: {}", id);
        
        ApiGroup existing = apiGroupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("API Group not found: " + id));
        
        existing.setName(apiGroup.getName());
        existing.setDescription(apiGroup.getDescription());
        
        return apiGroupRepository.save(existing);
    }
    
    @Transactional
    public void deleteApiGroup(Long id) {
        log.info("Deleting API Group: {}", id);
        apiGroupRepository.deleteById(id);
    }
    
    public List<ApiNode> getApiNodesByGroupId(Long apiGroupId) {
        return apiNodeRepository.findByApiGroupIdOrderBySequenceOrder(apiGroupId);
    }
    
    @Transactional
    public ApiNode addApiNodeToGroup(Long apiGroupId, ApiNode apiNode) {
        log.info("Adding API Node to Group: {}", apiGroupId);
        
        ApiGroup apiGroup = apiGroupRepository.findById(apiGroupId)
                .orElseThrow(() -> new RuntimeException("API Group not found: " + apiGroupId));
        
        apiNode.setApiGroup(apiGroup);
        
        // Set sequence order if not provided
        if (apiNode.getSequenceOrder() == null) {
            List<ApiNode> existingNodes = apiNodeRepository.findByApiGroupIdOrderBySequenceOrder(apiGroupId);
            apiNode.setSequenceOrder(existingNodes.size() + 1);
        }
        
        return apiNodeRepository.save(apiNode);
    }
    
    @Transactional
    public ApiNode updateApiNode(Long nodeId, ApiNode apiNode) {
        log.info("Updating API Node: {}", nodeId);
        
        ApiNode existing = apiNodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("API Node not found: " + nodeId));
        
        existing.setName(apiNode.getName());
        existing.setMethod(apiNode.getMethod());
        existing.setUrl(apiNode.getUrl());
        existing.setHeaders(apiNode.getHeaders());
        existing.setRequestBody(apiNode.getRequestBody());
        existing.setExportResponse(apiNode.getExportResponse());
        existing.setFieldMappings(apiNode.getFieldMappings());
        existing.setSequenceOrder(apiNode.getSequenceOrder());
        
        return apiNodeRepository.save(existing);
    }
    
    @Transactional
    public void deleteApiNode(Long nodeId) {
        log.info("Deleting API Node: {}", nodeId);
        apiNodeRepository.deleteById(nodeId);
    }
    
    @Transactional
    public void reorderApiNodes(Long apiGroupId, List<Long> nodeIds) {
        log.info("Reordering API Nodes for Group: {}", apiGroupId);
        log.info("Node IDs to reorder: {}", nodeIds);
        
        if (nodeIds == null || nodeIds.isEmpty()) {
            log.warn("No node IDs provided for reordering");
            return;
        }
        
        try {
            for (int i = 0; i < nodeIds.size(); i++) {
                Long nodeId = nodeIds.get(i);
                log.info("Processing node {} at position {}", nodeId, i + 1);
                ApiNode node = apiNodeRepository.findById(nodeId)
                        .orElseThrow(() -> new RuntimeException("API Node not found: " + nodeId));
                node.setSequenceOrder(i + 1);
                apiNodeRepository.save(node);
            }
            log.info("Successfully reordered {} nodes", nodeIds.size());
        } catch (Exception e) {
            log.error("Error reordering nodes", e);
            throw e;
        }
    }
}

// Made with Bob
