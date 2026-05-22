package com.apiflow.controller;

import com.apiflow.model.Collections;
import com.apiflow.model.Folder;
import com.apiflow.model.ApiRequest;
import com.apiflow.service.CollectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:3001"})
public class CollectionController {
    
    private final CollectionService collectionService;
    
    @GetMapping
    public ResponseEntity<List<Collections>> getAllCollections() {
        return ResponseEntity.ok(collectionService.getAllCollections());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Collections> getCollectionById(@PathVariable Long id) {
        return collectionService.getCollectionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Collections>> searchCollections(@RequestParam String name) {
        return ResponseEntity.ok(collectionService.searchCollections(name));
    }
    
    @PostMapping
    public ResponseEntity<Collections> createCollection(@RequestBody Collections collection) {
        Collections created = collectionService.createCollection(collection);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Collections> updateCollection(
            @PathVariable Long id,
            @RequestBody Collections collection) {
        try {
            Collections updated = collectionService.updateCollection(id, collection);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCollection(@PathVariable Long id) {
        collectionService.deleteCollection(id);
        return ResponseEntity.noContent().build();
    }
    
    // Folder endpoints
    @GetMapping("/{id}/folders")
    public ResponseEntity<List<Folder>> getFolders(@PathVariable Long id) {
        return ResponseEntity.ok(collectionService.getFoldersByCollectionId(id));
    }
    
    @PostMapping("/{id}/folders")
    public ResponseEntity<Folder> createFolder(
            @PathVariable Long id,
            @RequestBody Folder folder) {
        try {
            Folder created = collectionService.createFolder(id, folder);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/folders/{folderId}/subfolders")
    public ResponseEntity<List<Folder>> getSubFolders(@PathVariable Long folderId) {
        return ResponseEntity.ok(collectionService.getSubFolders(folderId));
    }
    
    @PutMapping("/folders/{folderId}")
    public ResponseEntity<Folder> updateFolder(
            @PathVariable Long folderId,
            @RequestBody Folder folder) {
        try {
            Folder updated = collectionService.updateFolder(folderId, folder);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/folders/{folderId}")
    public ResponseEntity<Void> deleteFolder(@PathVariable Long folderId) {
        collectionService.deleteFolder(folderId);
        return ResponseEntity.noContent().build();
    }
    
    // API Request endpoints
    @GetMapping("/{id}/requests")
    public ResponseEntity<List<ApiRequest>> getRequests(@PathVariable Long id) {
        return ResponseEntity.ok(collectionService.getRequestsByCollectionId(id));
    }
    
    @GetMapping("/folders/{folderId}/requests")
    public ResponseEntity<List<ApiRequest>> getRequestsByFolder(@PathVariable Long folderId) {
        return ResponseEntity.ok(collectionService.getRequestsByFolderId(folderId));
    }
    
    @PostMapping("/{id}/requests")
    public ResponseEntity<ApiRequest> createRequest(
            @PathVariable Long id,
            @RequestParam(required = false) Long folderId,
            @RequestBody ApiRequest request) {
        try {
            ApiRequest created = collectionService.createRequest(id, folderId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/requests/{requestId}")
    public ResponseEntity<ApiRequest> updateRequest(
            @PathVariable Long requestId,
            @RequestBody ApiRequest request) {
        try {
            ApiRequest updated = collectionService.updateRequest(requestId, request);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/requests/{requestId}")
    public ResponseEntity<Void> deleteRequest(@PathVariable Long requestId) {
        collectionService.deleteRequest(requestId);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/requests/{requestId}/move")
    public ResponseEntity<ApiRequest> moveRequest(
            @PathVariable Long requestId,
            @RequestParam Long targetCollectionId,
            @RequestParam(required = false) Long targetFolderId) {
        try {
            ApiRequest moved = collectionService.moveRequest(requestId, targetCollectionId, targetFolderId);
            return ResponseEntity.ok(moved);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

// Made with Bob