import React from "react";

export default function CancelPage() {
  return (
    <div className="status-page cancel-page">
      <h1>❌ Payment Cancelled</h1>
      <p>
        Your order was not completed. You can try again or contact support if
        you believe this is an error.
      </p>
      <a href="/" className="button-link">
        Return to Ticket Purchase
      </a>
      <p className="footer">
        *If you were already charged, please contact customer support.
      </p>
    </div>
  );
}
