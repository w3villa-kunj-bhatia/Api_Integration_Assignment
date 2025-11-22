import React from "react";
import TicketCard from "./TicketCard.jsx";

export default function App() {
  const event = {
    id: "concert-001",
    title: "Travis Scoot Circus Maximus Tour",
    date: "18 & 19 October 2025",
    venue: "JLN Stadium, New Delhi",
    price_rs: 5000,   
    price_cents: 5000 * 100, 
    currency: "inr",
    image:
      "https://cdn.sanity.io/images/vfp8z5al/production/e15fcb0e056e17ba871b6d077371f7db73981cb1-1200x1500.png",
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Travis Scoot Circus Maximus Tour — Purchase Tickets</h1>
        <p>Secure checkout using Stripe</p>
      </header>

      <main className="main">
        <TicketCard event={event} />
      </main>
    </div>
  );
}