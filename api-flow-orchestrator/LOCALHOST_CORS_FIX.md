# Localhost CORS Issue - Fixed

## Problem
The application was unable to test localhost microservices (e.g., `http://localhost:8082/addItem`) and returned "Network Error", while Postman worked fine.

## Root Causes

### 1. CORS Configuration Error
The [`CorsConfig.java`](backend/src/main/java/com/apiflow/config/CorsConfig.java) had an invalid configuration:
- `setAllowCredentials(true)` was set with `setAllowedOrigins(["*"])`
- **This combination is forbidden by browsers** - when credentials are allowed, you cannot use wildcard origins

### 2. Direct Browser Requests
The [`ApiTester.jsx`](frontend/src/components/ApiTester.jsx) component was making direct axios requests to external URLs, which triggers CORS preflight checks that fail for localhost-to-localhost communication.

## Solutions Implemented

### 1. Fixed CORS Configuration
**File:** `backend/src/main/java/com/apiflow/config/CorsConfig.java`

Changed from:
```java
config.setAllowCredentials(true);
config.setAllowedOrigins(Arrays.asList("*"));
```

To:
```java
config.setAllowCredentials(true);
config.setAllowedOriginPatterns(Arrays.asList(
    "http://localhost:*",
    "http://127.0.0.1:*"
));
config.setExposedHeaders(Arrays.asList("*"));
```

**Why this works:**
- `setAllowedOriginPatterns` allows pattern matching for origins
- Supports any localhost port (e.g., `localhost:3000`, `localhost:8082`)
- Compatible with `allowCredentials=true`

### 2. Created Proxy Endpoint
**File:** `backend/src/main/java/com/apiflow/controller/ProxyController.java`

Created a new REST endpoint `/api/proxy/execute` that:
- Accepts requests from the frontend
- Forwards them to any target URL (including localhost services)
- Returns the response back to the frontend
- Bypasses CORS issues since it's a server-to-server call

**Endpoint Details:**
- **URL:** `POST /api/proxy/execute`
- **Request Body:**
  ```json
  {
    "method": "GET|POST|PUT|DELETE|PATCH",
    "url": "http://localhost:8082/addItem",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{...}"
  }
  ```

### 3. Updated Frontend to Use Proxy
**File:** `frontend/src/components/ApiTester.jsx`

Modified the `sendRequestMutation` to route all requests through the proxy:

```javascript
// Before: Direct axios call (CORS issues)
const response = await axios({
  method: requestData.method,
  url: requestData.url,
  headers: requestData.headers,
  data: requestData.body
});

// After: Proxy call (no CORS issues)
const response = await axios.post('/api/proxy/execute', {
  method: requestData.method,
  url: requestData.url,
  headers: requestData.headers,
  body: typeof requestData.body === 'string' ? requestData.body : JSON.stringify(requestData.body)
});
```

## How It Works Now

1. **Frontend (localhost:3000)** → Makes request to `/api/proxy/execute`
2. **Vite Proxy** → Forwards to backend at `localhost:8085/api/proxy/execute`
3. **Backend ProxyController** → Makes server-side request to target URL (e.g., `localhost:8082/addItem`)
4. **Target Service** → Responds to backend
5. **Backend** → Returns response to frontend
6. **Frontend** → Displays response

## Testing

After the backend restarts (Spring Boot auto-reload should detect the new ProxyController):

1. Open your application at `http://localhost:3000`
2. Navigate to the API Tester
3. Enter: `http://localhost:8082/addItem`
4. Method: `POST`
5. Body: Your JSON payload
6. Click "Send"

**Expected Result:** ✅ Success response (same as Postman)

## Why Postman Works But Browsers Don't

- **Postman** is a native application that doesn't enforce CORS policies
- **Browsers** enforce Same-Origin Policy and CORS for security
- **Solution:** Use a backend proxy to make server-to-server calls (no CORS restrictions)

## Additional Benefits

The proxy approach also:
- ✅ Allows testing of services on different ports
- ✅ Enables testing of services on different machines
- ✅ Provides a centralized point for request logging/monitoring
- ✅ Can add authentication/authorization if needed
- ✅ Works with any HTTP method (GET, POST, PUT, DELETE, PATCH)

## Files Modified

1. `backend/src/main/java/com/apiflow/config/CorsConfig.java` - Fixed CORS configuration
2. `backend/src/main/java/com/apiflow/controller/ProxyController.java` - New proxy endpoint
3. `frontend/src/components/ApiTester.jsx` - Updated to use proxy

---
*Made with Bob*