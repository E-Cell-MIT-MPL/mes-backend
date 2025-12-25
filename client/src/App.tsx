import { useState, useEffect } from 'react';
import QRCode from "react-qr-code"; // <--- IMPORT THIS
// 1. Define the possible "Screens" or steps
type Step = 'REGISTER' | 'VERIFY' | 'LOGIN' | 'DASHBOARD';
type TicketData = string | null;
export default function App() {
  const [step, setStep] = useState<Step>('REGISTER');
  const [token, setToken] = useState<string>('');
  const [myTickets, setMyTickets] = useState<any[]>([]);
  // We keep form data in parent state so we don't lose the email between steps
  const [formData, setFormData] = useState({
    userType: 'MIT', // Defaulting to MIT based on your previous messages
    name: '',
    phone: '',
    regNumber: '',
    learnerEmail: '',
    personalEmail: '',
    password: '',
    otp: ''
  });

  const [status, setStatus] = useState({ message: '', error: false });
  const [ticketQR, setTicketQR] = useState<TicketData>(null);
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      setStep('DASHBOARD');
    }
  }, []);
  // Generic handler for input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* ================= API CALLS ================= */

  const handleRegister = async () => {
    setStatus({ message: 'Registering...', error: false });
    try {
      const res = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: formData.userType,
          name: formData.name,
          phone: formData.phone,
          regNumber: formData.regNumber,
          learnerEmail: formData.learnerEmail, // For MIT
          personalEmail: formData.personalEmail, // For NON_MIT
          password: formData.password
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus({ message: 'Success! Check email for OTP.', error: false });
        setStep('VERIFY');
      } else {
        setStatus({ message: data.message, error: true });
      }
    } catch (err) {
      setStatus({ message: 'Network Error', error: true });
    }
  };

  const handleVerify = async () => {
    setStatus({ message: 'Verifying...', error: false });
    // Determine which email to use based on userType
    const emailToVerify = formData.userType === 'MIT' ? formData.learnerEmail : formData.personalEmail;

    try {
      const res = await fetch('http://localhost:5000/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToVerify,
          otp: formData.otp
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus({ message: 'Verified! Please Login.', error: false });
        setStep('LOGIN');
      } else {
        setStatus({ message: data.message, error: true });
      }
    } catch (err) {
      setStatus({ message: 'Network Error', error: true });
    }
  };

  const handleLogin = async () => {
    setStatus({ message: 'Logging in...', error: false });
    const emailToLogin = formData.userType === 'MIT' ? formData.learnerEmail : formData.personalEmail;

    try {
      const res = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToLogin,
          password: formData.password
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setToken(data.token); // Save the ID Card
        localStorage.setItem('token', data.token); // <--- 2. SAVE TOKEN
        setStatus({ message: 'Login Successful!', error: false });
        setStep('DASHBOARD');
      } else {
        setStatus({ message: data.message, error: true });
      }
    } catch (err) {
      setStatus({ message: 'Network Error', error: true });
    }
  };
  const handleBuyTicket = async (eventName: string) => {
    setStatus({ message: `Processing payment for ${eventName}...`, error: false });

    // Simulate Payment Gateway Delay
    setTimeout(async () => {
      try {
        const res = await fetch('http://localhost:5000/tickets/buy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // <--- SEND TOKEN
          },
          body: JSON.stringify({ eventName }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus({ message: 'Payment Successful! Ticket Generated.', error: false });
          setTicketQR(data.qrData); // Save the QR string
        } else {
          setStatus({ message: data.message, error: true });
        }
      } catch (err) {
        setStatus({ message: 'Network Error', error: true });
      }
    }, 2000); // 2 second mock delay
  };
  const fetchTickets = async () => {
    if (!token) return;
    const res = await fetch('http://localhost:5000/tickets/my-tickets', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setMyTickets(data);
  };
  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('token'); // <--- CLEARS LOGIN
    setStep('LOGIN');
    setMyTickets([]);
  };
  // Call this when entering dashboard
  useEffect(() => {
    if (step === 'DASHBOARD') {
      fetchTickets();
    }
  }, [step, token]);
  /* ================= UI RENDERING ================= */

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>QrTicket App</h1>

      {/* Status Message Bar */}
      {status.message && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: status.error ? '#ffebee' : '#e8f5e9',
          color: status.error ? '#c62828' : '#2e7d32',
          borderRadius: '4px'
        }}>
          {status.message}
        </div>
      )}

      {/* --- STEP 1: REGISTER --- */}
      {step === 'REGISTER' && (
        <div style={formStyle}>
          <h2>Sign Up</h2>
          <select name="userType" value={formData.userType} onChange={handleChange} style={inputStyle}>
            <option value="MIT">MIT Student</option>
            <option value="NON_MIT">Outsider</option>
          </select>

          <input name="name" placeholder="Full Name" onChange={handleChange} style={inputStyle} />
          <input name="phone" placeholder="Phone Number" onChange={handleChange} style={inputStyle} />

          {/* ALWAYS show Personal Email because Schema requires it */}
          <input
            name="personalEmail"
            placeholder="Personal Email (Required)"
            onChange={handleChange}
            style={inputStyle}
          />

          {/* Only show MIT fields if MIT is selected */}
          {formData.userType === 'MIT' && (
            <>
              <input name="regNumber" placeholder="Registration Number" onChange={handleChange} style={inputStyle} />
              <input name="learnerEmail" placeholder="Learner Email (@learner.manipal.edu)" onChange={handleChange} style={inputStyle} />
            </>
          )}

          <input name="password" type="password" placeholder="Password" onChange={handleChange} style={inputStyle} />

          <button onClick={handleRegister} style={buttonStyle}>Register</button>
          <p style={{ fontSize: '0.9rem' }}>Already have an account? <span style={linkStyle} onClick={() => setStep('LOGIN')}>Login</span></p>
        </div>
      )}

      {/* --- STEP 2: VERIFY OTP --- */}
      {step === 'VERIFY' && (
        <div style={formStyle}>
          <h2>Verify Email</h2>
          <p>OTP sent to: {formData.userType === 'MIT' ? formData.learnerEmail : formData.personalEmail}</p>
          <input name="otp" placeholder="Enter 6-digit OTP" onChange={handleChange} style={inputStyle} />
          <button onClick={handleVerify} style={buttonStyle}>Verify Code</button>
        </div>
      )}

      {/* --- STEP 3: LOGIN --- */}
      {step === 'LOGIN' && (
        <div style={formStyle}>
          <h2>Login</h2>
          <input
            name={formData.userType === 'MIT' ? "learnerEmail" : "personalEmail"}
            placeholder="Email"
            // Pre-fill if we came from register flow
            value={formData.userType === 'MIT' ? formData.learnerEmail : formData.personalEmail}
            onChange={handleChange}
            style={inputStyle}
          />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} style={inputStyle} />
          <button onClick={handleLogin} style={buttonStyle}>Login</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
  
  {/* --- DASHBOARD --- */}
  {step === 'DASHBOARD' && (
        <div style={formStyle}>
          
          {/* CHECK: Do we have a QR to show? */}
          {ticketQR ? (
            /* --- YES: SHOW QR SCREEN --- */
            <div style={{ textAlign: 'center' }}>
              <h3>Your Ticket</h3>
              <div style={{ background: 'white', padding: '16px', display: 'inline-block', border: '1px solid #ccc' }}>
                <QRCode value={ticketQR} size={200} />
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>Scan this at the venue entry</p>
              
              <button 
                onClick={() => setTicketQR(null)} 
                style={{ ...buttonStyle, background: '#555', marginTop: '20px', width: '100%' }}
              >
                Close & Go Back
              </button>
            </div>
          ) : (
            /* --- NO: SHOW EVENT LIST & MY TICKETS --- */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 1. UPCOMING EVENTS */}
              <div>
                <h2>Upcoming Events</h2>
                <div style={cardStyle}>
                  <h3>Keynote Session - Day 1</h3>
                  <p>Price: ₹500</p>
                  <button onClick={() => handleBuyTicket('Revels 2025')} style={buttonStyle}>
                    Buy Ticket
                  </button>
                </div>
                
                <div style={{ ...cardStyle, marginTop: '10px' }}>
                  <h3>Influencer Conclave</h3>
                  <p>Price: ₹800</p>
                  <button onClick={() => handleBuyTicket('TechTatva Pro')} style={buttonStyle}>
                    Buy Ticket
                  </button>
                </div>
              </div>

              <hr style={{ width: '100%', border: '1px solid #eee' }} />

              {/* 2. MY PAST TICKETS */}
              <div>
                <h2>My Past Tickets</h2>
                {myTickets.length === 0 ? (
                  <p style={{ color: '#777', fontStyle: 'italic' }}>No tickets purchased yet.</p>
                ) : (
                  myTickets.map((ticket) => (
                    <div key={ticket._id} style={{ 
                      border: '1px solid #ddd', 
                      padding: '10px', 
                      marginBottom: '10px', 
                      borderRadius: '5px',
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      backgroundColor: 'white'
                    }}>
                      <div>
                        <strong>{ticket.eventName}</strong>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                           {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button 
                        onClick={() => setTicketQR(ticket.qrData)} 
                        style={{ padding: '5px 10px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '3px' }}
                      >
                        View QR
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button onClick={handleLogout} style={{ ...buttonStyle, background: 'transparent', color: 'red', border: '1px solid red', marginTop: '10px' }}>
                Logout
              </button>
            </div>
          )}
        </div>
      )}

</div>
    </div>
  );
}


// Simple styles objects to keep JSX clean
const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' };
const inputStyle: React.CSSProperties = { padding: '10px', fontSize: '16px' };
const buttonStyle: React.CSSProperties = { padding: '12px', background: 'black', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px', borderRadius: '4px' };
const linkStyle: React.CSSProperties = { color: 'blue', cursor: 'pointer', textDecoration: 'underline' };
const cardStyle: React.CSSProperties = { border: '1px solid #ccc', padding: '15px', borderRadius: '8px', background: '#f9f9f9' };