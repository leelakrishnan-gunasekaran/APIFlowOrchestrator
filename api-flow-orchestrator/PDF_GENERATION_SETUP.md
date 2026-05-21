# PDF Generation Setup Guide

## Overview

The API Flow Orchestrator now supports automatic PDF report generation for API execution results. This feature generates comprehensive reports including:

- Overall performance metrics and timeline graph
- Detailed API information (URL, Method, Request, Response, Duration)
- Status codes and error messages
- Visual performance bars

## Installation

To enable PDF generation, you need to install the required dependencies:

```bash
cd api-flow-orchestrator/frontend
npm install jspdf jspdf-autotable
```

## Features

### 1. Auto-Generate PDF Report (Checkbox)
- **Location:** Top of API Group Editor page
- **Label:** "Auto-generate PDF Report"
- **Behavior:** When checked, automatically generates a PDF report after each flow execution
- **Use Case:** Continuous monitoring and automatic documentation

### 2. Generate Report Now (Button)
- **Location:** Next to the checkbox
- **Label:** "📄 Generate Report Now"
- **Behavior:** Manually generates a PDF report of the current/latest execution results
- **Use Case:** On-demand report generation

### 3. Performance Dashboard (Button)
- **Location:** Right side of control bar
- **Label:** "📊 Performance Dashboard"
- **Behavior:** Toggles visibility of the Performance Heatmap component
- **Use Case:** Visual performance analysis

## PDF Report Contents

### Page 1: Summary
```
┌─────────────────────────────────────────┐
│ API Execution Report                    │
│                                         │
│ Group: Product APIs                     │
│ Generated: 2026-05-20 18:30:00         │
│                                         │
│ Overall Performance                     │
│ - Status: COMPLETED                     │
│ - Total Duration: 1250 ms              │
│ - Successful: 2 | Failed: 0            │
│                                         │
│ Performance Timeline                    │
│ [████████████] Create Product - 650ms   │
│ [██████] Update Product - 600ms         │
└─────────────────────────────────────────┘
```

### Page 2: API Summary Table
```
┌────────────────────────────────────────────────────────┐
│ API Name        │ Method │ URL              │ Duration │
├────────────────────────────────────────────────────────┤
│ Create Product  │ POST   │ localhost:8082   │ 650 ms   │
│ Update Product  │ POST   │ localhost:8082   │ 600 ms   │
└────────────────────────────────────────────────────────┘
```

### Page 3+: Detailed API Information
For each API:
```
1. Create Product
   Method: POST
   URL: http://localhost:8082/addItem
   Duration: 650 ms
   Status: SUCCESS (200)
   
   Request Body:
   {
     "itemName": "Mechanical Keyboard",
     "quantity": 45,
     "price": 89.99
   }
   
   Response:
   {
     "id": 6,
     "itemName": "Mechanical Keyboard",
     "quantity": 45
   }
```

## Usage Instructions

### Method 1: Automatic Generation

1. **Open API Group Editor**
   - Navigate to your API Group

2. **Enable Auto-Generation**
   - Check the "Auto-generate PDF Report" checkbox

3. **Execute Flow**
   - Click "Execute Flow" button
   - Wait for execution to complete
   - PDF will automatically download

4. **Result**
   - PDF file saved as: `{GroupName}_execution_report_{timestamp}.pdf`

### Method 2: Manual Generation

1. **Execute Flow First**
   - Run your API flow at least once to have execution data

2. **Generate Report**
   - Click "📄 Generate Report Now" button
   - PDF will download immediately

3. **Result**
   - PDF file saved with current execution results

## Fallback Behavior

If jsPDF libraries are not installed:
- System automatically falls back to text report generation
- Text file (.txt) is downloaded instead of PDF
- Contains same information in plain text format
- Alert message shows installation instructions

## File Naming Convention

PDF files are named using this pattern:
```
{GroupName}_execution_report_{timestamp}.pdf
```

Examples:
- `Product_execution_report_1716220800000.pdf`
- `User_Management_execution_report_1716220900000.pdf`

## Troubleshooting

### PDF Not Generating

**Problem:** Clicking button does nothing

**Solutions:**
1. Check browser console for errors
2. Verify jsPDF is installed: `npm list jspdf`
3. Ensure execution has completed
4. Check if APIs are configured in the group

### Installation Errors

**Problem:** `npm install` fails

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Install dependencies again
npm install jspdf jspdf-autotable
```

### Text Report Instead of PDF

**Problem:** Getting .txt file instead of PDF

**Solution:**
```bash
# This means jsPDF is not installed
cd api-flow-orchestrator/frontend
npm install jspdf jspdf-autotable

# Restart the development server
npm run dev
```

## Technical Details

### Dependencies
- **jspdf**: ^2.5.1 - Core PDF generation library
- **jspdf-autotable**: ^3.8.0 - Table generation plugin

### File Location
- PDF Generator: `frontend/src/utils/pdfGenerator.js`
- Integration: `frontend/src/pages/ApiGroupEditor.jsx`

### Browser Compatibility
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

### Performance
- Small reports (<10 APIs): < 1 second
- Medium reports (10-50 APIs): 1-3 seconds
- Large reports (>50 APIs): 3-5 seconds

## Best Practices

1. **Execute Before Generating**
   - Always run the flow at least once before generating reports
   - Reports without execution data show "Not executed" status

2. **Use Auto-Generation for CI/CD**
   - Enable checkbox for automated testing scenarios
   - Collect reports for each test run

3. **Manual Generation for Analysis**
   - Use manual button when reviewing specific executions
   - Generate multiple reports to compare performance

4. **Archive Reports**
   - Save reports with meaningful names
   - Organize by date or version for tracking

## Example Workflow

```
1. Configure APIs in API Group
   ↓
2. Check "Auto-generate PDF Report"
   ↓
3. Click "Execute Flow"
   ↓
4. Wait for completion
   ↓
5. PDF automatically downloads
   ↓
6. Review report for:
   - Performance metrics
   - Error analysis
   - Response validation
```

## Future Enhancements

Planned features:
- [ ] Custom report templates
- [ ] Email report delivery
- [ ] Scheduled report generation
- [ ] Comparison reports (before/after)
- [ ] Export to Excel format
- [ ] Chart customization options

---
*Made with Bob*