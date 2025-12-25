const API = "http://localhost:5000/auth";

async function post(url, data) {
  const res = await fetch(`${API}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

// LOGIN
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  const res = await post("/login", { email, password });

  if (res.token) {
    localStorage.setItem("token", res.token);
    msg.innerText = "Login successful";
    msg.className = "msg success";
  } else {
    msg.innerText = res.message;
    msg.className = "msg error";
  }
}

// REGISTER
async function register() {
  const data = {
    userType: document.getElementById("userType").value,
    name: document.getElementById("name").value,
    regNumber: document.getElementById("regNumber").value || null,
    learnerEmail: document.getElementById("learnerEmail").value || null,
    personalEmail: document.getElementById("personalEmail").value,
    phone: document.getElementById("phone").value,
    password: document.getElementById("password").value
  };

  const res = await post("/register", data);
  const msg = document.getElementById("msg");

  if (res.message) {
    msg.innerText = res.message;
    msg.className = "msg success";
    setTimeout(() => (window.location.href = "verify.html"), 1200);
  }
}

// VERIFY OTP
async function verifyOtp() {
  const email = document.getElementById("email").value;
  const otp = document.getElementById("otp").value;
  const msg = document.getElementById("msg");

  const res = await post("/verify-otp", { email, otp });

  msg.innerText = res.message;
  msg.className = res.message.includes("success")
    ? "msg success"
    : "msg error";
}

// RESEND OTP
async function resendOtp() {
  const email = document.getElementById("email").value;
  const msg = document.getElementById("msg");

  const res = await post("/resend-otp", { email });
  msg.innerText = res.message;
  msg.className = "msg success";
}

// FORGOT PASSWORD
async function forgotPassword() {
  const email = document.getElementById("email").value;
  const msg = document.getElementById("msg");

  const res = await post("/forgot-password", { email });
  msg.innerText = res.message;
  msg.className = "msg success";
}

// RESET PASSWORD
async function resetPassword() {
  const email = document.getElementById("email").value;
  const otp = document.getElementById("otp").value;
  const newPassword = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  const res = await post("/reset-password", {
    email,
    otp,
    newPassword
  });

  msg.innerText = res.message;
  msg.className = "msg success";
}
