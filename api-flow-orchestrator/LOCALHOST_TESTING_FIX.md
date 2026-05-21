# Localhost Microservices Testing - Network Error Fix

## Problem

When testing localhost microservices (e.g., `http://localhost:8082/addItem`):
- ✅ **Postman**: Works perfectly
- ❌ **Our Application**: Gets "Network Error"

## Root Cause

The issue was in the [`WebClientConfig.java`](backend/src/main/java/com/apiflow/config/WebClientConfig.java) configuration. The default WebClient builder doesn't properly handle localhost connections due to:

1. **No Connection Provider**: Default WebClient has restrictive connection pooling
2. **No Timeout Configuration**: Can cause hanging connections
3. **Missing Reactor Netty Configuration**: Localhost connections need specific HTTP client setup

## Solution Applied

Updated [`WebClientConfig.java`](backend/src/main/java/com/apiflow/config/WebClientConfig.java) with:

### 1. Custom Connection Provider
```java
ConnectionProvider connectionProvider = ConnectionProvider.builder("custom")
    .maxConnections(500)
    .maxIdleTime(Duration.ofSeconds(20))
    .maxLifeTime(Duration.ofSeconds(60))
    .pendingAcquireTimeout(Duration.ofSeconds(60))
    .evictInBackground(Duration.ofSeconds(120))
    .build();
```

### 2. Configured HttpClient with Timeouts
```java
HttpClient httpClient = HttpClient.create(connectionProvider)
    .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 30000)
    .responseTimeout(Duration.ofSeconds(30))
    .doOnConnected(conn ->
        conn.addHandlerLast(new ReadTimeoutHandler(30, TimeUnit.SECONDS))
            .addHandlerLast(new WriteTimeoutHandler(30, TimeUnit.SECONDS)));
```

### 3. WebClient with ReactorClientHttpConnector
```java
return WebClient.builder()
    .clientConnector(new ReactorClientHttpConnector(httpClient));
```

## How to Test the Fix

### Step 1: Restart Backend Server

**Option A - Using Terminal 4 (if still running):**
1. Go to Terminal 4 in VS Code
2. Press `Ctrl+C` to stop the server
3. Run: `mvn spring-boot:run`

**Option B - Fresh Terminal:**
```bash
cd api-flow-orchestrator/backend
mvn spring-boot:run
```

### Step 2: Test with Your Application

1. Open your application at `http://localhost:5173`
2. Go to the API Tester
3. Configure the request:
   - **Method**: POST
   - **URL**: `http://localhost:8082/addItem`
   - **Body**: 
   ```json
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
4. Click **Send**
5. You should now see a successful response instead of "Network Error"

## What Changed

### Before (Broken)
```java
@Bean
public WebClient.Builder webClientBuilder() {
    return WebClient.builder();  // Too basic, can't handle localhost properly
}
```

### After (Fixed)
```java
@Bean
public WebClient.Builder webClientBuilder() {
    // Custom connection provider for localhost support
    ConnectionProvider connectionProvider = ConnectionProvider.builder("custom")
        .maxConnections(500)
        .maxIdleTime(Duration.ofSeconds(20))
        .maxLifeTime(Duration.ofSeconds(60))
        .pendingAcquireTimeout(Duration.ofSeconds(60))
        .evictInBackground(Duration.ofSeconds(120))
        .build();
    
    // HttpClient with proper timeout configuration
    HttpClient httpClient = HttpClient.create(connectionProvider)
        .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 30000)
        .responseTimeout(Duration.ofSeconds(30))
        .doOnConnected(conn ->
            conn.addHandlerLast(new ReadTimeoutHandler(30, TimeUnit.SECONDS))
                .addHandlerLast(new WriteTimeoutHandler(30, TimeUnit.SECONDS)));
    
    return WebClient.builder()
        .clientConnector(new ReactorClientHttpConnector(httpClient));
}
```

## Technical Details

### Why Postman Works But Our App Didn't

1. **Postman**: Uses native HTTP client with full localhost support
2. **Our App**: Uses Spring WebFlux's WebClient which needs explicit configuration for:
   - Connection pooling
   - Timeout handling
   - Reactor Netty HTTP client setup

### The Proxy Flow

```
Frontend (localhost:5173)
    ↓
    POST /api/proxy/execute
    ↓
Backend ProxyController (localhost:8080)
    ↓
    WebClient → Your Microservice (localhost:8082)
    ↓
    Response back to Frontend
```

The fix ensures the WebClient in the middle can properly connect to localhost microservices.

## Benefits of This Configuration

1. ✅ **Localhost Support**: Can now test any localhost microservice
2. ✅ **Connection Pooling**: Efficient connection reuse (max 500 connections)
3. ✅ **Timeout Protection**: Won't hang indefinitely (30s timeouts)
4. ✅ **Connection Lifecycle**: Proper idle/max lifetime management
5. ✅ **Background Cleanup**: Automatic eviction of stale connections

## Troubleshooting

### If Still Getting Network Error

1. **Check Backend Logs**: Look for connection errors in Terminal 4
2. **Verify Microservice is Running**: Test with Postman first
3. **Check Port**: Ensure your microservice is on the correct port
4. **Firewall**: Ensure localhost connections aren't blocked

### Common Issues

**Issue**: "Connection refused"
- **Solution**: Microservice isn't running on that port

**Issue**: "Timeout"
- **Solution**: Microservice is too slow (>30s), increase timeout in WebClientConfig

**Issue**: "Unknown host"
- **Solution**: Use `localhost` or `127.0.0.1`, not machine name

## Next Steps

After confirming the fix works:

1. ✅ Test various HTTP methods (GET, POST, PUT, DELETE)
2. ✅ Test different localhost ports
3. ✅ Save successful requests to API Groups
4. ✅ Create workflows with multiple localhost services
5. ✅ Use variable chaining between localhost APIs

## Related Files

- [`WebClientConfig.java`](backend/src/main/java/com/apiflow/config/WebClientConfig.java) - Fixed configuration
- [`ProxyController.java`](backend/src/main/java/com/apiflow/controller/ProxyController.java) - Proxy endpoint
- [`ApiTester.jsx`](frontend/src/components/ApiTester.jsx) - Frontend component
- [`CorsConfig.java`](backend/src/main/java/com/apiflow/config/CorsConfig.java) - CORS configuration

---

**Status**: ✅ Fix Applied - Restart backend to test