MES Backend API Documentation
This repository contains the backend REST API for the Manipal Entrepreneurship Summit (MES) 2026. It handles user authentication, ticket management, payment processing via Atom Gateway, and QR code scanning for event entry.

🚀 Base URL
http://localhost:8080
🔐 Authentication & Security
Mechanism: JWT (JSON Web Tokens) stored in secure HTTP-Only Cookies.

Cookie Name: jwt

Implication: You do not need to manually attach tokens to the header. The browser (or Postman) will automatically send the cookie after a successful login.

CORS: Ensure your frontend requests include credentials: true.

📚 API Reference
1. System Health
Check Server Status
Endpoint: GET /health-check

Auth: Public

Response:

JSON

{
  "success": true,
  "message": "Service is healthy and running",
  "payload": null
}
2. Authentication Routes (/auth)
Register User
Endpoint: POST /auth/register

Auth: Public

Description: Creates a new user account.

Body (MIT Student):

JSON

{
  "userType": "MIT",
  "name": "John Doe",
  "regNumber": "220901234",
  "learnerEmail": "john.doe@learner.manipal.edu",
  "personalEmail": "john@gmail.com",
  "phone": "9876543210",
  "password": "SecurePass123!"
}
Body (Non-MIT):

JSON

{
  "userType": "NON_MIT",
  "name": "Jane Doe",
  "personalEmail": "jane@gmail.com",
  "phone": "9876543211",
  "password": "SecurePass123!"
}
Response:

JSON

{ "message": "Registered successfully. OTP sent to personal email." }
Verify OTP
Endpoint: POST /auth/verify-otp

Auth: Public

Body:

JSON

{ "email": "john@gmail.com", "otp": "123456" }
Response:

JSON

{ "message": "Email verified successfully" }
Login
Endpoint: POST /auth/login

Auth: Public

Description: Authenticates user and sets the jwt HTTP-only cookie.

Body:

JSON

{ "email": "john@gmail.com", "password": "SecurePass123!" }
Response:

JSON

{ "message": "Login successful" }
Password Management
Forgot Password: POST /auth/forgot-password (Body: { "email": "..." })

Reset Password: POST /auth/reset-password

Body:

JSON

{
  "email": "john@gmail.com",
  "otp": "123456",
  "newPassword": "NewPassword123!"
}
3. Ticket Routes (/tickets)
Buy Ticket (Reserve)
Endpoint: POST /tickets/buy

Auth: Required (Cookie)

Body:

JSON

{ "eventName": "MES Summit 2026" }
Response:

JSON

{
  "message": "Ticket purchased successfully",
  "ticketId": "67b8c9a1b2d3e4f5g6h7i8j9",
  "qrData": "{...}"
}
Get My Tickets
Endpoint: GET /tickets/my-tickets

Auth: Required (Cookie)

Response:

JSON

[
  {
    "_id": "67b8c9a1b2d3e4f5g6h7i8j9",
    "eventName": "MES Summit 2026",
    "isPaid": true,
    "isUsed": false,
    "qrData": "..."
  }
]
4. Payment Routes (/payment)
These routes handle the integration with Atom Payment Gateway.

Initiate Payment
Endpoint: POST /payment/initiate

Auth: Required (Cookie)

Description: Generates the signed payload required by Atom. The frontend must take this response and submit a hidden form to the Atom URL.

Body:

JSON

{
  "ticketId": "67b8c9a1b2d3e4f5g6h7i8j9",
  "amount": "499.00"
}
Response:

JSON

{
  "success": true,
  "url": "https://paynetzuat.atomtech.in/paynetz/epi/fts",
  "params": {
    "login": "...",
    "pass": "...",
    "ttype": "NBF",
    "prodid": "...",
    "signature": "generated_hash_string",
    "..."
  }
}
Payment Callback (Webhook)
Endpoint: POST /payment/callback

Auth: None (Server-to-Server)

Description: Atom's servers hit this endpoint to confirm payment status.

Body: Form-data sent by Atom (contains mmp_txn, f_code, signature, etc.).

Behavior:

Verifies response signature.

Updates Ticket status to PAID.

Redirects user to /payment/success or /payment/failed on the frontend.

5. Scanning Routes (/scan)
Scan Ticket QR
Endpoint: POST /scan/scan

Auth: Public (Protected by Logic/Scanner Device Header optional)

Headers: x-device: scanner-01 (Optional)

Body (The content of the QR code):

JSON

{
  "ticketId": "67b8c9a1b2d3e4f5g6h7i8j9",
  "username": "John Doe",
  "email": "john@gmail.com",
  "eventName": "MES Summit 2026",
  "timestamp": "2026-01-28T10:30:00.000Z"
}
Response (Valid):

JSON

{
  "success": true,
  "message": "ENTRY ALLOWED",
  "attendee": { "name": "John Doe" }
}
Response (Invalid/Duplicate):

JSON

{
  "success": false,
  "message": "Ticket already used",
  "usedAt": "2026-01-28T10:30:30.000Z"
}
🧪 Postman Testing Guide
Environment Setup: Create a Postman Environment with a variable base_url = http://localhost:8080.

Order of Operations:

Run Register → Check console/logs for OTP.

Run Verify OTP.

Run Login (This saves the cookie automatically).

Run Buy Ticket (Will fail if not logged in).

Run Initiate Payment using the ticketId from the Buy Ticket response.

Cookie Troubleshooting: If you get 401 Unauthorized, clear your Postman cookies (Cookies button below Send) and login again.


------------------------payment--------------------

Atom Payment Integration Roadmap
Phase 1: Preparation & Configuration
Objective: specific credentials and set up the environment.

1.1 Obtain Credentials
Contact the E-Cell Treasurer or the Atom account manager to get the following strictly confidential details:

Merchant Login ID: The account username.

Merchant Password: API password (different from dashboard login).

Product ID: The specific product category code (e.g., MES_EVENT).

Request Hash Key: Used to sign outgoing requests.

Response Hash Key: Used to verify incoming callbacks.

Client Code: Usually the same as Login ID or a specific sub-merchant code.

1.2 Environment Setup
Update your .env file in the Backend repository. Never hardcode these values.

Code snippet

ATOM_MODE=test                  # Change to 'live' for production
ATOM_LOGIN= [Your_Login_ID]
ATOM_PASSWORD= [Your_Password]
ATOM_PROD_ID= [Your_Product_ID]
ATOM_HASH_KEY= [Request_Hash]
ATOM_RESP_HASH_KEY= [Response_Hash]
ATOM_CLIENT_CODE= [Client_Code]
1.3 Install Dependencies
On the backend (Express), install the crypto library if not already present (Node.js usually has crypto built-in, but js-sha512 is often easier for specific hashing).

Bash

npm install js-sha512
Phase 2: Database Schema Updates
Objective: Track the state of payments and link them to tickets.

2.1 Update Ticket Model (ticket.model.js)
Modify your Mongoose schema to include payment tracking fields.

JavaScript

const ticketSchema = new mongoose.Schema({
  // ... existing fields ...
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'PENDING'
  },
  transactionId: { type: String, unique: true }, // Internal ID (e.g., MES_USERID_TIMESTAMP)
  atomTxnId: { type: String },                   // ID returned by Atom (mmp_txn)
  amount: { type: Number, required: true },
  paymentDate: { type: Date }
});
Phase 3: Backend Implementation (The Core)
Objective: Securely sign requests and handle callbacks.

3.1 Payment Controller Logic
You need two main functions:

initiatePayment:

Accepts ticketId from the frontend.

Calculates the Signature (Hash) using the specific formula provided in Atom documentation (usually: Login + Pass + TType + ProdID + TxnID + Amt + Currency).

Returns the Signed Payload and the Atom URL to the frontend.

handleCallback:

This is a POST route that Atom hits automatically.

CRITICAL: Verify the incoming signature using the ATOM_RESP_HASH_KEY. If the signature doesn't match, the request is fake.

If valid + Success Code (Ok): Update Ticket to SUCCESS.

If Failed: Update Ticket to FAILED.

Redirect: Finally, redirect the user's browser back to the Frontend (e.g., localhost:3000/success).

3.2 Routing
POST /payment/initiate (Protected by Auth Middleware)

POST /payment/callback (Public/Open - verified via Signature)

Phase 4: Frontend Implementation (Next.js)
Objective: Bridge the user to the payment gateway.

4.1 Payment Hook/Component
Since Atom requires a form submission, you cannot use a simple API call.

Step 1: Call your backend /payment/initiate to get the parameters.

Step 2: Create a hidden HTML form in the DOM.

Step 3: Populate inputs with the data received from the backend.

Step 4: Programmatically submit the form (form.submit()).

4.2 Status Pages
Create specific pages in your Next.js app to handle the redirect after payment:

/pages/payment/success.js: Display ticket details and QR code.

/pages/payment/failed.js: Show error message and "Try Again" button.

Phase 5: Testing Strategy
Objective: Ensure money flows correctly without losing data.

Sandbox Testing: Use ATOM_MODE=test. Atom provides "Magic Card Numbers" that simulate Success or Failure.

Signature Debugging: The most common error is "Invalid Signature". Log the string before hashing on the backend to ensure it matches the order Atom expects.

Network Resilience: Test what happens if the user closes the browser after payment but before the redirect. (The Backend Callback should still update the DB).

Phase 6: Go-Live Checklist
Objective: Production readiness.

[ ] Switch Mode: Change .env to ATOM_MODE=live.

[ ] HTTPS: Ensure the backend is running on HTTPS (required for production callbacks).

[ ] Callback URL: Whitelist your production domain IP with Atom (if required).

[ ] Error Logging: Ensure payment failures are logged to a file or monitoring service (e.g., Sentry) for debugging disputes.