# Postman-Style API Tester Refactoring

## Overview

This document describes the comprehensive refactoring of the API Test window to implement a Postman-style organization system with collections, folders, and API-level history tracking.

## What Was Changed

### Backend Changes

#### 1. New Database Models

**Collection.java** (replaces ApiGroup concept)
- Represents a collection of API requests (like Postman collections)
- Contains folders and requests
- Maintains authentication profiles and hook variables
- Location: `backend/src/main/java/com/apiflow/model/Collection.java`

**Folder.java**
- Represents folders within collections
- Supports nested folder structure (parent-child relationships)
- Can contain sub-folders and API requests
- Location: `backend/src/main/java/com/apiflow/model/Folder.java`

**ApiRequest.java** (replaces ApiNode)
- Represents individual API requests
- Can belong to a collection directly or be organized within folders
- Maintains its own execution history
- Location: `backend/src/main/java/com/apiflow/model/ApiRequest.java`

**ApiRequestHistory.java**
- Stores execution history for each API request
- Tracks request/response details, timing, and success/failure
- Enables per-endpoint history viewing
- Location: `backend/src/main/java/com/apiflow/model/ApiRequestHistory.java`

#### 2. Updated Existing Models

**HookVariable.java**
- Updated to reference `Collection` instead of `ApiGroup`

**AuthProfile.java**
- Updated to reference `Collection` instead of `ApiGroup`

#### 3. New Repositories

- `CollectionRepository.java` - CRUD operations for collections
- `FolderRepository.java` - CRUD operations for folders with hierarchy support
- `ApiRequestRepository.java` - CRUD operations for API requests
- `ApiRequestHistoryRepository.java` - History management per request

#### 4. New Services

**CollectionService.java**
- Manages collections, folders, and requests
- Handles hierarchical folder operations
- Maintains sequence ordering
- Location: `backend/src/main/java/com/apiflow/service/CollectionService.java`

**ApiRequestHistoryService.java**
- Manages API execution history
- Stores and retrieves history per request
- Supports history cleanup
- Location: `backend/src/main/java/com/apiflow/service/ApiRequestHistoryService.java`

#### 5. New Controllers

**CollectionController.java**
- REST endpoints for collection management
- Folder CRUD operations
- Request management within collections/folders
- Location: `backend/src/main/java/com/apiflow/controller/CollectionController.java`

**ApiRequestHistoryController.java**
- REST endpoints for history management
- Per-request history retrieval
- History cleanup operations
- Location: `backend/src/main/java/com/apiflow/controller/ApiRequestHistoryController.java`

### Frontend Changes

#### 1. New Components

**CollectionsSidebar.jsx**
- Postman-style sidebar navigation
- Tree view of collections, folders, and requests
- Expandable/collapsible hierarchy
- Context menu for management operations
- Per-request history display
- Location: `frontend/src/components/CollectionsSidebar.jsx`

**CollectionsSidebar.css**
- Postman-inspired styling
- Clean, modern UI with proper spacing
- Method badges with color coding
- Hover effects and transitions
- Location: `frontend/src/components/CollectionsSidebar.css`

**ApiTesterRefactored.jsx**
- Refactored API tester component
- Integrates with CollectionsSidebar
- Removed old history panel
- API-level history tracking
- Loads requests from sidebar selection
- Location: `frontend/src/components/ApiTesterRefactored.jsx`

**ApiTesterRefactored.css**
- Updated styles for new layout
- Sidebar integration support
- Removed old history panel styles
- Location: `frontend/src/components/ApiTesterRefactored.css`

## Key Features Implemented

### 1. Collections Management
- Create, rename, and delete collections
- Collections serve as top-level containers
- Each collection can have its own auth profile

### 2. Folder Organization
- Create folders within collections
- Support for nested folders (unlimited depth)
- Drag-and-drop ready structure
- Folders can contain both sub-folders and requests

### 3. Request Organization
- Requests can be placed directly in collections
- Requests can be organized within folders
- Each request maintains its configuration
- Requests can be duplicated and moved

### 4. API-Level History
- Each API endpoint maintains its own execution history
- History includes:
  - Request method, URL, headers, body
  - Response status, headers, body
  - Execution time and response size
  - Success/failure status
  - Timestamp of execution
- History is expandable per request in the sidebar
- Click on history item to load that execution

### 5. Postman-Style UI/UX
- Left sidebar with tree navigation
- Expandable collections and folders
- Color-coded HTTP method badges
- Context menus for quick actions
- Clean, modern interface
- Intuitive navigation

## API Endpoints

### Collections
- `GET /api/collections` - Get all collections
- `GET /api/collections/{id}` - Get collection by ID
- `POST /api/collections` - Create new collection
- `PUT /api/collections/{id}` - Update collection
- `DELETE /api/collections/{id}` - Delete collection

### Folders
- `GET /api/collections/{id}/folders` - Get folders in collection
- `POST /api/collections/{id}/folders` - Create folder
- `GET /api/collections/folders/{folderId}/subfolders` - Get sub-folders
- `PUT /api/collections/folders/{folderId}` - Update folder
- `DELETE /api/collections/folders/{folderId}` - Delete folder

### Requests
- `GET /api/collections/{id}/requests` - Get requests in collection
- `GET /api/collections/folders/{folderId}/requests` - Get requests in folder
- `POST /api/collections/{id}/requests` - Create request
- `PUT /api/collections/requests/{requestId}` - Update request
- `DELETE /api/collections/requests/{requestId}` - Delete request

### History
- `GET /api/history/request/{requestId}` - Get history for request
- `POST /api/history/request/{requestId}` - Save history entry
- `DELETE /api/history/{id}` - Delete history entry
- `DELETE /api/history/request/{requestId}/clear` - Clear all history for request

## Migration Notes

### For Existing Users

The old `ApiGroup` and `ApiNode` models are still present in the codebase. To migrate:

1. **Database Migration**: You'll need to create migration scripts to:
   - Rename `api_groups` table to `collections`
   - Rename `api_nodes` table to `api_requests`
   - Create new `folders` table
   - Create new `api_request_history` table
   - Update foreign key references

2. **Data Migration**: Existing API groups should be converted to collections, and existing API nodes should be converted to API requests.

### Using the New System

1. **Create a Collection**: Click "New Collection" in the sidebar
2. **Add Folders** (optional): Right-click collection → "Add Folder"
3. **Add Requests**: Right-click collection or folder → "Add Request"
4. **Execute Requests**: Click on a request to load it, then click "Send"
5. **View History**: Click the history toggle (▶) next to a request to see past executions
6. **Load History**: Click on a history item to load that specific execution

## Benefits

1. **Better Organization**: Collections and folders provide clear structure
2. **Per-Endpoint History**: Each API maintains its own execution history
3. **Postman Familiarity**: Users familiar with Postman will feel at home
4. **Scalability**: Supports large numbers of APIs with nested organization
5. **Context Preservation**: History maintains full request/response context
6. **Quick Access**: Sidebar provides fast navigation to any request

## Future Enhancements

Potential improvements for future iterations:

1. **Drag-and-Drop**: Reorder requests and folders
2. **Import/Export**: Import Postman collections
3. **Environments**: Variable management across collections
4. **Sharing**: Share collections with team members
5. **Search**: Global search across all collections
6. **Bulk Operations**: Execute multiple requests in sequence
7. **Request Duplication**: Clone requests easily
8. **Folder Colors**: Color-code folders for visual organization

## Testing Checklist

Before deploying, test the following:

- [ ] Create a new collection
- [ ] Create folders within collection
- [ ] Create nested folders
- [ ] Add requests to collection root
- [ ] Add requests to folders
- [ ] Execute a request and verify history is saved
- [ ] View request history in sidebar
- [ ] Load a historical execution
- [ ] Delete a request
- [ ] Delete a folder (verify cascade)
- [ ] Delete a collection (verify cascade)
- [ ] Context menu operations
- [ ] Expand/collapse functionality
- [ ] Request selection highlighting

## Conclusion

This refactoring transforms the API Tester into a professional-grade tool with Postman-style organization and per-endpoint history tracking. The implementation maintains all existing functionality while providing a significantly improved user experience and better scalability for managing large numbers of API requests.

---

**Made with Bob**