import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  const payNow = async () => {
    const res = await fetch("http://localhost:5000/payment/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: "1",
        email: "test.user@atomtech.in",
        mobile: "8888888888",
      }),
    });

    const data = await res.json();
    console.log("INITIATE RESPONSE:", data);

    if (!data.atomTokenId) {
      alert("Payment init failed");
      return;
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = "https://paynetzuat.atomtech.in/paynetz/epi/fts";

    const fields: Record<string, string> = {
      token: data.atomTokenId,
      merchId: data.merchId,
      txnId: data.txnId,
    };

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>ATOM Payment Test</h1>
      <button onClick={payNow}>Pay ₹1</button>
    </div>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
