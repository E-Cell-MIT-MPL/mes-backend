# 📡 API Endpoints Reference

Complete reference for all available API endpoints in the MES Backend.

**Base URL:** `http://localhost:5000`

---

## Table of Contents

1. [Authentication Routes](#authentication-routes)
2. [Ticket Routes](#ticket-routes)
3. [Payment Routes](#payment-routes)
4. [Scan Routes](#scan-routes)
5. [Health Check](#health-check)

---

## Authentication Routes

### Base Path: `/auth`

All authentication endpoints are public (no authentication required).

#### POST `/auth/register`
Register a new user and send OTP to email.

**Request Body:**
```typescript
{
  userType: "MIT" | "NON_MIT",
  name: string,
  phone: string,
  personalEmail: string,
  password: string,
  regNumber?: string,      // Required if userType is "MIT"
  learnerEmail?: string    // Required if userType is "MIT"
}
```

**Response:** `200 OK`
```json
{
  "message": "OTP sent to your email"
}
```

---

#### POST `/auth/verify-otp`
Verify the OTP sent to email.

**Request Body:**
```typescript
{
  email: string,   // personalEmail
  otp: string      // 6-digit OTP
}
```

**Response:** `200 OK`
```json
{
  "message": "Email verified successfully"
}
```

---

#### POST `/auth/resend-otp`
Resend OTP if expired or not received.

**Request Body:**
```typescript
{
  email: string    // personalEmail
}
```

**Response:** `200 OK`
```json
{
  "message": "New OTP sent to your email"
}
```

---

#### POST `/auth/login`
Login and receive authentication cookie.

**Request Body:**
```typescript
{
  email: string,      // personalEmail
  password: string
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful"
}
```

**Note:** JWT token is set as httpOnly cookie automatically.

---

#### POST `/auth/forgot-password`
Initiate password reset flow.

**Request Body:**
```typescript
{
  email: string    // personalEmail
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset link sent to your email"
}
```

---

#### POST `/auth/reset-password`
Reset password using token from email.

**Request Body:**
```typescript
{
  token: string,
  newPassword: string
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset successful"
}
```

---

## Ticket Routes

### Base Path: `/tickets`

🔒 **All ticket routes require authentication** (JWT cookie must be present).

#### GET `/tickets/my-tickets`
Fetch all tickets for the logged-in user.

**Headers:** None required (cookie sent automatically)

**Response:** `200 OK`
```typescript
{
  success: true,
  data: [
    {
      _id: string,
      userId: string,
      eventName: string,
      qrData: string,
      txnId: string,
      atomTxnId: string | null,
      atomTokenId: string | null,
      amount: number,
      paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED",
      paymentMode: string | null,
      statusCode: string | null,
      statusMessage: string | null,
      isUsed: boolean,
      usedAt: string | null,
      usedBy: string | null,
      createdAt: string,
      updatedAt: string
    }
  ]
}
```

**Example:**
```javascript
const response = await fetch('http://localhost:5000/tickets/my-tickets', {
  credentials: 'include'
});
const data = await response.json();
```

---

#### GET `/tickets/:ticketId`
Fetch a single ticket by ID.

**URL Parameters:**
- `ticketId` - MongoDB ObjectId of the ticket

**Response:** `200 OK`
```typescript
{
  success: true,
  data: {
    _id: string,
    userId: string,
    eventName: string,
    // ... (same as ticket object above)
  }
}
```

**Example:**
```javascript
const ticketId = '507f1f77bcf86cd799439011';
const response = await fetch(`http://localhost:5000/tickets/${ticketId}`, {
  credentials: 'include'
});
```

---

## Payment Routes

### Base Path: `/payment`

#### POST `/payment/initiate` 🔒
Initiate payment for event ticket.

**Request Body:**
```typescript
{
  eventName: string,   // e.g., "Revels 2025"
  amount: number       // e.g., 500
}
```

**Response:** `200 OK`
```typescript
{
  success: true,
  message: "Payment initiated successfully",
  data: {
    success: true,
    txnId: string,              // Your transaction ID
    ticketId: string,           // MongoDB ticket ID
    atomTokenId: string,        // Payment gateway token
    paymentUrl: string,         // Redirect URL for payment
    merchId: string             // Merchant ID
  }
}
```

**Next Steps:**
1. Redirect user to `paymentUrl` with `atomTokenId` and `merchId`
2. User completes payment on gateway
3. Gateway redirects to callback URL
4. Backend updates ticket status automatically

**Example:**
```javascript
const response = await fetch('http://localhost:5000/payment/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    eventName: 'Revels 2025',
    amount: 500
  })
});

const data = await response.json();

if (data.success) {
  // Redirect to payment gateway
  const { paymentUrl, atomTokenId, merchId } = data.data;
  window.location.href = `${paymentUrl}?token=${atomTokenId}&merchId=${merchId}`;
}
```

---

#### POST `/payment/callback`
Payment gateway callback endpoint (public - no auth required).

**Note:** This endpoint is called automatically by the payment gateway after payment completion. Frontend doesn't need to interact with this endpoint directly.

**Request Body:** Payment gateway response data

**Response:** Redirects to frontend with payment status

---

#### GET `/payment/status/:ticketId` 🔒
Check payment status for a ticket.

**URL Parameters:**
- `ticketId` - MongoDB ObjectId

**Response:** `200 OK`
```typescript
{
  success: true,
  data: {
    paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED",
    ticketId: string,
    amount: number,
    eventName: string
  }
}
```

**Example:**
```javascript
const ticketId = '507f1f77bcf86cd799439011';
const response = await fetch(`http://localhost:5000/payment/status/${ticketId}`, {
  credentials: 'include'
});
const status = await response.json();
```

---

## Scan Routes

### Base Path: `/scan`

#### POST `/scan/scan`
Scan and validate QR code for entry.

**Request Body:**
```typescript
{
  ticketId: string,      // From QR code
  // QR payload should include verification data
}
```

**Response (Success):** `200 OK`
```json
{
  "success": true,
  "message": "ENTRY ALLOWED",
  "attendee": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "eventName": "Revels 2025",
  "scannedAt": "2026-01-29T10:30:00.000Z"
}
```

**Response (Already Used):** `400 Bad Request`
```json
{
  "success": false,
  "message": "Ticket already used",
  "usedAt": "2026-01-29T09:00:00.000Z"
}
```

**Response (Invalid):** `404 Not Found`
```json
{
  "success": false,
  "message": "Invalid ticket"
}
```

---

## Health Check

#### GET `/health-check`
Check if server is running.

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Service is healthy and running",
  "payload": null
}
```

**Example:**
```javascript
const response = await fetch('http://localhost:5000/health-check');
const health = await response.json();
console.log(health.message); // "Service is healthy and running"
```

---

## Request Guidelines

### Authentication
- Protected routes (🔒) require JWT cookie
- Always include `credentials: 'include'` in fetch requests
- No manual `Authorization` headers needed

### Headers
```javascript
{
  'Content-Type': 'application/json',
  // No Authorization header needed - cookies handle this
}
```

### Error Responses
All endpoints return consistent error format:
```json
{
  "success": false,
  "message": "Error description here"
}
```

Common status codes:
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (email not verified)
- `404` - Not found
- `409` - Conflict (duplicate data)
- `500` - Internal server error

See [ERROR_HANDLING.md](ERROR_HANDLING.md) for detailed error handling.

---

## Rate Limiting

Currently, there are no rate limits implemented. However, it's recommended to:
- Avoid making rapid successive requests
- Implement debouncing on user actions
- Cache responses where appropriate

---

## Testing Endpoints

You can test endpoints using:

### cURL
```bash
# Login example
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Get tickets (using saved cookies)
curl http://localhost:5000/tickets/my-tickets \
  -b cookies.txt
```

### Postman
1. Set request URL to `http://localhost:5000/auth/login`
2. Set method to `POST`
3. In Settings → Enable "Automatically follow redirects"
4. In Settings → Enable "Send cookies"
5. Cookies will be automatically managed

### Browser Console
```javascript
fetch('http://localhost:5000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
})
.then(res => res.json())
.then(console.log);
```

---

For implementation examples, see [CODE_EXAMPLES.md](CODE_EXAMPLES.md).
