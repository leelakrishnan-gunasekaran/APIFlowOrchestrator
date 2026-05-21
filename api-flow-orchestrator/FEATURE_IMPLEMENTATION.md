# Feature Implementation: Variables Display and API Request Details

## Overview
This document describes the implementation of two new features in the API Flow Orchestrator:
1. **Variables Display in API Group Window** - Shows all extracted variables from API responses across the group
2. **Enhanced Edit API Node Modal** - Displays API request details and allows configuration of response data variables

## Changes Made

### 1. API Group Editor (ApiGroupEditor.jsx)

#### New Features:
- **Extracted Variables Section**: A collapsible section that displays all variables extracted from API responses across all APIs in the group
- **Variables Table**: Shows comprehensive information about each variable including:
  - API Name
  - HTTP Method
  - Variable Name
  - JSON Path for extraction
  - Source URL

#### Implementation Details:
- Added `useState` hook for `showVariables` to control the collapsible section
- Created `extractVariablesFromNodes()` function to aggregate all field mappings from API nodes
- Added imports for `ChevronDown` and `ChevronUp` icons from lucide-react
- Displays a helpful message when no variables are configured

### 2. Visual Node Editor (VisualNodeEditor.jsx)

#### New Features:
- **API Request Details Display**: When editing an existing API node, shows:
  - HTTP Method
  - URL
  - Headers (if configured)
  - Request Body (if applicable)
  
- **Response Data Variables Configuration**: 
  - Add/Remove field mappings to extract values from API responses
  - Each mapping consists of:
    - Variable name (e.g., `userId`, `token`)
    - JSON Path expression (e.g., `$.data.id`, `$.token`)
  - Visual representation of variable mappings with color-coded badges

#### Implementation Details:
- Extended `nodeConfig` state to include `fieldMappings` object
- Added `handleAddFieldMapping()` function using prompts for user input
- Added `handleRemoveFieldMapping()` function to delete variables
- Imported `X` icon from lucide-react for remove buttons
- Updated both `handleAddNode()` and `handleEditNode()` to handle field mappings

### 3. Styling Updates

#### ApiGroupEditor.css:
- **Variables Section Styles**:
  - Collapsible toggle button with hover effects
  - Responsive table layout for variables display
  - Color-coded method badges
  - Monospace font for code elements (variable names, JSON paths)
  - Truncated URLs with ellipsis for long values

#### VisualNodeEditor.css:
- **API Request Info Styles**:
  - Light blue background for request details section
  - Structured layout for method, URL, headers, and body
  - Monospace font for technical details
  
- **Field Mappings Styles**:
  - Green "Add Variable" button
  - List layout for variable mappings
  - Color-coded badges:
    - Blue for variable names
    - Yellow for JSON paths
  - Red remove button with hover effects
  - Help text for user guidance

## Usage

### Viewing Extracted Variables:
1. Navigate to an API Group
2. Click on "Extracted Variables (N)" to expand the section
3. View all variables extracted from API responses in a table format

### Configuring Response Variables:
1. Edit an existing API node or create a new one
2. In the modal, view the "API Request Details" section (for existing nodes)
3. Scroll to "Response Data Variables" section
4. Click "Add Variable" button
5. Enter variable name (e.g., `userId`)
6. Enter JSON path to extract the value (e.g., `$.data.id`)
7. The variable will be available for use in subsequent API calls using `{{variableName}}` syntax

## Technical Notes

- Field mappings are stored in the `fieldMappings` property of each API node
- The backend already supports field mappings through the `ApiNode` entity
- Variables can be used in subsequent API calls by referencing them with `{{variableName}}` syntax
- JSON Path expressions follow standard JSON Path syntax for extracting values from responses

## Benefits

1. **Better Visibility**: Users can see all extracted variables at a glance
2. **Easier Debugging**: API request details are displayed when editing nodes
3. **Improved Workflow**: Simplified process for configuring response data extraction
4. **Enhanced Traceability**: Clear mapping between variables and their source APIs