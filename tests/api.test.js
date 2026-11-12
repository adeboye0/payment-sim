"use strict";

require("dotenv").config();

const axios = require("axios");
const config = require("../config");
const { createApp } = require("../app");
const { encrypt } = require("../lib/functions");

let server;
let base;
let token;
let processingPayment;
let amountSeed = 10000;

function nextAmount() {
  amountSeed += 1;
  return amountSeed + Number(Math.random().toFixed(2));
}

async function sendRequest(path, { method = "GET", body: payload, token: auth } = {}) {
  const response = await axios({
    url: `${base}${path}`,
    method,
    headers: auth ? { Authorization: `Bearer ${auth}` } : undefined,
    data: payload,
    validateStatus: () => true,
  });
  return { status: response.status, body: response.data };
}

describe("api", () => {
  beforeAll(async () => {
    const app = createApp();
    server = await new Promise((resolve) => {
      const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
    });
    const { port } = server.address();
    base = `http://127.0.0.1:${port}`;
    config.publicBaseUrl = base;

    const login = await sendRequest("/auth/login", {
      method: "POST",
      body: { email: config.demoUser.email, password: config.demoUser.password },
    });
    expect(login.status).toBe(200);
    token = login.body.data.token;
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 5200));
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  test("rejects a bad login", async () => {
    const result = await sendRequest("/auth/login", {
      method: "POST",
      body: { email: config.demoUser.email, password: "wrong-password" },
    });

    expect(result.status).toBe(401);
    expect(result.body).toEqual({ status: "failed", data: { message: "Invalid email or password" } });
  });

  test("requires a token for payment routes", async () => {
    const result = await sendRequest("/create-payment", { method: "POST", body: { amount: nextAmount() } });

    expect(result.status).toBe(401);
    expect(result.body.status).toBe("failed");
  });

  test("creates, reads, and updates a payment", async () => {
    const amount = nextAmount();
    const created = await sendRequest("/create-payment", { method: "POST", token, body: { amount } });

    expect(created.status).toBe(200);
    expect(created.body.data).toMatchObject({
      amount,
      currency: "USD",
      status: "pending",
      email: config.demoUser.email,
    });
    expect(created.body.data.reference).toMatch(/^PAY-\d+-\d{3}$/);
    expect(created.body.data.checkoutUrl).toBe(`${base}/pay/${created.body.data.reference}`);

    const byId = await sendRequest(`/get-payment/${created.body.data.id}`, { token });
    const byReference = await sendRequest(`/get-payment/${created.body.data.reference}`, { token });
    expect(byId.status).toBe(200);
    expect(byReference.body.data.id).toBe(created.body.data.id);

    const updated = await sendRequest(`/update-payment/${created.body.data.reference}`, {
      method: "PUT",
      token,
      body: { status: "failed" },
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.status).toBe("failed");
  });

  test("blocks the same payment amount within 3 minutes", async () => {
    const amount = nextAmount();
    const first = await sendRequest("/create-payment", { method: "POST", token, body: { amount } });
    const second = await sendRequest("/create-payment", { method: "POST", token, body: { amount } });

    expect(first.status).toBe(200);
    expect(second.status).toBe(400);
    expect(second.body.data.message).toBe("Duplicate amount within the last 3 minutes.");
  });


  test("updates payment to processing on confirmation", async () => {
    const created = await sendRequest("/create-payment", { method: "POST", token, body: { amount: nextAmount() } });
    const confirmed = await sendRequest(`/pay/${created.body.data.reference}/confirm`, { method: "POST" });

    expect(confirmed.status).toBe(200);
    expect(confirmed.body.data.status).toBe("processing");
    processingPayment = confirmed.body.data;
  });

  test("settles a payment from an encrypted webhook", async () => {
    const payload = encrypt(
      JSON.stringify({ event: "payment.succeeded", reference: processingPayment.reference }),
      config.webhookSecret
    );
    const result = await sendRequest("/webhooks/payment", { method: "POST", body: { payload } });

    expect(result.status).toBe(200);
    expect(result.body.data.status).toBe("success");
    expect(result.body.data.id).toBe(processingPayment.id);
  });

  test("does not charge the same payment again", async () => {
    const created = await sendRequest("/create-payment", { method: "POST", token, body: { amount: nextAmount() } });
    const reference = created.body.data.reference;
    const first = await sendRequest(`/pay/${reference}/confirm`, { method: "POST" });
    const second = await sendRequest(`/pay/${reference}/confirm`, { method: "POST" });

    expect(first.status).toBe(200);
    expect(first.body.data.status).toBe("processing");
    expect(second.status).toBe(200);
    expect(second.body.data).toMatchObject({
      id: first.body.data.id,
      status: "processing",
      updatedAt: first.body.data.updatedAt,
    });

    const payload = encrypt(
      JSON.stringify({ event: "payment.succeeded", reference }),
      config.webhookSecret
    );
    const settled = await sendRequest("/webhooks/payment", { method: "POST", body: { payload } });
    const settledAgain = await sendRequest("/webhooks/payment", { method: "POST", body: { payload } });

    expect(settled.status).toBe(200);
    expect(settled.body.data.status).toBe("success");
    expect(settledAgain.status).toBe(200);
    expect(settledAgain.body.data).toMatchObject({
      id: first.body.data.id,
      status: "success",
      updatedAt: settled.body.data.updatedAt,
    });
  });

  test("rejects a webhook payload that cannot be decrypted", async () => {
    const result = await sendRequest("/webhooks/payment", { method: "POST", body: { payload: "not-valid" } });

    expect(result.status).toBe(401);
    expect(result.body.data.message).toBe("Invalid webhook payload");
  });

  test("cancels a pending payment and rejects a processing one", async () => {
    const pending = await sendRequest("/create-payment", { method: "POST", token, body: { amount: nextAmount() } });
    const cancelled = await sendRequest(`/pay/${pending.body.data.reference}/cancel`, { method: "POST" });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.status).toBe("abandoned");

    const processing = await sendRequest("/create-payment", { method: "POST", token, body: { amount: nextAmount() } });
    await sendRequest(`/pay/${processing.body.data.reference}/confirm`, { method: "POST" });
    const blocked = await sendRequest(`/pay/${processing.body.data.reference}/cancel`, { method: "POST" });
    expect(blocked.status).toBe(409);
    expect(blocked.body.data.message).toBe("Payment is processing.");
  });
});
