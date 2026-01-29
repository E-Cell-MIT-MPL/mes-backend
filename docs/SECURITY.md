# 🛡️ Security & CORS

Security best practices and CORS configuration for the MES Backend API.

---

## Table of Contents

1. [CORS Configuration](#cors-configuration)
2. [Cookie Security](#cookie-security)
3. [Authentication Security](#authentication-security)
4. [Password Security](#password-security)
5. [API Security Best Practices](#api-security-best-practices)
6. [Environment Variables](#environment-variables)
7. [Production Checklist](#production-checklist)

---

## CORS Configuration

### Backend Setup

The backend is configured to accept requests from the origin specified in `CORS_ORIGIN` environment variable.

```javascript
// Backend CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true  // ⚠️ CRITICAL: Allows cookies
}));
```

### Required Settings

**Backend `.env`:**
```env
CORS_ORIGIN=http://localhost:3000  # Must match frontend URL exactly
```

**Frontend:**
```javascript
// Always include credentials in fetch requests
fetch(url, {
  credentials: 'include'  // This is REQUIRED
});
```

### CORS Rules

✅ **DO:**
- Set `CORS_ORIGIN` to your exact frontend domain
- Use `credentials: 'include'` in all API requests
- Use consistent protocol (HTTP vs HTTPS)
- Use consistent domain (don't mix `localhost` with `127.0.0.1`)

❌ **DON'T:**
- Use wildcard `*` for `CORS_ORIGIN` when using credentials
- Mix HTTP and HTTPS in development
- Forget to include credentials in fetch requests
- Use different ports than configured

### Common CORS Issues

#### Issue: "Access-Control-Allow-Origin" error
**Solution:**
1. Verify `CORS_ORIGIN` in backend `.env` matches frontend URL exactly
2. Don't mix `localhost` with `127.0.0.1`
3. Check protocol matches (both HTTP or both HTTPS)

#### Issue: Cookies not being sent
**Solution:**
1. Add `credentials: 'include'` to fetch requests
2. Verify both frontend and backend are on same domain in development
3. In production, ensure proper CORS configuration for cross-domain

---

## Cookie Security

### Cookie Properties

The JWT token is stored in an httpOnly cookie with these security properties:

```javascript
Cookie Name: jwt

Properties:
  - httpOnly: true      // Cannot be accessed via JavaScript (XSS protection)
  - secure: true        // HTTPS only in production
  - sameSite: 'lax'     // CSRF protection
  - maxAge: 7 days      // Expires after 7 days
```

### Development vs Production

**Development:**
```javascript
{
  httpOnly: true,
  secure: false,        // Allows HTTP cookies
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
}
```

**Production:**
```javascript
{
  httpOnly: true,
  secure: true,         // HTTPS-only cookies
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
}
```

### Why httpOnly Cookies?

**Security Benefits:**
1. **XSS Protection**: JavaScript cannot access the cookie
2. **Automatic Management**: Browser handles cookie storage and sending
3. **Secure by Default**: No manual token management needed
4. **CSRF Protection**: SameSite attribute prevents cross-site requests

**Comparison with localStorage:**

| Feature              | httpOnly Cookie | localStorage |
| -------------------- | --------------- | ------------ |
| XSS Protection       | ✅ Yes          | ❌ No        |
| CSRF Protection      | ✅ Yes          | ✅ Yes       |
| Automatic Sending    | ✅ Yes          | ❌ No        |
| JS Access            | ❌ No           | ✅ Yes       |
| Server Control       | ✅ Yes          | ❌ No        |

---

## Authentication Security

### JWT Token Security

**Token Generation:**
```javascript
// Backend code (example)
const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

**Security Measures:**
1. Strong JWT secret (minimum 32 characters)
2. Token expiration (7 days)
3. Stored in httpOnly cookie
4. Validated on every protected route

### Password Requirements

**Minimum Requirements:**
- At least 8 characters
- Contains uppercase and lowercase letters
- Contains numbers
- Contains special characters (recommended)

**Backend Implementation:**
```javascript
// Passwords are hashed using bcrypt
const hashedPassword = await bcrypt.hash(password, 10);
```

### Email Verification

**Security Flow:**
1. User registers → OTP sent to email
2. OTP is 6 digits, expires in 10 minutes
3. User must verify email before login
4. `isVerified` flag must be `true` to login

**Benefits:**
- Prevents fake registrations
- Confirms user owns the email
- Adds extra security layer

---

## Password Security

### Storage

✅ **DO:**
- Hash passwords with bcrypt (salt rounds: 10+)
- Never store plaintext passwords
- Use strong JWT secret

❌ **DON'T:**
- Store passwords in plain text
- Use weak hashing algorithms (MD5, SHA1)
- Reuse same salt for all passwords

### Password Reset Flow

1. User requests password reset
2. Backend sends reset token to email
3. Token expires after 1 hour
4. User sets new password using token
5. Old password is overwritten

**Security Measures:**
- Reset tokens expire quickly
- One-time use tokens
- Old token invalidated when new password is set

---

## API Security Best Practices

### 1. Always Validate Input

```javascript
// Frontend validation
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Backend validation (example)
if (!email || !password) {
  return res.status(400).json({ message: 'Missing fields' });
}
```

### 2. Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
// Example: Limit login attempts
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
```

### 3. HTTPS in Production

**Always use HTTPS in production:**
```env
# Production
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

### 4. Sanitize User Input

```javascript
// Prevent NoSQL injection
const sanitizeEmail = (email) => {
  return email.replace(/[<>'"]/g, '');
};
```

### 5. Protect Sensitive Data

**Never log sensitive information:**
```javascript
// Bad
console.log('Password:', password);

// Good
console.log('Login attempt for user:', email);
```

### 6. Implement Request Size Limits

```javascript
// Backend (example)
app.use(express.json({ limit: '10mb' }));
```

---

## Environment Variables

### Critical Variables

**Never commit these to version control:**
```env
JWT_SECRET=your-secret-key-here
QR_SECRET=your-qr-secret-key
EMAIL_PASS=your-email-password
ATOM_MERCH_PASS=payment-gateway-password
```

### Secure Storage

✅ **DO:**
- Use `.env` files (add to `.gitignore`)
- Use environment variable management tools (Vault, AWS Secrets Manager)
- Rotate secrets regularly
- Use different secrets for dev/staging/prod

❌ **DON'T:**
- Commit `.env` files to Git
- Share secrets via email or chat
- Use same secrets across environments
- Hardcode secrets in code

### Environment-Specific Configuration

```javascript
// config.js
const config = {
  development: {
    apiUrl: 'http://localhost:5000',
    secure: false
  },
  production: {
    apiUrl: 'https://api.yourdomain.com',
    secure: true
  }
};

export default config[process.env.NODE_ENV];
```

---

## Production Checklist

### Backend Security

- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (secure cookies)
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Configure proper CORS_ORIGIN (no wildcards)
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Use environment variables for secrets
- [ ] Enable database encryption at rest
- [ ] Set up firewall rules
- [ ] Implement IP whitelisting if needed

### Frontend Security

- [ ] Use HTTPS for all requests
- [ ] Validate all user input
- [ ] Sanitize data before display (prevent XSS)
- [ ] Implement CSP (Content Security Policy)
- [ ] Use `credentials: 'include'` for API calls
- [ ] Handle errors securely (don't expose stack traces)
- [ ] Keep dependencies updated
- [ ] Implement proper error boundaries

### Cookie Security

- [ ] Set `secure: true` in production
- [ ] Set `sameSite: 'strict'` or 'lax'
- [ ] Set appropriate maxAge
- [ ] Use httpOnly cookies for sensitive data
- [ ] Implement cookie domain restrictions

### API Security

- [ ] Require authentication for protected routes
- [ ] Validate JWT on every protected request
- [ ] Implement request size limits
- [ ] Add request timeouts
- [ ] Log security events
- [ ] Implement rate limiting
- [ ] Use API versioning

---

## Security Headers

### Recommended Headers

```javascript
// Backend security headers (example using helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Headers to Set

```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## Monitoring and Logging

### What to Log

✅ **DO Log:**
- Authentication attempts (success/failure)
- API errors
- Security events (failed auth, suspicious activity)
- Performance metrics

❌ **DON'T Log:**
- Passwords
- JWT tokens
- Credit card numbers
- Personal identifiable information (PII)

### Example Logging

```javascript
// Good logging
logger.info('User login attempt', { 
  email: user.email,
  timestamp: new Date(),
  success: true
});

// Bad logging
logger.info('Login', { 
  email: user.email,
  password: password,  // ❌ NEVER LOG PASSWORDS
  token: jwt          // ❌ NEVER LOG TOKENS
});
```

---

## Security Testing

### Manual Security Checks

1. **Test CORS:**
   ```bash
   curl -H "Origin: https://malicious.com" \
     http://localhost:5000/auth/login -v
   ```

2. **Test Authentication:**
   ```bash
   # Try accessing protected route without cookie
   curl http://localhost:5000/tickets/my-tickets -v
   ```

3. **Test Cookie Security:**
   - Check cookie flags in browser DevTools
   - Verify httpOnly flag prevents JS access
   - Confirm secure flag in production

### Automated Security Tools

- **OWASP ZAP**: Web application security scanner
- **npm audit**: Check for vulnerable dependencies
- **Snyk**: Continuous security monitoring
- **SonarQube**: Code quality and security

---

## Incident Response

### If Security Breach Occurs

1. **Immediate Actions:**
   - Invalidate all active sessions
   - Rotate all secrets (JWT_SECRET, etc.)
   - Lock affected accounts
   - Document the incident

2. **Investigation:**
   - Check server logs
   - Identify vulnerability
   - Assess damage/data exposure

3. **Remediation:**
   - Fix vulnerability
   - Deploy patch
   - Notify affected users
   - Implement monitoring

4. **Prevention:**
   - Review security practices
   - Add additional security measures
   - Conduct security audit

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

For implementation examples, see [CODE_EXAMPLES.md](CODE_EXAMPLES.md).
