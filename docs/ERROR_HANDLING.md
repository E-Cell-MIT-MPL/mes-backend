# ⚠️ Error Handling

Comprehensive guide for handling errors in the MES Backend API.

---

## Standard Error Response Format

All errors follow a consistent format:

```typescript
{
  success: false,
  message: string,    // Human-readable error description
  payload: null
}
```

---

## HTTP Status Codes

### Overview Table

| Code  | Meaning                | When It Occurs                                    |
| ----- | ---------------------- | ------------------------------------------------- |
| `200` | Success                | Request completed successfully                    |
| `400` | Bad Request            | Missing/invalid request data                      |
| `401` | Unauthorized           | No token provided or invalid/expired token        |
| `403` | Forbidden              | Email not verified or insufficient permissions    |
| `404` | Not Found              | User, ticket, or resource not found               |
| `409` | Conflict               | Duplicate data (email exists, ticket already used)|
| `500` | Internal Server Error  | Unexpected server error                           |

---

## Error Scenarios by Endpoint

### Authentication Errors

#### Registration (`/auth/register`)

**400 Bad Request**
```json
{
  "success": false,
  "message": "Missing required fields"
}
```
**Causes:**
- Missing required fields (name, email, password, etc.)
- Invalid email format
- Password too short
- MIT student missing regNumber or learnerEmail

**409 Conflict**
```json
{
  "success": false,
  "message": "Email already registered"
}
```
**Cause:** User with this email already exists

---

#### OTP Verification (`/auth/verify-otp`)

**400 Bad Request**
```json
{
  "success": false,
  "message": "Invalid OTP"
}
```
**Causes:**
- Incorrect OTP
- OTP expired (>10 minutes old)

**404 Not Found**
```json
{
  "success": false,
  "message": "User not found"
}
```
**Cause:** Email doesn't exist in database

---

#### Login (`/auth/login`)

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```
**Causes:**
- Wrong email or password
- User doesn't exist

**403 Forbidden**
```json
{
  "success": false,
  "message": "Email not verified. Please verify your email first."
}
```
**Cause:** User hasn't completed OTP verification

---

### Ticket Errors

#### Fetch Tickets (`/tickets/my-tickets`)

**401 Unauthorized**
```json
{
  "success": false,
  "message": "No token provided"
}
```
**Cause:** Request made without authentication cookie

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Invalid token"
}
```
**Causes:**
- Token expired (>7 days old)
- Token tampered with
- Token from different environment

---

#### Get Single Ticket (`/tickets/:ticketId`)

**404 Not Found**
```json
{
  "success": false,
  "message": "Ticket not found"
}
```
**Causes:**
- Invalid ticket ID
- Ticket doesn't belong to logged-in user
- Ticket deleted

---

### Payment Errors

#### Initiate Payment (`/payment/initiate`)

**400 Bad Request**
```json
{
  "success": false,
  "message": "Missing required fields"
}
```
**Cause:** Missing eventName or amount

**401 Unauthorized**
```json
{
  "success": false,
  "message": "No token provided"
}
```
**Cause:** User not logged in

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Payment gateway error"
}
```
**Causes:**
- Payment gateway configuration issue
- Network error with payment gateway
- Invalid payment gateway credentials

---

#### Payment Status (`/payment/status/:ticketId`)

**404 Not Found**
```json
{
  "success": false,
  "message": "Ticket not found"
}
```
**Cause:** Invalid ticket ID

---

### Scan Errors

#### Scan Ticket (`/scan/scan`)

**400 Bad Request**
```json
{
  "success": false,
  "message": "Ticket already used",
  "usedAt": "2026-01-29T09:00:00.000Z"
}
```
**Cause:** Ticket was already scanned

**404 Not Found**
```json
{
  "success": false,
  "message": "Invalid ticket"
}
```
**Causes:**
- Ticket ID doesn't exist
- QR code is invalid or tampered

**400 Bad Request**
```json
{
  "success": false,
  "message": "Payment not completed"
}
```
**Cause:** Ticket payment status is not SUCCESS

---

## Error Handling Patterns

### Basic Pattern

```javascript
const handleApiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Handle HTTP error
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  } catch (error) {
    // Handle network error or thrown error
    console.error('API Error:', error);
    throw error;
  }
};
```

---

### Advanced Pattern with Status Code Handling

```javascript
const handleApiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include'
    });
    
    const data = await response.json();
    
    // Handle different status codes
    switch (response.status) {
      case 200:
        return data;
        
      case 400:
        throw new Error(data.message || 'Invalid request');
        
      case 401:
        // Redirect to login
        window.location.href = '/login';
        throw new Error('Please login to continue');
        
      case 403:
        // Email not verified
        window.location.href = '/verify-email';
        throw new Error('Please verify your email');
        
      case 404:
        throw new Error(data.message || 'Resource not found');
        
      case 409:
        throw new Error(data.message || 'Conflict error');
        
      case 500:
        throw new Error('Server error. Please try again later.');
        
      default:
        throw new Error(data.message || 'Unknown error');
    }
  } catch (error) {
    // Network error or other exceptions
    if (!navigator.onLine) {
      throw new Error('No internet connection');
    }
    throw error;
  }
};
```

---

### React Hook Example

```typescript
import { useState } from 'react';

interface ApiError {
  message: string;
  status?: number;
}

const useApiCall = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  
  const apiCall = async <T,>(
    url: string,
    options?: RequestInit
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const error: ApiError = {
          message: data.message || 'Request failed',
          status: response.status
        };
        setError(error);
        
        // Handle specific status codes
        if (response.status === 401) {
          window.location.href = '/login';
        } else if (response.status === 403) {
          window.location.href = '/verify-email';
        }
        
        return null;
      }
      
      return data as T;
    } catch (err) {
      const error: ApiError = {
        message: err instanceof Error ? err.message : 'Network error'
      };
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { apiCall, loading, error };
};

// Usage
const MyComponent = () => {
  const { apiCall, loading, error } = useApiCall();
  
  const handleLogin = async () => {
    const result = await apiCall('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (result) {
      // Success
      console.log('Logged in');
    }
  };
  
  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};
```

---

## Error Display Strategies

### Toast Notifications

```javascript
import { toast } from 'react-toastify';

const handleError = (error, statusCode) => {
  switch (statusCode) {
    case 400:
      toast.error(error.message || 'Invalid request');
      break;
    case 401:
      toast.error('Session expired. Please login again.');
      break;
    case 403:
      toast.warning('Please verify your email to continue');
      break;
    case 404:
      toast.error('Resource not found');
      break;
    case 409:
      toast.warning(error.message || 'Conflict error');
      break;
    case 500:
      toast.error('Server error. Please try again later.');
      break;
    default:
      toast.error(error.message || 'Something went wrong');
  }
};
```

---

### Form Validation Errors

```javascript
const [formErrors, setFormErrors] = useState({});

const handleSubmit = async (formData) => {
  try {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Show error in form
      setFormErrors({ general: data.message });
      return;
    }
    
    // Success
    setFormErrors({});
  } catch (error) {
    setFormErrors({ general: 'Network error. Please try again.' });
  }
};
```

---

## Retry Logic

For transient errors, implement retry logic:

```javascript
const apiCallWithRetry = async (url, options = {}, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include'
      });
      
      // Only retry on 5xx errors or network failures
      if (response.status < 500) {
        return await response.json();
      }
      
      lastError = await response.json();
    } catch (error) {
      lastError = error;
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    }
  }
  
  throw lastError;
};
```

---

## Best Practices

### 1. Always Check Response Status
```javascript
if (!response.ok) {
  // Handle error
}
```

### 2. Provide User-Friendly Messages
```javascript
// Bad
throw new Error('ERR_AUTH_001');

// Good
throw new Error('Please verify your email before logging in');
```

### 3. Log Errors for Debugging
```javascript
console.error('API Error:', {
  url,
  status: response.status,
  message: data.message,
  timestamp: new Date().toISOString()
});
```

### 4. Handle Network Errors
```javascript
if (!navigator.onLine) {
  throw new Error('No internet connection');
}
```

### 5. Don't Expose Sensitive Information
```javascript
// Bad
console.error('Token:', jwt);

// Good
console.error('Authentication failed');
```

---

## Testing Error Scenarios

### Manual Testing with cURL

```bash
# Test invalid credentials
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@example.com","password":"wrong"}' \
  -v

# Test unauthorized access
curl http://localhost:5000/tickets/my-tickets -v

# Test invalid ticket ID
curl http://localhost:5000/tickets/invalid-id \
  -b cookies.txt -v
```

---

## Common Issues and Solutions

### Issue: "No token provided" error
**Solution:** Ensure `credentials: 'include'` is in your fetch request

### Issue: Token expired repeatedly
**Solution:** Check backend JWT_SECRET hasn't changed, verify cookie maxAge

### Issue: CORS error on error responses
**Solution:** Check CORS_ORIGIN in backend .env matches frontend URL

### Issue: Can't read error message
**Solution:** Always parse JSON response before accessing message:
```javascript
const data = await response.json();
console.log(data.message);
```

---

For more troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
