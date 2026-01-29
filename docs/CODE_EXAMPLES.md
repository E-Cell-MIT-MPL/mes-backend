# 💻 Code Examples

Complete implementation examples for integrating the MES Backend API with your frontend application.

---

## Table of Contents

1. [Complete Authentication Flow](#complete-authentication-flow)
2. [Ticket Management](#ticket-management)
3. [Payment Integration](#payment-integration)
4. [React Hooks](#react-hooks)
5. [Context Providers](#context-providers)
6. [Error Handling](#error-handling)
7. [Utility Functions](#utility-functions)

---

## Complete Authentication Flow

### React/TypeScript Implementation

```typescript
import { useState } from 'react';

const API_BASE = 'http://localhost:5000';

// ===== 1. REGISTRATION =====
const RegistrationForm = () => {
  const [formData, setFormData] = useState({
    userType: 'MIT' as 'MIT' | 'NON_MIT',
    name: '',
    phone: '',
    personalEmail: '',
    password: '',
    regNumber: '',
    learnerEmail: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userType: formData.userType,
          name: formData.name,
          phone: formData.phone,
          personalEmail: formData.personalEmail,
          password: formData.password,
          ...(formData.userType === 'MIT' && {
            regNumber: formData.regNumber,
            learnerEmail: formData.learnerEmail
          })
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('OTP sent to email');
        // Navigate to OTP verification page
        // navigate('/verify-otp', { state: { email: formData.personalEmail }});
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <select
        value={formData.userType}
        onChange={(e) => setFormData({ ...formData, userType: e.target.value as 'MIT' | 'NON_MIT' })}
      >
        <option value="MIT">MIT Student</option>
        <option value="NON_MIT">Non-MIT Student</option>
      </select>

      <input
        type="text"
        placeholder="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <input
        type="tel"
        placeholder="Phone"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        required
      />

      <input
        type="email"
        placeholder="Personal Email"
        value={formData.personalEmail}
        onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
      />

      {formData.userType === 'MIT' && (
        <>
          <input
            type="text"
            placeholder="Registration Number"
            value={formData.regNumber}
            onChange={(e) => setFormData({ ...formData, regNumber: e.target.value })}
            required
          />

          <input
            type="email"
            placeholder="Learner Email"
            value={formData.learnerEmail}
            onChange={(e) => setFormData({ ...formData, learnerEmail: e.target.value })}
            required
          />
        </>
      )}

      <button type="submit">Register</button>
    </form>
  );
};

// ===== 2. OTP VERIFICATION =====
const OtpVerification = ({ email }: { email: string }) => {
  const [otp, setOtp] = useState('');

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Email verified! You can now login.');
        // Navigate to login page
        // navigate('/login');
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('New OTP sent to email');
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Resend OTP failed:', error);
    }
  };

  return (
    <form onSubmit={handleVerifyOtp}>
      <input
        type="text"
        placeholder="Enter 6-digit OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        maxLength={6}
        required
      />
      <button type="submit">Verify OTP</button>
      <button type="button" onClick={handleResendOtp}>Resend OTP</button>
    </form>
  );
};

// ===== 3. LOGIN =====
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ⚠️ CRITICAL
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful! Cookie set automatically.');
        // Navigate to dashboard
        // navigate('/dashboard');
      } else if (response.status === 403) {
        console.error('Email not verified');
        // Navigate to OTP verification
        // navigate('/verify-otp', { state: { email }});
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
};

// ===== 4. CHECK AUTH STATUS =====
const checkAuthStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/tickets/my-tickets`, {
      credentials: 'include' // Cookie sent automatically
    });

    return response.ok; // true if authenticated, false otherwise
  } catch (error) {
    return false;
  }
};

// Use in App component
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus().then((authenticated) => {
      setIsAuthenticated(authenticated);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return isAuthenticated ? <Dashboard /> : <LoginForm />;
};
```

---

## Ticket Management

### Fetching Tickets

```typescript
import { useState, useEffect } from 'react';
import { Ticket } from './types/api';

const TicketsList = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${API_BASE}/tickets/my-tickets`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const data = await response.json();
      setTickets(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading tickets...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>My Tickets</h2>
      {tickets.length === 0 ? (
        <p>No tickets found</p>
      ) : (
        <ul>
          {tickets.map((ticket) => (
            <li key={ticket._id}>
              <h3>{ticket.eventName}</h3>
              <p>Status: {ticket.paymentStatus}</p>
              <p>Amount: ₹{ticket.amount}</p>
              {ticket.paymentStatus === 'SUCCESS' && (
                <QRCodeDisplay data={ticket.qrData} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

### Fetching Single Ticket

```typescript
const TicketDetail = ({ ticketId }: { ticketId: string }) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const response = await fetch(`${API_BASE}/tickets/${ticketId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTicket(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
    }
  };

  if (!ticket) return <div>Loading...</div>;

  return (
    <div>
      <h2>{ticket.eventName}</h2>
      <p>Transaction ID: {ticket.txnId}</p>
      <p>Amount: ₹{ticket.amount}</p>
      <p>Status: {ticket.paymentStatus}</p>
      {ticket.isUsed && (
        <p>Used at: {new Date(ticket.usedAt!).toLocaleString()}</p>
      )}
    </div>
  );
};
```

### QR Code Display

```typescript
import QRCode from 'qrcode.react';

const QRCodeDisplay = ({ data }: { data: string }) => {
  return (
    <div>
      <QRCode value={data} size={256} />
    </div>
  );
};
```

---

## Payment Integration

### Initiating Payment

```typescript
const PaymentButton = ({ eventName, amount }: { eventName: string; amount: number }) => {
  const [loading, setLoading] = useState(false);

  const handleBuyTicket = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/payment/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ eventName, amount })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect to payment gateway
        const { paymentUrl, atomTokenId, merchId } = data.data;
        window.location.href = `${paymentUrl}?token=${atomTokenId}&merchId=${merchId}`;
      } else {
        console.error(data.message);
        alert('Payment initiation failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleBuyTicket} disabled={loading}>
      {loading ? 'Processing...' : `Buy Ticket - ₹${amount}`}
    </button>
  );
};
```

### Checking Payment Status

```typescript
const PaymentStatus = ({ ticketId }: { ticketId: string }) => {
  const [status, setStatus] = useState<string>('PENDING');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
    // Poll every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [ticketId]);

  const checkStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/payment/status/${ticketId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data.data.paymentStatus);

        // Stop polling if payment is complete
        if (data.data.paymentStatus !== 'PENDING') {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };

  return (
    <div>
      <h3>Payment Status: {status}</h3>
      {loading && <p>Waiting for payment confirmation...</p>}
      {status === 'SUCCESS' && <p>✅ Payment successful!</p>}
      {status === 'FAILED' && <p>❌ Payment failed</p>}
    </div>
  );
};
```

---

## React Hooks

### useAuth Hook

```typescript
import { useState, useEffect, createContext, useContext } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_BASE}/tickets/my-tickets`, {
        credentials: 'include'
      });
      const authenticated = response.ok;
      setIsAuthenticated(authenticated);
      return authenticated;
    } catch {
      setIsAuthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    // Clear client state
    setIsAuthenticated(false);
    // Redirect to login
    window.location.href = '/login';
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Usage
const SomeComponent = () => {
  const { isAuthenticated, login, logout } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={() => login('email@example.com', 'password')}>Login</button>
      )}
    </div>
  );
};
```

### useTickets Hook

```typescript
import { useState, useEffect } from 'react';
import { Ticket } from './types/api';

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/tickets/my-tickets`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const data = await response.json();
      setTickets(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return { tickets, loading, error, refetch: fetchTickets };
};

// Usage
const TicketsPage = () => {
  const { tickets, loading, error, refetch } = useTickets();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {tickets.map(ticket => (
        <div key={ticket._id}>{ticket.eventName}</div>
      ))}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
};
```

---

## Context Providers

### Complete Auth Provider with Token Refresh

```typescript
import React, { createContext, useState, useEffect, useContext } from 'react';

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_BASE}/tickets/my-tickets`, {
        credentials: 'include'
      });

      if (response.ok) {
        setIsAuthenticated(true);
        // Optionally fetch user data
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp })
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        setUser({ email, name: '' }); // Fetch actual user data if needed
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    // Clear client state
    setIsAuthenticated(false);
    setUser(null);

    // Optional: Call backend logout endpoint if implemented
    // await fetch(`${API_BASE}/auth/logout`, {
    //   method: 'POST',
    //   credentials: 'include'
    // });

    // Redirect to login
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        verifyOtp
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## Error Handling

### Global Error Handler

```typescript
export const handleApiError = (error: any, statusCode?: number) => {
  if (statusCode === 401) {
    // Redirect to login
    window.location.href = '/login';
    return 'Session expired. Please login again.';
  }

  if (statusCode === 403) {
    // Redirect to verification
    window.location.href = '/verify-email';
    return 'Please verify your email to continue.';
  }

  if (statusCode === 404) {
    return 'Resource not found.';
  }

  if (statusCode === 409) {
    return error.message || 'Conflict error.';
  }

  if (statusCode && statusCode >= 500) {
    return 'Server error. Please try again later.';
  }

  return error.message || 'An error occurred.';
};
```

---

## Utility Functions

### API Wrapper

```typescript
export const apiCall = async <T = any>(
  url: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      const error = handleApiError(data, response.status);
      return { error };
    }

    return { data };
  } catch (error) {
    return { error: 'Network error' };
  }
};

// Usage
const { data, error } = await apiCall('/tickets/my-tickets');
if (error) {
  console.error(error);
} else {
  console.log(data);
}
```

---

For more details on data types, see [DATA_MODELS.md](DATA_MODELS.md).
