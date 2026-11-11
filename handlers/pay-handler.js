"use strict";

const path = require("path");
const paymentHelper = require("../lib/payment-helper");

exports.showPayPage = async (req, res) => {
  res.sendFile(path.join(__dirname, "../public/pay.html"));
};

exports.paymentStatus = async (req, res, next) => {
  try {
    await paymentHelper.getPayment(res, req.params.reference);
  } catch (err) {
    next(err);
  }
};

exports.confirmPayment = async (req, res, next) => {
  try {
    await paymentHelper.confirmPayment(res, req.params.reference);
  } catch (err) {
    next(err);
  }
};

exports.cancelPayment = async (req, res, next) => {
  try {
    await paymentHelper.cancelPayment(res, req.params.reference);
  } catch (err) {
    next(err);
  }
};

exports.failPayment = async (req, res, next) => {
  try {
    await paymentHelper.failPayment(res, req.params.reference);
  } catch (err) {
    next(err);
  }
};

exports.webhook = async (req, res, next) => {
  try {
    await paymentHelper.handleWebhook(res, req.body || {});
  } catch (err) {
    next(err);
  }
};
