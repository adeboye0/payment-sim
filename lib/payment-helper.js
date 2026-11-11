"use strict";

const schemas = require("../utils/schemas");
const { apiResponse } = require("../utils/responses");
const { generateId, generatePaymentReference } = require("./functions");
const { payments } = require("../models/Payment");
const stripe = require("../integrations/stripe");

exports.createPayment = async (res, body = {}, user = {}) => {
  const valid = schemas.validateSchema(body, schemas.createPaymentSchema);
  if (!valid.status) return apiResponse(res, "failed", { message: valid.message });

  const { amount, currency } = body;
  const reference = generatePaymentReference();

  const payment = {
    id: generateId(),
    userId: user.id,
    email: user.email,
    amount,
    currency: currency || "USD",
    reference,
    status: "pending",
    checkoutUrl: null,
    sessionId: null,
    createdAt: new Date().toISOString(),
  };

  try {
    const session = await stripe.createCheckoutSession({
      email: payment.email,
      amount: payment.amount,
      currency: payment.currency,
      reference: payment.reference,
      metadata: { paymentId: payment.id, userId: payment.userId },
    });
    payment.checkoutUrl = session.url;
    payment.sessionId = session.id;
  } catch (err) {
    return apiResponse(res, "failed", { message: err.message }, err.statusCode || 502);
  }

  payments.push(payment);
  return apiResponse(res, "success", payment, 200);
};

exports.getPayment = async (res, idOrReference) => {
  const payment = payments.find((item) => item.id === idOrReference || item.reference === idOrReference);
  if (!payment) return apiResponse(res, "failed", { message: "Payment not found" }, 404);

  return apiResponse(res, "success", payment);
};

exports.updatePayment = async (res, idOrReference, body = {}) => {
  const valid = schemas.validateSchema(body, schemas.updatePaymentSchema);
  if (!valid.status) return apiResponse(res, "failed", { message: valid.message });

  const { status } = body;

  const payment = payments.find((item) => item.id === idOrReference || item.reference === idOrReference);
  if (!payment) return apiResponse(res, "failed", { message: "Payment not found" }, 404);

  payment.status = status;
  payment.updatedAt = new Date().toISOString();

  return apiResponse(res, "success", payment);
};
