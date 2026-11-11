"use strict";

const axios = require("axios");
const config = require("../config");
const { toCent } = require("../lib/functions");

async function createCheckoutSession({ email, amount, currency, reference, metadata = {} }) {
  if (!config.stripe.secretKey) {
    const error = new Error("secret key is not configured");
    error.statusCode = 500;
    throw error;
  }

  const params = new URLSearchParams({
    mode: "payment",
    customer_email: email,
    client_reference_id: reference,
    success_url: config.stripe.successUrl,
    cancel_url: config.stripe.cancelUrl,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": String(currency || "USD").toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(toCent(amount)),
    "line_items[0][price_data][product_data][name]": reference,
    "metadata[paymentId]": metadata.paymentId || "",
    "metadata[userId]": metadata.userId || "",
  });

  try {
    const response = await axios.post(`${config.stripe.baseUrl}/v1/checkout/sessions`, params, {
      timeout: 15000,
      headers: {
        Authorization: `Bearer ${config.stripe.secretKey}`,
      },
    });

    const body = response.data || {};
    if (!body.id || !body.url) {
      const error = new Error(body.error?.message || "failed request");
      error.statusCode = 502;
      throw error;
    }

    return body;
  } catch (err) {
    if (err.statusCode) throw err;
    const error = new Error(err.response?.data?.error?.message || "failed request");
    error.statusCode = 502;
    throw error;
  }
}

module.exports = { createCheckoutSession };
