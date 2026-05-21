# Variable Chaining Guide - Using Extracted Values in Subsequent APIs

## Overview

Your application already supports variable chaining! You can extract values from one API response and use them in subsequent APIs using the `{{VARIABLE_NAME}}` syntax.

## How It Works

### Backend Implementation
The [`ApiExecutionService.java`](backend/src/main/java/com/apiflow/service/ApiExecutionService.java) already handles variable replacement:
- Line 49: Creates a `variableContext` map to store extracted values
- Line 99-105: Replaces `{{variables}}` in URLs, headers, and request bodies
- Line 149: Extracts new variables from responses and adds them to the context
- Variables flow through the execution sequence automatically

## Step-by-Step Example: Create Product → Update Product

### Step 1: Create the "Create Product" API

1. **Go to API Tester**
2. **Configure the API:**
   ```
   Method: POST
   URL: http://localhost:8082/addItem
   Body:
   {
     "itemName": "Mechanical Keyboard",
     "quantity": 45,
     "price": 89.99,
     "supplier": "Keychron Corp",
     "category": "Peripherals",
     "location": "Warehouse A",
     "description": "RGB backlit wireless keyboard",
     "manufactureDate": "2026-03-20T10:00:00",
     "expiryDate": "2031-03-20T10:00:00"
   }
   ```

3. **Configure Variable Extraction:**
   - Click **Add Variable**
   - **Variable Name:** `PRODUCT_ID`
   - **JSON Path:** `id`
   - **Value:** (will be populated after sending)

4. **Test the API:**
   - Click **Send**
   - Verify response contains `"id": 6` (or similar)
   - Verify the variable shows the extracted value

5. **Save to API Group:**
   - Click **Save**
   - Select or create a group (e.g., "Product")
   - API Name: "Create Product"
   - Click **Save**

### Step 2: Create the "Update Product" API

1. **In API Tester, configure:**
   ```
   Method: POST
   URL: http://localhost:8082/updateItem
   Body:
   {
     "id": "{{PRODUCT_ID}}",
     "quantity": 100,
     "price": 79.99
   }
   ```

   **Important:** Use `{{PRODUCT_ID}}` exactly as shown - this will be replaced with the actual ID during flow execution.

2. **No variable extraction needed** (unless you want to extract something from the update response)

3. **Save to the same API Group:**
   - Click **Save**
   - Select the same group ("Product")
   - API Name: "Update Product"
   - Click **Save**

### Step 3: Execute the Flow

1. **Go to API Groups**
2. **Open the "Product" group**
3. **Verify the sequence:**
   - API 1: Create Product (extracts `PRODUCT_ID`)
   - API 2: Update Product (uses `{{PRODUCT_ID}}`)

4. **Click "Execute Flow"**

5. **What happens:**
   ```
   Step 1: Create Product executes
   → Response: { "id": 6, "itemName": "Mechanical Keyboard", ... }
   → Extracts: PRODUCT_ID = 6
   → Stores in variableContext

   Step 2: Update Product executes
   → Original body: { "id": "{{PRODUCT_ID}}", "quantity": 100, ... }
   → Replaced body: { "id": "6", "quantity": 100, ... }
   → Sends request with actual ID
   → Success!
   ```

6. **View Results:**
   - Check "Extracted Variables" section
   - See `PRODUCT_ID = 6`
   - Check execution results to see both APIs succeeded

## Variable Syntax

### In Request Body
```json
{
  "id": "{{PRODUCT_ID}}",
  "userId": "{{USER_ID}}",
  "amount": "{{TOTAL_AMOUNT}}"
}
```

### In URL
```
http://localhost:8082/products/{{PRODUCT_ID}}/details
http://localhost:8082/users/{{USER_ID}}/orders/{{ORDER_ID}}
```

### In Headers
```json
{
  "X-Product-ID": "{{PRODUCT_ID}}",
  "Authorization": "Bearer {{ACCESS_TOKEN}}"
}
```

## Advanced Examples

### Example 1: Multi-Step Product Workflow

**API 1: Create Product**
```
POST http://localhost:8082/addItem
Extracts: PRODUCT_ID from response.id
```

**API 2: Get Product Details**
```
GET http://localhost:8082/products/{{PRODUCT_ID}}
Extracts: SUPPLIER_ID from response.supplierId
```

**API 3: Update Supplier**
```
PUT http://localhost:8082/suppliers/{{SUPPLIER_ID}}
Body: { "status": "active" }
```

### Example 2: User Registration Flow

**API 1: Register User**
```
POST http://localhost:8082/register
Body: { "email": "user@example.com", "password": "secret" }
Extracts: USER_ID from response.userId
```

**API 2: Create Profile**
```
POST http://localhost:8082/profiles
Body: { "userId": "{{USER_ID}}", "name": "John Doe" }
Extracts: PROFILE_ID from response.profileId
```

**API 3: Upload Avatar**
```
POST http://localhost:8082/profiles/{{PROFILE_ID}}/avatar
Body: { "imageUrl": "https://..." }
```

### Example 3: Nested JSON Path Extraction

**API Response:**
```json
{
  "data": {
    "user": {
      "id": 123,
      "profile": {
        "email": "user@example.com"
      }
    }
  }
}
```

**Variable Extraction:**
- Variable Name: `USER_ID`
- JSON Path: `data.user.id`
- Extracted Value: `123`

**Usage in Next API:**
```json
{
  "userId": "{{USER_ID}}"
}
```

## Testing Variable Replacement

### In API Tester (Preview Only)
When you test in API Tester, variables won't be replaced because there's no execution context. The API Tester is for individual testing only.

### In Flow Execution (Actual Replacement)
Variables are only replaced during flow execution when:
1. Previous APIs have extracted the variables
2. The variables exist in the execution context
3. The syntax `{{VARIABLE_NAME}}` is used correctly

## Common Patterns

### Pattern 1: Create → Read → Update → Delete (CRUD)
```
1. POST /items          → Extract: ITEM_ID
2. GET /items/{{ITEM_ID}}
3. PUT /items/{{ITEM_ID}}
4. DELETE /items/{{ITEM_ID}}
```

### Pattern 2: Authentication Flow
```
1. POST /login          → Extract: ACCESS_TOKEN
2. GET /profile         → Header: "Authorization: Bearer {{ACCESS_TOKEN}}"
3. POST /data           → Header: "Authorization: Bearer {{ACCESS_TOKEN}}"
```

### Pattern 3: Parent-Child Relationship
```
1. POST /orders         → Extract: ORDER_ID
2. POST /orders/{{ORDER_ID}}/items
3. POST /orders/{{ORDER_ID}}/items
4. POST /orders/{{ORDER_ID}}/checkout
```

## Troubleshooting

### Variable Not Being Replaced

**Problem:** `{{PRODUCT_ID}}` appears literally in the request

**Solutions:**
1. ✅ Verify the variable was extracted in a previous API
2. ✅ Check the variable name matches exactly (case-sensitive)
3. ✅ Ensure the extracting API executed successfully
4. ✅ Verify the JSON path is correct
5. ✅ Check execution order (extracting API must run first)

### Variable Shows "Not executed yet"

**Problem:** Variable extraction configured but no value shown

**Solutions:**
1. ✅ Execute the flow (not just test in API Tester)
2. ✅ Check if the API response contains the expected field
3. ✅ Verify JSON path syntax (use dot notation: `data.user.id`)
4. ✅ Review execution results for errors

### Wrong Value Extracted

**Problem:** Variable extracts wrong value or null

**Solutions:**
1. ✅ Check the actual API response structure
2. ✅ Adjust JSON path to match response structure
3. ✅ Test in API Tester first to verify extraction
4. ✅ Use browser dev tools to inspect actual response

## Best Practices

### 1. Use Descriptive Variable Names
```
✅ Good: PRODUCT_ID, USER_EMAIL, ORDER_TOTAL
❌ Bad: ID, VAR1, X
```

### 2. Extract Only What You Need
```
✅ Extract: PRODUCT_ID (used in next API)
❌ Extract: PRODUCT_NAME (not used anywhere)
```

### 3. Verify Extraction Before Using
```
1. Test extraction in API Tester
2. Save to group
3. Execute flow
4. Verify extracted value
5. Add dependent APIs
```

### 4. Handle Optional Fields
If a field might not exist, have a fallback:
```
API 1: Extract OPTIONAL_ID (might be null)
API 2: Check if OPTIONAL_ID exists before using
```

### 5. Document Variable Dependencies
In API names or descriptions:
```
"Update Product (requires PRODUCT_ID from Create Product)"
```

## Quick Reference

| Action | Syntax | Example |
|--------|--------|---------|
| Extract variable | Configure in API node | Variable: `PRODUCT_ID`, Path: `id` |
| Use in body | `{{VARIABLE_NAME}}` | `{"id": "{{PRODUCT_ID}}"}` |
| Use in URL | `{{VARIABLE_NAME}}` | `/products/{{PRODUCT_ID}}` |
| Use in header | `{{VARIABLE_NAME}}` | `"X-ID": "{{PRODUCT_ID}}"` |
| Nested path | Dot notation | `data.user.profile.id` |
| Array access | Not supported | Use index: `items.0.id` |

## Summary

✅ **Variable chaining is already working in your application!**

**To use it:**
1. Extract variables from API responses (Variable Name + JSON Path)
2. Use `{{VARIABLE_NAME}}` syntax in subsequent APIs
3. Execute the flow (not individual tests)
4. Variables are automatically replaced during execution

**The backend handles everything automatically:**
- Variable extraction from responses
- Storage in execution context
- Replacement in URLs, headers, and bodies
- Sequential execution with variable flow

---
*Made with Bob*