"use strict";

const express = require("express");
const cors = require("cors");

const paymentHandler = require("./handlers/payment-handler");
const authHandler = require("./handlers/auth-handler");
const { requireAuth } = require("./middleware/auth");

function createApiRouter() {
  const router = express.Router();

  router.post("/auth/login", authHandler.login);
  router.post("/create-payment", requireAuth, paymentHandler.createPayment);
  router.get("/get-payment/:idOrReference", requireAuth, paymentHandler.getPayment);
  router.put("/update-payment/:idOrReference", requireAuth, paymentHandler.updatePayment);
  router.patch("/update-payment/:idOrReference", requireAuth, paymentHandler.updatePayment);

  return router;
}

function createApp() {
  const app = express();

  app.set("trust proxy", true);
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use(createApiRouter());

  app.use((_req, res) => {
    res.status(404).json({ status: "failed", data: { message: "Not found" } });
  });

  app.use((err, _req, res, _next) => {
    console.error("Handler error:", err);
    res.status(500).json({
      status: "failed",
      data: { message: err?.message || "Internal server error" },
    });
  });

  return app;
}

module.exports = { createApp, createApiRouter };
