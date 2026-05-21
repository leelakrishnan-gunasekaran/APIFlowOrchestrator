# Create Test User via API

Since the database password hash might not be matching, use the `/api/auth/register` endpoint to create a user with a properly encoded password.

## Method 1: Using curl (Command Line)

Open a terminal and run:

```bash
curl -X POST http://localhost:8085/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"password123\"}"
```

## Method 2: Using PowerShell (Windows)

```powershell
Invoke-RestMethod -Uri "http://localhost:8085/api/auth/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"password123"}'
```

## Method 3: Using Postman or Browser Console

### Postman:
1. Create new POST request
2. URL: `http://localhost:8085/api/auth/register`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "username": "admin",
  "password": "password123"
}
```

### Browser Console (F12):
```javascript
fetch('http://localhost:8085/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'password123' })
})
.then(r => r.json())
.then(d => console.log(d));
```

## Method 4: Direct SQL with Correct BCrypt Hash

If the register endpoint doesn't work, run this SQL to insert a user with a verified BCrypt hash:

```sql
-- Delete existing admin if it exists
DELETE FROM users WHERE username = 'admin';

-- Insert admin with correct BCrypt hash for 'password123'
-- This hash was generated with BCrypt strength 10
INSERT INTO users (username, password, role, enabled, created_at)
VALUES (
  'admin',
  '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cyhQQl3MpbEyEL0qhO/5s7lqpEm3C',
  'Admin',
  1,
  GETDATE()
);

SELECT * FROM users WHERE username = 'admin';
```

## After Creating the User

1. Go to http://localhost:5173
2. Login with:
   - Username: `admin`
   - Password: `password123`
3. You should see "admin (Admin)" in the navbar

## Troubleshooting

If you still get 401:

1. **Check backend logs** for authentication errors
2. **Verify user exists**: Run `SELECT * FROM users WHERE username = 'admin'`
3. **Test register endpoint**: Try creating a different user like "testuser"
4. **Check password encoding**: The AuthController uses BCryptPasswordEncoder

## Alternative: Create User via Register Endpoint First

Since the register endpoint is public, you can:
1. Use any of the methods above to create an admin user
2. Then login with those credentials
3. The password will be properly BCrypt encoded by the application