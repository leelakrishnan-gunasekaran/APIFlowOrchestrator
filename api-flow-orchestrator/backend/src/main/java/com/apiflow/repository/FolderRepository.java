package com.apiflow.repository;

import com.apiflow.model.Folder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FolderRepository extends JpaRepository<Folder, Long> {
    List<Folder> findByCollectionIdOrderBySequenceOrder(Long collectionId);
    List<Folder> findByParentFolderIdOrderBySequenceOrder(Long parentFolderId);
    List<Folder> findByCollectionIdAndParentFolderIsNullOrderBySequenceOrder(Long collectionId);
}

// Made with Bob