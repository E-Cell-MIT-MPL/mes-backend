# HttpOnly Cookies Migration Summary

## Overview

Upgraded token storage from **localStorage** to **httpOnly cookies** for improved security.

## Changes Made

### 1. Backend - package.json

✅ Added `cookie-parser` dependency (v1.4.7)

```json
"cookie-parser": "^1.4.7"
```

### 2. Backend - server.js

✅ Imported cookie-parser middleware
✅ Updated CORS configuration to accept credentials
✅ Added cookie parser middleware

```javascript
import cookieParser from "cookie-parser";

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true, // Allow cookies in requests
  }),
);
app.use(cookieParser()); // Parse cookies from headers
```

### 3. Backend - auth.controller.js (login endpoint)

✅ Changed response to set httpOnly cookie instead of returning token

**Before:**

```javascript
return res.json({
  message: "Login successful",
  token, // Token sent in response body
});
```

**After:**

```javascript
return res
  .cookie("jwt", token, {
    httpOnly: true, // Prevents XSS attacks
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax", // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
  .json({
    message: "Login successful",
  });
```

### 4. Backend - auth.middleware.js

✅ Updated to read token from httpOnly cookie

**Before:**

```javascript
const authHeader = req.headers.authorization;
const token = authHeader.split(" ")[1]; // Bearer scheme
```

**After:**

```javascript
const token = req.cookies.jwt; // Direct cookie access
```

### 5. Frontend - App.tsx

✅ Removed localStorage usage
✅ Replaced token state with isLoggedIn boolean
✅ Added `credentials: 'include'` to all fetch requests

**Key changes:**

- Removed: `localStorage.getItem/setItem/removeItem`
- Removed: Bearer token headers in requests
- Added: `credentials: 'include'` in all fetch calls
- Updated: Initial login check uses authenticated endpoint instead of localStorage

```javascript
// Before
const [token, setToken] = useState < string > "";
const savedToken = localStorage.getItem("token");

// After
const [isLoggedIn, setIsLoggedIn] = useState < boolean > false;
const res = await fetch("...", { credentials: "include" });
```

## Security Improvements

| Aspect                | localStorage      | httpOnly Cookies         |
| --------------------- | ----------------- | ------------------------ |
| XSS Protection        | ❌ Vulnerable     | ✅ Protected             |
| Automatic Inclusion   | ❌ Manual headers | ✅ Automatic             |
| CSRF Protection       | ❌ Not included   | ✅ sameSite=lax          |
| Session Lifetime      | ❌ Forever        | ✅ 7 days (configurable) |
| Access via JavaScript | ✅ Full access    | ❌ Blocked (httpOnly)    |

## Testing

### Before making requests:

1. Install dependencies: `pnpm install`
2. Ensure backend .env has `CORS_ORIGIN=http://localhost:5173` (or http://localhost:5173 if using Vite default)

### Test registration flow:

1. Register new user → OTP verification → Login
2. Verify cookie is set: Open DevTools → Application → Cookies → Check for `jwt` cookie (httpOnly flag visible)
3. Verify token is NOT in localStorage (should be empty)

### Test authenticated requests:

- Buy ticket endpoint should work without manual Authorization headers
- Fetch my-tickets should work with automatic cookie inclusion
- Token will auto-refresh per cookie maxAge setting

## Configuration Notes

### Environment Variables

Add to `.env` if not present:

```env
CORS_ORIGIN=http://localhost:5173
```

### Development vs Production

- **Development**: `secure: false` (allows HTTP cookies)
- **Production**: `secure: true` (HTTPS-only cookies)

Set via `NODE_ENV=production` environment variable.

## Browser Compatibility

✅ All modern browsers support httpOnly cookies (IE9+)
✅ Works with React, Vue, Angular, etc.
✅ No additional libraries required

## Rollback (if needed)

If reverting is needed, restore from localStorage approach and remove:

- `cookie-parser` dependency
- `credentials: 'include'` from fetch calls
- Cookie setting logic from auth.controller.js

---

Migration completed successfully! 🎉
