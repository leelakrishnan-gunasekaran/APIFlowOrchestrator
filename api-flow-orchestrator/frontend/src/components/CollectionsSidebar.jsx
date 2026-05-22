import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import './CollectionsSidebar.css';

const CollectionsSidebar = ({ onSelectRequest, selectedRequestId }) => {
  const queryClient = useQueryClient();
  const [expandedCollections, setExpandedCollections] = useState(new Set());
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [expandedHistory, setExpandedHistory] = useState(new Set());
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newRequestName, setNewRequestName] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  // Fetch all collections
  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await api.get('/collections');
      return response.data;
    }
  });

  // Create collection mutation
  const createCollectionMutation = useMutation({
    mutationFn: async (name) => {
      const response = await api.post('/collections', {
        name,
        description: ''
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['collections']);
      setShowNewCollectionModal(false);
      setNewCollectionName('');
    }
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async ({ collectionId, name, parentFolderId }) => {
      const response = await api.post(`/collections/${collectionId}/folders`, {
        name,
        description: '',
        parentFolder: parentFolderId ? { id: parentFolderId } : null
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['collections']);
      setShowNewFolderModal(false);
      setNewFolderName('');
      setSelectedFolderId(null);
    }
  });

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: async ({ collectionId, folderId, name }) => {
      const url = folderId 
        ? `/api/collections/${collectionId}/requests?folderId=${folderId}`
        : `/api/collections/${collectionId}/requests`;
      
      const response = await api.post(url.replace('/api', ''), {
        name,
        method: 'GET',
        url: '',
        headers: '{}',
        requestBody: null
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['collections']);
      setShowNewRequestModal(false);
      setNewRequestName('');
      setSelectedFolderId(null);
    }
  });

  // Delete collection mutation
  const deleteCollectionMutation = useMutation({
    mutationFn: async (collectionId) => {
      await api.delete(`/collections/${collectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['collections']);
    }
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId) => {
      await api.delete(`/collections/folders/${folderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['collections']);
    }
  });

  // Delete request mutation
  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      await api.delete(`/collections/requests/${requestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['collections']);
    }
  });

  const toggleCollection = (collectionId) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
    }
    setExpandedCollections(newExpanded);
  };

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const toggleHistory = (requestId) => {
    const newExpanded = new Set(expandedHistory);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedHistory(newExpanded);
  };

  const handleContextMenu = (e, type, item) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      item
    });
  };

  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      createCollectionMutation.mutate(newCollectionName.trim());
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim() && selectedCollectionId) {
      createFolderMutation.mutate({
        collectionId: selectedCollectionId,
        name: newFolderName.trim(),
        parentFolderId: selectedFolderId
      });
    }
  };

  const handleCreateRequest = () => {
    if (newRequestName.trim() && selectedCollectionId) {
      createRequestMutation.mutate({
        collectionId: selectedCollectionId,
        folderId: selectedFolderId,
        name: newRequestName.trim()
      });
    }
  };

  const renderFolder = (folder, level = 1) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasSubFolders = folder.subFolders && folder.subFolders.length > 0;
    const hasRequests = folder.requests && folder.requests.length > 0;

    return (
      <div key={folder.id} className="folder-item" style={{ paddingLeft: `${level * 16}px` }}>
        <div
          className="folder-header"
          onClick={() => toggleFolder(folder.id)}
          onContextMenu={(e) => handleContextMenu(e, 'folder', folder)}
        >
          <span className="folder-arrow">{isExpanded ? '▼' : '▶'}</span>
          <span className="folder-icon">{isExpanded ? '📂' : '📁'}</span>
          <span className="folder-name">{folder.name}</span>
          <div className="folder-actions">
            <button
              className="add-request-btn"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCollectionId(folder.collection?.id);
                setSelectedFolderId(folder.id);
                setShowNewRequestModal(true);
              }}
              title="Add Request"
            >
              +
            </button>
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete folder "${folder.name}"?`)) {
                  deleteFolderMutation.mutate(folder.id);
                }
              }}
              title="Delete Folder"
            >
              −
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="folder-content">
            {hasSubFolders && folder.subFolders.map(subFolder => renderFolder(subFolder, level + 1))}
            {hasRequests && folder.requests.map(request => renderRequest(request, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderRequest = (request, level = 1) => {
    const isExpanded = expandedHistory.has(request.id);
    const isSelected = selectedRequestId === request.id;
    const hasHistory = request.history && request.history.length > 0;

    return (
      <div key={request.id} className="request-item" style={{ paddingLeft: `${level * 16}px` }}>
        <div
          className={`request-header ${isSelected ? 'selected' : ''}`}
          onClick={() => onSelectRequest(request)}
          onContextMenu={(e) => handleContextMenu(e, 'request', request)}
        >
          <span className={`method-badge method-${request.method.toLowerCase()}`}>
            {request.method}
          </span>
          <span className="request-name">{request.name}</span>
          <div className="request-actions">
            {hasHistory && (
              <button
                className="history-toggle-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleHistory(request.id);
                }}
                title="View History"
              >
                {isExpanded ? '▼' : '▶'} ({request.history.length})
              </button>
            )}
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete request "${request.name}"?`)) {
                  deleteRequestMutation.mutate(request.id);
                }
              }}
              title="Delete Request"
            >
              −
            </button>
          </div>
        </div>
        
        {isExpanded && hasHistory && (
          <div className="history-list">
            {request.history.map(historyItem => (
              <div
                key={historyItem.id}
                className="history-item"
                onClick={() => onSelectRequest(request, historyItem)}
              >
                <span className={`history-status ${historyItem.success ? 'success' : 'error'}`}>
                  {historyItem.success ? historyItem.responseStatus : 'Error'}
                </span>
                <span className="history-time">
                  {new Date(historyItem.executedAt).toLocaleString()}
                </span>
                <span className="history-duration">{historyItem.durationMs}ms</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCollection = (collection) => {
    const isExpanded = expandedCollections.has(collection.id);
    const hasFolders = collection.folders && collection.folders.length > 0;
    const hasRequests = collection.requests && collection.requests.length > 0;

    return (
      <div key={collection.id} className="collection-item">
        <div 
          className="collection-header"
          onClick={() => toggleCollection(collection.id)}
          onContextMenu={(e) => handleContextMenu(e, 'collection', collection)}
        >
          <span className="collection-icon">{isExpanded ? '▼' : '▶'}</span>
          <span className="collection-name">{collection.name}</span>
          <div className="collection-actions">
            <button
              className="add-folder-btn"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCollectionId(collection.id);
                setSelectedFolderId(null);
                setShowNewFolderModal(true);
              }}
              title="Add Folder"
            >
              📁+
            </button>
            <button
              className="add-request-btn"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCollectionId(collection.id);
                setSelectedFolderId(null);
                setShowNewRequestModal(true);
              }}
              title="Add Request"
            >
              +
            </button>
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete collection "${collection.name}"?`)) {
                  deleteCollectionMutation.mutate(collection.id);
                }
              }}
              title="Delete Collection"
            >
              −
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="collection-content">
            {hasFolders && collection.folders.map(folder => renderFolder(folder))}
            {hasRequests && collection.requests.map(request => renderRequest(request))}
          </div>
        )}
      </div>
    );
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (isLoading) {
    return <div className="collections-sidebar loading">Loading collections...</div>;
  }

  return (
    <div className="collections-sidebar">
      <div className="sidebar-header">
        <h3>Collections</h3>
        <button
          className="new-collection-btn"
          onClick={() => setShowNewCollectionModal(true)}
          title="New Collection"
        >
          + New Collection
        </button>
      </div>

      <div className="collections-list">
        {collections.length === 0 ? (
          <div className="empty-state">
            <p>No collections yet</p>
            <p className="hint">Create a collection to get started</p>
          </div>
        ) : (
          collections.map(collection => renderCollection(collection))
        )}
      </div>

      {/* New Collection Modal */}
      {showNewCollectionModal && (
        <div className="modal-overlay" onClick={() => setShowNewCollectionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>New Collection</h3>
            <input
              type="text"
              placeholder="Collection name"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateCollection()}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setShowNewCollectionModal(false)}>Cancel</button>
              <button onClick={handleCreateCollection} disabled={!newCollectionName.trim()}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="modal-overlay" onClick={() => setShowNewFolderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>New Folder</h3>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setShowNewFolderModal(false)}>Cancel</button>
              <button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="modal-overlay" onClick={() => setShowNewRequestModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>New Request</h3>
            <input
              type="text"
              placeholder="Request name"
              value={newRequestName}
              onChange={(e) => setNewRequestName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateRequest()}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setShowNewRequestModal(false)}>Cancel</button>
              <button onClick={handleCreateRequest} disabled={!newRequestName.trim()}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'collection' && (
            <>
              <div className="context-menu-item" onClick={() => {
                setSelectedCollectionId(contextMenu.item.id);
                setShowNewFolderModal(true);
                setContextMenu(null);
              }}>
                Add Folder
              </div>
              <div className="context-menu-item" onClick={() => {
                setSelectedCollectionId(contextMenu.item.id);
                setShowNewRequestModal(true);
                setContextMenu(null);
              }}>
                Add Request
              </div>
              <div className="context-menu-divider" />
              <div className="context-menu-item danger" onClick={() => {
                if (confirm(`Delete collection "${contextMenu.item.name}"?`)) {
                  deleteCollectionMutation.mutate(contextMenu.item.id);
                }
                setContextMenu(null);
              }}>
                Delete Collection
              </div>
            </>
          )}
          {contextMenu.type === 'folder' && (
            <>
              <div className="context-menu-item" onClick={() => {
                setSelectedCollectionId(contextMenu.item.collection?.id);
                setSelectedFolderId(contextMenu.item.id);
                setShowNewFolderModal(true);
                setContextMenu(null);
              }}>
                Add Subfolder
              </div>
              <div className="context-menu-item" onClick={() => {
                setSelectedCollectionId(contextMenu.item.collection?.id);
                setSelectedFolderId(contextMenu.item.id);
                setShowNewRequestModal(true);
                setContextMenu(null);
              }}>
                Add Request
              </div>
              <div className="context-menu-divider" />
              <div className="context-menu-item danger" onClick={() => {
                if (confirm(`Delete folder "${contextMenu.item.name}"?`)) {
                  deleteFolderMutation.mutate(contextMenu.item.id);
                }
                setContextMenu(null);
              }}>
                Delete Folder
              </div>
            </>
          )}
          {contextMenu.type === 'request' && (
            <>
              <div className="context-menu-item" onClick={() => {
                onSelectRequest(contextMenu.item);
                setContextMenu(null);
              }}>
                Open Request
              </div>
              <div className="context-menu-divider" />
              <div className="context-menu-item danger" onClick={() => {
                if (confirm(`Delete request "${contextMenu.item.name}"?`)) {
                  deleteRequestMutation.mutate(contextMenu.item.id);
                }
                setContextMenu(null);
              }}>
                Delete Request
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CollectionsSidebar;

// Made with Bob