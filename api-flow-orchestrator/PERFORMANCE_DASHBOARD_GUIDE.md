# Performance Dashboard Guide

## Overview

The Performance Dashboard is a comprehensive execution history viewer that opens in a new browser tab. It provides detailed insights into API execution history, including request/response data and performance metrics with visual charts.

## Features

### 1. **Execution History Panel** (Left Side)
- Lists all execution runs for the API Group
- Shows execution name in format: `{GroupName}_{Date}_{Time}`
- Displays status badges (COMPLETED/FAILED)
- Shows duration, success count, and failure count
- Click any history item to view its details

### 2. **API Details Panel** (Middle)
- Lists all APIs executed in the selected run
- Shows sequence number, API name, and status
- Displays duration and HTTP status code
- Click any API to view its request/response details
- **Request/Response Viewer:**
  - Side-by-side view of request and response
  - Formatted JSON display
  - Syntax highlighting
  - Scrollable content areas
  - Error messages highlighted in red

### 3. **Performance Chart Panel** (Right Side)
- Bar chart showing duration of each API
- Visual comparison of API performance
- Color-coded bars (blue for all APIs)
- Summary statistics cards:
  - Total Duration
  - Average Duration
  - Successful Count
  - Failed Count

## How to Access

### Method 1: From API Group Editor
1. Open any API Group
2. Click the **"📊 Performance Dashboard"** button (top-right)
3. Dashboard opens in a new browser tab

### Method 2: Direct URL
Navigate to: `/groups/{groupId}/performance`

Example: `http://localhost:3000/groups/1/performance`

## User Interface Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [Close] 📊 Performance Dashboard                                │
│         API Group Name                                           │
├──────────────┬──────────────────────────┬────────────────────────┤
│ HISTORY      │ API DETAILS              │ PERFORMANCE CHART      │
│              │                          │                        │
│ ▶ Product_   │ #1 Create Product        │ ┌────────────────────┐ │
│   May 20_    │    650 ms | HTTP 200     │ │    Bar Chart       │ │
│   18:30:00   │                          │ │                    │ │
│   ✓ 2 ✗ 0    │ #2 Update Product        │ │  [████] API 1      │ │
│              │    600 ms | HTTP 200     │ │  [███]  API 2      │ │
│ □ Product_   │                          │ └────────────────────┘ │
│   May 20_    │ ┌──────────────────────┐ │                        │
│   17:45:00   │ │ Request Body         │ │ Total: 1250 ms         │
│   ✓ 2 ✗ 0    │ │ {                    │ │ Average: 625 ms        │
│              │ │   "itemName": "..."  │ │ Success: 2             │
│              │ │ }                    │ │ Failed: 0              │
│              │ └──────────────────────┘ │                        │
│              │ ┌──────────────────────┐ │                        │
│              │ │ Response             │ │                        │
│              │ │ {                    │ │                        │
│              │ │   "id": 6,           │ │                        │
│              │ │   "status": "ok"     │ │                        │
│              │ │ }                    │ │                        │
│              │ └──────────────────────┘ │                        │
└──────────────┴──────────────────────────┴────────────────────────┘
```

## Step-by-Step Usage

### Step 1: Execute Your API Flow
1. Configure your APIs in an API Group
2. Click "Execute Flow" button
3. Wait for execution to complete
4. Execution is automatically saved to history

### Step 2: Open Performance Dashboard
1. Click **"📊 Performance Dashboard"** button
2. New tab opens with the dashboard
3. See all execution history on the left

### Step 3: Select an Execution
1. Click any execution from the history list
2. Selected item highlights in blue
3. API list appears in the middle panel
4. Performance chart appears on the right

### Step 4: View API Details
1. Click any API from the list
2. Request and Response appear below
3. View formatted JSON data
4. Check status codes and errors

### Step 5: Analyze Performance
1. Review the bar chart on the right
2. Compare API durations visually
3. Check summary statistics
4. Identify slow APIs

## History Name Format

Execution history items are named using this pattern:
```
{GroupName}_{Date}_{Time}
```

### Examples:
- `Product_May 20, 2026_18:30:00`
- `User_Management_May 20, 2026_17:45:30`
- `Payment_Gateway_May 19, 2026_23:15:45`

### Components:
- **GroupName**: Name of the API Group
- **Date**: Month Day, Year (e.g., "May 20, 2026")
- **Time**: HH:MM:SS in 12-hour format

## Status Indicators

### Execution Status
- **✓ COMPLETED** (Green) - All APIs executed successfully
- **✗ FAILED** (Red) - One or more APIs failed

### API Status
- **SUCCESS** (Green badge) - API executed successfully
- **FAILED** (Red badge) - API execution failed

### Counts
- **✓ {number}** (Green) - Number of successful APIs
- **✗ {number}** (Red) - Number of failed APIs

## Performance Metrics

### Duration Display
- Shown in milliseconds (ms)
- Displayed for each API individually
- Total duration shown for entire execution
- Average duration calculated automatically

### Chart Features
- **X-Axis**: API names (rotated 45° for readability)
- **Y-Axis**: Duration in milliseconds
- **Bars**: Blue color, rounded corners
- **Tooltip**: Hover to see exact values
- **Legend**: Shows "Duration (ms)"

## Request/Response Viewer

### Features
- **Side-by-side layout**: Request on left, Response on right
- **Formatted JSON**: Automatic pretty-printing with indentation
- **Syntax highlighting**: Easy to read JSON structure
- **Scrollable**: Handle large payloads
- **Status codes**: Displayed in response header
- **Error messages**: Highlighted in red below response

### Example Display

**Request Body:**
```json
{
  "itemName": "Mechanical Keyboard",
  "quantity": 45,
  "price": 89.99
}
```

**Response (HTTP 200):**
```json
{
  "id": 6,
  "itemName": "Mechanical Keyboard",
  "quantity": 45,
  "status": "created"
}
```

## Use Cases

### 1. Performance Analysis
- Compare execution times across different runs
- Identify slow APIs in the workflow
- Track performance improvements over time
- Find bottlenecks in the API chain

### 2. Debugging
- Review failed executions
- Check error messages
- Verify request/response data
- Trace data flow through APIs

### 3. Testing Validation
- Confirm correct request payloads
- Verify response structures
- Check status codes
- Validate error handling

### 4. Documentation
- Reference actual request/response examples
- Show API behavior to team members
- Create test case documentation
- Generate API usage examples

## Keyboard Shortcuts

- **Esc**: Close the dashboard tab (browser default)
- **Ctrl/Cmd + W**: Close the tab
- **Ctrl/Cmd + R**: Refresh to see new executions

## Tips & Best Practices

### 1. Regular Monitoring
- Check dashboard after each execution
- Review performance trends
- Identify degradation early

### 2. Error Investigation
- Always check failed executions
- Review error messages carefully
- Verify request data was correct

### 3. Performance Optimization
- Compare before/after optimization
- Track improvements over time
- Document performance baselines

### 4. Team Collaboration
- Share dashboard URL with team
- Discuss execution results
- Use for code reviews

## Troubleshooting

### No Execution History Showing

**Problem:** History panel is empty

**Solutions:**
1. Execute the API flow at least once
2. Refresh the dashboard page
3. Check if correct API Group is selected
4. Verify backend is running

### Chart Not Displaying

**Problem:** Performance chart shows empty state

**Solutions:**
1. Select an execution from history
2. Ensure execution has API results
3. Check browser console for errors
4. Refresh the page

### Request/Response Not Showing

**Problem:** Details panel is empty

**Solutions:**
1. Click on an API from the list
2. Ensure API was executed (not just configured)
3. Check if execution completed successfully
4. Verify data was saved in database

### Dashboard Won't Open

**Problem:** Clicking button does nothing

**Solutions:**
1. Check if pop-up blocker is enabled
2. Allow pop-ups for this site
3. Try Ctrl+Click to force new tab
4. Check browser console for errors

## Technical Details

### Data Flow
```
1. User clicks "Execute Flow"
   ↓
2. Backend executes APIs sequentially
   ↓
3. Results saved to ExecutionRun table
   ↓
4. User clicks "Performance Dashboard"
   ↓
5. New tab opens with dashboard
   ↓
6. Frontend fetches execution history
   ↓
7. User selects execution
   ↓
8. Details and chart displayed
```

### API Endpoints Used
- `GET /api/execution/runs/{groupId}` - Fetch all execution runs
- `GET /api/groups/{id}` - Fetch group details

### Components
- **PerformanceDashboard.jsx** - Main dashboard component
- **PerformanceDashboard.css** - Styling
- **Recharts** - Chart library for bar chart
- **React Query** - Data fetching and caching

### Browser Compatibility
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## Future Enhancements

Planned features:
- [ ] Export execution data to CSV
- [ ] Compare multiple executions
- [ ] Filter by date range
- [ ] Search execution history
- [ ] Custom chart types (line, pie)
- [ ] Real-time execution monitoring
- [ ] Performance alerts/notifications
- [ ] Execution replay functionality

---
*Made with Bob*