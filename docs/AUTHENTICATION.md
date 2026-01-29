# 🔐 Authentication Flow

The MES Backend uses **httpOnly cookies** for authentication. The JWT token is stored in a secure cookie that's automatically sent with every request.

## Overview

### Registration → Verification → Login Flow

```
┌─────────────┐      ┌──────────────┐      ┌─────────┐      ┌───────────┐
│  REGISTER   │ ───▶ │  VERIFY OTP  │ ───▶ │  LOGIN  │ ───▶ │ DASHBOARD │
└─────────────┘      └──────────────┘      └─────────┘      └───────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  RESEND OTP  │
                     └──────────────┘
```

### Cookie Details

The JWT token is stored in a cookie with the following properties:

```javascript
Cookie Name: jwt

Properties:
  - httpOnly: true      // Cannot be accessed via JavaScript
  - secure: true        // HTTPS only in production (false in development)
  - sameSite: 'lax'     // CSRF protection
  - maxAge: 7 days      // Expires after 7 days
```

## Authentication Endpoints

### 1. Registration

**Endpoint:** `POST /auth/register`

Register a new user and send OTP to email.

**Request Body:**
```typescript
{
  userType: "MIT" | "NON_MIT",  // Required
  name: string,                  // Required
  phone: string,                 // Required
  personalEmail: string,         // Required
  password: string,              // Required

  // Only for MIT students:
  regNumber?: string,            // Required if MIT
  learnerEmail?: string          // Required if MIT
}
```

**Response:**
```json
{
  "message": "OTP sent to your email"
}
```

**Example:**
```javascript
const response = await fetch('http://localhost:5000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    userType: 'MIT',
    name: 'John Doe',
    phone: '9876543210',
    regNumber: '2021BCS001',
    learnerEmail: 'john.2021@learner.manipal.edu',
    personalEmail: 'john@example.com',
    password: 'SecurePass123!'
  })
});
```

---

### 2. OTP Verification

**Endpoint:** `POST /auth/verify-otp`

Verify the OTP sent to email.

**Request Body:**
```typescript
{
  email: string,   // personalEmail used during registration
  otp: string      // 6-digit OTP from email
}
```

**Response:**
```json
{
  "message": "Email verified successfully"
}
```

**Example:**
```javascript
const response = await fetch('http://localhost:5000/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'john@example.com',
    otp: '123456'
  })
});
```

---

### 3. Resend OTP

**Endpoint:** `POST /auth/resend-otp`

Resend OTP if expired or not received.

**Request Body:**
```typescript
{
  email: string  // personalEmail
}
```

**Response:**
```json
{
  "message": "New OTP sent to your email"
}
```

**Example:**
```javascript
const response = await fetch('http://localhost:5000/auth/resend-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'john@example.com'
  })
});
```

---

### 4. Login

**Endpoint:** `POST /auth/login`

Login and receive authentication cookie.

**Request Body:**
```typescript
{
  email: string,      // personalEmail
  password: string
}
```

**Response:**
```json
{
  "message": "Login successful"
}
```

**Important:** The JWT token is set as a **httpOnly cookie** automatically. No token is returned in the response body.

**Example:**
```javascript
const response = await fetch('http://localhost:5000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // ⚠️ CRITICAL
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
});

if (response.ok) {
  // Cookie is set automatically
  // Redirect to dashboard
}
```

---

### 5. Forgot Password

**Endpoint:** `POST /auth/forgot-password`

Initiate password reset flow.

**Request Body:**
```typescript
{
  email: string  // personalEmail
}
```

**Response:**
```json
{
  "message": "Password reset link sent to your email"
}
```

---

### 6. Reset Password

**Endpoint:** `POST /auth/reset-password`

Reset password using token from email.

**Request Body:**
```typescript
{
  token: string,
  newPassword: string
}
```

**Response:**
```json
{
  "message": "Password reset successful"
}
```

---

## How Authentication Works

### 1. Initial Registration
User registers with their details → Backend validates and sends OTP to email

### 2. Email Verification
User enters OTP → Backend verifies and marks email as verified → User can now login

### 3. Login
User provides credentials → Backend validates → JWT token is created and stored in httpOnly cookie → Cookie is automatically sent with every subsequent request

### 4. Authenticated Requests
Frontend makes request with `credentials: 'include'` → Browser automatically sends the cookie → Backend validates JWT from cookie → Request is processed

### 5. Token Expiry
After 7 days, the cookie expires automatically → User needs to login again

## Checking Authentication Status

To check if a user is authenticated, make any protected API call:

```javascript
const checkAuth = async () => {
  try {
    const response = await fetch('http://localhost:5000/tickets/my-tickets', {
      credentials: 'include'
    });
    
    if (response.ok) {
      return true;  // User is authenticated
    } else if (response.status === 401) {
      return false; // Not authenticated, redirect to login
    }
  } catch (error) {
    return false;
  }
};
```

## Logout Implementation

The backend doesn't have a dedicated logout endpoint, but you can implement logout functionality:

### Option 1: Client-Side Logout
```javascript
const handleLogout = () => {
  // Clear any client-side state
  // The cookie will expire after 7 days automatically
  
  // Redirect to login page
  window.location.href = '/login';
};
```

### Option 2: Backend Logout (Recommended)
Add this to your backend:

```javascript
// Backend route
app.post('/auth/logout', (req, res) => {
  res.clearCookie('jwt').json({ message: 'Logged out successfully' });
});
```

Then in frontend:
```javascript
const handleLogout = async () => {
  await fetch('http://localhost:5000/auth/logout', {
    method: 'POST',
    credentials: 'include'
  });
  
  window.location.href = '/login';
};
```

## Security Best Practices

### ✅ DO:
- Always use `credentials: 'include'` in fetch requests
- Use HTTPS in production
- Validate email before allowing login
- Handle 401 responses by redirecting to login
- Store only non-sensitive user data in local state

### ❌ DON'T:
- Store JWT tokens in `localStorage` or `sessionStorage`
- Manually add `Authorization` headers with JWT
- Try to access the `jwt` cookie via JavaScript (it's httpOnly)
- Skip email verification step
- Mix `localhost` with `127.0.0.1` in development

## User Types

### MIT Students
Must provide:
- `userType: "MIT"`
- `regNumber` (e.g., "2021BCS001")
- `learnerEmail` (e.g., "john.2021@learner.manipal.edu")
- `personalEmail`
- Other basic fields

### Non-MIT Students
Must provide:
- `userType: "NON_MIT"`
- `personalEmail`
- Other basic fields

## Error Responses

### Common Error Codes
- `400` - Bad request (missing or invalid fields)
- `401` - Unauthorized (not logged in or invalid token)
- `403` - Forbidden (email not verified)
- `404` - User not found
- `409` - Conflict (email already registered)
- `500` - Internal server error

See [ERROR_HANDLING.md](ERROR_HANDLING.md) for detailed error handling strategies.
