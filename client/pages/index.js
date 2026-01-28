export default function Home() {
  const payNow = async () => {
    const res = await fetch("http://localhost:5000/api/payment/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: "1",
        email: "test.user@atomtech.in",
        mobile: "8888888888",
      }),
    });

    const data = await res.json();

    const form = document.createElement("form");
    form.method = "POST";
    form.action = data.paymentUrl;

    const fields = {
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

  return <button onClick={payNow}>Pay with ATOM</button>;
}
