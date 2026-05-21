# Extracted Variables Guide

## Understanding "Not executed yet"

The "Extracted Value" column shows **"Not executed yet"** because extracted variables are only populated **after executing the API flow**, not from individual API Tester runs.

## How Extracted Variables Work

### 1. **API Tester** (Individual Testing)
When you test an API in the API Tester:
- ✅ You can define variables to extract (Variable Name + JSON Path)
- ✅ These variable definitions are saved with the API node
- ❌ The extracted values are NOT persisted to the API Group
- ❌ The values shown in API Tester are temporary (session only)

**Purpose:** Quick testing and configuration of variable extraction rules

### 2. **API Group Flow Execution** (Sequential Execution)
When you click "Execute Flow" in the API Group Editor:
- ✅ All APIs in the group execute in sequence
- ✅ Variables are extracted from each API response
- ✅ Extracted values are stored in the execution run results
- ✅ These values appear in the "Extracted Variables" section
- ✅ Later APIs can use variables extracted from earlier APIs

**Purpose:** Production execution with variable chaining

## Step-by-Step Workflow

### Step 1: Test and Configure in API Tester
1. Go to **API Tester**
2. Configure your API request (URL, method, body, headers)
3. In the **Variables** section, define what to extract:
   - **Variable Name:** `PRODUCT_ID`
   - **JSON Path:** `id`
4. Click **Send** to test
5. Verify the extraction works (values shown temporarily)
6. Click **Save** to add to an API Group

### Step 2: Execute the Flow
1. Go to **API Groups** and open your group
2. Click **Execute Flow** button
3. Wait for execution to complete
4. Click **Extracted Variables** dropdown

### Step 3: View Extracted Values
Now you'll see:
- ✅ **Extracted Value:** `6` (actual value from response)
- Instead of: ❌ **Extracted Value:** "Not executed yet"

## Example Scenario

### API 1: Create Product
```json
POST http://localhost:8082/addItem
Response: { "id": 6, "itemName": "Mechanical Keyboard", ... }
```
**Variable Extraction:**
- Variable Name: `PRODUCT_ID`
- JSON Path: `id`
- **After Flow Execution:** Extracted Value = `6`

### API 2: Update Product (Uses Variable)
```json
POST http://localhost:8082/updateItem
Body: { "id": "{{PRODUCT_ID}}", "quantity": 50 }
```
The `{{PRODUCT_ID}}` will be replaced with `6` during flow execution.

## Why This Design?

### API Tester = Configuration Tool
- Defines **what** to extract (rules)
- Tests **if** extraction works
- Does NOT persist extracted values

### Flow Execution = Production Tool
- Executes APIs in sequence
- Extracts and stores actual values
- Enables variable chaining between APIs

## Viewing Extracted Values

### In API Group Editor
```
Extracted Variables (1) ▼

┌─────────────────────────────────────────────────────────────────────┐
│ API Name              │ Method │ Variable Name │ Extracted Value    │
├─────────────────────────────────────────────────────────────────────┤
│ POST http://...       │ POST   │ PRODUCT_ID    │ 6                  │
└─────────────────────────────────────────────────────────────────────┘
```

**Before Flow Execution:**
- Extracted Value: "Not executed yet"

**After Flow Execution:**
- Extracted Value: `6` (actual value)

### In Edit API Node Modal
When you click the gear icon on an API node:
- Shows the field mappings (Variable Name → JSON Path)
- Shows "Not executed yet" until flow runs
- After flow execution, shows the actual extracted value

## Common Questions

### Q: Why don't values from API Tester show in API Group?
**A:** API Tester is for testing and configuration only. Values are temporary and not persisted. You must execute the flow to see actual values.

### Q: How do I see if my variable extraction is configured correctly?
**A:** 
1. Test in API Tester - you'll see temporary values
2. Save to API Group
3. Execute the flow
4. Check "Extracted Variables" section

### Q: Can I manually set extracted values?
**A:** No. Extracted values come from actual API responses during flow execution. You can only configure the extraction rules (Variable Name + JSON Path).

### Q: When should I use the API Tester vs Execute Flow?
**A:**
- **API Tester:** Testing individual APIs, configuring extraction rules, debugging
- **Execute Flow:** Running the complete workflow, getting actual extracted values, production use

## Best Practices

1. **Test First:** Always test variable extraction in API Tester before saving
2. **Verify JSON Path:** Make sure your JSON path matches the response structure
3. **Execute to Validate:** After saving, execute the flow to verify extraction works
4. **Check Execution History:** Review past runs to see historical extracted values

## Troubleshooting

### "Not executed yet" persists after execution
- Check if the flow execution completed successfully
- Verify the API response contains the expected field
- Check the JSON path is correct
- Review execution results for errors

### Variable not being extracted
- Verify JSON path syntax (use dot notation: `data.user.id`)
- Check if the field exists in the response
- Ensure the API executed successfully (200 status)
- Look at the raw response in execution results

---
*Made with Bob*