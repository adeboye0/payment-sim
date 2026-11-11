"use strict";

const express = require("express");
const cors = require("cors");

const { logError } = require("./lib/functions");
const paymentHandler = require("./handlers/payment-handler");
const payHandler = require("./handlers/pay-handler");
const authHandler = require("./handlers/auth-handler");
const { requireAuth } = require("./middleware/auth");

function createApiRouter() {
  const router = express.Router();

  router.post("/auth/login", authHandler.login);
  router.post("/create-payment", requireAuth, paymentHandler.createPayment);
  router.get("/get-payment/:idOrReference", requireAuth, paymentHandler.getPayment);
  router.put("/update-payment/:idOrReference", requireAuth, paymentHandler.updatePayment);
  router.patch("/update-payment/:idOrReference", requireAuth, paymentHandler.updatePayment);
  router.post("/webhooks/payment", payHandler.webhook);
  router.get("/pay/:reference/status", payHandler.paymentStatus);
  router.post("/pay/:reference/confirm", payHandler.confirmPayment);
  router.post("/pay/:reference/fail", payHandler.failPayment);
  router.post("/pay/:reference/cancel", payHandler.cancelPayment);
  router.get("/pay/:reference", payHandler.showPayPage);

  return router;
}

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.use(createApiRouter());

  app.use((_req, res) => {
    res.status(404).json({ status: "failed", data: { message: "not found" } });
  });

  app.use((err, _req, res, _next) => {
    logError("Handler error", err);
    res.status(500).json({
      status: "failed",
      data: { message: err?.message || "failed request" },
    });
  });

  return app;
}

module.exports = { createApp, createApiRouter };
