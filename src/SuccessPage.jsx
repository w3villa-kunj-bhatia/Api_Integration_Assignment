import React, { useEffect, useState } from "react";

// Dynamically read the API URL (Must be set on Vercel deployment)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4242";

export default function SuccessPage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const sessionId = query.get("session_id");

    if (!sessionId) {
      setError("No session ID found in the URL.");
      setLoading(false);
      return;
    }

    async function fetchSessionStatus() {
      try {
        // Uses VITE_API_BASE_URL
        const res = await fetch(
          `${API_BASE_URL}/session-status?session_id=${sessionId}`
        );
        const data = await res.json();

        if (res.ok) {
          if (data.status === "paid") {
            setSession(data);
          } else {
            setError(
              `Payment status is not 'paid'. Current status: ${data.status}`
            );
          }
        } else {
          throw new Error(
            data.error?.message || "Failed to fetch session details."
          );
        }
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    }

    fetchSessionStatus();
  }, []);

  if (loading) {
    return (
      <div className="status-page">
        <h1>Processing Payment...</h1>
        <p>Please wait while we confirm your transaction.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-page error-page">
        <h1>⚠️ Payment Error</h1>
        <p>There was an issue processing or confirming your payment.</p>
        <p className="error-message">Details: {error}</p>
        <a href="/" className="button-link">
          Try Again
        </a>
      </div>
    );
  }

  const item = session.line_items?.[0]?.description || "Ticket(s)";

  return (
    <div className="status-page success-page">
      <h1>🎉 Payment Successful!</h1>
      <p>Thank you for your purchase.</p>
      <p>
        A confirmation email has been sent to{" "}
        <strong className="email-highlight">
          {session.customer_email || "your provided email address"}
        </strong>
        .
      </p>
      <div className="receipt-details">
        <h3>Order Details:</h3>
        <p>
          <strong>Item:</strong> {item}
        </p>
        <p>
          <strong>Payment Status:</strong> Confirmed
        </p>
      </div>
      <a href="/" className="button-link">
        Go Home
      </a>
    </div>
  );
}
