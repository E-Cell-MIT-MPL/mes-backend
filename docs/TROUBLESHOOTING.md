# 🐛 Troubleshooting Guide

Common issues and solutions for integrating the MES Backend API.

---

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [CORS Issues](#cors-issues)
3. [Cookie Issues](#cookie-issues)
4. [Payment Issues](#payment-issues)
5. [Network Issues](#network-issues)
6. [Development Environment Issues](#development-environment-issues)

---

## Authentication Issues

### Issue: "No token provided" error

**Symptoms:**
- Getting 401 Unauthorized error
- Error message: "No token provided"

**Solutions:**

1. **Check credentials in fetch request:**
   ```javascript
   // ✅ Correct
   fetch(url, {
     credentials: 'include'  // This is REQUIRED
   });

   // ❌ Wrong
   fetch(url);  // Missing credentials
   ```

2. **Verify you're logged in:**
   ```javascript
   const checkAuth = async () => {
     const response = await fetch('http://localhost:5000/tickets/my-tickets', {
       credentials: 'include'
     });
     console.log('Authenticated:', response.ok);
   };
   ```

3. **Check browser cookies:**
   - Open DevTools → Application → Cookies
   - Look for cookie named `jwt` from `localhost:5000`
   - If missing, login again

---

### Issue: "Invalid token" error

**Symptoms:**
- Getting 401 Unauthorized
- Error message: "Invalid token"

**Solutions:**

1. **Token expired (>7 days):**
   - Cookie expires after 7 days
   - Solution: Login again

2. **JWT_SECRET changed:**
   - Backend JWT_SECRET was changed
   - Solution: All users need to login again

3. **Token from different environment:**
   - Using production token in development (or vice versa)
   - Solution: Login in the correct environment

---

### Issue: "Email not verified" on login

**Symptoms:**
- Getting 403 Forbidden
- Error message: "Email not verified"

**Solutions:**

1. **Complete OTP verification:**
   - User must verify email after registration
   - Check email for OTP
   - Call `/auth/verify-otp` endpoint

2. **Resend OTP if expired:**
   ```javascript
   await fetch('http://localhost:5000/auth/resend-otp', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     credentials: 'include',
     body: JSON.stringify({ email: 'user@example.com' })
   });
   ```

---

### Issue: Login successful but not authenticated

**Symptoms:**
- Login returns 200 OK
- Subsequent requests return 401

**Solutions:**

1. **Check cookie in browser:**
   - DevTools → Application → Cookies
   - Verify `jwt` cookie exists

2. **Verify credentials: 'include' is used:**
   ```javascript
   // Must be in EVERY request
   fetch(url, { credentials: 'include' });
   ```

3. **Check for JavaScript errors:**
   - Open console and look for errors
   - Cookie might be blocked by browser settings

---

## CORS Issues

### Issue: CORS error in console

**Symptoms:**
```
Access to fetch at 'http://localhost:5000/auth/login' from origin 
'http://localhost:3000' has been blocked by CORS policy
```

**Solutions:**

1. **Check backend CORS_ORIGIN:**
   ```env
   # Backend .env
   CORS_ORIGIN=http://localhost:3000  # Must match frontend URL exactly
   ```

2. **Don't mix protocols:**
   ```
   ❌ Backend: http://localhost:5000, Frontend: https://localhost:3000
   ✅ Both should be HTTP or both HTTPS
   ```

3. **Don't mix localhost with 127.0.0.1:**
   ```
   ❌ Backend: http://localhost:5000, Calling: http://127.0.0.1:5000
   ✅ Use consistent domain
   ```

4. **Restart backend after .env changes:**
   ```bash
   # Stop backend and restart
   npm run dev
   ```

---

### Issue: "Credentials flag is true, but Access-Control-Allow-Credentials is not"

**Symptoms:**
- CORS error specifically about credentials

**Solutions:**

1. **Verify backend CORS config:**
   ```javascript
   // Backend must have
   app.use(cors({
     origin: process.env.CORS_ORIGIN,
     credentials: true  // This is CRITICAL
   }));
   ```

2. **Check frontend request:**
   ```javascript
   fetch(url, {
     credentials: 'include'  // Must be present
   });
   ```

---

## Cookie Issues

### Issue: Cookie not being set after login

**Symptoms:**
- Login successful
- No `jwt` cookie in browser

**Diagnostic Steps:**

1. **Check DevTools → Network tab:**
   - Find the login request
   - Check Response Headers
   - Look for `Set-Cookie` header

2. **Check DevTools → Application → Cookies:**
   - Domain: `localhost` or your domain
   - Name: `jwt`

**Solutions:**

1. **In development, use localhost (not 127.0.0.1):**
   ```javascript
   // ✅ Use this
   const API_BASE = 'http://localhost:5000';
   
   // ❌ Not this
   const API_BASE = 'http://127.0.0.1:5000';
   ```

2. **Check browser settings:**
   - Browser might be blocking cookies
   - Try in incognito/private mode
   - Check if third-party cookies are blocked

3. **Verify secure flag in production:**
   ```javascript
   // Production backend must use HTTPS
   // Cookie secure flag should be true
   ```

---

### Issue: Cookie not being sent with requests

**Symptoms:**
- Cookie exists in browser
- Still getting "No token provided"

**Solutions:**

1. **Add credentials to ALL requests:**
   ```javascript
   // Every single fetch request needs this
   fetch(url, {
     credentials: 'include'
   });
   ```

2. **Check cookie domain:**
   - Cookie domain must match request domain
   - View in DevTools → Application → Cookies
   - Domain column should match your API domain

3. **Check SameSite attribute:**
   - Cookie SameSite should be `lax` or `none`
   - If `strict`, cookie won't be sent in some cases

---

### Issue: Cookie deleted/cleared unexpectedly

**Symptoms:**
- Was logged in
- Suddenly logged out
- Cookie disappeared

**Possible Causes:**

1. **Token expired (7 days):**
   - Solution: User needs to login again

2. **Browser cleared cookies:**
   - Solution: User needs to login again

3. **Logout called:**
   - Check if logout function was accidentally called

---

## Payment Issues

### Issue: Payment not initiating

**Symptoms:**
- Payment button not working
- Error when calling `/payment/initiate`

**Solutions:**

1. **Check authentication:**
   ```javascript
   // Payment requires authentication
   const response = await fetch('http://localhost:5000/payment/initiate', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     credentials: 'include',  // Required
     body: JSON.stringify({ eventName: 'Revels 2025', amount: 500 })
   });
   ```

2. **Check request body:**
   ```javascript
   // Must include both fields
   {
     eventName: string,  // Required
     amount: number      // Required
   }
   ```

3. **Check backend payment gateway config:**
   - Verify `ATOM_MERCH_ID` and other payment env vars
   - Check backend logs for payment gateway errors

---

### Issue: Payment status not updating

**Symptoms:**
- Payment completed on gateway
- Ticket still shows PENDING

**Solutions:**

1. **Check payment callback URL:**
   - Verify gateway is calling correct callback URL
   - Check backend logs for callback errors

2. **Verify signature validation:**
   - Check backend logs for signature errors
   - Payment gateway signature must be valid

3. **Manual status check:**
   ```javascript
   const response = await fetch(`http://localhost:5000/payment/status/${ticketId}`, {
     credentials: 'include'
   });
   const status = await response.json();
   console.log(status);
   ```

---

### Issue: Payment gateway redirect not working

**Symptoms:**
- Payment initiated successfully
- Redirect to gateway fails

**Solutions:**

1. **Check response structure:**
   ```javascript
   const data = await response.json();
   console.log('Payment URL:', data.data.paymentUrl);
   console.log('Token:', data.data.atomTokenId);
   console.log('Merchant ID:', data.data.merchId);
   ```

2. **Verify redirect URL:**
   ```javascript
   // Must include token and merchId
   const url = `${paymentUrl}?token=${atomTokenId}&merchId=${merchId}`;
   window.location.href = url;
   ```

3. **Check popup blockers:**
   - If using `window.open()`, popup might be blocked
   - Try `window.location.href` instead

---

## Network Issues

### Issue: "Failed to fetch" error

**Symptoms:**
- Network error in console
- Error: "Failed to fetch"

**Solutions:**

1. **Check backend is running:**
   ```bash
   # Test with curl
   curl http://localhost:5000/health-check
   ```

2. **Check port:**
   ```javascript
   // Verify correct port
   const API_BASE = 'http://localhost:5000';  // Default port
   ```

3. **Check firewall:**
   - Firewall might be blocking connections
   - Try disabling temporarily to test

4. **Check network connectivity:**
   ```javascript
   if (!navigator.onLine) {
     console.error('No internet connection');
   }
   ```

---

### Issue: Request timeout

**Symptoms:**
- Request takes forever
- Eventually times out

**Solutions:**

1. **Check backend performance:**
   - Backend might be slow or unresponsive
   - Check backend logs

2. **Implement timeout:**
   ```javascript
   const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
     const controller = new AbortController();
     const id = setTimeout(() => controller.abort(), timeout);
     
     try {
       const response = await fetch(url, {
         ...options,
         signal: controller.signal
       });
       clearTimeout(id);
       return response;
     } catch (error) {
       clearTimeout(id);
       throw error;
     }
   };
   ```

---

## Development Environment Issues

### Issue: Changes not reflecting

**Symptoms:**
- Made code changes
- No effect in browser

**Solutions:**

1. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear cache manually

2. **Restart development server:**
   ```bash
   # Stop server (Ctrl+C) and restart
   npm run dev
   ```

3. **Check for build errors:**
   - Look at terminal for errors
   - Check browser console

---

### Issue: Environment variables not working

**Symptoms:**
- env vars undefined
- Using wrong values

**Solutions:**

1. **Restart development server:**
   ```bash
   # .env changes require restart
   npm run dev
   ```

2. **Check .env file location:**
   - Must be in project root
   - Named exactly `.env` (not `.env.txt`)

3. **Check variable prefix:**
   ```env
   # Vite
   VITE_API_URL=http://localhost:5000
   
   # Create React App
   REACT_APP_API_URL=http://localhost:5000
   
   # Next.js
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

4. **Access correctly in code:**
   ```javascript
   // Vite
   const apiUrl = import.meta.env.VITE_API_URL;
   
   // Create React App
   const apiUrl = process.env.REACT_APP_API_URL;
   
   // Next.js
   const apiUrl = process.env.NEXT_PUBLIC_API_URL;
   ```

---

### Issue: Port already in use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**

1. **Find and kill process:**
   ```bash
   # macOS/Linux
   lsof -ti:5000 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

2. **Use different port:**
   ```env
   # Backend .env
   PORT=5001
   ```

---

## Database Issues

### Issue: MongoDB connection failed

**Symptoms:**
```
MongoNetworkError: failed to connect to server
```

**Solutions:**

1. **Check MongoDB is running:**
   ```bash
   # macOS/Linux
   sudo systemctl status mongod
   
   # Start if not running
   sudo systemctl start mongod
   ```

2. **Check connection string:**
   ```env
   MONGODB_URL=mongodb://localhost:27017/mes
   ```

3. **Check MongoDB port:**
   ```bash
   # Default port is 27017
   netstat -an | grep 27017
   ```

---

## Getting Help

If issues persist after trying these solutions:

1. **Check backend logs:**
   - Look for error messages
   - Check stack traces

2. **Enable verbose logging:**
   ```javascript
   // Add to see all requests/responses
   fetch(url, options)
     .then(res => {
       console.log('Response:', res);
       return res.json();
     })
     .then(data => console.log('Data:', data))
     .catch(err => console.error('Error:', err));
   ```

3. **Test with cURL:**
   ```bash
   # Isolate if issue is frontend or backend
   curl -X POST http://localhost:5000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}' \
     -c cookies.txt -v
   ```

4. **Check GitHub Issues:**
   - [MES Backend Repository](https://github.com/E-Cell-MIT-MPL/mes-backend)
   - Search for similar issues
   - Open new issue if needed

5. **Review Documentation:**
   - [API_REFERENCE.md](API_REFERENCE.md)
   - [AUTHENTICATION.md](AUTHENTICATION.md)
   - [ERROR_HANDLING.md](ERROR_HANDLING.md)

---

## Quick Checklist

Before opening an issue, verify:

- [ ] Backend is running (`http://localhost:5000/health-check`)
- [ ] `CORS_ORIGIN` matches frontend URL
- [ ] Using `credentials: 'include'` in ALL requests
- [ ] Not mixing `localhost` with `127.0.0.1`
- [ ] Cookies enabled in browser
- [ ] Environment variables set correctly
- [ ] JWT token present in cookies (after login)
- [ ] Checked browser console for errors
- [ ] Checked backend logs for errors
- [ ] Tested with cURL to isolate issue

---

For more detailed information, see the complete documentation suite.
