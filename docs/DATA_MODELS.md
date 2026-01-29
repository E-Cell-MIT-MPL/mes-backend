# 📊 Data Models

TypeScript interfaces and data structures for the MES Backend API.

---

## Table of Contents

1. [User Model](#user-model)
2. [Ticket Model](#ticket-model)
3. [OTP Model](#otp-model)
4. [Enums](#enums)
5. [Request/Response Types](#requestresponse-types)
6. [Complete TypeScript Definitions](#complete-typescript-definitions)

---

## User Model

```typescript
interface User {
  _id: string;
  userType: "MIT" | "NON_MIT";
  name: string;
  regNumber?: string;           // Only for MIT students
  learnerEmail?: string;        // Only for MIT students
  personalEmail: string;        // Required for all users
  phone: string;
  password: string;             // Hashed (bcrypt)
  isVerified: boolean;          // Email verification status
  createdAt: Date;
  updatedAt: Date;
}
```

### Field Details

- **userType**: Determines if user is from MIT or external
- **regNumber**: MIT registration number (e.g., "2021BCS001")
- **learnerEmail**: MIT email (e.g., "name.2021@learner.manipal.edu")
- **personalEmail**: Primary email for login and communication
- **isVerified**: Must be `true` to login (set via OTP verification)

---

## Ticket Model

```typescript
interface Ticket {
  _id: string;
  userId: string;               // Reference to User._id
  eventName: string;            // e.g., "Revels 2025"
  qrData: string;               // Encrypted QR code data (JSON string)

  // Payment Details
  txnId: string;                // Unique transaction ID
  atomTxnId: string | null;     // Payment gateway transaction ID
  atomTokenId: string | null;   // Payment gateway token
  amount: number;               // Ticket price
  paymentStatus: PaymentStatus;
  paymentMode: string | null;   // e.g., "CC", "DC", "NB", "UPI"
  statusCode: string | null;    // Gateway status code
  statusMessage: string | null; // Gateway status message
  signature: string | null;     // Payment signature for verification
  signatureVerified: boolean;   // Signature verification status
  rawResponse: object | null;   // Complete gateway response

  // Attendance Tracking
  isUsed: boolean;              // Ticket usage status
  usedAt: Date | null;          // Timestamp of ticket scan
  usedBy: string | null;        // Scanner device ID

  createdAt: Date;
  updatedAt: Date;
}
```

### QR Data Structure

The `qrData` field contains an encrypted JSON string with the following structure:

```typescript
interface QRDataPayload {
  ticketId: string;
  userId: string;
  eventName: string;
  timestamp: number;
}
```

### Payment Status Flow

```
PENDING → SUCCESS
   ↓
FAILED / CANCELLED
```

---

## OTP Model

```typescript
interface Otp {
  _id: string;
  email: string;               // User's personalEmail
  otp: string;                 // 6-digit code
  expiresAt: Date;             // TTL index for auto-deletion
}
```

### OTP Details

- **OTP Length**: 6 digits
- **Expiry Time**: 10 minutes
- **Auto-deletion**: Handled by MongoDB TTL index

---

## Enums

### UserType

```typescript
type UserType = "MIT" | "NON_MIT";
```

### PaymentStatus

```typescript
type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
```

### Payment Modes

```typescript
type PaymentMode = 
  | "CC"    // Credit Card
  | "DC"    // Debit Card
  | "NB"    // Net Banking
  | "UPI"   // UPI
  | "WALLET"
  | null;
```

---

## Request/Response Types

### Registration Request

```typescript
interface RegisterRequest {
  userType: UserType;
  name: string;
  phone: string;
  personalEmail: string;
  password: string;
  
  // Only for MIT students
  regNumber?: string;
  learnerEmail?: string;
}
```

### Login Request

```typescript
interface LoginRequest {
  email: string;       // personalEmail
  password: string;
}
```

### OTP Verification Request

```typescript
interface VerifyOtpRequest {
  email: string;       // personalEmail
  otp: string;         // 6-digit code
}
```

### Payment Initiation Request

```typescript
interface PaymentInitiateRequest {
  eventName: string;   // e.g., "Revels 2025"
  amount: number;      // e.g., 500
}
```

### Payment Initiation Response

```typescript
interface PaymentInitiateResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    txnId: string;
    ticketId: string;
    atomTokenId: string;
    paymentUrl: string;
    merchId: string;
  };
}
```

### Ticket Response

```typescript
interface TicketResponse {
  success: boolean;
  data: Ticket[];
}
```

### Payment Status Response

```typescript
interface PaymentStatusResponse {
  success: boolean;
  data: {
    paymentStatus: PaymentStatus;
    ticketId: string;
    amount: number;
    eventName: string;
  };
}
```

### Scan Response

```typescript
interface ScanSuccessResponse {
  success: true;
  message: "ENTRY ALLOWED";
  attendee: {
    name: string;
    email: string;
  };
  eventName: string;
  scannedAt: string;
}

interface ScanErrorResponse {
  success: false;
  message: string;
  usedAt?: string;    // If ticket already used
}
```

### Generic API Response

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  payload?: any;
}
```

---

## Complete TypeScript Definitions

Here's a complete file you can use in your frontend project:

```typescript
// types/api.ts

// ===== Enums =====
export type UserType = "MIT" | "NON_MIT";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export type PaymentMode = 
  | "CC" 
  | "DC" 
  | "NB" 
  | "UPI" 
  | "WALLET" 
  | null;

// ===== Models =====
export interface User {
  _id: string;
  userType: UserType;
  name: string;
  regNumber?: string;
  learnerEmail?: string;
  personalEmail: string;
  phone: string;
  password: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  _id: string;
  userId: string;
  eventName: string;
  qrData: string;
  txnId: string;
  atomTxnId: string | null;
  atomTokenId: string | null;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
  statusCode: string | null;
  statusMessage: string | null;
  signature: string | null;
  signatureVerified: boolean;
  rawResponse: object | null;
  isUsed: boolean;
  usedAt: string | null;
  usedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Otp {
  _id: string;
  email: string;
  otp: string;
  expiresAt: string;
}

// ===== Request Types =====
export interface RegisterRequest {
  userType: UserType;
  name: string;
  phone: string;
  personalEmail: string;
  password: string;
  regNumber?: string;
  learnerEmail?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface PaymentInitiateRequest {
  eventName: string;
  amount: number;
}

export interface ScanRequest {
  ticketId: string;
}

// ===== Response Types =====
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  payload?: any;
}

export interface PaymentInitiateResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    txnId: string;
    ticketId: string;
    atomTokenId: string;
    paymentUrl: string;
    merchId: string;
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  data: {
    paymentStatus: PaymentStatus;
    ticketId: string;
    amount: number;
    eventName: string;
  };
}

export interface TicketsResponse {
  success: boolean;
  data: Ticket[];
}

export interface SingleTicketResponse {
  success: boolean;
  data: Ticket;
}

export interface ScanSuccessResponse {
  success: true;
  message: "ENTRY ALLOWED";
  attendee: {
    name: string;
    email: string;
  };
  eventName: string;
  scannedAt: string;
}

export interface ScanErrorResponse {
  success: false;
  message: string;
  usedAt?: string;
}

export type ScanResponse = ScanSuccessResponse | ScanErrorResponse;

// ===== Form Data Types =====
export interface RegisterFormData extends RegisterRequest {}

export interface LoginFormData extends LoginRequest {}

export interface OtpFormData extends VerifyOtpRequest {}
```

---

## Usage Examples

### Typing API Calls

```typescript
import { TicketsResponse, ApiResponse } from './types/api';

// Fetching tickets
const fetchTickets = async (): Promise<Ticket[]> => {
  const response = await fetch('http://localhost:5000/tickets/my-tickets', {
    credentials: 'include'
  });
  
  const data: TicketsResponse = await response.json();
  
  if (data.success) {
    return data.data;
  }
  
  return [];
};

// Generic API call with type safety
const apiCall = async <T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include'
  });
  
  return response.json();
};
```

### Form Validation

```typescript
import { RegisterFormData, UserType } from './types/api';

const validateRegisterForm = (data: RegisterFormData): string[] => {
  const errors: string[] = [];
  
  if (!data.name) errors.push('Name is required');
  if (!data.phone) errors.push('Phone is required');
  if (!data.personalEmail) errors.push('Email is required');
  if (!data.password) errors.push('Password is required');
  
  if (data.userType === 'MIT') {
    if (!data.regNumber) errors.push('Registration number is required for MIT students');
    if (!data.learnerEmail) errors.push('Learner email is required for MIT students');
  }
  
  return errors;
};
```

### React Component Example

```typescript
import React, { useState, useEffect } from 'react';
import { Ticket, TicketsResponse } from './types/api';

const TicketsList: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchTickets();
  }, []);
  
  const fetchTickets = async () => {
    try {
      const response = await fetch('http://localhost:5000/tickets/my-tickets', {
        credentials: 'include'
      });
      
      const data: TicketsResponse = await response.json();
      
      if (data.success) {
        setTickets(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {tickets.map((ticket) => (
        <div key={ticket._id}>
          <h3>{ticket.eventName}</h3>
          <p>Status: {ticket.paymentStatus}</p>
          <p>Amount: ₹{ticket.amount}</p>
        </div>
      ))}
    </div>
  );
};
```

---

## Date Handling

All date fields are returned as ISO 8601 strings:

```typescript
// Example: "2026-01-29T10:30:00.000Z"

// Convert to JavaScript Date
const ticket: Ticket = await fetchTicket();
const createdDate = new Date(ticket.createdAt);

// Format for display
const formatted = new Date(ticket.createdAt).toLocaleDateString('en-IN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});
```

---

For API usage examples, see [CODE_EXAMPLES.md](CODE_EXAMPLES.md).
