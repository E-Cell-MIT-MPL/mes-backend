# 🔧 Environment Configuration

Complete guide for setting up environment variables for both backend and frontend.

---

## Backend Environment Variables

### Required Variables

Create a `.env` file in the backend root directory:

```env
# ===== SERVER CONFIGURATION =====
NODE_ENV=development
HOST=localhost
PORT=5000

# ⚠️ CRITICAL: Must match your frontend URL exactly
CORS_ORIGIN=http://localhost:3000

# ===== DATABASE =====
MONGODB_URL=mongodb://localhost:27017/mes

# ===== SECURITY SECRETS =====
# Generate strong random strings (32+ characters)
JWT_SECRET=your-jwt-secret-key-here
QR_SECRET=your-qr-secret-key-here

# ===== EMAIL SERVICE (OTP) =====
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # Gmail App Password, not regular password
EMAIL_FROM=noreply@mes.com

# ===== FRONTEND URL =====
FRONTEND_URL=http://localhost:3000

# ===== PAYMENT GATEWAY (ATOM) =====
# Optional - Required only if using payment features
ATOM_MERCH_ID=your-merchant-id
ATOM_MERCH_PASS=your-merchant-password
ATOM_PROD_ID=your-product-id
ATOM_AUTH_URL=https://payment.atomtech.in/paynetz/epi/fts
ATOM_PAYMENT_URL=https://payment.atomtech.in/
ATOM_REQ_ENC_KEY=encryption-key
ATOM_REQ_SALT=salt-value
ATOM_RES_DEC_KEY=decryption-key
ATOM_RES_SALT=salt-value
ATOM_RES_HASH_KEY=hash-key
```

---

## Frontend Environment Variables

### React (Vite)

Create `.env` file in frontend root:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000

# Environment
VITE_NODE_ENV=development
```

**Usage in code:**
```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL;
```

---

### React (Create React App)

```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:5000

# Environment
REACT_APP_NODE_ENV=development
```

**Usage in code:**
```typescript
const API_BASE = process.env.REACT_APP_API_BASE_URL;
```

---

### Next.js

```env
# API Configuration (public)
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000

# Server-side only variables
API_SECRET=your-secret-key
```

**Usage in code:**
```typescript
// Client-side
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

// Server-side only
const secret = process.env.API_SECRET;
```

---

## Production Configuration

### Backend Production

```env
# Server
NODE_ENV=production
HOST=0.0.0.0
PORT=5000
CORS_ORIGIN=https://yourdomain.com

# Database
MONGODB_URL=mongodb+srv://user:password@cluster.mongodb.net/mes?retryWrites=true&w=majority

# Secrets (Generate new ones for production!)
JWT_SECRET=production-jwt-secret-minimum-32-characters
QR_SECRET=production-qr-secret-minimum-32-characters

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=production-email@gmail.com
EMAIL_PASS=production-app-password
EMAIL_FROM=noreply@yourdomain.com

# Frontend
FRONTEND_URL=https://yourdomain.com

# Payment Gateway (Production credentials)
ATOM_MERCH_ID=production-merchant-id
ATOM_MERCH_PASS=production-merchant-password
ATOM_PROD_ID=production-product-id
ATOM_AUTH_URL=https://payment.atomtech.in/paynetz/epi/fts
ATOM_PAYMENT_URL=https://payment.atomtech.in/
ATOM_REQ_ENC_KEY=production-encryption-key
ATOM_REQ_SALT=production-salt
ATOM_RES_DEC_KEY=production-decryption-key
ATOM_RES_SALT=production-salt
ATOM_RES_HASH_KEY=production-hash-key
```

---

### Frontend Production

```env
# Vite
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_NODE_ENV=production

# Create React App
REACT_APP_API_BASE_URL=https://api.yourdomain.com
REACT_APP_NODE_ENV=production

# Next.js
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
NODE_ENV=production
```

---

## Environment-Specific Configuration

### Using Multiple Environment Files

**Backend:**
```
.env                    # Default
.env.development        # Development overrides
.env.production         # Production overrides
.env.test              # Test overrides
```

**Frontend:**
```
.env                    # Default
.env.local              # Local overrides (gitignored)
.env.development        # Development
.env.production         # Production
```

---

### Loading Environment Variables

**Backend (Node.js):**
```javascript
// Using dotenv
require('dotenv').config();

// Access variables
const port = process.env.PORT || 5000;
const corsOrigin = process.env.CORS_ORIGIN;
```

**Frontend (Vite):**
```typescript
// Automatically loaded
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

**Frontend (Create React App):**
```typescript
// Automatically loaded
const apiUrl = process.env.REACT_APP_API_BASE_URL;
```

---

## Configuration File Setup

### Backend Config File

Create `src/config/config.js`:

```javascript
module.exports = {
  server: {
    env: process.env.NODE_ENV || 'development',
    host: process.env.HOST || 'localhost',
    port: parseInt(process.env.PORT || '5000'),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },
  
  database: {
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017/mes'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d'
  },
  
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000'
  },
  
  payment: {
    atom: {
      merchId: process.env.ATOM_MERCH_ID,
      merchPass: process.env.ATOM_MERCH_PASS,
      prodId: process.env.ATOM_PROD_ID,
      authUrl: process.env.ATOM_AUTH_URL,
      paymentUrl: process.env.ATOM_PAYMENT_URL,
      reqEncKey: process.env.ATOM_REQ_ENC_KEY,
      reqSalt: process.env.ATOM_REQ_SALT,
      resDecKey: process.env.ATOM_RES_DEC_KEY,
      resSalt: process.env.ATOM_RES_SALT,
      resHashKey: process.env.ATOM_RES_HASH_KEY
    }
  }
};
```

---

### Frontend Config File

Create `src/config/config.ts`:

```typescript
const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  },
  
  app: {
    name: 'MES Frontend',
    version: '1.0.0',
  },
  
  features: {
    enablePayments: true,
    enableTicketScanning: true,
  },
  
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
};

export default config;

// Usage
import config from './config/config';
console.log(config.api.baseUrl);
```

---

## Generating Secrets

### JWT Secret

```bash
# Generate a random 32-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example output:**
```
a7f8d9e2c4b3f6a8d9e2c4b3f6a8d9e2c4b3f6a8d9e2c4b3f6a8d9e2c4b3f6a8
```

---

### QR Secret

```bash
# Generate another random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Email Configuration (Gmail)

### Setting up Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select "Mail" and your device
5. Generate password
6. Use this password in `EMAIL_PASS`

**Example:**
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  # 16-character app password
```

---

## MongoDB Configuration

### Local MongoDB

```env
MONGODB_URL=mongodb://localhost:27017/mes
```

### MongoDB Atlas (Cloud)

```env
MONGODB_URL=mongodb+srv://username:password@cluster0.mongodb.net/mes?retryWrites=true&w=majority
```

**Steps to get MongoDB Atlas URL:**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Add database user
4. Whitelist your IP
5. Get connection string
6. Replace `<password>` with your password

---

## Verifying Configuration

### Check Backend Environment

Create a test script `check-env.js`:

```javascript
require('dotenv').config();

const required = [
  'CORS_ORIGIN',
  'MONGODB_URL',
  'JWT_SECRET',
  'QR_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS'
];

console.log('Checking environment variables...\n');

let allPresent = true;

required.forEach(key => {
  const present = !!process.env[key];
  console.log(`${present ? '✅' : '❌'} ${key}: ${present ? 'Set' : 'MISSING'}`);
  if (!present) allPresent = false;
});

if (allPresent) {
  console.log('\n✅ All required variables are set!');
} else {
  console.log('\n❌ Some required variables are missing!');
  process.exit(1);
}
```

Run: `node check-env.js`

---

### Check Frontend Environment

```typescript
// Add to your main component
useEffect(() => {
  console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('Environment:', import.meta.env.MODE);
}, []);
```

---

## Security Best Practices

### ✅ DO:

- Use strong, random secrets (32+ characters)
- Use different secrets for dev/staging/prod
- Store `.env` in `.gitignore`
- Use environment variable management tools in production (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly
- Use HTTPS in production
- Never commit `.env` files to Git

### ❌ DON'T:

- Use weak or predictable secrets
- Reuse secrets across environments
- Commit `.env` files
- Share secrets via email/chat
- Hardcode secrets in code
- Use production secrets in development

---

## .gitignore Configuration

Make sure your `.gitignore` includes:

```gitignore
# Environment variables
.env
.env.local
.env.development
.env.production
.env.test

# Dependencies
node_modules/

# Build outputs
dist/
build/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

---

## CI/CD Environment Variables

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
env:
  NODE_ENV: production
  MONGODB_URL: ${{ secrets.MONGODB_URL }}
  JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

Add secrets in GitHub:
1. Repository Settings
2. Secrets and variables → Actions
3. New repository secret

---

### Docker Environment

```dockerfile
# Dockerfile
ENV NODE_ENV=production
ENV PORT=5000

# Use --env-file flag
docker run --env-file .env.production your-image
```

---

## Troubleshooting

### Environment Variables Not Loading

1. **Restart development server after .env changes**
2. **Check file name is exactly `.env`**
3. **Verify file location (project root)**
4. **Check for syntax errors in .env file**
5. **Use correct variable prefix (VITE_, REACT_APP_, etc.)**

### Values Showing as Undefined

```typescript
// Debug
console.log('All env vars:', import.meta.env);

// Check if variable exists
if (!import.meta.env.VITE_API_BASE_URL) {
  console.error('API_BASE_URL not set!');
}
```

---

For more information, see [QUICK_START.md](QUICK_START.md) and [SECURITY.md](SECURITY.md).
