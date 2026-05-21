# Testing Guide: Field Mappings and Variable Extraction

## Overview
This guide helps you test the complete flow of saving field mappings and viewing extracted values.

## Prerequisites
1. Backend running on port 8080
2. Frontend running on port 3001
3. Database configured and accessible

## Test Scenario: Complete Data Flow

### Step 1: Create/Edit an API Node with Field Mappings

1. Navigate to an API Group in the frontend
2. Click "Add API Node" or edit an existing node
3. Fill in the basic details:
   - **Name**: Test User API
   - **Method**: GET
   - **URL**: https://jsonplaceholder.typicode.com/users/1
   - **Headers**: `{"Content-Type": "application/json"}`

4. Scroll to "Response Data Variables" section
5. Click "Add Variable" button
6. Enter variable name: `userId`
7. Enter JSON path: `$.id`
8. Click "Add Variable" again
9. Enter variable name: `userName`
10. Enter JSON path: `$.name`
11. Click "Save" or "Update Node"

### Step 2: Verify Data is Saved

**Backend Verification:**
The data should be saved to the `api_nodes` table and `api_node_field_mappings` table.

**Database Check:**
```sql
-- Check the API node
SELECT * FROM api_nodes WHERE name = 'Test User API';

-- Check field mappings
SELECT * FROM api_node_field_mappings WHERE api_node_id = <your_node_id>;
```

Expected result in `api_node_field_mappings`:
| api_node_id | field_name | field_value |
|-------------|------------|-------------|
| 1           | userId     | $.id        |
| 1           | userName   | $.name      |

### Step 3: Execute the API Flow

1. Click "Execute Flow" button in the Visual Node Editor
2. Wait for execution to complete
3. Check the execution results

### Step 4: View Extracted Values

1. Look at the "Extracted Variables" section at the top of the API Group page
2. Click to expand the section
3. You should see a table with:
   - API Name: Test User API
   - Method: GET
   - Variable Name: userId
   - **Extracted Value**: 1 (in green badge)
   - JSON Path: $.id
   
   - API Name: Test User API
   - Method: GET
   - Variable Name: userName
   - **Extracted Value**: Leanne Graham (in green badge)
   - JSON Path: $.name

### Step 5: Edit Node and Verify Field Mappings Display

1. Click the edit button on the API node
2. In the modal, you should see:
   - **API Request Details** section showing:
     - Method: GET
     - URL: https://jsonplaceholder.typicode.com/users/1
     - Headers: {"Content-Type": "application/json"}
   
   - **Response Data Variables** section showing:
     - userId → $.id (with remove button)
     - userName → $.name (with remove button)

## Troubleshooting

### Issue: Field Mappings Not Saving

**Check:**
1. Browser console for any errors
2. Network tab to see if the request includes `fieldMappings` in the payload
3. Backend logs for any errors during save

**Expected Request Payload:**
```json
{
  "name": "Test User API",
  "method": "GET",
  "url": "https://jsonplaceholder.typicode.com/users/1",
  "headers": "{\"Content-Type\": \"application/json\"}",
  "requestBody": "",
  "exportResponse": false,
  "fieldMappings": {
    "userId": "$.id",
    "userName": "$.name"
  },
  "sequenceOrder": 1
}
```

### Issue: Extracted Values Not Showing

**Check:**
1. Ensure the API has been executed at least once
2. Check if `latestRun` data is being fetched in the browser console
3. Verify the response data structure matches the JSON path

**Debug Steps:**
1. Open browser DevTools
2. Go to Network tab
3. Look for the request to `/api/execution/runs/{groupId}/recent`
4. Check if the response includes `apiRunResults` with response data

### Issue: Values Show "Not executed yet"

**Possible Causes:**
1. The API flow hasn't been executed
2. The execution failed
3. The JSON path doesn't match the response structure

**Solution:**
1. Click "Execute Flow" to run the APIs
2. Check execution results for any errors
3. Verify JSON path matches the actual response structure

## Data Flow Summary

```
1. User adds field mappings in UI
   ↓
2. Frontend sends POST/PUT to /api/groups/{id}/nodes or /api/groups/nodes/{nodeId}
   ↓
3. Backend saves to api_nodes and api_node_field_mappings tables
   ↓
4. User executes the flow
   ↓
5. Backend extracts values using JSON paths and stores in variableContext
   ↓
6. Execution results saved to api_run_results table
   ↓
7. Frontend fetches latest run and parses response data
   ↓
8. Extracted values displayed in the Variables section
```

## Expected Behavior

✅ Field mappings persist after save
✅ Field mappings display when editing a node
✅ Extracted values show after execution
✅ Values update after each execution
✅ Multiple variables can be configured per API
✅ Variables can be removed and re-added

## API Endpoints Used

- `POST /api/groups/{id}/nodes` - Create API node with field mappings
- `PUT /api/groups/nodes/{nodeId}` - Update API node with field mappings
- `GET /api/groups/{id}/nodes` - Fetch API nodes with field mappings
- `POST /api/execution/run/{groupId}` - Execute API flow
- `GET /api/execution/runs/{groupId}/recent` - Get recent execution results