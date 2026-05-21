# Variable Extraction Error Guide

## Error Message
```
"Error: Not enough variable values available to expand 'PRODUCT_ID'"
```

## What This Means

This error occurs when an API tries to use a variable (e.g., `{{PRODUCT_ID}}`) but that variable doesn't exist in the execution context. The variable either:
1. Was never extracted from a previous API
2. Failed to extract due to incorrect JSON path
3. The previous API that should extract it failed
4. The previous API hasn't executed yet (execution order issue)

---

## Common Causes & Solutions

### Cause 1: Variable Not Configured for Extraction

**Problem**: The previous API doesn't have the variable extraction configured.

**Example**:
- API 1 (Create Product) returns `{"id": 33, "name": "Product"}`
- API 2 (Update Product) tries to use `{{PRODUCT_ID}}`
- But API 1 doesn't have variable extraction configured

**Solution**:
1. Open API 1 (Create Product) in the editor
2. Scroll to "Response Data Variables" section
3. Click "Add Variable"
4. Configure:
   - **Variable Name**: `PRODUCT_ID`
   - **JSON Path**: `id`
5. Save the API
6. Execute the flow again

---

### Cause 2: Incorrect JSON Path

**Problem**: The JSON path doesn't match the actual response structure.

**Example Response**:
```json
{
  "data": {
    "product": {
      "id": 33,
      "name": "Keyboard"
    }
  }
}
```

**Wrong Configuration**:
- Variable Name: `PRODUCT_ID`
- JSON Path: `id` ❌ (This won't find the ID)

**Correct Configuration**:
- Variable Name: `PRODUCT_ID`
- JSON Path: `data.product.id` ✅

**How to Fix**:
1. Check the actual API response in execution results
2. Identify the correct path to the value
3. Update the JSON path in variable configuration
4. Use dot notation: `parent.child.field`

**Common Response Structures**:

| Response Structure | Correct JSON Path |
|-------------------|-------------------|
| `{"id": 123}` | `id` |
| `{"data": {"id": 123}}` | `data.id` |
| `{"result": {"user": {"id": 123}}}` | `result.user.id` |
| `{"response": {"data": {"userId": 123}}}` | `response.data.userId` |

---

### Cause 3: Previous API Failed

**Problem**: The API that should extract the variable failed, so the variable was never extracted.

**Example**:
- API 1 (Create Product) fails with 500 error
- Variable `PRODUCT_ID` is not extracted
- API 2 (Update Product) tries to use `{{PRODUCT_ID}}`
- Error: Variable not available

**Solution**:
1. Check execution results for API 1
2. Fix the issue causing API 1 to fail
3. Ensure API 1 returns 200 OK
4. Execute the flow again

---

### Cause 4: Wrong Execution Order

**Problem**: APIs are executing in the wrong order.

**Example**:
- API 1: Update Product (uses `{{PRODUCT_ID}}`)
- API 2: Create Product (extracts `PRODUCT_ID`)
- Error: PRODUCT_ID not available when API 1 runs

**Solution**:
1. Open the API Group editor
2. Use the up/down arrows to reorder APIs
3. Ensure the extracting API comes BEFORE the using API
4. Correct order:
   - API 1: Create Product (extracts `PRODUCT_ID`)
   - API 2: Update Product (uses `{{PRODUCT_ID}}`)

---

### Cause 5: Variable Name Mismatch

**Problem**: The variable name in extraction doesn't match the variable name in usage.

**Example**:
- Extraction: Variable Name = `ProductID`
- Usage: `{{PRODUCT_ID}}`
- Error: PRODUCT_ID not found (case-sensitive!)

**Solution**:
1. Check the exact variable name in extraction configuration
2. Use the EXACT same name in `{{}}` syntax
3. Variable names are case-sensitive
4. Common mistakes:
   - `ProductID` vs `PRODUCT_ID`
   - `product_id` vs `PRODUCT_ID`
   - `productId` vs `PRODUCT_ID`

---

### Cause 6: Testing Individual API (Not in Flow)

**Problem**: Testing an API individually in API Tester that uses variables.

**Example**:
- Open "Update Product" API in API Tester
- Click "Send"
- Error: PRODUCT_ID not available

**Why**: API Tester doesn't have execution context from previous APIs.

**Solution**:
- Don't test APIs with variables individually
- Always test the complete flow using "Execute Flow" button
- Variables only work during flow execution

---

## Step-by-Step Debugging Guide

### Step 1: Verify Variable Extraction Configuration

1. Open the API that should extract the variable
2. Check "Response Data Variables" section
3. Verify:
   - ✅ Variable is configured
   - ✅ Variable name is correct
   - ✅ JSON path is correct

### Step 2: Check API Response Structure

1. Execute the flow
2. View execution results
3. Click on the extracting API
4. Look at the actual response
5. Verify the JSON path matches the response structure

**Example**:

If response is:
```json
{
  "success": true,
  "data": {
    "id": 33,
    "name": "Product"
  }
}
```

Then JSON path should be: `data.id` (not just `id`)

### Step 3: Verify Execution Order

1. Check the sequence numbers (#1, #2, #3)
2. Ensure extracting API comes before using API
3. Use up/down arrows to reorder if needed

### Step 4: Check for API Failures

1. Look at execution results
2. Check if the extracting API succeeded (green badge)
3. If it failed (red badge), fix that API first

### Step 5: Verify Variable Name Consistency

1. Note the exact variable name from extraction
2. Check all usages of `{{VARIABLE_NAME}}`
3. Ensure exact match (case-sensitive)

---

## Complete Example: Product Workflow

### Correct Setup

**API 1: Create Product**
```
Method: POST
URL: http://localhost:8082/addItem
Body: {
  "itemName": "Keyboard",
  "quantity": 45,
  "price": 89.99
}

Response Data Variables:
- Variable Name: PRODUCT_ID
- JSON Path: id
```

**API 2: Update Product**
```
Method: POST
URL: http://localhost:8082/updateItem
Body: {
  "id": "{{PRODUCT_ID}}",
  "quantity": 100,
  "price": 79.99
}
```

### Execution Flow

1. API 1 executes
2. Response: `{"id": 33, "itemName": "Keyboard", ...}`
3. System extracts: `PRODUCT_ID = 33`
4. API 2 executes
5. Body becomes: `{"id": "33", "quantity": 100, "price": 79.99}`
6. Success!

---

## Quick Checklist

When you see "Not enough variable values available to expand 'VARIABLE_NAME'":

- [ ] Is the variable configured for extraction in a previous API?
- [ ] Is the JSON path correct for the response structure?
- [ ] Did the previous API execute successfully (200 OK)?
- [ ] Is the execution order correct (extractor before user)?
- [ ] Is the variable name exactly the same (case-sensitive)?
- [ ] Are you executing the flow (not testing individual API)?

---

## Testing Your Fix

After making changes:

1. **Execute the complete flow** (not individual APIs)
2. **Check execution results**:
   - Verify extracting API succeeded
   - Check "Extracted Variables" section
   - Confirm variable has a value
3. **Check using API**:
   - Verify it succeeded
   - Check request body in results
   - Confirm variable was replaced with actual value

---

## Still Having Issues?

### Debug Mode

1. Execute the flow
2. Open execution results
3. For the extracting API:
   - Click to view details
   - Check the response body
   - Verify the field exists
4. For the using API:
   - Click to view details
   - Check the request body
   - See if variable was replaced

### Common Patterns

**Pattern 1: Nested Response**
```json
Response: {"data": {"user": {"id": 123}}}
JSON Path: data.user.id
```

**Pattern 2: Array Response**
```json
Response: {"items": [{"id": 123}]}
JSON Path: items.0.id
```

**Pattern 3: Direct Response**
```json
Response: {"id": 123, "name": "Test"}
JSON Path: id
```

---

*Made with Bob*