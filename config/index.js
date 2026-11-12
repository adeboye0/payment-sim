"use strict";

const port = Number(process.env.PORT || 3000);

module.exports = {
  port,
  publicBaseUrl: String(process.env.PUBLIC_BASE_URL || `http://localhost:${port}`).replace(/\/$/, ""),
  jwtSecret: process.env.JWT_SECRET || "test-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
  webhookSecret: process.env.WEBHOOK_SECRET || "test-webhook-secret",
  demoUsers: [
    {
      id: "test_id",
      email: String(process.env.DEMO_EMAIL || "test@example.com"),
      password: process.env.DEMO_PASSWORD || "test-password",
    },
    {
      id: "test_id_2",
      email: String(process.env.DEMO_EMAIL_2 || "test2@example.com"),
      password: process.env.DEMO_PASSWORD_2 || "test-password",
    },
  ],
};
