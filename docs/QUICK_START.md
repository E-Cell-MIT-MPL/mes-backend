# 🚀 Quick Start Guide

This guide will help you get started with integrating the MES Backend API into your frontend application.

## Prerequisites for Frontend Developers

### 1. Backend Environment Configuration

Ensure your backend `.env` file has the following configuration:

```env
CORS_ORIGIN=http://localhost:3000  # or your frontend URL
```

### 2. Always Include Credentials

Every API request must include credentials to send/receive cookies:

```javascript
credentials: "include"
```

### 3. No Manual Token Management

Authentication is handled via httpOnly cookies automatically.

**DO NOT:**
- Use `localStorage` or `sessionStorage` for JWT tokens
- Use `Authorization` headers for JWT tokens
- Try to manually access or set the JWT cookie

**The backend handles everything automatically!**

## Installation Steps

### Frontend Setup

1. **Install dependencies** (if using axios):
   ```bash
   npm install axios
   # or
   yarn add axios
   ```

2. **Configure API base URL**:
   ```javascript
   // config/api.js
   export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
   ```

3. **Set up axios (optional)**:
   ```javascript
   // config/axios.js
   import axios from 'axios';
   
   const api = axios.create({
     baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
     withCredentials: true, // This is equivalent to credentials: 'include'
   });
   
   export default api;
   ```

## First API Call

Test your setup with a simple registration or login call:

```javascript
// Using fetch
const testConnection = async () => {
  try {
    const response = await fetch('http://localhost:5000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',  // ⚠️ CRITICAL
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const data = await response.json();
    console.log('Connection successful:', data);
  } catch (error) {
    console.error('Connection failed:', error);
  }
};
```

## Environment Variables

Create a `.env` file in your frontend project:

```env
# Frontend .env
REACT_APP_API_URL=http://localhost:5000
NODE_ENV=development
```

For production:

```env
# Production .env
REACT_APP_API_URL=https://api.yourdomain.com
NODE_ENV=production
```

## Verification Checklist

Before proceeding, verify:

- [ ] Backend is running on `http://localhost:5000`
- [ ] Backend `.env` has `CORS_ORIGIN` set to your frontend URL
- [ ] Frontend can make requests to the backend
- [ ] Cookies are being sent and received (check DevTools → Application → Cookies)
- [ ] You're using `credentials: 'include'` in all requests

## Next Steps

Once your setup is complete:

1. Read [AUTHENTICATION.md](AUTHENTICATION.md) to understand the auth flow
2. Check [API_REFERENCE.md](API_REFERENCE.md) for available endpoints
3. See [CODE_EXAMPLES.md](CODE_EXAMPLES.md) for implementation examples

## Common Setup Issues

### CORS Errors
- Verify `CORS_ORIGIN` in backend `.env` matches your frontend URL exactly
- Don't mix `localhost` with `127.0.0.1`

### Cookies Not Being Set
- Check that `credentials: 'include'` is in your fetch requests
- Verify both frontend and backend are on the same domain (or proper CORS is configured)
- Check browser DevTools → Application → Cookies

### Connection Refused
- Ensure backend is running
- Verify the backend port (default: 5000)
- Check firewall settings

For more issues, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
