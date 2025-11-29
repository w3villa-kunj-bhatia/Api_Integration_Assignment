import React, { useState, useEffect } from "react";
import TicketCard from "./TicketCard.jsx";
import SuccessPage from "./SuccessPage.jsx";
import CancelPage from "./CancelPage.jsx";

// Function to get the current base path (e.g., /success, /cancel, or /)
function getCurrentBasePath(pathname) {
  // Use startsWith to ignore query parameters like ?session_id=...
  if (pathname.startsWith("/success")) {
    return "/success";
  }
  if (pathname.startsWith("/cancel")) {
    return "/cancel";
  }
  return "/";
}

export default function App() {
  const [route, setRoute] = useState(
    getCurrentBasePath(window.location.pathname)
  );

  useEffect(() => {
    // Listener for browser history changes (e.g., back/forward buttons)
    const handlePopState = () => {
      setRoute(getCurrentBasePath(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    // Return to clean up the event listener when the component unmounts
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const event = {
    id: "concert-001",
    title: "Travis Scott Circus Maximus Tour",
    date: "18 & 19 October 2025",
    venue: "JLN Stadium, New Delhi",
    price_rs: 5000,
    price_cents: 5000 * 100,
    currency: "inr",
    image:
      "https://cdn.sanity.io/images/vfp8z5al/production/e15fcb0e056e17ba871b6d077371f7db73981cb1-1200x1500.png",
  };

  let content;

  if (route === "/success") {
    content = <SuccessPage />;
  } else if (route === "/cancel") {
    content = <CancelPage />;
  } else {
    // Default Home Page
    content = (
      <>
        <header className="header">
          <h1>Travis Scott Circus Maximus Tour — Purchase Tickets</h1>
          <p>Secure checkout using Stripe</p>
        </header>

        <main className="main">
          <TicketCard event={event} />
        </main>
      </>
    );
  }

  return <div className="app">{content}</div>;
}