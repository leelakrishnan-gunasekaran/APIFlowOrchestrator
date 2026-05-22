package com.apiflow.service;

import com.apiflow.model.Collections;
import com.apiflow.model.Folder;
import com.apiflow.model.ApiRequest;
import com.apiflow.repository.CollectionRepository;
import com.apiflow.repository.FolderRepository;
import com.apiflow.repository.ApiRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CollectionService {
    
    private final CollectionRepository collectionRepository;
    private final FolderRepository folderRepository;
    private final ApiRequestRepository apiRequestRepository;
    
    @Transactional(readOnly = true)
    public List<Collections> getAllCollections() {
        List<Collections> collections = collectionRepository.findAll();
        
        // Eagerly initialize lazy-loaded relationships
        collections.forEach(collection -> {
            // Initialize folders and their nested relationships
            collection.getFolders().size();
            collection.getFolders().forEach(folder -> {
                folder.getSubFolders().size();
                folder.getRequests().size();
                folder.getRequests().forEach(request -> {
                    if (request.getHistory() != null) {
                        request.getHistory().size();
                    }
                });
            });
            
            // Initialize requests at collection level
            collection.getRequests().size();
            collection.getRequests().forEach(request -> {
                if (request.getHistory() != null) {
                    request.getHistory().size();
                }
            });
        });
        
        return collections;
    }
    
    @Transactional(readOnly = true)
    public Optional<Collections> getCollectionById(Long id) {
        Optional<Collections> collectionOpt = collectionRepository.findById(id);
        
        // Eagerly initialize lazy-loaded relationships
        collectionOpt.ifPresent(collection -> {
            collection.getFolders().size();
            collection.getFolders().forEach(folder -> {
                folder.getSubFolders().size();
                folder.getRequests().size();
                folder.getRequests().forEach(request -> {
                    if (request.getHistory() != null) {
                        request.getHistory().size();
                    }
                });
            });
            
            collection.getRequests().size();
            collection.getRequests().forEach(request -> {
                if (request.getHistory() != null) {
                    request.getHistory().size();
                }
            });
        });
        
        return collectionOpt;
    }
    
    public List<Collections> searchCollections(String name) {
        return collectionRepository.findByNameContainingIgnoreCase(name);
    }
    
    @Transactional
    public Collections createCollection(Collections collection) {
        log.info("Creating Collection: {}", collection.getName());
        return collectionRepository.save(collection);
    }
    
    @Transactional
    public Collections updateCollection(Long id, Collections collection) {
        log.info("Updating Collection: {}", id);
        
        Collections existing = collectionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Collection not found: " + id));
        
        existing.setName(collection.getName());
        existing.setDescription(collection.getDescription());
        
        return collectionRepository.save(existing);
    }
    
    @Transactional
    public void deleteCollection(Long id) {
        log.info("Deleting Collection: {}", id);
        collectionRepository.deleteById(id);
    }
    
    // Folder operations
    public List<Folder> getFoldersByCollectionId(Long collectionId) {
        return folderRepository.findByCollectionIdAndParentFolderIsNullOrderBySequenceOrder(collectionId);
    }
    
    public List<Folder> getSubFolders(Long parentFolderId) {
        return folderRepository.findByParentFolderIdOrderBySequenceOrder(parentFolderId);
    }
    
    @Transactional
    public Folder createFolder(Long collectionId, Folder folder) {
        log.info("Creating Folder in Collection: {}", collectionId);
        
        Collections collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new RuntimeException("Collection not found: " + collectionId));
        
        folder.setCollection(collection);
        
        // Set sequence order if not provided
        if (folder.getSequenceOrder() == null) {
            List<Folder> existingFolders;
            if (folder.getParentFolder() != null) {
                existingFolders = folderRepository.findByParentFolderIdOrderBySequenceOrder(folder.getParentFolder().getId());
            } else {
                existingFolders = folderRepository.findByCollectionIdAndParentFolderIsNullOrderBySequenceOrder(collectionId);
            }
            folder.setSequenceOrder(existingFolders.size() + 1);
        }
        
        return folderRepository.save(folder);
    }
    
    @Transactional
    public Folder updateFolder(Long folderId, Folder folder) {
        log.info("Updating Folder: {}", folderId);
        
        Folder existing = folderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Folder not found: " + folderId));
        
        existing.setName(folder.getName());
        existing.setDescription(folder.getDescription());
        existing.setSequenceOrder(folder.getSequenceOrder());
        
        return folderRepository.save(existing);
    }
    
    @Transactional
    public void deleteFolder(Long folderId) {
        log.info("Deleting Folder: {}", folderId);
        folderRepository.deleteById(folderId);
    }
    
    // API Request operations
    public List<ApiRequest> getRequestsByCollectionId(Long collectionId) {
        return apiRequestRepository.findByCollectionIdAndFolderIsNullOrderBySequenceOrder(collectionId);
    }
    
    public List<ApiRequest> getRequestsByFolderId(Long folderId) {
        return apiRequestRepository.findByFolderIdOrderBySequenceOrder(folderId);
    }
    
    @Transactional
    public ApiRequest createRequest(Long collectionId, Long folderId, ApiRequest request) {
        log.info("Creating API Request in Collection: {}, Folder: {}", collectionId, folderId);
        
        Collections collection = collectionRepository.findById(collectionId)
                .orElseThrow(() -> new RuntimeException("Collection not found: " + collectionId));
        
        request.setCollection(collection);
        
        if (folderId != null) {
            Folder folder = folderRepository.findById(folderId)
                    .orElseThrow(() -> new RuntimeException("Folder not found: " + folderId));
            request.setFolder(folder);
        }
        
        // Set sequence order if not provided
        if (request.getSequenceOrder() == null) {
            List<ApiRequest> existingRequests;
            if (folderId != null) {
                existingRequests = apiRequestRepository.findByFolderIdOrderBySequenceOrder(folderId);
            } else {
                existingRequests = apiRequestRepository.findByCollectionIdAndFolderIsNullOrderBySequenceOrder(collectionId);
            }
            request.setSequenceOrder(existingRequests.size() + 1);
        }
        
        return apiRequestRepository.save(request);
    }
    
    @Transactional
    public ApiRequest updateRequest(Long requestId, ApiRequest request) {
        log.info("Updating API Request: {}", requestId);
        
        ApiRequest existing = apiRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("API Request not found: " + requestId));
        
        existing.setName(request.getName());
        existing.setMethod(request.getMethod());
        existing.setUrl(request.getUrl());
        existing.setHeaders(request.getHeaders());
        existing.setRequestBody(request.getRequestBody());
        existing.setExportResponse(request.getExportResponse());
        existing.setFieldMappings(request.getFieldMappings());
        existing.setSequenceOrder(request.getSequenceOrder());
        
        return apiRequestRepository.save(existing);
    }
    
    @Transactional
    public void deleteRequest(Long requestId) {
        log.info("Deleting API Request: {}", requestId);
        apiRequestRepository.deleteById(requestId);
    }
    
    @Transactional
    public ApiRequest moveRequest(Long requestId, Long targetCollectionId, Long targetFolderId) {
        log.info("Moving API Request: {} to Collection: {}, Folder: {}", requestId, targetCollectionId, targetFolderId);
        
        ApiRequest request = apiRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("API Request not found: " + requestId));
        
        Collections targetCollection = collectionRepository.findById(targetCollectionId)
                .orElseThrow(() -> new RuntimeException("Target collection not found: " + targetCollectionId));
        
        // Update collection
        request.setCollection(targetCollection);
        
        // Update folder (can be null for collection root)
        if (targetFolderId != null) {
            Folder targetFolder = folderRepository.findById(targetFolderId)
                    .orElseThrow(() -> new RuntimeException("Target folder not found: " + targetFolderId));
            request.setFolder(targetFolder);
        } else {
            request.setFolder(null);
        }
        
        // Update sequence order
        List<ApiRequest> existingRequests;
        if (targetFolderId != null) {
            existingRequests = apiRequestRepository.findByFolderIdOrderBySequenceOrder(targetFolderId);
        } else {
            existingRequests = apiRequestRepository.findByCollectionIdAndFolderIsNullOrderBySequenceOrder(targetCollectionId);
        }
        request.setSequenceOrder(existingRequests.size() + 1);
        
        return apiRequestRepository.save(request);
    }
}

// Made with Bob