# Authentication Implementation Guide

## Overview

This document describes the Spring Security authentication implementation for the API Flow Orchestrator application. The system uses JWT (JSON Web Tokens) for stateless authentication.

## Architecture

### Backend Components

1. **User Entity** ([`User.java`](backend/src/main/java/com/apiflow/model/User.java))
   - Stores user credentials and profile information
   - Fields: id, username, password (BCrypt encrypted), role, enabled, createdAt, lastLogin

2. **UserRepository** ([`UserRepository.java`](backend/src/main/java/com/apiflow/repository/UserRepository.java))
   - JPA repository for user data access
   - Methods: findByUsername, existsByUsername

3. **CustomUserDetailsService** ([`CustomUserDetailsService.java`](backend/src/main/java/com/apiflow/service/CustomUserDetailsService.java))
   - Implements Spring Security's UserDetailsService
   - Loads user details for authentication

4. **JwtUtil** ([`JwtUtil.java`](backend/src/main/java/com/apiflow/security/JwtUtil.java))
   - Utility class for JWT token operations
   - Methods: generateToken, validateToken, extractUsername, extractRole

5. **JwtAuthenticationFilter** ([`JwtAuthenticationFilter.java`](backend/src/main/java/com/apiflow/security/JwtAuthenticationFilter.java))
   - Intercepts requests to validate JWT tokens
   - Extends OncePerRequestFilter

6. **SecurityConfig** ([`SecurityConfig.java`](backend/src/main/java/com/apiflow/config/SecurityConfig.java))
   - Configures Spring Security
   - Defines authentication provider, password encoder, and security filter chain
   - Permits `/api/auth/**` endpoints without authentication

7. **AuthController** ([`AuthController.java`](backend/src/main/java/com/apiflow/controller/AuthController.java))
   - REST endpoints for authentication
   - Endpoints:
     - `POST /api/auth/login` - User login
     - `POST /api/auth/logout` - User logout
     - `GET /api/auth/validate` - Token validation
     - `POST /api/auth/register` - User registration (for testing)

### Frontend Components

1. **Login Component** ([`Login.jsx`](frontend/src/pages/Login.jsx))
   - Login form with username and password fields
   - Handles authentication and stores JWT token in localStorage

2. **App Component** ([`App.jsx`](frontend/src/App.jsx))
   - Manages authentication state
   - Displays user info (username and role) in navbar
   - Provides logout functionality
   - Redirects unauthenticated users to login page

3. **API Service** ([`api.js`](frontend/src/services/api.js))
   - Axios interceptors to include JWT token in all API requests
   - Handles 401 errors by redirecting to login

## Setup Instructions

### 1. Database Setup

Run the SQL script to create initial test users:

```sql
-- Execute INIT_USERS.sql in your INTEGRATION database
-- This creates test users with password 'password123'
```

The script creates the following test users:
- **admin** (Admin role)
- **developer** (Developer role)
- **tester** (Tester role)
- **qa** (QA role)

All users have the password: `password123`

### 2. Backend Configuration

The JWT configuration is in [`application.properties`](backend/src/main/resources/application.properties):

```properties
jwt.secret=apiFlowOrchestratorSecretKeyForJWTTokenGenerationAndValidation2024
jwt.expiration=86400000  # 24 hours in milliseconds
```

### 3. Running the Application

1. Start the backend:
   ```bash
   cd api-flow-orchestrator/backend
   mvn spring-boot:run
   ```

2. Start the frontend:
   ```bash
   cd api-flow-orchestrator/frontend
   npm run dev
   ```

3. Access the application at `http://localhost:5173`

## Authentication Flow

### Login Process

1. User enters username and password on login page
2. Frontend sends POST request to `/api/auth/login`
3. Backend validates credentials using Spring Security
4. If valid, backend generates JWT token with username and role
5. Frontend stores token, username, and role in localStorage
6. User is redirected to dashboard

### Authenticated Requests

1. Frontend includes JWT token in Authorization header: `Bearer <token>`
2. JwtAuthenticationFilter validates token on each request
3. If valid, request proceeds; if invalid, returns 401 Unauthorized
4. Frontend intercepts 401 errors and redirects to login

### Logout Process

1. User clicks logout button
2. Frontend clears localStorage (token, username, role)
3. User is redirected to login page

## API Endpoints

### Authentication Endpoints (Public)

- `POST /api/auth/login`
  - Request: `{ "username": "admin", "password": "password123" }`
  - Response: `{ "token": "jwt-token", "username": "admin", "role": "Admin", "message": "Login successful" }`

- `POST /api/auth/logout`
  - Response: `{ "message": "Logout successful" }`

- `GET /api/auth/validate`
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ "token": "jwt-token", "username": "admin", "role": "Admin", "message": "Token is valid" }`

- `POST /api/auth/register`
  - Request: `{ "username": "newuser", "password": "password" }`
  - Response: `{ "message": "User registered successfully" }`

### Protected Endpoints

All other API endpoints require authentication:
- `/api/groups/**`
- `/api/execution/**`
- `/api/batch/**`

## User Interface

### Login Screen

- Clean, centered login form
- Username and password fields
- Error message display
- Default credentials shown for testing

### Main Application

- **Navbar** displays:
  - Application logo and name
  - Navigation links (API Groups, API Tester)
  - Theme toggle (Light/Dark mode)
  - User info: `username (role)` - e.g., "admin (Admin)"
  - Logout button (red)

## Security Features

1. **Password Encryption**: BCrypt with strength 10
2. **JWT Tokens**: Signed with HS256 algorithm
3. **Token Expiration**: 24 hours
4. **Stateless Authentication**: No server-side sessions
5. **CORS Configuration**: Configured for cross-origin requests
6. **CSRF Protection**: Disabled for stateless JWT authentication

## Testing

### Manual Testing

1. Navigate to `http://localhost:5173`
2. You should be redirected to login page
3. Login with test credentials:
   - Username: `admin`
   - Password: `password123`
4. Verify user info appears in navbar: "admin (Admin)"
5. Navigate to different pages - should remain authenticated
6. Click logout - should redirect to login page
7. Try accessing protected pages without login - should redirect to login

### Creating New Users

Use the register endpoint:

```bash
curl -X POST http://localhost:8085/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","password":"newpassword"}'
```

Or use the SQL script to insert users directly into the database.

## Troubleshooting

### Common Issues

1. **401 Unauthorized on all requests**
   - Check if JWT token is being sent in Authorization header
   - Verify token hasn't expired
   - Check SecurityConfig allows the endpoint

2. **Login fails with valid credentials**
   - Verify user exists in database
   - Check password is BCrypt encrypted
   - Review backend logs for authentication errors

3. **Token validation fails**
   - Ensure JWT secret matches in application.properties
   - Check token format: `Bearer <token>`
   - Verify token hasn't expired

4. **CORS errors**
   - Check CorsConfig allows frontend origin
   - Verify SecurityConfig CORS configuration

## File Structure

```
api-flow-orchestrator/
├── backend/
│   └── src/main/java/com/apiflow/
│       ├── config/
│       │   └── SecurityConfig.java
│       ├── controller/
│       │   └── AuthController.java
│       ├── dto/
│       │   ├── LoginRequest.java
│       │   └── AuthResponse.java
│       ├── model/
│       │   └── User.java
│       ├── repository/
│       │   └── UserRepository.java
│       ├── security/
│       │   ├── JwtUtil.java
│       │   └── JwtAuthenticationFilter.java
│       └── service/
│           └── CustomUserDetailsService.java
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx
│       │   └── Login.css
│       ├── services/
│       │   └── api.js
│       └── App.jsx
├── INIT_USERS.sql
└── AUTHENTICATION_SETUP.md
```

## Dependencies

### Backend (pom.xml)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.11.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.11.5</version>
</dependency>
```

### Frontend (package.json)

- axios (already included)
- react-router-dom (already included)

## Future Enhancements

1. **Role-Based Access Control**: Implement different permissions for different roles
2. **Password Reset**: Add forgot password functionality
3. **User Management**: Admin interface to manage users
4. **Refresh Tokens**: Implement token refresh mechanism
5. **Multi-Factor Authentication**: Add 2FA support
6. **Session Management**: Track active sessions
7. **Audit Logging**: Log authentication events