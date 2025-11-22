import React, { useState } from "react";

export default function TicketCard({ event }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleBuy(quantity = 1) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("https://api-integration-assignment.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_cents: event.price_cents,
          currency: event.currency,
          quantity,
          name: event.title,
          metadata: { eventId: event.id },
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => null);
        throw new Error(
          `Server error creating session: ${res.status} ${body || ""}`
        );
      }

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      setError(err.message || String(err));
      setLoading(false);
    }
  }

  return (
    <div className="ticket-card">
      <img className="poster" src={event.image} alt={event.title} />

      <div className="info">
        <h2>{event.title}</h2>
        <p className="meta">
          {event.date} — {event.venue}
        </p>
        <p className="price">
          {(event.price_cents / 100).toFixed(2)} {event.currency.toUpperCase()}
        </p>

        <div className="actions">
          <button disabled={loading} onClick={() => handleBuy(1)}>
            {loading ? "Redirecting..." : "Buy 1 Ticket"}
          </button>

          <button disabled={loading} onClick={() => handleBuy(2)}>
            {loading ? "Redirecting..." : "Buy 2 Tickets"}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}