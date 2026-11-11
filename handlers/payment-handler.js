"use strict";

const paymentHelper = require("../lib/payment-helper");
const { send } = require("../utils/responses");

exports.createPayment = async (req, res, next) => {
  try {
    const result = await paymentHelper.createPayment(req.body || {});
    send(res, result);
  } catch (err) {
    next(err);
  }
};