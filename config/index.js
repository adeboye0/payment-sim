"use strict";

module.exports = {
  port: Number(process.env.PORT || 8080),
  jwtSecret: process.env.JWT_SECRET || "test-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
  demoUser: {
    id: "user_demo",
    email: String(process.env.DEMO_EMAIL || "test@test.com"),
    password: process.env.DEMO_PASSWORD || "password",
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    baseUrl: String(process.env.STRIPE_BASE_URL || "https://api.stripe.com").replace(/\/$/, ""),
    successUrl: process.env.STRIPE_SUCCESS_URL || "http://localhost:8080/payments/success?session_id={CHECKOUT_SESSION_ID}",
    cancelUrl: process.env.STRIPE_CANCEL_URL || "http://localhost:8080/payments/cancel",
  },
};
