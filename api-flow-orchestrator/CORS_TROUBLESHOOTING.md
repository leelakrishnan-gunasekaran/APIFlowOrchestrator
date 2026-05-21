# CORS Troubleshooting Guide

## Issue: Network Error when testing localhost APIs

When testing APIs running on localhost (e.g., `http://localhost:8082/addItem`) from the API Tester, you may encounter a "Network Error". This is due to browser CORS (Cross-Origin Resource Sharing) policy.

## Why This Happens

- Frontend runs on: `http://localhost:3001`
- Your API runs on: `http://localhost:8082`
- Browser blocks requests between different origins for security

## Solutions

### Solution 1: Enable CORS on Your API Server (Recommended)

Add CORS headers to your API server running on port 8082:

**For Express.js (Node.js):**
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
```

**For Spring Boot (Java):**
```java
@CrossOrigin(origins = "http://localhost:3001")
@RestController
public class YourController {
    // your endpoints
}
```

**For Flask (Python):**
```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app, origins=['http://localhost:3001'])
```

### Solution 2: Use a Browser Extension

Install a CORS browser extension (for development only):
- Chrome: "Allow CORS: Access-Control-Allow-Origin"
- Firefox: "CORS Everywhere"

**Warning:** Only use this for development. Disable it when browsing other sites.

### Solution 3: Test with Public APIs

Use public APIs that have CORS enabled:
- JSONPlaceholder: `https://jsonplaceholder.typicode.com/users/1`
- ReqRes: `https://reqres.in/api/users`
- HTTPBin: `https://httpbin.org/get`

## Testing the Fix

1. After enabling CORS on your API server
2. Restart your API server
3. In API Tester, try the request again
4. It should work without Network Error

## For Production

When deploying to production:
- Configure CORS to only allow your production frontend domain
- Never use `origin: '*'` in production
- Use environment variables for allowed origins

## Alternative: Use the API Flow Orchestrator Backend

The API Flow Orchestrator backend (port 8085) acts as a proxy and handles CORS for you:
1. Save your API to a group
2. Execute the flow using "Execute Flow" button
3. The backend makes the API calls server-side (no CORS issues)

This is the recommended approach for production use.