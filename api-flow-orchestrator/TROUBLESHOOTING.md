# Troubleshooting Guide

## Issue: Dashboard Shows "Loading..." Indefinitely

### Root Cause
The frontend cannot connect to the backend API, which is typically caused by:
1. Backend server not running
2. Database connection issues
3. CORS configuration problems
4. Port conflicts

---

## Solution Steps

### Step 1: Verify Backend is Running

1. **Start the Backend Server**
   ```bash
   cd api-flow-orchestrator/backend
   mvn spring-boot:run
   ```

2. **Check Console Output**
   Look for these messages:
   ```
   Started ApiFlowOrchestratorApplication in X.XXX seconds
   Tomcat started on port(s): 8085 (http)
   ```

3. **Test Backend Directly**
   Open browser and navigate to:
   ```
   http://localhost:8085/api/groups
   ```
   
   **Expected**: JSON response (empty array `[]` or list of groups)
   **If Error**: Backend is not running or has issues

---

### Step 2: Verify Database Connection

1. **Check SQL Server is Running**
   ```bash
   # Windows
   sc query MSSQLSERVER
   
   # Or check in Services (services.msc)
   ```

2. **Verify Database Exists**
   ```sql
   -- Connect to SQL Server and run:
   SELECT name FROM sys.databases WHERE name = 'INTEGRATION';
   ```

3. **Create Database if Missing**
   ```sql
   CREATE DATABASE INTEGRATION;
   GO
   ```

4. **Check Connection Settings**
   File: `backend/src/main/resources/application.properties`
   ```properties
   spring.datasource.url=jdbc:sqlserver://localhost\\MSSQLSERVER01;databaseName=INTEGRATION;encrypt=false;trustServerCertificate=true
   spring.datasource.username=sa
   spring.datasource.password=12345
   ```

---

### Step 3: Verify Frontend is Running

1. **Start the Frontend Server**
   ```bash
   cd api-flow-orchestrator/frontend
   npm install  # First time only
   npm run dev
   ```

2. **Check Console Output**
   Look for:
   ```
   VITE v5.x.x  ready in XXX ms
   ➜  Local:   http://localhost:3000/
   ```

3. **Open Browser**
   Navigate to: `http://localhost:3000`

---

### Step 4: Check Browser Console

1. **Open Developer Tools** (F12)
2. **Go to Console Tab**
3. **Look for Errors**

**Common Errors:**

#### Error: "Failed to fetch" or "Network Error"
```
Solution: Backend is not running
→ Start backend: mvn spring-boot:run
```

#### Error: "CORS policy" or "Access-Control-Allow-Origin"
```
Solution: CORS misconfiguration
→ Verify @CrossOrigin annotations in controllers
→ Check allowed origins match frontend URL
```

#### Error: "404 Not Found"
```
Solution: Wrong API endpoint
→ Verify backend is running on port 8085
→ Check API base URL in frontend/src/services/api.js
```

---

### Step 5: Verify Ports

**Backend Port**: 8085
**Frontend Port**: 3000 (or 5173 with Vite)

**Check if ports are in use:**
```bash
# Windows
netstat -ano | findstr :8085
netstat -ano | findstr :3000

# If port is occupied, kill the process or change port
```

---

## Quick Fix: Reset Everything

If nothing works, try this complete reset:

### 1. Stop All Servers
- Stop backend (Ctrl+C in terminal)
- Stop frontend (Ctrl+C in terminal)

### 2. Clean Backend
```bash
cd api-flow-orchestrator/backend
mvn clean
```

### 3. Verify Database
```sql
-- In SQL Server Management Studio
USE INTEGRATION;
GO

-- Check if tables exist
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES;

-- If no tables, they will be created on next startup
```

### 4. Start Backend
```bash
cd api-flow-orchestrator/backend
mvn spring-boot:run
```

**Wait for**: "Started ApiFlowOrchestratorApplication"

### 5. Test Backend API
Open browser: `http://localhost:8085/api/groups`

**Expected**: `[]` or list of groups

### 6. Start Frontend
```bash
cd api-flow-orchestrator/frontend
npm run dev
```

### 7. Open Application
Navigate to: `http://localhost:3000`

---

## Common Issues & Solutions

### Issue: "Create New Group" Button Not Visible

**Cause**: Dashboard stuck in loading state

**Solution**:
1. Check browser console for errors
2. Verify backend is running: `http://localhost:8085/api/groups`
3. Check network tab in DevTools for failed requests

---

### Issue: SQL Server Connection Failed

**Error Message**:
```
Cannot create PoolableConnectionFactory
Login failed for user 'sa'
```

**Solutions**:

1. **Enable SQL Server Authentication**
   - Open SQL Server Management Studio
   - Right-click server → Properties → Security
   - Select "SQL Server and Windows Authentication mode"
   - Restart SQL Server service

2. **Reset SA Password**
   ```sql
   ALTER LOGIN sa WITH PASSWORD = '12345';
   ALTER LOGIN sa ENABLE;
   ```

3. **Check SQL Server Instance Name**
   - Verify instance name: `localhost\MSSQLSERVER01`
   - Update in application.properties if different

---

### Issue: Tables Not Created

**Cause**: Hibernate DDL auto-update not working

**Solution**:
1. Check `application.properties`:
   ```properties
   spring.jpa.hibernate.ddl-auto=update
   ```

2. Manually create tables (see DATABASE_SETUP.md)

3. Check user permissions:
   ```sql
   -- Grant CREATE TABLE permission
   GRANT CREATE TABLE TO sa;
   ```

---

### Issue: CORS Errors in Browser

**Error**:
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**:
1. Verify @CrossOrigin in controllers includes your frontend URL
2. Check application.properties for CORS settings
3. Restart backend after changes

---

## Verification Checklist

Use this checklist to verify everything is working:

- [ ] SQL Server is running
- [ ] Database "INTEGRATION" exists
- [ ] Backend starts without errors
- [ ] Backend responds at http://localhost:8085/api/groups
- [ ] Frontend starts without errors
- [ ] Frontend loads at http://localhost:3000
- [ ] Dashboard shows "Create New Group" button
- [ ] No errors in browser console
- [ ] Can create a new API group
- [ ] Can navigate to group editor

---

## Still Having Issues?

### Check Logs

**Backend Logs**:
```bash
# In backend terminal, look for:
- Connection errors
- SQL exceptions
- Port binding errors
```

**Frontend Logs**:
```bash
# In browser console (F12), look for:
- Network errors
- API call failures
- CORS errors
```

### Test API Endpoints Manually

Use Postman or curl to test:

```bash
# Test GET all groups
curl http://localhost:8085/api/groups

# Test CREATE group
curl -X POST http://localhost:8085/api/groups \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Group","description":"Test"}'
```

---

## Contact Support

If issues persist:
1. Collect error messages from console
2. Check backend logs
3. Verify database connection
4. Review this troubleshooting guide
5. Check DATABASE_SETUP.md for database configuration

---

**Last Updated**: May 20, 2026