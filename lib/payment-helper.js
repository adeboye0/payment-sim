"use strict";

const _ = require("lodash");
const config = require("../config");
const moment = require("moment");
const schemas = require("../utils/schemas");
const { apiResponse } = require("../utils/responses");
const { generateId, generatePaymentReference, encrypt, decrypt, logError } = require("./functions");
const { payments, save } = require("../models/Payment");

exports.createPayment = async (res, body = {}, user = {}) => {
  const valid = schemas.validateSchema(body, schemas.createPaymentSchema);
  if (!valid.status) return apiResponse(res, "failed", { message: valid.message });

  const { amount, currency } = body;
  const duplicate = _.find(payments, (item) => item.userId === user.id  && Number(item.amount) === Number(amount) && moment(item.createdAt).isAfter(moment().subtract(3, "minutes")));
  if (duplicate) {
    return apiResponse(res, "failed", { message: "Duplicate amount within the last 3 minutes." }, 400);
  }

  const reference = generatePaymentReference();

  const payment = {
    id: generateId(),
    userId: user.id,
    email: user.email,
    amount,
    currency: currency || "USD",
    reference,
    status: "pending",
    checkoutUrl: `${config.publicBaseUrl}/pay/${reference}`,
    createdAt: moment().toISOString(),
  };

  payments.push(payment);
  save();
  return apiResponse(res, "success", payment, 200);
};

exports.getPayment = async (res, idOrReference, user) => {
  const payment = _.find(payments, (item) => item.id === idOrReference || item.reference === idOrReference);
  if (!payment || (user && payment.userId !== user.id)) {
    return apiResponse(res, "failed", { message: "Payment not found" }, 404);
  }

  return apiResponse(res, "success", payment);
};

exports.confirmPayment = async (res, reference) => {
  return processPayment(res, reference, "payment.succeeded");
};

exports.failPayment = async (res, reference) => {
  return processPayment(res, reference, "payment.failed");
};

async function processPayment(res, reference, event) {
  const payment = _.find(payments, (item) => item.id === reference || item.reference === reference);
  if (!payment) return apiResponse(res, "failed", { message: "Payment not found" }, 404);
  if (payment.status !== "pending") return apiResponse(res, "success", payment);

  payment.status = "processing";
  payment.updatedAt = new Date().toISOString();
  save();
  const webhookUrl = `${config.publicBaseUrl}/webhooks/payment`;
  res.once("finish", () => {
    setTimeout(() => {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: encrypt(JSON.stringify({ event, reference: payment.reference }), config.webhookSecret),
        }),
      }).catch((err) => {
        logError("Payment webhook failed", err);
      });
    }, 5000);
  });
  return apiResponse(res, "success", payment);
}

exports.cancelPayment = async (res, reference) => {
  const payment = _.find(payments, (item) => item.id === reference || item.reference === reference);
  if (!payment) return apiResponse(res, "failed", { message: "Payment not found" }, 404);

  if (payment.status === "processing") {
    return apiResponse(res, "failed", { message: "Payment is processing." }, 409);
  }
  
  if (payment.status !== "pending") return apiResponse(res, "success", payment);

  payment.status = "abandoned";
  payment.updatedAt = new Date().toISOString();
  save();
  return apiResponse(res, "success", payment);
};

exports.updatePayment = async (res, idOrReference, body = {}, user) => {
  const valid = schemas.validateSchema(body, schemas.updatePaymentSchema);
  if (!valid.status) return apiResponse(res, "failed", { message: valid.message });

  const { status } = body;

  const payment = _.find(payments, (item) => item.id === idOrReference || item.reference === idOrReference);
  if (!payment || (user && payment.userId !== user.id)) {
    return apiResponse(res, "failed", { message: "Payment not found" }, 404);
  }

  payment.status = status;
  payment.updatedAt = new Date().toISOString();
  save();
  return apiResponse(res, "success", payment);
};

exports.handleWebhook = async (res, body = {}) => {
  const envelope = schemas.validateSchema(body, schemas.webhookRequestSchema);
  if (!envelope.status) return apiResponse(res, "failed", { message: envelope.message });

  let payload;
  try {
    payload = JSON.parse(decrypt(body.payload, config.webhookSecret));
  } catch (err) {
    return apiResponse(res, "failed", { message: "Invalid webhook payload" }, 401);
  }

  const valid = schemas.validateSchema(payload, schemas.webhookSchema);
  if (!valid.status) return apiResponse(res, "failed", { message: valid.message });

  const payment = _.find(payments, (item) => item.id === payload.reference || item.reference === payload.reference);
  if (!payment) return apiResponse(res, "failed", { message: "Payment not found" }, 404);

  const next = payload.event === "payment.succeeded" ? "success" : "failed";
  if (payment.status === next || (payment.status !== "pending" && payment.status !== "processing")) {
    return apiResponse(res, "success", payment);
  }

  payment.status = next;
  payment.updatedAt = new Date().toISOString();
  save();
  return apiResponse(res, "success", payment);
};
